import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const missions = sqliteTable("missions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  purpose: text("purpose").notNull(),
  owner: text("owner").notNull(),
  status: text("status").notNull().default("forming"),
  authoritySummary: text("authority_summary").notNull(),
  successSignal: text("success_signal").notNull(),
  nextDecision: text("next_decision").notNull(),
  confidence: integer("confidence").notNull().default(50),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
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
