import { and, eq, inArray, isNotNull } from "drizzle-orm";
import {
  executeAtomicBatch,
  getDb,
  getRuntimeVariable,
  sqlStatement,
} from "../../../../db";
import {
  cognitiveFragments,
  cognitiveSyncReceipts,
  cognitiveThreads,
  evidence,
  missions,
  publicCases,
} from "../../../../db/schema";
import {
  buildCandidateCanonicalPayload,
  assertBoundedJson,
  checkpointRequestSchema,
  CognitiveBridgeValidationError,
  deterministicPrivateId,
  hmacSha256,
  sha256,
  stableStringify,
} from "../../../../runtime/cognitive-bridge";
import {
  requireOrganizationalMutation,
  runtimeMutationContext,
  type RuntimeMutationAction,
} from "../../../../runtime/api-constitutional-guard";
import {
  canRecordMission,
  getRuntimeIdentity,
  mutationCameFromSameOrigin,
} from "../../../member-auth";

const actionByObjectType = {
  CognitiveEvent: "create_cognitive_event",
  DeliberationSession: "create_deliberation_session",
  LearningRecord: "create_learning_record",
  EvolutionProposal: "create_evolution_proposal",
} as const;

const MAX_CHECKPOINT_BYTES = 128_000;

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
      { error: "Sign in before synchronizing a cognitive checkpoint." },
      { status: 401 },
    );
  }
  if (!identity.member) {
    return Response.json(
      { error: "Only approved GO Society members can stage cognition." },
      { status: 403 },
    );
  }

  let raw: unknown;
  try {
    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_CHECKPOINT_BYTES) {
      return Response.json(
        { code: "PAYLOAD_TOO_LARGE", error: "The checkpoint exceeds the private intake limit." },
        { status: 413 },
      );
    }
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_CHECKPOINT_BYTES) {
      return Response.json(
        { code: "PAYLOAD_TOO_LARGE", error: "The checkpoint exceeds the private intake limit." },
        { status: 413 },
      );
    }
    raw = JSON.parse(body);
  } catch {
    return Response.json({ error: "The checkpoint payload is not valid JSON." }, { status: 400 });
  }
  try {
    assertBoundedJson(raw);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The cognitive payload is too complex.",
      },
      { status: 400 },
    );
  }
  const parsed = checkpointRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "The checkpoint is incomplete." },
      { status: 400 },
    );
  }
  const input = parsed.data;

  for (const candidate of input.candidates) {
    if (candidate.objectType !== "EvolutionProposal") continue;
    const risk = candidate.payload.risk_class;
    const reversibility = candidate.payload.reversibility;
    if (risk === "high" || risk === "critical" || reversibility !== "reversible") {
      return Response.json(
        {
          code: "ALPHA_RISK_BOUNDARY",
          error: "The alpha bridge stages only low/medium, reversible EvolutionProposals.",
        },
        { status: 400 },
      );
    }
  }

  try {
    const db = getDb();
    const [mission] = await db
      .select({ id: missions.id })
      .from(missions)
      .where(eq(missions.id, input.missionId))
      .limit(1);
    if (!mission) {
      return Response.json({ error: "The selected mission does not exist." }, { status: 404 });
    }
    if (!(await canRecordMission(identity.member, input.missionId))) {
      return Response.json(
        { error: "This member cannot write to that mission." },
        { status: 403 },
      );
    }

    const actor = `member:${identity.member.id}`;
    const target = `mission:${input.missionId}`;
    const actions = new Set([
      ...(input.fragments.length ? ["custom:capture_cognitive_source" as const] : []),
      ...input.candidates.map(
        (candidate) => actionByObjectType[candidate.objectType],
      ),
    ]);
    const authorityByAction = new Map<
      RuntimeMutationAction,
      { grantId: string; grantRevision: number }
    >();
    for (const action of actions) {
      const authority = await requireOrganizationalMutation(actor, action, target, {
        sourceInterface: input.source.interface,
        candidateOnly: true,
      });
      if (!authority.allowed) {
        return Response.json({ error: authority.reason }, { status: 403 });
      }
      if (!authority.grantId || !authority.grantRevision) {
        return Response.json(
          { error: "The active authority grant cannot be bound to this write." },
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
        { error: "Cognitive synchronization requires one stable authority boundary." },
        { status: 403 },
      );
    }
    const authorityGrant = authorityByAction.get(
      "custom:capture_cognitive_source",
    )!;
    const authorityGrantId = authorityGrant.grantId;

    const clientRefs = [
      ...input.fragments.map((fragment) => `fragment:${fragment.clientRef}`),
      ...input.candidates.map((candidate) => `candidate:${candidate.clientRef}`),
    ];
    if (new Set(clientRefs).size !== clientRefs.length) {
      return Response.json(
        { error: "Checkpoint client references must be unique." },
        { status: 400 },
      );
    }
    const turnRefs = input.fragments.map((fragment) => fragment.sourceTurnRef);
    if (new Set(turnRefs).size !== turnRefs.length) {
      return Response.json(
        { error: "A checkpoint cannot contain the same source turn twice." },
        { status: 400 },
      );
    }

    const requestHash = await sha256(stableStringify(input));
    const storedIdempotencyKey = await deterministicPrivateId(
      "idem",
      actor,
      "checkpoint",
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
          { error: "That idempotency key was already used for a different checkpoint." },
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

    const threadBindingSecret =
      getRuntimeVariable("GO_SOCIETY_THREAD_HMAC_SECRET") ?? "";
    const sourceThreadKey = await hmacSha256(
      threadBindingSecret,
      stableStringify({
        missionId: input.missionId,
        memberId: identity.member.id,
        sourceInterface: input.source.interface,
        sourceThreadKey: input.source.threadKey,
      }),
    );
    const threadId = await deterministicPrivateId(
      "ct",
      input.source.interface,
      sourceThreadKey,
    );
    const [existingThread] = await db
      .select()
      .from(cognitiveThreads)
      .where(
        and(
          eq(cognitiveThreads.sourceInterface, input.source.interface),
          eq(cognitiveThreads.sourceThreadKey, sourceThreadKey),
        ),
      )
      .limit(1);
    if (
      existingThread &&
      (existingThread.missionId !== input.missionId ||
        existingThread.accountableMemberId !== identity.member.id)
    ) {
      return Response.json(
        { error: "That source conversation is already bound to another cognitive boundary." },
        { status: 409 },
      );
    }
    const cursorFrom = existingThread?.lastCursor ?? 0;
    if (input.expectedCursor !== cursorFrom) {
      return Response.json(
        {
          code: "STALE_CURSOR",
          error: "The conversation cursor is stale. Reload organizational context before synchronizing.",
          currentCursor: cursorFrom,
        },
        { status: 409 },
      );
    }

    const existingFragments = turnRefs.length
      ? await db
          .select()
          .from(cognitiveFragments)
          .where(
            and(
              eq(cognitiveFragments.threadId, threadId),
              inArray(cognitiveFragments.sourceTurnRef, turnRefs),
            ),
          )
      : [];
    const existingByTurn = new Map(
      existingFragments.map((fragment) => [fragment.sourceTurnRef, fragment]),
    );
    const preparedFragments = await Promise.all(
      input.fragments.map(async (fragment) => {
        const contentHash = await sha256(fragment.verbatimText);
        const existing = existingByTurn.get(fragment.sourceTurnRef);
        if (existing && existing.contentHash !== contentHash) {
          throw new CognitiveBridgeValidationError(
            `Source turn ${fragment.sourceTurnRef} already exists with different verbatim text.`,
          );
        }
        return {
          ...fragment,
          id: await deterministicPrivateId(
            "cf",
            threadId,
            fragment.sourceTurnRef,
          ),
          contentHash,
          isNew: !existing,
        };
      }),
    );
    const fragmentIdByClientRef = new Map(
      preparedFragments.map((fragment) => [fragment.clientRef, fragment.id]),
    );
    const cursorTo = cursorFrom + 1;

    await validateEvidenceReferences(
      db,
      input.missionId,
      input.candidates.map((candidate) => candidate.payload),
    );

    const objectIdByClientRef = new Map(
      input.candidates.map((candidate) => [
        candidate.clientRef,
        `co_${crypto.randomUUID()}`,
      ]),
    );
    const createdAt = new Date().toISOString();
    const authorizationReceiptIdByAction = new Map(
      [...actions].map((action) => [
        action,
        `car_${crypto.randomUUID()}`,
      ]),
    );
    const preparedObjects = await Promise.all(
      input.candidates.map(async (candidate) => {
        const objectId = objectIdByClientRef.get(candidate.clientRef)!;
        const sourceRefs = candidate.sourceFragmentRefs.length
          ? candidate.sourceFragmentRefs
          : input.fragments.map((fragment) => fragment.clientRef);
        const narrativeRefs = sourceRefs.map((reference) => {
          const resolved = fragmentIdByClientRef.get(reference);
          if (!resolved) {
            throw new CognitiveBridgeValidationError(
              `Unknown source fragment reference: ${reference}`,
            );
          }
          return resolved;
        });
        const resolvedPayload = resolveCandidateReferences(
          candidate.payload,
          objectIdByClientRef,
        );
        const payload = buildCandidateCanonicalPayload(
          candidate.objectType,
          {
            ...resolvedPayload,
            authority_ref: authorityGrantId,
            context: {
              ...asRecord(resolvedPayload.context),
              mission_ref: target,
              source_thread_ref: threadId,
            },
          },
          objectId,
          createdAt,
          identity.member!.displayName,
          narrativeRefs,
        );
        return {
          id: objectId,
          objectType: candidate.objectType,
          payload,
          payloadHash: await sha256(stableStringify(payload)),
          narrativeRefs,
          authorizationReceiptId: authorizationReceiptIdByAction.get(
            actionByObjectType[candidate.objectType],
          )!,
        };
      }),
    );

    const receiptId = `csr_${crypto.randomUUID()}`;
    const checkpointClaimId = `ccc_${crypto.randomUUID()}`;
    const responsePayload = {
      contractVersion: "0.5.0-alpha.1",
      checkpoint: {
        id: receiptId,
        missionId: input.missionId,
        threadId,
        cursorFrom,
        cursorTo,
        fragmentIds: preparedFragments.map((fragment) => fragment.id),
        candidateObjects: preparedObjects.map((object) => ({
          id: object.id,
          objectType: object.objectType,
          decisionState: "candidate",
        })),
        boundary: {
          sourceVisibility: "private",
          agentOutput: "candidate_only",
          headChanged: false,
        },
      },
    };
    const statements = [
      sqlStatement(
        `
          INSERT OR IGNORE INTO cognitive_threads (
            id, source_interface, source_thread_key, source_title, mission_id,
            accountable_member_id, capture_mode, consent_scope, last_cursor,
            status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'internal_only', 0, 'active', ?, ?)
        `,
        threadId,
        input.source.interface,
        sourceThreadKey,
        input.source.title,
        input.missionId,
        identity.member.id,
        input.source.captureMode,
        createdAt,
        createdAt,
      ),
      ...[...actions].map((action) => {
        const authority = authorityByAction.get(action)!;
        const context = runtimeMutationContext(action);
        return sqlStatement(
          `
            INSERT INTO cognitive_authorization_receipts (
              id, authority_grant_id, grant_revision, member_id, mission_id,
              action, resource_risk, resource_exposure, reversibility,
              executor, requested_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'web-runtime', 'runtime-api', ?)
          `,
          authorizationReceiptIdByAction.get(action)!,
          authority.grantId,
          authority.grantRevision,
          identity.member!.id,
          input.missionId,
          action,
          context.resourceRisk,
          context.resourceExposure,
          context.reversibility,
          createdAt,
        );
      }),
      sqlStatement(
        `
          INSERT INTO cognitive_checkpoint_claims (
            id, thread_id, cursor_from, cursor_to, request_hash,
            consent_scope, consent_confirmed_by_member_id,
            consent_confirmed_at, authorization_receipt_id, created_at
          ) VALUES (?, ?, ?, ?, ?, 'internal_only', ?, ?, ?, ?)
        `,
        checkpointClaimId,
        threadId,
        cursorFrom,
        cursorTo,
        requestHash,
        identity.member.id,
        createdAt,
        authorizationReceiptIdByAction.get("custom:capture_cognitive_source")!,
        createdAt,
      ),
      sqlStatement(
        `
          UPDATE cognitive_threads
          SET source_title = ?, capture_mode = ?, last_cursor = ?, updated_at = ?
          WHERE id = ? AND mission_id = ? AND accountable_member_id = ?
            AND last_cursor = ?
        `,
        input.source.title,
        input.source.captureMode,
        cursorTo,
        createdAt,
        threadId,
        input.missionId,
        identity.member.id,
        cursorFrom,
      ),
    ];
    for (const fragment of preparedFragments.filter((item) => item.isNew)) {
      statements.push(
        sqlStatement(
          `
            INSERT INTO cognitive_fragments (
              id, thread_id, source_turn_ref, speaker_type, speaker_ref,
              verbatim_text, content_hash, content_kind, visibility,
              provenance_trust, occurred_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'private', ?, ?, ?)
          `,
          fragment.id,
          threadId,
          fragment.sourceTurnRef,
          fragment.speakerType,
          fragment.speakerRef ?? null,
          fragment.verbatimText,
          fragment.contentHash,
          fragment.contentKind,
          fragment.provenanceTrust,
          fragment.occurredAt ?? null,
          createdAt,
        ),
      );
    }
    for (const object of preparedObjects) {
      statements.push(
        sqlStatement(
          `
            INSERT INTO cognitive_objects (
              id, object_type, schema_version, mission_id, thread_id,
              decision_state, canonical_payload, payload_hash, created_by,
              accountable_member_id, authority_grant_id,
              authorization_receipt_id, created_at, updated_at
            ) VALUES (?, ?, '0.5.0', ?, ?, 'candidate', ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          object.id,
          object.objectType,
          input.missionId,
          threadId,
          JSON.stringify(object.payload),
          object.payloadHash,
          `bridge:${input.source.interface}:${actor}`,
          identity.member.id,
          authorityGrantId,
          object.authorizationReceiptId,
          createdAt,
          createdAt,
        ),
      );
      for (const fragmentId of object.narrativeRefs) {
        statements.push(
          sqlStatement(
            `
              INSERT INTO cognitive_object_links (
                id, from_object_id, to_object_id, fragment_id, relation_type,
                created_at
              ) VALUES (?, ?, NULL, ?, 'narrative_anchor', ?)
            `,
            `col_${crypto.randomUUID()}`,
            object.id,
            fragmentId,
            createdAt,
          ),
        );
      }
    }
    statements.push(
      sqlStatement(
        `
          INSERT INTO cognitive_sync_receipts (
            id, idempotency_key, thread_id, operation, request_hash,
            response_payload, cursor_from, cursor_to, actor, received_at
          ) VALUES (?, ?, ?, 'checkpoint', ?, ?, ?, ?, ?, ?)
        `,
        receiptId,
        storedIdempotencyKey,
        threadId,
        requestHash,
        JSON.stringify(responsePayload),
        cursorFrom,
        cursorTo,
        actor,
        createdAt,
      ),
    );
    await executeAtomicBatch(statements);

    return Response.json(responsePayload, {
      status: 201,
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    if (error instanceof CognitiveBridgeValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "";
    if (
      message.includes("constraint") ||
      message.includes("UNIQUE") ||
      message.includes("stale cursor or invalid source consent")
    ) {
      return Response.json(
        {
          code: "CHECKPOINT_CONFLICT",
          error: "The conversation changed while this checkpoint was being stored. Reload and retry.",
        },
        { status: 409 },
      );
    }
    return Response.json(
      { error: "Unable to persist the cognitive checkpoint." },
      { status: 500 },
    );
  }
}

/**
 * Re-enter the canonical checkpoint handler after the Web Human Gate has
 * confirmed an exact MCP draft hash. This is an in-process function call: it
 * neither proxies an HTTP request nor synthesizes an authenticated identity.
 * The surrounding Next request context remains authoritative for
 * getRuntimeIdentity(), while the original browser Origin is preserved for
 * the same-origin write check.
 */
export async function persistHumanConfirmedCheckpoint(
  humanGateRequest: Request,
  input: unknown,
): Promise<Response> {
  const origin = humanGateRequest.headers.get("origin");
  if (!origin) {
    return Response.json(
      { error: "The Human Gate requires an explicit same-origin browser request." },
      { status: 403 },
    );
  }
  const headers = new Headers({
    origin,
    "content-type": "application/json",
  });
  return POST(
    new Request(
      new URL("/api/cognitive-bridge/checkpoints", humanGateRequest.url),
      {
        method: "POST",
        headers,
        body: JSON.stringify(input),
      },
    ),
  );
}

function resolveCandidateReferences(
  value: Record<string, unknown>,
  objectIds: Map<string, string>,
): Record<string, unknown> {
  return resolveValue(value, objectIds) as Record<string, unknown>;
}

function resolveValue(value: unknown, objectIds: Map<string, string>): unknown {
  if (typeof value === "string" && value.startsWith("$candidate:")) {
    const reference = value.slice("$candidate:".length);
    const resolved = objectIds.get(reference);
    if (!resolved) {
      throw new CognitiveBridgeValidationError(
        `Unknown cognitive candidate reference: ${reference}`,
      );
    }
    return resolved;
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolveValue(item, objectIds));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        resolveValue(item, objectIds),
      ]),
    );
  }
  return value;
}

async function validateEvidenceReferences(
  db: ReturnType<typeof getDb>,
  missionId: number,
  payloads: Record<string, unknown>[],
) {
  const references = new Set(
    payloads.flatMap((payload) =>
      [payload.evidence_refs, payload.counter_evidence_refs].flatMap((value) =>
        Array.isArray(value)
          ? value.filter(
            (item): item is string => typeof item === "string",
          )
          : [],
      ),
    ),
  );
  const evidenceIds: number[] = [];
  const publicCaseIds: number[] = [];
  for (const reference of references) {
    const match = /^(evidence|public-case):(\d+)$/.exec(reference);
    if (!match) {
      throw new CognitiveBridgeValidationError(
        `Evidence reference ${reference} is not a persisted GO Society Evidence or approved public case.`,
      );
    }
    (match[1] === "evidence" ? evidenceIds : publicCaseIds).push(Number(match[2]));
  }
  const [evidenceRows, caseRows] = await Promise.all([
    evidenceIds.length
      ? db
          .select({ id: evidence.id })
          .from(evidence)
          .where(
            and(
              inArray(evidence.id, evidenceIds),
              eq(evidence.missionId, missionId),
            ),
          )
      : [],
    publicCaseIds.length
      ? db
          .select({ id: publicCases.id })
          .from(publicCases)
          .where(
            and(
              inArray(publicCases.id, publicCaseIds),
              eq(publicCases.privacyStatus, "human_approved"),
              eq(publicCases.publicationStatus, "published"),
              eq(publicCases.reidentificationRisk, "low"),
              eq(publicCases.consentScope, "anonymous_publication"),
              isNotNull(publicCases.approvedByMemberId),
              isNotNull(publicCases.approvedAt),
              isNotNull(publicCases.publishedAt),
              eq(publicCases.missionId, missionId),
            ),
          )
      : [],
  ]);
  if (
    evidenceRows.length !== new Set(evidenceIds).size ||
    caseRows.length !== new Set(publicCaseIds).size
  ) {
    throw new CognitiveBridgeValidationError(
      "One or more Reality Evidence references do not exist.",
    );
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
