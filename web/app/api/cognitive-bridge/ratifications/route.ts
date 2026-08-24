import { env } from "cloudflare:workers";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../../db";
import {
  cognitiveHeads,
  cognitiveObjects,
  cognitiveSyncReceipts,
  cognitiveThreads,
  members,
  missions,
} from "../../../../db/schema";
import {
  buildCognitiveCommitPayload,
  buildCognitiveVersionPayload,
  buildRatifiedObjectPayload,
  candidateObjectTypes,
  collectRefs,
  cognitiveDependencyRefs,
  CognitiveBridgeValidationError,
  deterministicPrivateId,
  ratificationRequestSchema,
  sha256,
  stableStringify,
  type CandidateObjectType,
  type RatifiedObject,
} from "../../../../runtime/cognitive-bridge";
import {
  requireOrganizationalMutation,
  runtimeMutationContext,
  type RuntimeMutationAction,
} from "../../../../runtime/api-constitutional-guard";
import {
  canReviewMission,
  getRuntimeIdentity,
  mutationCameFromSameOrigin,
} from "../../../member-auth";

const MAX_RATIFICATION_BYTES = 32_000;

export async function POST(request: Request) {
  if (!mutationCameFromSameOrigin(request)) {
    return Response.json(
      { error: "Cross-origin writes are not allowed." },
      { status: 403 },
    );
  }

  const identity = await getRuntimeIdentity();
  if (!identity.user) {
    return Response.json(
      { error: "Sign in before reviewing organizational cognition." },
      { status: 401 },
    );
  }
  if (!identity.member) {
    return Response.json(
      { error: "Only approved GO Society members can review cognition." },
      { status: 403 },
    );
  }

  let raw: unknown;
  try {
    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_RATIFICATION_BYTES) {
      return Response.json(
        { code: "PAYLOAD_TOO_LARGE", error: "The review exceeds the human-gate limit." },
        { status: 413 },
      );
    }
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_RATIFICATION_BYTES) {
      return Response.json(
        { code: "PAYLOAD_TOO_LARGE", error: "The review exceeds the human-gate limit." },
        { status: 413 },
      );
    }
    raw = JSON.parse(body);
  } catch {
    return Response.json({ error: "The review payload is not valid JSON." }, { status: 400 });
  }
  const parsed = ratificationRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "The review is incomplete." },
      { status: 400 },
    );
  }
  const input = parsed.data;

  try {
    const db = getDb();
    const [mission] = await db
      .select({ id: missions.id, owner: missions.owner })
      .from(missions)
      .where(eq(missions.id, input.missionId))
      .limit(1);
    if (!mission) {
      return Response.json({ error: "The selected mission does not exist." }, { status: 404 });
    }
    if (!(await canReviewMission(identity.member, input.missionId))) {
      return Response.json(
        { error: "This member cannot ratify cognition for that mission." },
        { status: 403 },
      );
    }
    const [missionAccountableMember] = await db
      .select({ id: members.id })
      .from(members)
      .where(and(eq(members.role, "owner"), eq(members.status, "active")))
      .limit(1);
    if (!missionAccountableMember) {
      return Response.json(
        { error: "The Mission has no active accountable owner." },
        { status: 409 },
      );
    }

    const actor = `member:${identity.member.id}`;
    const requestHash = await sha256(stableStringify(input));
    const storedIdempotencyKey = await deterministicPrivateId(
      "idem",
      actor,
      "ratification",
      String(input.missionId),
      input.idempotencyKey,
    );
    const [existingReceipt] = await db
      .select()
      .from(cognitiveSyncReceipts)
      .where(eq(cognitiveSyncReceipts.idempotencyKey, storedIdempotencyKey))
      .limit(1);
    if (existingReceipt) {
      if (existingReceipt.requestHash !== requestHash) {
        return Response.json(
          { error: "That idempotency key was already used for a different review." },
          { status: 409 },
        );
      }
      return Response.json(existingReceipt.responsePayload, {
        headers: {
          "cache-control": "no-store",
          "x-go-society-idempotent-replay": "true",
        },
      });
    }

    const candidateRows = await db
      .select()
      .from(cognitiveObjects)
      .where(
        and(
          eq(cognitiveObjects.missionId, input.missionId),
          eq(cognitiveObjects.decisionState, "candidate"),
          inArray(cognitiveObjects.id, input.candidateIds),
        ),
      );
    if (candidateRows.length !== new Set(input.candidateIds).size) {
      return Response.json(
        { error: "One or more candidates are missing, already decided, or outside this mission." },
        { status: 409 },
      );
    }
    const requestedHashIds = Object.keys(input.candidateHashes);
    if (
      requestedHashIds.length !== new Set(input.candidateIds).size ||
      candidateRows.some(
        (candidate) => input.candidateHashes[candidate.id] !== candidate.payloadHash,
      )
    ) {
      return Response.json(
        {
          code: "STALE_REVIEW_MATERIAL",
          error: "One or more candidates changed after the reviewer loaded them.",
        },
        { status: 409 },
      );
    }
    const threadIds = new Set(candidateRows.map((candidate) => candidate.threadId));
    if (threadIds.size !== 1) {
      return Response.json(
        { error: "Ratify one deliberation checkpoint at a time." },
        { status: 400 },
      );
    }
    const threadId = [...threadIds][0];
    const [thread] = await db
      .select()
      .from(cognitiveThreads)
      .where(eq(cognitiveThreads.id, threadId))
      .limit(1);
    if (!thread) {
      return Response.json({ error: "The source deliberation no longer exists." }, { status: 409 });
    }
    for (const candidate of input.decision === "ratify" ? candidateRows : []) {
      if (!stringArray(asRecord(candidate.canonicalPayload).narrative_refs).length) {
        throw new CognitiveBridgeValidationError(
          `Candidate ${candidate.id} has no private source anchor and cannot cross the human gate.`,
        );
      }
    }

    const selectedById = new Map(
      candidateRows.map((candidate) => [candidate.id, candidate]),
    );
    const dependencyRefs = [
      ...new Set(
        candidateRows.flatMap((candidate) =>
          cognitiveDependencyRefs(
            asCandidateObjectType(candidate.objectType),
            asRecord(candidate.canonicalPayload),
          ),
        ),
      ),
    ];
    const dependencyRows = dependencyRefs.length
      ? await db
          .select()
          .from(cognitiveObjects)
          .where(inArray(cognitiveObjects.id, dependencyRefs))
      : [];
    const dependencyById = new Map(
      dependencyRows.map((dependency) => [dependency.id, dependency]),
    );
    for (const candidate of input.decision === "ratify" ? candidateRows : []) {
      const objectType = asCandidateObjectType(candidate.objectType);
      const expectedType = dependencyTypeFor(objectType);
      for (const reference of cognitiveDependencyRefs(
        objectType,
        asRecord(candidate.canonicalPayload),
      )) {
        const dependency = selectedById.get(reference) ?? dependencyById.get(reference);
        const selectedDependency = selectedById.has(reference);
        if (
          !dependency ||
          dependency.missionId !== input.missionId ||
          dependency.objectType !== expectedType ||
          (selectedDependency
            ? dependency.decisionState !== "candidate" || dependency.threadId !== threadId
            : dependency.decisionState !== "ratified")
        ) {
          return Response.json(
            {
              code: "INVALID_COGNITIVE_DEPENDENCY",
              error: `Dependency ${reference} must be a same-Mission ${expectedType} that is already ratified or selected in this decision.`,
            },
            { status: 400 },
          );
        }
      }
    }

    const [head] = await db
      .select()
      .from(cognitiveHeads)
      .where(eq(cognitiveHeads.missionId, input.missionId))
      .limit(1);
    const currentRevision = head?.revision ?? 0;
    if (currentRevision !== input.expectedRevision) {
      return Response.json(
        {
          error: "The organizational cognitive head changed. Reload context before deciding.",
          currentRevision,
        },
        { status: 409 },
      );
    }

    const target = `mission:${input.missionId}`;
    const requiredActions = new Set([
      "custom:review_cognition" as const,
      ...(input.decision === "ratify"
        ? (["create_cognitive_commit", "create_cognitive_version"] as const)
        : []),
      ...(input.decision === "ratify" &&
      candidateRows.some((candidate) => candidate.objectType === "EvolutionProposal")
        ? (["approve_evolution_proposal"] as const)
        : []),
    ]);
    const authorityByAction = new Map<
      RuntimeMutationAction,
      { grantId: string; grantRevision: number }
    >();
    for (const action of requiredActions) {
      const authority = await requireOrganizationalMutation(actor, action, target, {
        decision: input.decision,
        humanReview: true,
      });
      if (!authority.allowed) {
        return Response.json({ error: authority.reason }, { status: 403 });
      }
      if (!authority.grantId || !authority.grantRevision) {
        return Response.json(
          { error: "The active authority grant cannot be bound to this decision." },
          { status: 403 },
        );
      }
      authorityByAction.set(action, {
        grantId: authority.grantId,
        grantRevision: authority.grantRevision,
      });
    }
    const authorityGrants = new Set(
      [...authorityByAction.values()].map(
        (authority) => `${authority.grantId}:${authority.grantRevision}`,
      ),
    );
    if (authorityGrants.size !== 1) {
      return Response.json(
        { error: "Cognitive review requires one stable authority boundary." },
        { status: 403 },
      );
    }
    const authorityGrant = authorityByAction.get("custom:review_cognition")!;
    const authorityGrantId = authorityGrant.grantId;
    const decidedAt = new Date().toISOString();
    const d1 = env.DB;
    const authorizationReceiptIdByAction = new Map(
      [...requiredActions].map((action) => [
        action,
        `car_${crypto.randomUUID()}`,
      ]),
    );
    const authorizationStatements = [...requiredActions].map((action) => {
      const authority = authorityByAction.get(action)!;
      const context = runtimeMutationContext(action);
      return d1
        .prepare(`
          INSERT INTO cognitive_authorization_receipts (
            id, authority_grant_id, grant_revision, member_id, mission_id,
            action, resource_risk, resource_exposure, reversibility,
            executor, requested_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'web-runtime', 'runtime-api', ?)
        `)
        .bind(
          authorizationReceiptIdByAction.get(action)!,
          authority.grantId,
          authority.grantRevision,
          identity.member!.id,
          input.missionId,
          action,
          context.resourceRisk,
          context.resourceExposure,
          context.reversibility,
          decidedAt,
        );
    });

    if (input.decision === "reject") {
      const receiptId = `csr_${crypto.randomUUID()}`;
      const responsePayload = {
        contractVersion: "0.5.0-alpha.1",
        ratification: {
          id: receiptId,
          decision: "rejected",
          candidateIds: input.candidateIds,
          revision: currentRevision,
          headChanged: false,
          decidedBy: identity.member.displayName,
          decidedAt,
        },
      };
      const statements = [...authorizationStatements, ...candidateRows.map((candidate) =>
        d1
          .prepare(`
            INSERT INTO cognitive_candidate_decisions (
              candidate_id, decision, decided_by_member_id, rationale,
              authorization_receipt_id, decided_at
            ) VALUES (?, 'reject', ?, ?, ?, ?)
          `)
          .bind(
            candidate.id,
            identity.member!.id,
            input.rationale,
            authorizationReceiptIdByAction.get("custom:review_cognition")!,
            decidedAt,
          ),
      )];
      statements.push(...candidateRows.map((candidate) =>
        d1
          .prepare(`
            UPDATE cognitive_objects
            SET decision_state = 'rejected', decided_by_member_id = ?,
                decision_rationale = ?, decided_at = ?, updated_at = ?
            WHERE id = ? AND decision_state = 'candidate'
          `)
          .bind(
            identity.member!.id,
            input.rationale,
            decidedAt,
            decidedAt,
            candidate.id,
          ),
      ));
      statements.push(
        d1
          .prepare(`
            INSERT INTO cognitive_sync_receipts (
              id, idempotency_key, thread_id, operation, request_hash,
              response_payload, cursor_from, cursor_to, actor, received_at
            ) VALUES (?, ?, ?, 'ratification_reject', ?, ?, ?, ?, ?, ?)
          `)
          .bind(
            receiptId,
            storedIdempotencyKey,
            threadId,
            requestHash,
            JSON.stringify(responsePayload),
            thread.lastCursor,
            thread.lastCursor,
            actor,
            decidedAt,
          ),
      );
      await d1.batch(statements);
      return Response.json(responsePayload, {
        headers: { "cache-control": "no-store" },
      });
    }

    const previousVersionRows = head
      ? await db
          .select()
          .from(cognitiveObjects)
          .where(eq(cognitiveObjects.id, head.ratifiedVersionId))
          .limit(1)
      : [];
    const previousVersion = previousVersionRows[0] ?? null;
    const newRevision = currentRevision + 1;
    const commitId = `cc_m${input.missionId}_r${newRevision}`;
    const versionId = `cv_m${input.missionId}_r${newRevision}`;
    const ratifiedIdByCandidateId = new Map(
      candidateRows.map((candidate) => [
        candidate.id,
        `${candidate.id}_r${newRevision}`,
      ]),
    );
    const ratifiedObjects: RatifiedObject[] = candidateRows.map((candidate) => {
      const objectType = asCandidateObjectType(candidate.objectType);
      const id = ratifiedIdByCandidateId.get(candidate.id)!;
      return {
        id,
        objectType,
        payload: buildRatifiedObjectPayload(
          objectType,
          asRecord(candidate.canonicalPayload),
          id,
          candidate.id,
          mission.owner,
          identity.member!.displayName,
          input.rationale,
          decidedAt,
          ratifiedIdByCandidateId,
        ),
      };
    });
    const evidenceRefs = collectRefs(ratifiedObjects, "evidence_refs");
    const narrativeRefs = collectRefs(ratifiedObjects, "narrative_refs");
    const deliberationRefs = ratifiedObjects
      .filter((object) => object.objectType === "DeliberationSession")
      .map((object) => object.id);
    const evolutionProposalRefs = ratifiedObjects
      .filter((object) => object.objectType === "EvolutionProposal")
      .map((object) => object.id);
    const commitPayload = buildCognitiveCommitPayload({
      id: commitId,
      previousVersionRef: head?.ratifiedVersionId ?? null,
      newVersionRef: versionId,
      evidenceRefs,
      deliberationRefs,
      evolutionProposalRefs,
      decisionOwner: identity.member.displayName,
      summary: input.rationale,
      createdAt: decidedAt,
      candidateRefs: candidateRows.map((candidate) => candidate.id),
      narrativeRefs,
    });
    const versionPayload = buildCognitiveVersionPayload({
      id: versionId,
      missionId: input.missionId,
      revision: newRevision,
      previousVersionRef: head?.ratifiedVersionId ?? null,
      previousPayload: previousVersion
        ? asRecord(previousVersion.canonicalPayload)
        : null,
      commitRef: commitId,
      ratifiedObjects,
      accountableHuman: mission.owner,
      decisionOwner: identity.member.displayName,
      createdAt: decidedAt,
      threadRef: threadId,
      decisionSummary: input.rationale,
      candidateRefs: candidateRows.map((candidate) => candidate.id),
    });
    const [commitHash, versionHash, ...ratifiedHashes] = await Promise.all([
      sha256(stableStringify(commitPayload)),
      sha256(stableStringify(versionPayload)),
      ...ratifiedObjects.map((object) => sha256(stableStringify(object.payload))),
    ]);
    const receiptId = `csr_${crypto.randomUUID()}`;
    const responsePayload = {
      contractVersion: "0.5.0-alpha.1",
      ratification: {
        id: receiptId,
        decision: "ratified",
        candidateIds: input.candidateIds,
        ratifiedObjectIds: ratifiedObjects.map((object) => object.id),
        objectMap: Object.fromEntries(ratifiedIdByCandidateId),
        commitId,
        versionId,
        revision: newRevision,
        headChanged: true,
        decidedBy: identity.member.displayName,
        decidedAt,
      },
    };

    const statements = [...authorizationStatements, ...candidateRows.map((candidate) =>
      d1
        .prepare(`
          INSERT INTO cognitive_candidate_decisions (
            candidate_id, decision, decided_by_member_id, rationale,
            authorization_receipt_id, decided_at
          ) VALUES (?, 'ratify', ?, ?, ?, ?)
        `)
        .bind(
          candidate.id,
          identity.member!.id,
          input.rationale,
          authorizationReceiptIdByAction.get("custom:review_cognition")!,
          decidedAt,
        ),
    )];
    statements.push(...ratifiedObjects.map((object, index) =>
      d1
        .prepare(`
          INSERT INTO cognitive_objects (
            id, object_type, schema_version, mission_id, thread_id,
            decision_state, canonical_payload, payload_hash, created_by,
            accountable_member_id, authority_grant_id, decided_by_member_id,
            authorization_receipt_id, decision_rationale, decided_at,
            created_at, updated_at
          ) VALUES (?, ?, '0.5.0', ?, ?, 'ratified', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          object.id,
          object.objectType,
          input.missionId,
          threadId,
          JSON.stringify(object.payload),
          ratifiedHashes[index],
          actor,
          missionAccountableMember.id,
          authorityGrantId,
          identity.member!.id,
          authorizationReceiptIdByAction.get(
            object.objectType === "EvolutionProposal"
              ? "approve_evolution_proposal"
              : "custom:review_cognition",
          )!,
          input.rationale,
          decidedAt,
          decidedAt,
          decidedAt,
        ),
    ));
    for (const [index, candidate] of candidateRows.entries()) {
      const ratified = ratifiedObjects[index];
      statements.push(
        d1
          .prepare(`
            UPDATE cognitive_objects
            SET decision_state = 'superseded', decided_by_member_id = ?,
                decision_rationale = ?, decided_at = ?, updated_at = ?
            WHERE id = ? AND decision_state = 'candidate'
          `)
          .bind(
            identity.member.id,
            `Ratified as ${ratified.id}. ${input.rationale}`,
            decidedAt,
            decidedAt,
            candidate.id,
          ),
        d1
          .prepare(`
            INSERT INTO cognitive_object_links (
              id, from_object_id, to_object_id, fragment_id, relation_type,
              created_at
            ) VALUES (?, ?, ?, NULL, 'ratified_from', ?)
          `)
          .bind(
            `col_${crypto.randomUUID()}`,
            ratified.id,
            candidate.id,
            decidedAt,
          ),
      );
      for (const fragmentId of stringArray(ratified.payload.narrative_refs)) {
        statements.push(
          d1
            .prepare(`
              INSERT INTO cognitive_object_links (
                id, from_object_id, to_object_id, fragment_id, relation_type,
                created_at
              ) VALUES (?, ?, NULL, ?, 'narrative_anchor', ?)
            `)
            .bind(`col_${crypto.randomUUID()}`, ratified.id, fragmentId, decidedAt),
        );
      }
    }
    statements.push(
      d1
        .prepare(`
          INSERT INTO cognitive_objects (
            id, object_type, schema_version, mission_id, thread_id,
            decision_state, canonical_payload, payload_hash, created_by,
            accountable_member_id, authority_grant_id, decided_by_member_id,
            authorization_receipt_id, decision_rationale, decided_at,
            created_at, updated_at
          ) VALUES (?, 'CognitiveCommit', '0.5.0', ?, ?, 'ratified', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          commitId,
          input.missionId,
          threadId,
          JSON.stringify(commitPayload),
          commitHash,
          actor,
          missionAccountableMember.id,
          authorityGrantId,
          identity.member.id,
          authorizationReceiptIdByAction.get("create_cognitive_commit")!,
          input.rationale,
          decidedAt,
          decidedAt,
          decidedAt,
        ),
      d1
        .prepare(`
          INSERT INTO cognitive_objects (
            id, object_type, schema_version, mission_id, thread_id,
            decision_state, canonical_payload, payload_hash, created_by,
            accountable_member_id, authority_grant_id, decided_by_member_id,
            authorization_receipt_id, decision_rationale, decided_at,
            created_at, updated_at
          ) VALUES (?, 'CognitiveVersion', '0.5.0', ?, ?, 'ratified', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          versionId,
          input.missionId,
          threadId,
          JSON.stringify(versionPayload),
          versionHash,
          actor,
          missionAccountableMember.id,
          authorityGrantId,
          identity.member.id,
          authorizationReceiptIdByAction.get("create_cognitive_version")!,
          input.rationale,
          decidedAt,
          decidedAt,
          decidedAt,
        ),
    );
    statements.push(
      d1
        .prepare(`
          INSERT INTO cognitive_head_transitions (
            id, mission_id, previous_revision, next_revision, version_id,
            authorization_receipt_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          `cht_${crypto.randomUUID()}`,
          input.missionId,
          currentRevision,
          newRevision,
          versionId,
          authorizationReceiptIdByAction.get("create_cognitive_version")!,
          decidedAt,
        ),
    );
    if (head) {
      statements.push(
        d1
          .prepare(`
            UPDATE cognitive_heads
            SET ratified_version_id = ?, revision = ?, updated_at = ?
            WHERE mission_id = ? AND revision = ?
          `)
          .bind(
            versionId,
            newRevision,
            decidedAt,
            input.missionId,
            currentRevision,
          ),
      );
    } else {
      statements.push(
        d1
          .prepare(`
            INSERT INTO cognitive_heads (
              mission_id, ratified_version_id, revision, updated_at
            ) VALUES (?, ?, ?, ?)
          `)
          .bind(input.missionId, versionId, newRevision, decidedAt),
      );
    }
    statements.push(
      d1
        .prepare(`
          INSERT INTO cognitive_sync_receipts (
            id, idempotency_key, thread_id, operation, request_hash,
            response_payload, cursor_from, cursor_to, actor, received_at
          ) VALUES (?, ?, ?, 'ratification_commit', ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          receiptId,
          storedIdempotencyKey,
          threadId,
          requestHash,
          JSON.stringify(responsePayload),
          thread.lastCursor,
          thread.lastCursor,
          actor,
          decidedAt,
        ),
    );
    await d1.batch(statements);

    return Response.json(responsePayload, {
      status: 201,
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    if (error instanceof CognitiveBridgeValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "";
    if (message.includes("UNIQUE") || message.includes("constraint")) {
      return Response.json(
        { error: "The cognitive head changed while this decision was being committed. Reload and review again." },
        { status: 409 },
      );
    }
    return Response.json(
      { error: "Unable to complete the cognitive review." },
      { status: 500 },
    );
  }
}

function asCandidateObjectType(value: string): CandidateObjectType {
  if (!candidateObjectTypes.includes(value as CandidateObjectType)) {
    throw new CognitiveBridgeValidationError(
      `Object type ${value} cannot be ratified through a candidate checkpoint.`,
    );
  }
  return value as CandidateObjectType;
}

function dependencyTypeFor(
  objectType: CandidateObjectType,
): CandidateObjectType {
  return {
    CognitiveEvent: "CognitiveEvent",
    DeliberationSession: "CognitiveEvent",
    LearningRecord: "DeliberationSession",
    EvolutionProposal: "LearningRecord",
  }[objectType] as CandidateObjectType;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
