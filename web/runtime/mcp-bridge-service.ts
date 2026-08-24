import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, getRuntimeVariable } from "../db";
import {
  cognitiveHeads,
  cognitiveMcpDrafts,
  cognitiveMcpPrincipalLinks,
  cognitiveObjects,
  cognitiveSyncReceipts,
  cognitiveThreads,
  members,
  missions,
} from "../db/schema";
import {
  assertBoundedJson,
  checkpointRequestSchema,
  deterministicPrivateId,
  hmacSha256,
  sha256,
  stableStringify,
  type CheckpointRequest,
} from "./cognitive-bridge";
import { requireOrganizationalMutation } from "./api-constitutional-guard";
import {
  canAccessMission,
  canRecordMission,
  type RuntimeMember,
} from "../app/member-auth";
import {
  authenticateBearerRequest,
  OAuthResourceServerError,
  publicOrigin,
} from "./oauth-resource-server";

const DRAFT_TTL_MS = 24 * 60 * 60 * 1_000;
const MAX_STAGED_BYTES = 128_000;

export type McpBridgeRequestContext = {
  headers: Headers;
  origin: string;
  requestUrl: string;
};

export class McpBridgeServiceError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: Record<string, unknown>;
  public readonly wwwAuthenticate?: string | string[];

  constructor(
    code: string,
    message: string,
    status = 400,
    details?: Record<string, unknown>,
    wwwAuthenticate?: string | string[],
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
    this.wwwAuthenticate = wwwAuthenticate;
  }
}

const contextInputSchema = z.object({
  missionId: z.number().int().positive().optional(),
  source: z
    .object({
      interface: z.string().trim().min(1).max(80),
      threadKey: z.string().trim().min(1).max(240),
    })
    .optional(),
});

const reviewInputSchema = z.object({
  draftId: z.string().trim().regex(/^mcpd_[a-f0-9-]{16,}$/),
  payloadHash: z.string().regex(/^[a-f0-9]{64}$/),
});

type StagedCheckpointPayload = Omit<CheckpointRequest, "idempotencyKey">;

type ResolvedPrincipal = {
  link: typeof cognitiveMcpPrincipalLinks.$inferSelect;
  member: RuntimeMember;
  principalHash: string;
};

export async function getMcpCognitiveContext(
  rawInput: unknown,
  requestContext: McpBridgeRequestContext,
): Promise<Record<string, unknown>> {
  const principal = await resolveMcpPrincipal(
    requestContext,
    "go.context.read",
  );
  const parsed = contextInputSchema.safeParse(rawInput ?? {});
  if (!parsed.success) {
    throw validationError(parsed.error.issues[0]?.message);
  }

  const db = getDb();
  const mission = await resolveMission(db, parsed.data.missionId);
  if (!(await canAccessMission(principal.member, mission.id))) {
    throw new McpBridgeServiceError(
      "MISSION_ACCESS_DENIED",
      "This linked member cannot read that Mission's cognitive context.",
      403,
    );
  }
  await requireMcpAuthority(
    principal.member,
    mission.id,
    "custom:read_cognitive_context",
  );

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
  const payload = version ? asRecord(version.canonicalPayload) : null;

  let sourceCursor: Record<string, unknown> | null = null;
  if (parsed.data.source) {
    const binding = await prepareMcpSourceBinding(
      principal,
      mission.id,
      parsed.data.source,
    );
    const [thread] = await db
      .select({
        id: cognitiveThreads.id,
        lastCursor: cognitiveThreads.lastCursor,
        status: cognitiveThreads.status,
        updatedAt: cognitiveThreads.updatedAt,
      })
      .from(cognitiveThreads)
      .where(
        and(
          eq(cognitiveThreads.sourceInterface, parsed.data.source.interface),
          eq(cognitiveThreads.sourceThreadKey, binding.canonicalThreadKeyHash),
          eq(cognitiveThreads.missionId, mission.id),
          eq(cognitiveThreads.accountableMemberId, principal.member.id),
        ),
      )
      .limit(1);
    sourceCursor = {
      cursor: thread?.lastCursor ?? 0,
      status: thread?.status ?? "unbound",
      updatedAt: thread?.updatedAt ?? null,
    };
  }

  return {
    contractVersion: "0.5.0-alpha.2",
    mission: {
      id: mission.id,
      slug: mission.slug,
      title: mission.title,
      purpose: mission.purpose,
      accountableHuman: mission.publicOwnerLabel,
    },
    ratifiedState: version && head
      ? {
          id: version.id,
          revision: head.revision,
          payloadHash: version.payloadHash,
          beliefs: records(payload?.beliefs).slice(-40),
          assumptions: strings(payload?.assumptions).slice(-80),
          decisions: records(payload?.decisions).slice(-40),
          reasoningPatterns: strings(payload?.reasoning_patterns).slice(-80),
          openQuestions: strings(payload?.open_questions).slice(-80),
          evidenceRefs: strings(payload?.evidence_refs).slice(-120),
          learningRecordRefs: strings(payload?.learning_record_refs).slice(-120),
          createdAt: version.createdAt,
        }
      : null,
    sourceCursor,
    boundary: {
      visibility: "linked_member_private",
      ratifiedOnly: true,
      sourceMaterialIncluded: false,
      candidatesIncluded: false,
      agentMayRatify: false,
      humanGate: "web_only",
    },
  };
}

