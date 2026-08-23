import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import {
  canPerformAction,
  parseAuthorityGrant,
} from "../db/authority-grants.ts";

const migrations = [
  "0000_tiny_liz_osborn.sql",
  "0001_supreme_doomsday.sql",
  "0002_talented_silk_fever.sql",
  "0003_low_daredevil.sql",
];

test("the complete forward migration chain is valid and fails closed on duplicate active grants", async () => {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");

  try {
    for (const migration of migrations) {
      const sql = await readFile(
        new URL(`../drizzle/${migration}`, import.meta.url),
        "utf8",
      );
      for (const statement of sql.split("--> statement-breakpoint")) {
        if (statement.trim()) db.exec(statement);
      }
    }

    const grantCount = db
      .prepare("SELECT COUNT(*) AS count FROM authority_grants")
      .get().count;
    assert.equal(grantCount, 1);

    const rawGrant = db
      .prepare(`
        SELECT
          id, grantor, grantee,
          accountable_human AS accountableHuman,
          scope,
          allowed_actions AS allowedActions,
          prohibited_actions AS prohibitedActions,
          resource_rights AS resourceRights,
          limits,
          reversibility_ceiling AS reversibilityCeiling,
          evidence_obligations AS evidenceObligations,
          escalation,
          conflict_rules AS conflictRules,
          valid_from AS validFrom,
          expires_at AS expiresAt,
          revoked_at AS revokedAt,
          self_expansion_allowed AS selfExpansionAllowed
        FROM authority_grants
        WHERE grantee = 'member:1'
      `)
      .get();
    const seededGrant = {
      ...rawGrant,
      allowedActions: JSON.parse(rawGrant.allowedActions),
      prohibitedActions: JSON.parse(rawGrant.prohibitedActions),
      resourceRights: JSON.parse(rawGrant.resourceRights),
      limits: JSON.parse(rawGrant.limits),
      evidenceObligations: JSON.parse(rawGrant.evidenceObligations),
      escalation: JSON.parse(rawGrant.escalation),
      conflictRules: JSON.parse(rawGrant.conflictRules),
      selfExpansionAllowed: Boolean(rawGrant.selfExpansionAllowed),
    };
    assert.ok(parseAuthorityGrant(seededGrant));
    assert.equal(
      canPerformAction(seededGrant, {
        actor: "member:1",
        action: "custom:manage_membership",
        target: "mission:1",
        resourceRisk: "high",
        resourceExposure: 1,
        tool: "web-runtime",
        reversibility: "reversible_only",
      }),
      true,
    );

    const alphaCase = db
      .prepare(
        "SELECT public_title AS title, stage FROM public_cases WHERE public_title = ?",
      )
      .get("An alpha reference surface now exists");
    assert.equal(alphaCase.title, "An alpha reference surface now exists");
    assert.equal(alphaCase.stage, "probe");

    assert.throws(
      () =>
        db.exec(`
          INSERT INTO authority_grants (
            id, grantor, grantee, accountable_human, scope,
            allowed_actions, prohibited_actions, resource_rights, limits,
            reversibility_ceiling, evidence_obligations, escalation,
            conflict_rules, valid_from, expires_at, revoked_at,
            self_expansion_allowed
          )
          SELECT
            'duplicate-' || id, grantor, grantee, accountable_human, scope,
            allowed_actions, prohibited_actions, resource_rights, limits,
            reversibility_ceiling, evidence_obligations, escalation,
            conflict_rules, valid_from, expires_at, NULL,
            self_expansion_allowed
          FROM authority_grants
          LIMIT 1
        `),
      /UNIQUE constraint failed: authority_grants\.grantee/,
    );

    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  } finally {
    db.close();
  }
});
