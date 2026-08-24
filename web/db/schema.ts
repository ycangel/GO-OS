import { sql } from "drizzle-orm";
import {
  check,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import type {
  AuthorityAction,
  AuthorityLimits,
  AuthorityResourceRights,
} from "./authority-grants";

export const missions = sqliteTable("missions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  purpose: text("purpose").notNull(),
  owner: text("owner").notNull(),
  publicOwnerLabel: text("public_owner_label")
    .notNull()
    .default("Named human owner"),
  status: text("status").notNull().default("forming"),
  authoritySummary: text("authority_summary").notNull(),
  successSignal: text("success_signal").notNull(),
  nextDecision: text("next_decision").notNull(),
  confidence: integer("confidence").notNull().default(50),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const members = sqliteTable("members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").unique(),
  displayName: text("display_name").notNull(),
  publicAlias: text("public_alias")
    .notNull()
    .default("GO Society Mission Partner"),
  namePublic: integer("name_public", { mode: "boolean" })
    .notNull()
    .default(false),
  role: text("role").notNull().default("mission_partner"),
  status: text("status").notNull().default("invited"),
  expiresAt: text("expires_at"),
  joinedAt: text("joined_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const missionMemberships = sqliteTable(
  "mission_memberships",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    missionId: integer("mission_id")
      .notNull()
      .references(() => missions.id),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id),
    canRecord: integer("can_record", { mode: "boolean" })
      .notNull()
      .default(true),
    canReview: integer("can_review", { mode: "boolean" })
      .notNull()
      .default(false),
    canPublish: integer("can_publish", { mode: "boolean" })
      .notNull()
      .default(false),
    status: text("status").notNull().default("active"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("mission_memberships_mission_member_unique").on(
      table.missionId,
      table.memberId,
    ),
  ],
);

export const fieldRecords = sqliteTable("field_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  missionId: integer("mission_id")
    .notNull()
    .references(() => missions.id),
  organizationAlias: text("organization_alias").notNull(),
  sourceKind: text("source_kind").notNull(),
  roleClass: text("role_class").notNull(),
  privateNotes: text("private_notes").notNull(),
  stage: text("stage").notNull().default("signal"),
  consentScope: text("consent_scope").notNull().default("internal_only"),
  privacyStatus: text("privacy_status").notNull().default("private_intake"),
  createdByMemberId: integer("created_by_member_id")
    .notNull()
    .references(() => members.id),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const publicCases = sqliteTable("public_cases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  missionId: integer("mission_id").references(() => missions.id),
  sourceFieldRecordId: integer("source_field_record_id").references(
    () => fieldRecords.id,
  ),
  publicTitle: text("public_title").notNull(),
  publicSummary: text("public_summary").notNull(),
  organizationProfile: text("organization_profile").notNull(),
  sourceRoleClass: text("source_role_class").notNull(),
  stage: text("stage").notNull().default("signal"),
  consentScope: text("consent_scope").notNull(),
  reidentificationRisk: text("reidentification_risk").notNull(),
  privacyStatus: text("privacy_status").notNull().default("pending"),
  publicationStatus: text("publication_status").notNull().default("draft"),
  approvedByMemberId: integer("approved_by_member_id").references(
    () => members.id,
  ),
  approvedAt: text("approved_at"),
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const publicationReviews = sqliteTable("publication_reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  publicCaseId: integer("public_case_id")
    .notNull()
    .references(() => publicCases.id),
  reviewerMemberId: integer("reviewer_member_id")
    .notNull()
    .references(() => members.id),
  decision: text("decision").notNull(),
  piiCheckStatus: text("pii_check_status").notNull(),
  reidentificationRisk: text("reidentification_risk").notNull(),
  consentScope: text("consent_scope").notNull(),
  privateNotes: text("private_notes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const evidence = sqliteTable("evidence", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  missionId: integer("mission_id").references(() => missions.id),
  title: text("title").notNull(),
  observation: text("observation").notNull(),
  source: text("source").notNull(),
  freshness: text("freshness").notNull().default("current"),
  reliability: text("reliability").notNull().default("medium"),
  createdBy: text("created_by").notNull().default("GO Society"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const exceptions = sqliteTable("exceptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  missionId: integer("mission_id").references(() => missions.id),
  title: text("title").notNull(),
  context: text("context").notNull(),
  severity: text("severity").notNull().default("medium"),
  requiredDecision: text("required_decision").notNull(),
  accountableOwner: text("accountable_owner").notNull(),
  status: text("status").notNull().default("open"),
  createdBy: text("created_by").notNull().default("GO Society"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const evolutionProposals = sqliteTable("evolution_proposals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  triggerEvidence: text("trigger_evidence").notNull(),
  proposedChange: text("proposed_change").notNull(),
  sponsor: text("sponsor").notNull(),
  status: text("status").notNull().default("proposed"),
  reversible: integer("reversible", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const capabilities = sqliteTable("capabilities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  maturity: text("maturity").notNull().default("emerging"),
  evidenceCount: integer("evidence_count").notNull().default(0),
  lastLearnedAt: text("last_learned_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const authorityGrants = sqliteTable(
  "authority_grants",
  {
    id: text("id").primaryKey(),
    grantor: text("grantor").notNull(),
    grantee: text("grantee").notNull(),
    accountableHuman: text("accountable_human").notNull(),
    scope: text("scope").notNull(),
    allowedActions: text("allowed_actions", { mode: "json" })
      .$type<AuthorityAction[]>()
      .notNull(),
    prohibitedActions: text("prohibited_actions", { mode: "json" })
      .$type<AuthorityAction[]>()
      .notNull(),
    resourceRights: text("resource_rights", { mode: "json" })
      .$type<AuthorityResourceRights>()
      .notNull(),
    limits: text("limits", { mode: "json" })
      .$type<AuthorityLimits>()
      .notNull(),
    reversibilityCeiling: text("reversibility_ceiling")
      .$type<
        | "reversible_only"
        | "costly_to_reverse_allowed"
        | "irreversible_allowed"
      >()
      .notNull(),
    evidenceObligations: text("evidence_obligations", { mode: "json" })
      .$type<string[]>()
      .notNull(),
    escalation: text("escalation", { mode: "json" })
      .$type<string[]>()
      .notNull(),
    conflictRules: text("conflict_rules", { mode: "json" })
      .$type<string[]>()
      .notNull(),
    validFrom: text("valid_from"),
    expiresAt: text("expires_at"),
    revokedAt: text("revoked_at"),
    revision: integer("revision").notNull().default(1),
    selfExpansionAllowed: integer("self_expansion_allowed", {
      mode: "boolean",
    })
      .notNull()
      .default(false),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("authority_grants_grantee_active_unique").on(
      table.grantee,
    ).where(sql`${table.revokedAt} IS NULL`),
  ],
);

/**
 * Private conversation bindings for the Cognitive Bridge.
 *
 * A thread is a transport boundary, not a ninth GO OS core object. It lets a
 * conversation resume from durable organizational cognition without treating
 * the transcript itself as ratified memory.
 */
export const cognitiveThreads = sqliteTable(
  "cognitive_threads",
  {
    id: text("id").primaryKey(),
    sourceInterface: text("source_interface").notNull(),
    sourceThreadKey: text("source_thread_key").notNull(),
    sourceTitle: text("source_title").notNull(),
    missionId: integer("mission_id")
      .notNull()
      .references(() => missions.id),
    accountableMemberId: integer("accountable_member_id")
      .notNull()
      .references(() => members.id),
    captureMode: text("capture_mode")
      .notNull()
      .default("selected_checkpoint"),
    consentScope: text("consent_scope").notNull().default("internal_only"),
    lastCursor: integer("last_cursor").notNull().default(0),
    status: text("status").notNull().default("active"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("cognitive_threads_source_unique").on(
      table.sourceInterface,
      table.sourceThreadKey,
    ),
  ],
);

/** Exact private source material. Source is never silently promoted to Evidence. */
export const cognitiveFragments = sqliteTable(
  "cognitive_fragments",
  {
    id: text("id").primaryKey(),
    threadId: text("thread_id")
      .notNull()
      .references(() => cognitiveThreads.id),
    sourceTurnRef: text("source_turn_ref").notNull(),
    speakerType: text("speaker_type").notNull(),
    speakerRef: text("speaker_ref"),
    verbatimText: text("verbatim_text").notNull(),
    contentHash: text("content_hash").notNull(),
    contentKind: text("content_kind").notNull().default("narrative"),
    provenanceTrust: text("provenance_trust")
      .notNull()
      .default("model_reported"),
    visibility: text("visibility").notNull().default("private"),
    occurredAt: text("occurred_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("cognitive_fragments_thread_turn_unique").on(
      table.threadId,
      table.sourceTurnRef,
    ),
  ],
);

/**
 * Canonical GO OS objects staged or ratified through the bridge.
 * decisionState is the human-governed workflow state; canonicalPayload keeps
 * the schema-shaped object and its epistemic status.
 */
export const cognitiveObjects = sqliteTable("cognitive_objects", {
  id: text("id").primaryKey(),
  objectType: text("object_type").notNull(),
  schemaVersion: text("schema_version").notNull().default("0.5.0"),
  missionId: integer("mission_id")
    .notNull()
    .references(() => missions.id),
  threadId: text("thread_id")
    .notNull()
    .references(() => cognitiveThreads.id),
  decisionState: text("decision_state").notNull().default("candidate"),
  canonicalPayload: text("canonical_payload", { mode: "json" })
    .$type<Record<string, unknown>>()
    .notNull(),
  payloadHash: text("payload_hash").notNull(),
  createdBy: text("created_by").notNull(),
  accountableMemberId: integer("accountable_member_id")
    .notNull()
    .references(() => members.id),
  authorityGrantId: text("authority_grant_id")
    .notNull()
    .references(() => authorityGrants.id),
  authorizationReceiptId: text("authorization_receipt_id").references(
    () => cognitiveAuthorizationReceipts.id,
  ),
  decidedByMemberId: integer("decided_by_member_id").references(
    () => members.id,
  ),
  decisionRationale: text("decision_rationale"),
  decidedAt: text("decided_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const cognitiveObjectLinks = sqliteTable(
  "cognitive_object_links",
  {
    id: text("id").primaryKey(),
    fromObjectId: text("from_object_id")
      .notNull()
      .references(() => cognitiveObjects.id),
    toObjectId: text("to_object_id").references(() => cognitiveObjects.id),
    fragmentId: text("fragment_id").references(() => cognitiveFragments.id),
    relationType: text("relation_type").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    check(
      "cognitive_object_links_one_target",
      sql`(${table.toObjectId} IS NULL) <> (${table.fragmentId} IS NULL)`,
    ),
    uniqueIndex("cognitive_object_links_object_unique")
      .on(
        table.fromObjectId,
        table.toObjectId,
        table.relationType,
      )
      .where(sql`${table.toObjectId} IS NOT NULL`),
    uniqueIndex("cognitive_object_links_fragment_unique").on(
      table.fromObjectId,
      table.fragmentId,
      table.relationType,
    ).where(sql`${table.fragmentId} IS NOT NULL`),
  ],
);

/**
 * Transaction-local proof that the named grant was still valid at the exact
 * write boundary. A database trigger revalidates grant revision, expiry,
 * revocation, action and Mission membership before accepting the receipt.
 */
export const cognitiveAuthorizationReceipts = sqliteTable(
  "cognitive_authorization_receipts",
  {
    id: text("id").primaryKey(),
    authorityGrantId: text("authority_grant_id")
      .notNull()
      .references(() => authorityGrants.id),
    grantRevision: integer("grant_revision").notNull(),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id),
    missionId: integer("mission_id")
      .notNull()
      .references(() => missions.id),
    action: text("action").notNull(),
    resourceRisk: text("resource_risk").notNull(),
    resourceExposure: integer("resource_exposure").notNull(),
    reversibility: text("reversibility").notNull(),
    executor: text("executor").notNull(),
    requestedBy: text("requested_by").notNull(),
    createdAt: text("created_at").notNull(),
  },
);

/** Exactly one human decision may ever claim a candidate. */
export const cognitiveCandidateDecisions = sqliteTable(
  "cognitive_candidate_decisions",
  {
    candidateId: text("candidate_id")
      .primaryKey()
      .references(() => cognitiveObjects.id),
    decision: text("decision").notNull(),
    decidedByMemberId: integer("decided_by_member_id")
      .notNull()
      .references(() => members.id),
    rationale: text("rationale").notNull(),
    authorizationReceiptId: text("authorization_receipt_id")
      .notNull()
      .references(() => cognitiveAuthorizationReceipts.id),
    decidedAt: text("decided_at").notNull(),
  },
  (table) => [
    check(
      "cognitive_candidate_decisions_decision_check",
      sql`${table.decision} IN ('ratify', 'reject')`,
    ),
  ],
);

/** A cursor can be advanced by only one checkpoint. */
export const cognitiveCheckpointClaims = sqliteTable(
  "cognitive_checkpoint_claims",
  {
    id: text("id").primaryKey(),
    threadId: text("thread_id")
      .notNull()
      .references(() => cognitiveThreads.id),
    cursorFrom: integer("cursor_from").notNull(),
    cursorTo: integer("cursor_to").notNull(),
    requestHash: text("request_hash").notNull(),
    consentScope: text("consent_scope").notNull(),
    consentConfirmedByMemberId: integer("consent_confirmed_by_member_id")
      .notNull()
      .references(() => members.id),
    consentConfirmedAt: text("consent_confirmed_at").notNull(),
    authorizationReceiptId: text("authorization_receipt_id")
      .notNull()
      .references(() => cognitiveAuthorizationReceipts.id),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("cognitive_checkpoint_claims_thread_cursor_unique").on(
      table.threadId,
      table.cursorFrom,
    ),
    check(
      "cognitive_checkpoint_claims_cursor_step",
      sql`${table.cursorTo} = ${table.cursorFrom} + 1`,
    ),
    check(
      "cognitive_checkpoint_claims_consent_scope",
      sql`${table.consentScope} = 'internal_only'`,
    ),
  ],
);

/** A Mission revision can advance through only one successful transition. */
export const cognitiveHeadTransitions = sqliteTable(
  "cognitive_head_transitions",
  {
    id: text("id").primaryKey(),
    missionId: integer("mission_id")
      .notNull()
      .references(() => missions.id),
    previousRevision: integer("previous_revision").notNull(),
    nextRevision: integer("next_revision").notNull(),
    versionId: text("version_id").notNull(),
    authorizationReceiptId: text("authorization_receipt_id")
      .notNull()
      .references(() => cognitiveAuthorizationReceipts.id),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("cognitive_head_transitions_revision_unique").on(
      table.missionId,
      table.previousRevision,
    ),
    check(
      "cognitive_head_transitions_revision_step",
      sql`${table.nextRevision} = ${table.previousRevision} + 1`,
    ),
  ],
);

/** One optimistic, append-only cognitive head per Mission. */
export const cognitiveHeads = sqliteTable("cognitive_heads", {
  missionId: integer("mission_id")
    .primaryKey()
    .references(() => missions.id),
  ratifiedVersionId: text("ratified_version_id")
    .notNull()
    .references(() => cognitiveObjects.id),
  revision: integer("revision").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/** Durable idempotency and cursor receipts for future Skill/MCP adapters. */
export const cognitiveSyncReceipts = sqliteTable(
  "cognitive_sync_receipts",
  {
    id: text("id").primaryKey(),
    idempotencyKey: text("idempotency_key").notNull(),
    threadId: text("thread_id")
      .notNull()
      .references(() => cognitiveThreads.id),
    operation: text("operation").notNull(),
    requestHash: text("request_hash").notNull(),
    responsePayload: text("response_payload", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull(),
    cursorFrom: integer("cursor_from").notNull(),
    cursorTo: integer("cursor_to").notNull(),
    actor: text("actor").notNull(),
    receivedAt: text("received_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("cognitive_sync_receipts_idempotency_unique").on(
      table.idempotencyKey,
    ),
  ],
);