export async function stageMcpCheckpoint(
  rawInput: unknown,
  requestContext: McpBridgeRequestContext,
): Promise<Record<string, unknown>> {
  const principal = await resolveMcpPrincipal(
    requestContext,
    "go.checkpoint.write",
  );
  const parsed = normalizeMcpStageInput(rawInput);
  const db = getDb();
  const mission = await resolveMission(db, parsed.missionId);
  if (!(await canRecordMission(principal.member, mission.id))) {
    throw new McpBridgeServiceError(
      "MISSION_RECORD_DENIED",
      "This linked member cannot stage cognition for that Mission.",
      403,
    );
  }
  const authority = await requireMcpAuthority(
    principal.member,
    mission.id,
    "custom:capture_cognitive_source",
  );

  const binding = await prepareMcpSourceBinding(
    principal,
    mission.id,
    parsed.source,
  );
  const stagedPayload: StagedCheckpointPayload = {
    missionId: parsed.missionId,
    expectedCursor: parsed.expectedCursor,
    source: {
      interface: parsed.source.interface,
      threadKey: binding.opaqueClientThreadKey,
      title: parsed.source.title,
      captureMode: "selected_checkpoint",
      consentConfirmed: true,
    },
    fragments: parsed.fragments.map((fragment) => ({
      ...fragment,
      provenanceTrust: "model_reported" as const,
    })),
    candidates: parsed.candidates,
  };
  // The consent literal is needed only by the canonical schema type. It is
  // deliberately removed from the staged artifact and cannot be supplied by
  // the MCP caller.
  const storedPayload = {
    ...stagedPayload,
    source: {
      ...stagedPayload.source,
      consentConfirmed: false,
    },
  } as unknown as Record<string, unknown>;
  const payloadHash = await sha256(stableStringify(storedPayload));
  const draftId = `mcpd_${crypto.randomUUID()}`;
  const canonicalConfirmation = buildHumanConfirmedCheckpointInput(
    draftId,
    payloadHash,
    storedPayload,
  );
  const expectedCheckpointRequestHash = await sha256(
    stableStringify(canonicalConfirmation),
  );
  const idempotencyKeyHash = await deterministicPrivateId(
    "mcpidem",
    principal.link.id,
    String(mission.id),
    parsed.idempotencyKey,
  );

  const [existing] = await db
    .select()
    .from(cognitiveMcpDrafts)
    .where(eq(cognitiveMcpDrafts.idempotencyKeyHash, idempotencyKeyHash))
    .limit(1);
  if (existing) {
    if (existing.payloadHash !== payloadHash) {
      throw new McpBridgeServiceError(
        "IDEMPOTENCY_CONFLICT",
        "That idempotency key was already used for a different MCP draft.",
        409,
      );
    }
    if (
      ["staged", "pending_human_consent", "expired"].includes(existing.status) &&
      (existing.status === "expired" || Date.parse(existing.expiresAt) <= Date.now())
    ) {
      await expireDraft(db, existing.id);
      throw new McpBridgeServiceError(
        "DRAFT_EXPIRED",
        "That idempotent private draft has expired; use a new idempotency key after reloading context.",
        410,
      );
    }
    return draftToolResponse(existing, requestContext.origin, true);
  }

  const [thread] = await db
    .select()
    .from(cognitiveThreads)
    .where(
      and(
        eq(cognitiveThreads.sourceInterface, parsed.source.interface),
        eq(cognitiveThreads.sourceThreadKey, binding.canonicalThreadKeyHash),
      ),
    )
    .limit(1);
  if (
    thread &&
    (thread.missionId !== mission.id ||
      thread.accountableMemberId !== principal.member.id)
  ) {
    throw new McpBridgeServiceError(
      "THREAD_BINDING_CONFLICT",
      "That source conversation is already bound to another cognitive boundary.",
      409,
    );
  }
  const currentCursor = thread?.lastCursor ?? 0;
  if (parsed.expectedCursor !== currentCursor) {
    throw new McpBridgeServiceError(
      "STALE_CURSOR",
      "Reload ratified organizational context before staging another checkpoint.",
      409,
      { currentCursor },
    );
  }
  const activeDraftsAtCursor = await db
    .select({
      id: cognitiveMcpDrafts.id,
      status: cognitiveMcpDrafts.status,
      expiresAt: cognitiveMcpDrafts.expiresAt,
    })
    .from(cognitiveMcpDrafts)
    .where(
      and(
        eq(cognitiveMcpDrafts.principalLinkId, principal.link.id),
        eq(cognitiveMcpDrafts.missionId, mission.id),
        eq(cognitiveMcpDrafts.accountableMemberId, principal.member.id),
        eq(cognitiveMcpDrafts.sourceInterface, parsed.source.interface),
        eq(cognitiveMcpDrafts.sourceThreadKeyHash, binding.canonicalThreadKeyHash),
        eq(cognitiveMcpDrafts.expectedCursor, currentCursor),
        inArray(cognitiveMcpDrafts.status, [
          "staged",
          "pending_human_consent",
          "confirming",
        ]),
      ),
    )
    .limit(4);
  const expiredDraftIds = activeDraftsAtCursor
    .filter(
      (draft) =>
        draft.status !== "confirming" && Date.parse(draft.expiresAt) <= Date.now(),
    )
    .map((draft) => draft.id);
  if (expiredDraftIds.length) {
    const expiredAt = new Date().toISOString();
    await db
      .update(cognitiveMcpDrafts)
      .set({
        status: "expired",
        stagedPayload: null,
        sourceTitle: "[cleared]",
        payloadClearedAt: expiredAt,
        updatedAt: expiredAt,
      })
      .where(
        and(
          inArray(cognitiveMcpDrafts.id, expiredDraftIds),
          inArray(cognitiveMcpDrafts.status, ["staged", "pending_human_consent"]),
        ),
      );
  }
  if (activeDraftsAtCursor.length > expiredDraftIds.length) {
    throw new McpBridgeServiceError(
      "DRAFT_CURSOR_RESERVED",
      "A different live draft already reserves this conversation cursor. Review or reject it before staging another checkpoint.",
      409,
      { currentCursor },
    );
  }

  const now = new Date();
  const createdAt = now.toISOString();
  const expiresAt = new Date(now.valueOf() + DRAFT_TTL_MS).toISOString();
  const draft = {
    id: draftId,
    principalLinkId: principal.link.id,
    missionId: mission.id,
    accountableMemberId: principal.member.id,
    sourceInterface: parsed.source.interface,
    sourceThreadKeyHash: binding.canonicalThreadKeyHash,
    sourceTitle: parsed.source.title,
    expectedCursor: parsed.expectedCursor,
    stagedPayload: storedPayload,
    payloadHash,
    expectedCheckpointRequestHash,
    payloadClearedAt: null,
    idempotencyKeyHash,
    status: "staged",
    authorityGrantId: authority.grantId,
    authorityGrantRevision: authority.grantRevision,
    reviewRequestedAt: null,
    confirmedCheckpointReceiptId: null,
    confirmedAt: null,
    rejectedAt: null,
    expiresAt,
    createdAt,
    updatedAt: createdAt,
  };

  try {
    await db.insert(cognitiveMcpDrafts).values(draft);
  } catch (error) {
    const [raced] = await db
      .select()
      .from(cognitiveMcpDrafts)
      .where(eq(cognitiveMcpDrafts.idempotencyKeyHash, idempotencyKeyHash))
      .limit(1);
    if (raced?.payloadHash === payloadHash) {
      return draftToolResponse(raced, requestContext.origin, true);
    }
    const [cursorRace] = await db
      .select({ id: cognitiveMcpDrafts.id })
      .from(cognitiveMcpDrafts)
      .where(
        and(
          eq(cognitiveMcpDrafts.principalLinkId, principal.link.id),
          eq(cognitiveMcpDrafts.missionId, mission.id),
          eq(cognitiveMcpDrafts.sourceInterface, parsed.source.interface),
          eq(cognitiveMcpDrafts.sourceThreadKeyHash, binding.canonicalThreadKeyHash),
          eq(cognitiveMcpDrafts.expectedCursor, parsed.expectedCursor),
          inArray(cognitiveMcpDrafts.status, [
            "staged",
            "pending_human_consent",
            "confirming",
          ]),
        ),
      )
      .limit(1);
    if (cursorRace) {
      throw new McpBridgeServiceError(
        "DRAFT_CURSOR_RESERVED",
        "Another live draft won this conversation cursor. Review it before staging another checkpoint.",
        409,
        { currentCursor: parsed.expectedCursor },
      );
    }
    throw error;
  }

  return draftToolResponse(draft, requestContext.origin, false);
}

