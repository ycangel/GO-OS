import {
  and,
  desc,
  eq,
  inArray,
  isNotNull,
} from "drizzle-orm";
import { getDb } from "../../../../db";
import {
  cognitiveFragments,
  cognitiveHeads,
  cognitiveObjects,
  cognitiveThreads,
  evidence,
  missions,
  publicCases,
} from "../../../../db/schema";
import { requireOrganizationalMutation } from "../../../../runtime/api-constitutional-guard";
import {
  canAccessMission,
  canRecordMission,
  canReviewMission,
  getRuntimeIdentity,
} from "../../../member-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await getRuntimeIdentity();
  if (!identity.user) {
    return Response.json(
      { error: "Sign in to enter the GO Society cognitive space." },
      { status: 401 },
    );
  }
  if (!identity.member) {
    return Response.json(
      { error: "This account is not an approved GO Society member." },
      { status: 403 },
    );
  }

  try {
    const db = getDb();
    const url = new URL(request.url);
    const includeReviewMaterial = url.searchParams.get("view") === "review";
    const requestedThreadId = url.searchParams.get("threadId");
    const requestedMissionId = Number(
      url.searchParams.get("missionId"),
    );
    const [mission] = Number.isInteger(requestedMissionId) && requestedMissionId > 0
      ? await db
          .select()
          .from(missions)
          .where(eq(missions.id, requestedMissionId))
          .limit(1)
      : await db
          .select()
          .from(missions)
          .where(eq(missions.slug, "make-go-runnable"))
          .limit(1);

    if (!mission) {
      return Response.json({ error: "The cognitive mission does not exist." }, { status: 404 });
    }
    if (!(await canAccessMission(identity.member, mission.id))) {
      return Response.json(
        { error: "This member cannot enter that mission's cognitive space." },
        { status: 403 },
      );
    }

    const actor = `member:${identity.member.id}`;
    const target = `mission:${mission.id}`;
    const readAuthority = await requireOrganizationalMutation(
      actor,
      "custom:read_cognitive_context",
      target,
      { readOnly: true },
    );
    if (!readAuthority.allowed) {
      return Response.json(
        { error: "The active AuthorityGrant does not permit cognitive access." },
        { status: 403 },
      );
    }
    const [reviewMembership, recordMembership] = await Promise.all([
      canReviewMission(identity.member, mission.id),
      canRecordMission(identity.member, mission.id),
    ]);
    const [reviewAuthority, recordAuthority] = await Promise.all([
      reviewMembership
        ? requireOrganizationalMutation(
            actor,
            "custom:review_cognition",
            target,
            { readOnly: true },
          )
        : Promise.resolve({ allowed: false, reason: "No review membership" }),
      recordMembership
        ? requireOrganizationalMutation(
            actor,
            "custom:capture_cognitive_source",
            target,
            { capabilityProbe: true },
          )
        : Promise.resolve({ allowed: false, reason: "No record membership" }),
    ]);
    const canRatify = reviewMembership && reviewAuthority.allowed;
    const canCheckpoint = recordMembership && recordAuthority.allowed;
    const accessibleThreadBoundary = canRatify
      ? eq(cognitiveThreads.missionId, mission.id)
      : and(
          eq(cognitiveThreads.missionId, mission.id),
          eq(cognitiveThreads.accountableMemberId, identity.member.id),
        );
    const threadRows = includeReviewMaterial
      ? await db
          .select()
          .from(cognitiveThreads)
          .where(accessibleThreadBoundary)
          .orderBy(
            desc(cognitiveThreads.updatedAt),
            desc(cognitiveThreads.createdAt),
          )
          .limit(20)
      : [];
    const currentThread = requestedThreadId
      ? threadRows.find((thread) => thread.id === requestedThreadId) ?? null
      : threadRows[0] ?? null;
    if (requestedThreadId && includeReviewMaterial && !currentThread) {
      return Response.json(
        { error: "That private deliberation is outside this member's boundary." },
        { status: 404 },
      );
    }
    const activeThreadIds = currentThread ? [currentThread.id] : [];

    const [head] = await db
      .select()
      .from(cognitiveHeads)
      .where(eq(cognitiveHeads.missionId, mission.id))
      .limit(1);
    const [version] = head
      ? await db
          .select()
          .from(cognitiveObjects)
          .where(eq(cognitiveObjects.id, head.ratifiedVersionId))
          .limit(1)
      : [];
    const ratifiedPayload = version ? asRecord(version.canonicalPayload) : null;
    const commitRef =
      typeof ratifiedPayload?.commit_ref === "string"
        ? ratifiedPayload.commit_ref
        : null;
    const [commit] = commitRef
      ? await db
          .select()
          .from(cognitiveObjects)
          .where(eq(cognitiveObjects.id, commitRef))
          .limit(1)
      : [];

    const candidateRows = activeThreadIds.length
      ? await db
          .select()
          .from(cognitiveObjects)
          .where(
            and(
              eq(cognitiveObjects.missionId, mission.id),
              eq(cognitiveObjects.decisionState, "candidate"),
              inArray(cognitiveObjects.threadId, activeThreadIds),
            ),
          )
          .orderBy(cognitiveObjects.createdAt, cognitiveObjects.id)
          .limit(60)
      : [];
    const fragmentRows = activeThreadIds.length
      ? await db
          .select()
          .from(cognitiveFragments)
          .where(inArray(cognitiveFragments.threadId, activeThreadIds))
          .orderBy(cognitiveFragments.createdAt, cognitiveFragments.sourceTurnRef)
          .limit(120)
      : [];

    const fragmentById = new Map(fragmentRows.map((fragment) => [fragment.id, fragment]));
    const threadById = new Map(threadRows.map((thread) => [thread.id, thread]));
    const candidates = candidateRows
      .sort((left, right) => {
        const leftThread = threadById.get(left.threadId)?.updatedAt ?? left.createdAt;
        const rightThread = threadById.get(right.threadId)?.updatedAt ?? right.createdAt;
        return rightThread.localeCompare(leftThread) || left.createdAt.localeCompare(right.createdAt);
      })
      .map((candidate) => {
        const payload = asRecord(candidate.canonicalPayload);
        const narrativeRefs = stringArray(payload.narrative_refs);
        const sourceThread = threadById.get(candidate.threadId);
        return {
          id: candidate.id,
          threadId: candidate.threadId,
          sourceTitle: sourceThread?.sourceTitle ?? "Private deliberation",
          sourceInterface: sourceThread?.sourceInterface ?? "unknown",
          objectType: candidate.objectType,
          decisionState: candidate.decisionState,
          payload,
          payloadHash: candidate.payloadHash,
          createdBy: candidate.createdBy,
          createdAt: candidate.createdAt,
          narrativeAnchors: narrativeRefs
            .map((reference) => fragmentById.get(reference))
            .filter((fragment) => fragment != null)
            .map((fragment) => ({
              id: fragment.id,
              sourceTurnRef: fragment.sourceTurnRef,
              speakerType: fragment.speakerType,
              speakerRef: fragment.speakerRef,
              verbatimText: fragment.verbatimText,
              contentKind: fragment.contentKind,
              contentHash: fragment.contentHash,
              provenanceTrust: fragment.provenanceTrust,
            })),
        };
      });

    const evidenceRefs = unique([
      ...stringArray(ratifiedPayload?.evidence_refs),
      ...candidates.flatMap((candidate) =>
        stringArray(candidate.payload.evidence_refs),
      ),
    ]);
    const evidenceIds = evidenceRefs
      .map((reference) => /^evidence:(\d+)$/.exec(reference)?.[1])
      .filter((id): id is string => Boolean(id))
      .map(Number);
    const publicCaseIds = evidenceRefs
      .map((reference) => /^public-case:(\d+)$/.exec(reference)?.[1])
      .filter((id): id is string => Boolean(id))
      .map(Number);
    const [evidenceRows, publicCaseRows] = await Promise.all([
      evidenceIds.length
        ? db
            .select()
            .from(evidence)
            .where(
              and(
                inArray(evidence.id, evidenceIds),
                eq(evidence.missionId, mission.id),
              ),
            )
        : [],
      publicCaseIds.length
        ? db
            .select()
            .from(publicCases)
            .where(
              and(
                inArray(publicCases.id, publicCaseIds),
                eq(publicCases.publicationStatus, "published"),
                eq(publicCases.privacyStatus, "human_approved"),
                eq(publicCases.reidentificationRisk, "low"),
                eq(publicCases.consentScope, "anonymous_publication"),
                isNotNull(publicCases.approvedByMemberId),
                isNotNull(publicCases.approvedAt),
                isNotNull(publicCases.publishedAt),
                eq(publicCases.missionId, mission.id),
              ),
            )
        : [],
    ]);
    const realityEvidence = [
      ...evidenceRows.map((item) => ({
        ref: `evidence:${item.id}`,
        kind: "Evidence",
        title: item.title,
        observation: item.observation,
        source: item.source,
        reliability: item.reliability,
        freshness: item.freshness,
      })),
      ...publicCaseRows.map((item) => ({
        ref: `public-case:${item.id}`,
        kind: "Approved public case",
        title: item.publicTitle,
        observation: item.publicSummary,
        source: item.sourceRoleClass,
        reliability: "human_approved",
        freshness: item.publishedAt ? "published" : "current",
      })),
    ];
    const openQuestions = unique([
      ...stringArray(ratifiedPayload?.open_questions),
      ...(includeReviewMaterial
        ? candidates.flatMap((candidate) =>
            stringArray(candidate.payload.open_questions),
          )
        : []),
      ...(includeReviewMaterial
        ? candidates.flatMap((candidate) =>
            stringArray(candidate.payload.questions),
          )
        : []),
    ]);

    return Response.json(
      {
        contractVersion: "0.5.0-alpha.1",
        mission: {
          id: mission.id,
          slug: mission.slug,
          title: mission.title,
          purpose: mission.purpose,
          accountableHuman: canRatify
            ? mission.owner
            : mission.publicOwnerLabel,
        },
        sync: currentThread
          ? {
              threadId: currentThread.id,
              sourceInterface: currentThread.sourceInterface,
              sourceTitle: currentThread.sourceTitle,
              cursor: currentThread.lastCursor,
              status: currentThread.status,
              updatedAt: currentThread.updatedAt,
            }
          : null,
        threads: threadRows.map((thread) => ({
          threadId: thread.id,
          sourceInterface: thread.sourceInterface,
          sourceTitle: thread.sourceTitle,
          cursor: thread.lastCursor,
          status: thread.status,
          updatedAt: thread.updatedAt,
        })),
        ratifiedState: version && head
          ? {
              id: version.id,
              revision: head.revision,
              payload: ratifiedPayload,
              payloadHash: version.payloadHash,
              createdAt: version.createdAt,
              commit: commit
                ? {
                    id: commit.id,
                    payload: asRecord(commit.canonicalPayload),
                    payloadHash: commit.payloadHash,
                    decidedBy: commit.decidedByMemberId,
                    rationale: commit.decisionRationale,
                    decidedAt: commit.decidedAt,
                  }
                : null,
            }
          : null,
        candidateState: candidates,
        sourceMaterial: fragmentRows.map((fragment) => ({
          id: fragment.id,
          threadId: fragment.threadId,
          sourceTurnRef: fragment.sourceTurnRef,
          speakerType: fragment.speakerType,
          speakerRef: fragment.speakerRef,
          verbatimText: fragment.verbatimText,
          contentKind: fragment.contentKind,
          contentHash: fragment.contentHash,
          provenanceTrust: fragment.provenanceTrust,
          occurredAt: fragment.occurredAt,
        })),
        realityEvidence,
        openQuestions,
        authority: {
          actor: `member:${identity.member.id}`,
          accountableHuman: canRatify
            ? mission.owner
            : mission.publicOwnerLabel,
          currentReviewer: identity.member.displayName,
          canCheckpoint,
          canRatify,
          candidateOnlyForAgents: true,
          headChangesRequireHuman: true,
        },
        boundary: {
          visibility: "private_authorized_members",
          sourceIsEvidence: false,
          candidateIsRatified: false,
          defaultContextIsRatifiedOnly: true,
        },
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "The private cognitive space is temporarily unavailable." },
      { status: 500 },
    );
  }
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

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
