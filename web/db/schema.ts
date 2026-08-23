import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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