export async function requestMcpHumanReview(
  rawInput: unknown,
  requestContext: McpBridgeRequestContext,
): Promise<Record<string, unknown>> {
  const principal = await resolveMcpPrincipal(
    requestContext,
    "go.checkpoint.write",
  );
  const parsed = reviewInputSchema.safeParse(rawInput);
  if (!parsed.success) throw validationError(parsed.error.issues[0]?.message);

  const db = getDb();
  const draft = await requireDraftForPrincipal(
    db,
    principal,
    parsed.data.draftId,
    parsed.data.payloadHash,
  );
  await requireMcpAuthority(
    principal.member,
    draft.missionId,
    "custom:capture_cognitive_source",
  );
  if (["confirming", "confirmed", "rejected"].includes(draft.status)) {
    throw new McpBridgeServiceError(
      "DRAFT_TERMINAL",
      "This draft has already crossed the Human Gate.",
      409,
    );
  }
  if (draft.status === "expired" || Date.parse(draft.expiresAt) <= Date.now()) {
    await expireDraft(db, draft.id);
    throw new McpBridgeServiceError(
      "DRAFT_EXPIRED",
      "This private MCP draft expired before human review.",
      410,
    );
  }

  if (draft.status === "staged") {
    const now = new Date().toISOString();
    await db
      .update(cognitiveMcpDrafts)
      .set({
        status: "pending_human_consent",
        reviewRequestedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(cognitiveMcpDrafts.id, draft.id),
          eq(cognitiveMcpDrafts.status, "staged"),
          eq(cognitiveMcpDrafts.payloadHash, draft.payloadHash),
        ),
      );
  }
  const [updated] = await db
    .select()
    .from(cognitiveMcpDrafts)
    .where(eq(cognitiveMcpDrafts.id, draft.id))
    .limit(1);
  return draftToolResponse(updated ?? draft, requestContext.origin, draft.status !== "staged");
}

export async function getWebMcpPrincipalLink(
  member: RuntimeMember,
  stablePrincipalKey: string,
  requestUrl: string,
) {
  const principalHash = await principalHashFromStableUserId(
    stablePrincipalKey,
    requestUrl,
  );
  const db = getDb();
  const [link] = await db
    .select()
    .from(cognitiveMcpPrincipalLinks)
    .where(
      and(
        eq(cognitiveMcpPrincipalLinks.principalHash, principalHash),
        eq(cognitiveMcpPrincipalLinks.memberId, member.id),
        eq(cognitiveMcpPrincipalLinks.status, "active"),
        isNull(cognitiveMcpPrincipalLinks.revokedAt),
      ),
    )
    .limit(1);
  return link ?? null;
}

export async function linkWebMcpPrincipal(
  member: RuntimeMember,
  stablePrincipalKey: string,
  requestUrl: string,
) {
  const principalHash = await principalHashFromStableUserId(
    stablePrincipalKey,
    requestUrl,
  );
  const db = getDb();
  const [existingForPrincipal] = await db
    .select()
    .from(cognitiveMcpPrincipalLinks)
    .where(
      and(
        eq(cognitiveMcpPrincipalLinks.principalHash, principalHash),
        eq(cognitiveMcpPrincipalLinks.status, "active"),
        isNull(cognitiveMcpPrincipalLinks.revokedAt),
      ),
    )
    .limit(1);
  if (existingForPrincipal && existingForPrincipal.memberId !== member.id) {
    throw new McpBridgeServiceError(
      "PRINCIPAL_ALREADY_LINKED",
      "This verified identity is already linked to another GO Society member.",
      409,
    );
  }
  if (existingForPrincipal) return existingForPrincipal;

  const [existingForMember] = await db
    .select()
    .from(cognitiveMcpPrincipalLinks)
    .where(
      and(
        eq(cognitiveMcpPrincipalLinks.memberId, member.id),
        eq(cognitiveMcpPrincipalLinks.status, "active"),
        isNull(cognitiveMcpPrincipalLinks.revokedAt),
      ),
    )
    .limit(1);
  if (existingForMember) {
    throw new McpBridgeServiceError(
      "MEMBER_ALREADY_LINKED",
      "This member already has an active conversation bridge link. Revoke it before linking another identity.",
      409,
    );
  }

  const now = new Date().toISOString();
  const link = {
    id: await deterministicPrivateId("mcpl", principalHash, String(member.id), now),
    principalHash,
    memberId: member.id,
    status: "active",
    linkedAt: now,
    revokedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(cognitiveMcpPrincipalLinks).values(link);
  return link;
}

export async function revokeWebMcpPrincipal(
  member: RuntimeMember,
  stablePrincipalKey: string,
  requestUrl: string,
) {
  const link = await getWebMcpPrincipalLink(
    member,
    stablePrincipalKey,
    requestUrl,
  );
  if (!link) return false;
  const now = new Date().toISOString();
  await getDb()
    .update(cognitiveMcpPrincipalLinks)
    .set({ status: "revoked", revokedAt: now, updatedAt: now })
    .where(
      and(
        eq(cognitiveMcpPrincipalLinks.id, link.id),
        eq(cognitiveMcpPrincipalLinks.status, "active"),
      ),
    );
  return true;
}

export async function listMcpDraftsForMember(member: RuntimeMember) {
  const db = getDb();
  await cleanupExpiredMcpDrafts(db);
  const rows = await db
    .select()
    .from(cognitiveMcpDrafts)
    .where(eq(cognitiveMcpDrafts.accountableMemberId, member.id))
    .orderBy(desc(cognitiveMcpDrafts.createdAt))
    .limit(40);
  return rows.map(materializeDraftStatus);
}

export async function getMcpDraftForMember(
  member: RuntimeMember,
  draftId: string,
) {
  const db = getDb();
  const [draft] = await db
    .select()
    .from(cognitiveMcpDrafts)
    .where(
      and(
        eq(cognitiveMcpDrafts.id, draftId),
        eq(cognitiveMcpDrafts.accountableMemberId, member.id),
      ),
    )
    .limit(1);
  if (!draft) {
    throw new McpBridgeServiceError(
      "DRAFT_NOT_FOUND",
      "That MCP draft is outside this member's boundary.",
      404,
    );
  }
  if (
    ["staged", "pending_human_consent"].includes(draft.status) &&
    Date.parse(draft.expiresAt) <= Date.now()
  ) {
    await expireDraft(db, draft.id);
    return {
      ...draft,
      status: "expired" as const,
      stagedPayload: null,
      sourceTitle: "[cleared]",
      payloadClearedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  return materializeDraftStatus(draft);
}

export async function rejectMcpDraftForMember(
  member: RuntimeMember,
  draftId: string,
  payloadHash: string,
) {
  const db = getDb();
  const draft = await getMcpDraftForMember(member, draftId);
  assertExactDraftHash(draft, payloadHash);
  if (draft.status === "expired") {
    throw new McpBridgeServiceError("DRAFT_EXPIRED", "This draft has expired.", 410);
  }
  if (draft.status === "confirmed") {
    throw new McpBridgeServiceError(
      "DRAFT_TERMINAL",
      "A confirmed checkpoint cannot be rejected.",
      409,
    );
  }
  if (draft.status === "confirming") {
    throw new McpBridgeServiceError(
      "DRAFT_CONFIRMING",
      "This checkpoint confirmation is already in progress; retry confirmation instead of rejecting it.",
      409,
    );
  }
  if (draft.status === "rejected") return draft;
  const now = new Date().toISOString();
  await db
    .update(cognitiveMcpDrafts)
    .set({
      status: "rejected",
      stagedPayload: null,
      sourceTitle: "[cleared]",
      payloadClearedAt: now,
      rejectedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(cognitiveMcpDrafts.id, draft.id),
        eq(cognitiveMcpDrafts.payloadHash, payloadHash),
        inArray(cognitiveMcpDrafts.status, ["staged", "pending_human_consent"]),
      ),
    );
  const [updated] = await db
    .select()
    .from(cognitiveMcpDrafts)
    .where(eq(cognitiveMcpDrafts.id, draft.id))
    .limit(1);
  if (updated?.status === "rejected") return updated;
  throw new McpBridgeServiceError(
    "HUMAN_GATE_RACE",
    "This draft changed while the rejection was being stored. Reload before deciding.",
    409,
  );
}

export async function prepareMcpDraftConfirmation(
  member: RuntimeMember,
  draftId: string,
  payloadHash: string,
): Promise<{ draft: typeof cognitiveMcpDrafts.$inferSelect; checkpoint: CheckpointRequest }> {
  const draft = await getMcpDraftForMember(member, draftId);
  assertExactDraftHash(draft, payloadHash);
  if (draft.status === "expired") {
    throw new McpBridgeServiceError("DRAFT_EXPIRED", "This draft has expired.", 410);
  }
  if (draft.status === "rejected") {
    throw new McpBridgeServiceError(
      "DRAFT_TERMINAL",
      "A rejected draft cannot be confirmed.",
      409,
    );
  }
  if (draft.status === "confirmed") {
    throw new McpBridgeServiceError(
      "DRAFT_ALREADY_CONFIRMED",
      "This draft was already confirmed.",
      409,
      { checkpointReceiptId: draft.confirmedCheckpointReceiptId },
    );
  }
  if (!["pending_human_consent", "confirming"].includes(draft.status)) {
    throw new McpBridgeServiceError(
      "HUMAN_REVIEW_NOT_REQUESTED",
      "The MCP caller must request the Web Human Gate before this draft can be confirmed.",
      409,
    );
  }
  const actualPayloadHash = await sha256(stableStringify(draft.stagedPayload));
  if (actualPayloadHash !== draft.payloadHash) {
    throw new McpBridgeServiceError(
      "DRAFT_INTEGRITY_ERROR",
      "The staged payload no longer matches the exact hash shown for review.",
      409,
    );
  }
  const parsed = buildHumanConfirmedCheckpointInput(
    draft.id,
    draft.payloadHash,
    draft.stagedPayload,
  );
  const actualCheckpointRequestHash = await sha256(stableStringify(parsed));
  if (actualCheckpointRequestHash !== draft.expectedCheckpointRequestHash) {
    throw new McpBridgeServiceError(
      "DRAFT_INTEGRITY_ERROR",
      "The exact human-confirmed checkpoint no longer matches the staged review boundary.",
      409,
    );
  }
  if (draft.status === "pending_human_consent") {
    const claimedAt = new Date().toISOString();
    await getDb()
      .update(cognitiveMcpDrafts)
      .set({ status: "confirming", updatedAt: claimedAt })
      .where(
        and(
          eq(cognitiveMcpDrafts.id, draft.id),
          eq(cognitiveMcpDrafts.payloadHash, payloadHash),
          eq(cognitiveMcpDrafts.status, "pending_human_consent"),
        ),
      );
    const [claimed] = await getDb()
      .select()
      .from(cognitiveMcpDrafts)
      .where(eq(cognitiveMcpDrafts.id, draft.id))
      .limit(1);
    if (!claimed || claimed.status !== "confirming") {
      throw new McpBridgeServiceError(
        "HUMAN_GATE_RACE",
        "This draft changed while the Human Gate was claiming it. Reload before deciding.",
        409,
      );
    }
  }
  return { draft, checkpoint: parsed };
}

export async function releaseMcpDraftConfirmation(
  draftId: string,
  payloadHash: string,
) {
  const now = new Date().toISOString();
  await getDb()
    .update(cognitiveMcpDrafts)
    .set({ status: "pending_human_consent", updatedAt: now })
    .where(
      and(
        eq(cognitiveMcpDrafts.id, draftId),
        eq(cognitiveMcpDrafts.payloadHash, payloadHash),
        eq(cognitiveMcpDrafts.status, "confirming"),
      ),
    );
}

export async function markMcpDraftConfirmed(
  draftId: string,
  payloadHash: string,
  checkpointReceiptId: string,
) {
  const now = new Date().toISOString();
  const db = getDb();
  await db
    .update(cognitiveMcpDrafts)
    .set({
      status: "confirmed",
      stagedPayload: null,
      sourceTitle: "[cleared]",
      payloadClearedAt: now,
      confirmedCheckpointReceiptId: checkpointReceiptId,
      confirmedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(cognitiveMcpDrafts.id, draftId),
        eq(cognitiveMcpDrafts.payloadHash, payloadHash),
        eq(cognitiveMcpDrafts.status, "confirming"),
      ),
    );
  const [updated] = await db
    .select({
      status: cognitiveMcpDrafts.status,
      confirmedCheckpointReceiptId:
        cognitiveMcpDrafts.confirmedCheckpointReceiptId,
    })
    .from(cognitiveMcpDrafts)
    .where(eq(cognitiveMcpDrafts.id, draftId))
    .limit(1);
  if (
    updated?.status !== "confirmed" ||
    updated.confirmedCheckpointReceiptId !== checkpointReceiptId
  ) {
    throw new McpBridgeServiceError(
      "HUMAN_GATE_RECEIPT_CONFLICT",
      "The canonical checkpoint exists, but its MCP draft receipt could not be finalized. Retry the same confirmation.",
      409,
    );
  }
}

function normalizeMcpStageInput(rawInput: unknown): CheckpointRequest {
  try {
    assertBoundedJson(rawInput);
  } catch (error) {
    throw validationError(
      error instanceof Error ? error.message : "The MCP checkpoint is too complex.",
    );
  }
  if (new TextEncoder().encode(stableStringify(rawInput)).byteLength > MAX_STAGED_BYTES) {
    throw new McpBridgeServiceError(
      "PAYLOAD_TOO_LARGE",
      "The MCP checkpoint exceeds the private intake limit.",
      413,
    );
  }
  const raw = asRecord(rawInput);
  const source = asRecord(raw.source);
  if (Object.prototype.hasOwnProperty.call(source, "consentConfirmed")) {
    throw new McpBridgeServiceError(
      "MCP_CANNOT_CONFIRM_CONSENT",
      "MCP callers cannot assert human consent. Request the Web Human Gate instead.",
      400,
    );
  }
  const fragments = Array.isArray(raw.fragments) ? raw.fragments : [];
  if (fragments.some((value) => asRecord(value).speakerType === "system")) {
    throw new McpBridgeServiceError(
      "SYSTEM_FRAGMENT_FORBIDDEN",
      "System messages cannot enter the GO Society cognitive intake.",
      400,
    );
  }
  const normalized = {
    ...raw,
    source: { ...source, consentConfirmed: true },
    fragments: fragments.map((value) => ({
      ...asRecord(value),
      provenanceTrust: "model_reported",
    })),
  };
  const parsed = checkpointRequestSchema.safeParse(normalized);
  if (!parsed.success) throw validationError(parsed.error.issues[0]?.message);
  const clientRefs = [
    ...parsed.data.fragments.map((fragment) => `fragment:${fragment.clientRef}`),
    ...parsed.data.candidates.map((candidate) => `candidate:${candidate.clientRef}`),
  ];
  if (new Set(clientRefs).size !== clientRefs.length) {
    throw validationError("Checkpoint client references must be unique.");
  }
  const turnRefs = parsed.data.fragments.map((fragment) => fragment.sourceTurnRef);
  if (new Set(turnRefs).size !== turnRefs.length) {
    throw validationError("A checkpoint cannot contain the same source turn twice.");
  }
  for (const candidate of parsed.data.candidates) {
    if (candidate.objectType !== "EvolutionProposal") continue;
    if (
      ["high", "critical"].includes(String(candidate.payload.risk_class)) ||
      candidate.payload.reversibility !== "reversible"
    ) {
      throw new McpBridgeServiceError(
        "ALPHA_RISK_BOUNDARY",
        "The alpha bridge stages only low/medium, reversible EvolutionProposals.",
        400,
      );
    }
  }
  return parsed.data;
}

async function resolveMcpPrincipal(
  context: McpBridgeRequestContext,
  requiredScope: "go.context.read" | "go.checkpoint.write",
): Promise<ResolvedPrincipal> {
  validateRequestContext(context);
  let oauthPrincipal;
  try {
    oauthPrincipal = await authenticateBearerRequest(
      context.headers,
      context.requestUrl,
      [requiredScope],
    );
  } catch (error) {
    if (error instanceof OAuthResourceServerError) {
      throw new McpBridgeServiceError(
        error.code,
        error.message,
        error.status,
        undefined,
        error.wwwAuthenticate,
      );
    }
    throw error;
  }
  const principalHash = await principalHashFromStableUserId(
    oauthPrincipal.principalKey,
    context.requestUrl,
  );
  const db = getDb();
  const [row] = await db
    .select({ link: cognitiveMcpPrincipalLinks, member: members })
    .from(cognitiveMcpPrincipalLinks)
    .innerJoin(members, eq(cognitiveMcpPrincipalLinks.memberId, members.id))
    .where(
      and(
        eq(cognitiveMcpPrincipalLinks.principalHash, principalHash),
        eq(cognitiveMcpPrincipalLinks.status, "active"),
        isNull(cognitiveMcpPrincipalLinks.revokedAt),
      ),
    )
    .limit(1);
  if (!row || !["invited", "active"].includes(row.member.status)) {
    throw new McpBridgeServiceError(
      "PRINCIPAL_NOT_LINKED",
      "Link this verified OAuth identity from the private GO Society Web runtime before using the cognitive bridge.",
      403,
    );
  }
  if (
    row.member.expiresAt &&
    (!Number.isFinite(Date.parse(row.member.expiresAt)) ||
      Date.parse(row.member.expiresAt) <= Date.now())
  ) {
    throw new McpBridgeServiceError(
      "MEMBER_EXPIRED",
      "The linked GO Society membership has expired.",
      403,
    );
  }
  await cleanupExpiredMcpDrafts(db);
  return {
    link: row.link,
    principalHash,
    member: {
      id: row.member.id,
      displayName: row.member.displayName,
      publicAlias: row.member.publicAlias,
      namePublic: row.member.namePublic,
      role: row.member.role,
      status: row.member.status,
      isOwner: row.member.role === "owner",
    },
  };
}

async function principalHashFromStableUserId(
  stablePrincipalKey: string,
  requestUrl: string,
) {
  const normalizedPrincipalKey = stablePrincipalKey.trim();
  if (!normalizedPrincipalKey || normalizedPrincipalKey.length > 2_048) {
    throw new McpBridgeServiceError(
      "INVALID_PRINCIPAL_KEY",
      "The verified identity did not provide a usable stable principal key.",
      403,
    );
  }
  let origin: string;
  try {
    origin = publicOrigin(requestUrl);
  } catch {
    throw new McpBridgeServiceError(
      "PUBLIC_ORIGIN_UNAVAILABLE",
      "The canonical public origin is unavailable for principal binding.",
      503,
    );
  }
  const secret = getRuntimeVariable("GO_SOCIETY_PRINCIPAL_HMAC_SECRET") ?? "";
  try {
    return await hmacSha256(
      secret,
      stableStringify({ siteOrigin: origin, stableUserId: normalizedPrincipalKey }),
    );
  } catch {
    throw new McpBridgeServiceError(
      "PRINCIPAL_BINDING_UNAVAILABLE",
      "The OAuth-scoped MCP principal binding is unavailable.",
      503,
    );
  }
}

async function prepareMcpSourceBinding(
  principal: ResolvedPrincipal,
  missionId: number,
  source: { interface: string; threadKey: string },
) {
  const principalSecret =
    getRuntimeVariable("GO_SOCIETY_PRINCIPAL_HMAC_SECRET") ?? "";
  const threadSecret =
    getRuntimeVariable("GO_SOCIETY_THREAD_HMAC_SECRET") ?? "";
  try {
    const opaqueClientThreadKey = await hmacSha256(
      principalSecret,
      stableStringify({
        principalHash: principal.principalHash,
        missionId,
        sourceInterface: source.interface,
        clientThreadKey: source.threadKey,
      }),
    );
    const canonicalThreadKeyHash = await hmacSha256(
      threadSecret,
      stableStringify({
        missionId,
        memberId: principal.member.id,
        sourceInterface: source.interface,
        sourceThreadKey: opaqueClientThreadKey,
      }),
    );
    return { opaqueClientThreadKey, canonicalThreadKeyHash };
  } catch {
    throw new McpBridgeServiceError(
      "THREAD_BINDING_UNAVAILABLE",
      "The private conversation binding is unavailable.",
      503,
    );
  }
}

async function requireMcpAuthority(
  member: RuntimeMember,
  missionId: number,
  action: "custom:read_cognitive_context" | "custom:capture_cognitive_source",
) {
  const result = await requireOrganizationalMutation(
    `member:${member.id}`,
    action,
    `mission:${missionId}`,
    { candidateOnly: true, humanGate: "web-only" },
    {
      executor: "mcp-cognitive-bridge",
      requestedBy: "mcp-runtime",
    },
  );
  if (!result.allowed || !result.grantId || !result.grantRevision) {
    throw new McpBridgeServiceError(
      "MCP_AUTHORITY_DENIED",
      "The active AuthorityGrant does not permit this MCP operation.",
      403,
    );
  }
  return { grantId: result.grantId, grantRevision: result.grantRevision };
}

async function resolveMission(
  db: ReturnType<typeof getDb>,
  missionId?: number,
) {
  const [mission] = missionId
    ? await db.select().from(missions).where(eq(missions.id, missionId)).limit(1)
    : await db
        .select()
        .from(missions)
        .where(eq(missions.slug, "make-go-runnable"))
        .limit(1);
  if (!mission) {
    throw new McpBridgeServiceError(
      "MISSION_NOT_FOUND",
      "The requested cognitive Mission does not exist.",
      404,
    );
  }
  return mission;
}

async function requireDraftForPrincipal(
  db: ReturnType<typeof getDb>,
  principal: ResolvedPrincipal,
  draftId: string,
  payloadHash: string,
) {
  const [draft] = await db
    .select()
    .from(cognitiveMcpDrafts)
    .where(
      and(
        eq(cognitiveMcpDrafts.id, draftId),
        eq(cognitiveMcpDrafts.principalLinkId, principal.link.id),
        eq(cognitiveMcpDrafts.accountableMemberId, principal.member.id),
      ),
    )
    .limit(1);
  if (!draft) {
    throw new McpBridgeServiceError(
      "DRAFT_NOT_FOUND",
      "That private draft is outside this linked principal boundary.",
      404,
    );
  }
  assertExactDraftHash(draft, payloadHash);
  return draft;
}

function assertExactDraftHash(
  draft: { payloadHash: string },
  payloadHash: string,
) {
  if (draft.payloadHash !== payloadHash) {
    throw new McpBridgeServiceError(
      "DRAFT_CHANGED",
      "The staged payload hash does not match the exact draft under review.",
      409,
    );
  }
}

function materializeDraftStatus(draft: typeof cognitiveMcpDrafts.$inferSelect) {
  if (
    ["staged", "pending_human_consent"].includes(draft.status) &&
    Date.parse(draft.expiresAt) <= Date.now()
  ) {
    return {
      ...draft,
      status: "expired" as const,
      stagedPayload: null,
      sourceTitle: "[cleared]",
      payloadClearedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  return draft;
}

async function expireDraft(db: ReturnType<typeof getDb>, draftId: string) {
  const now = new Date().toISOString();
  await db
    .update(cognitiveMcpDrafts)
    .set({
      status: "expired",
      stagedPayload: null,
      sourceTitle: "[cleared]",
      payloadClearedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(cognitiveMcpDrafts.id, draftId),
        inArray(cognitiveMcpDrafts.status, [
          "staged",
          "pending_human_consent",
          "confirming",
        ]),
      ),
    );
}

async function cleanupExpiredMcpDrafts(db: ReturnType<typeof getDb>) {
  const now = new Date().toISOString();
  await db
    .update(cognitiveMcpDrafts)
    .set({
      status: "expired",
      stagedPayload: null,
      sourceTitle: "[cleared]",
      payloadClearedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        inArray(cognitiveMcpDrafts.status, ["staged", "pending_human_consent"]),
        sql`julianday(${cognitiveMcpDrafts.expiresAt}) <= julianday(${now})`,
      ),
    );

  const confirmingDrafts = await db
    .select()
    .from(cognitiveMcpDrafts)
    .where(
      and(
        eq(cognitiveMcpDrafts.status, "confirming"),
        sql`julianday(${cognitiveMcpDrafts.expiresAt}) <= julianday(${now})`,
      ),
    )
    .limit(40);
  for (const draft of confirmingDrafts) {
    const [receipt] = await db
      .select({ id: cognitiveSyncReceipts.id })
      .from(cognitiveSyncReceipts)
      .innerJoin(
        cognitiveThreads,
        eq(cognitiveThreads.id, cognitiveSyncReceipts.threadId),
      )
      .where(
        and(
          eq(
            cognitiveSyncReceipts.requestHash,
            draft.expectedCheckpointRequestHash,
          ),
          eq(
            cognitiveSyncReceipts.actor,
            `member:${draft.accountableMemberId}`,
          ),
          eq(cognitiveSyncReceipts.cursorFrom, draft.expectedCursor),
          eq(cognitiveSyncReceipts.cursorTo, draft.expectedCursor + 1),
          eq(cognitiveThreads.missionId, draft.missionId),
          eq(cognitiveThreads.accountableMemberId, draft.accountableMemberId),
          eq(cognitiveThreads.sourceInterface, draft.sourceInterface),
          eq(cognitiveThreads.sourceThreadKey, draft.sourceThreadKeyHash),
        ),
      )
      .limit(1);
    if (receipt) {
      try {
        await markMcpDraftConfirmed(draft.id, draft.payloadHash, receipt.id);
      } catch {
        // Preserve an inconsistent confirming draft for explicit recovery and
        // red-team inspection instead of destroying potentially canonical data.
      }
    } else {
      await expireDraft(db, draft.id);
    }
  }
}

function buildHumanConfirmedCheckpointInput(
  draftId: string,
  payloadHash: string,
  stagedPayload: unknown,
): CheckpointRequest {
  const stored = asRecord(stagedPayload);
  const source = asRecord(stored.source);
  const fragments = Array.isArray(stored.fragments) ? stored.fragments : [];
  const canonicalInput = {
    ...stored,
    idempotencyKey: `mcp-confirm-${draftId}-${payloadHash.slice(0, 16)}`,
    source: { ...source, consentConfirmed: true },
    fragments: fragments.map((value) => ({
      ...asRecord(value),
      provenanceTrust: "user_confirmed",
    })),
  };
  const parsed = checkpointRequestSchema.safeParse(canonicalInput);
  if (!parsed.success) {
    throw new McpBridgeServiceError(
      "DRAFT_INTEGRITY_ERROR",
      "The staged payload no longer satisfies the canonical checkpoint contract.",
      409,
    );
  }
  return parsed.data;
}

function draftToolResponse(
  draft: Pick<
    typeof cognitiveMcpDrafts.$inferSelect,
    "id" | "missionId" | "status" | "payloadHash" | "expiresAt"
  >,
  origin: string,
  replay: boolean,
) {
  const reviewUrl = new URL(
    `/?mcpDraft=${encodeURIComponent(draft.id)}#mcp-human-gate`,
    origin,
  ).toString();
  return {
    contractVersion: "0.5.0-alpha.2",
    draft: {
      id: draft.id,
      missionId: draft.missionId,
      status: draft.status,
      payloadHash: draft.payloadHash,
      expiresAt: draft.expiresAt,
      reviewUrl: draft.status === "pending_human_consent" ? reviewUrl : null,
      idempotentReplay: replay,
      boundary: {
        provenanceTrust: "model_reported",
        canonicalCognitionCreated: draft.status === "confirmed",
        candidateCreated: draft.status === "confirmed",
        headChanged: false,
        humanConsentRequired: !["confirmed", "rejected"].includes(draft.status),
      },
    },
  };
}

function validateRequestContext(context: McpBridgeRequestContext) {
  let requestOrigin: string;
  try {
    requestOrigin = new URL(context.requestUrl).origin;
  } catch {
    throw new McpBridgeServiceError(
      "INVALID_REQUEST_CONTEXT",
      "The MCP request URL is invalid.",
      500,
    );
  }
  if (safeOrigin(context.origin) !== requestOrigin) {
    throw new McpBridgeServiceError(
      "INVALID_REQUEST_CONTEXT",
      "The MCP request origin does not match the Site runtime.",
      500,
    );
  }
}

function safeOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    throw new McpBridgeServiceError(
      "INVALID_REQUEST_CONTEXT",
      "The Site origin is invalid.",
      500,
    );
  }
}

function validationError(message?: string) {
  return new McpBridgeServiceError(
    "INVALID_INPUT",
    message ?? "The MCP cognitive bridge input is incomplete.",
    400,
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === "object" && !Array.isArray(item),
      )
    : [];
}
