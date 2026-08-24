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
  "0004_calm_ares.sql",
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
    assert.equal(grantCount, 2);
    assert.equal(
      db.prepare("SELECT COUNT(*) AS count FROM authority_grants WHERE revoked_at IS NULL").get().count,
      1,
    );

    const rawGrant = db
      .prepare(`
        SELECT
          id, revision, grantor, grantee,
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
          AND revoked_at IS NULL
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
    assert.equal(
      canPerformAction(seededGrant, {
        actor: "member:1",
        action: "custom:read_cognitive_context",
        target: "mission:1",
        resourceRisk: "low",
        resourceExposure: 0,
        tool: "web-runtime",
        reversibility: "reversible_only",
      }),
      true,
    );
    assert.equal(
      canPerformAction(seededGrant, {
        actor: "member:1",
        action: "create_cognitive_commit",
        target: "mission:1",
        resourceRisk: "high",
        resourceExposure: 1,
        tool: "web-runtime",
        reversibility: "costly_to_reverse_allowed",
      }),
      true,
    );
    assert.equal(
      canPerformAction(seededGrant, {
        actor: "member:1",
        action: "custom:capture_cognitive_source",
        target: "mission:1",
        resourceRisk: "low",
        resourceExposure: 1,
        tool: "web-runtime",
        reversibility: "reversible_only",
      }),
      true,
    );

    const bridgeCounts = db
      .prepare(`
        SELECT
          (SELECT COUNT(*) FROM cognitive_threads) AS threads,
          (SELECT COUNT(*) FROM cognitive_fragments) AS fragments,
          (SELECT COUNT(*) FROM cognitive_objects WHERE decision_state = 'candidate') AS candidates,
          (SELECT COUNT(*) FROM cognitive_heads) AS heads
      `)
      .get();
    assert.equal(bridgeCounts.threads, 0);
    assert.equal(bridgeCounts.fragments, 0);
    assert.equal(bridgeCounts.candidates, 0);
    assert.equal(bridgeCounts.heads, 0);

    const checkpointClaimColumns = new Set(
      db
        .prepare("PRAGMA table_info(cognitive_checkpoint_claims)")
        .all()
        .map((column) => column.name),
    );
    assert.ok(checkpointClaimColumns.has("consent_scope"));
    assert.ok(
      checkpointClaimColumns.has("consent_confirmed_by_member_id"),
    );
    assert.ok(checkpointClaimColumns.has("consent_confirmed_at"));

    const cognitiveMigration = await readFile(
      new URL("../drizzle/0004_calm_ares.sql", import.meta.url),
      "utf8",
    );
    assert.doesNotMatch(cognitiveMigration, /cf_narrative_review_001/);

    db.exec(`
      INSERT INTO cognitive_threads (
        id, source_interface, source_thread_key, source_title, mission_id,
        accountable_member_id, capture_mode, consent_scope, last_cursor,
        status, created_at, updated_at
      ) VALUES (
        'thread-test', 'test', 'opaque-test-key', 'Synthetic private fixture',
        1, 1, 'selected_checkpoint', 'internal_only', 0, 'active',
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      );

      INSERT INTO cognitive_authorization_receipts (
        id, authority_grant_id, grant_revision, member_id, mission_id,
        action, resource_risk, resource_exposure, reversibility,
        executor, requested_by, created_at
      )
      SELECT
        'auth-create-event', id, revision, 1, 1,
        'create_cognitive_event', 'low', 1, 'reversible_only',
        'web-runtime', 'migration-test', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      FROM authority_grants WHERE grantee = 'member:1' AND revoked_at IS NULL;

      INSERT INTO cognitive_authorization_receipts (
        id, authority_grant_id, grant_revision, member_id, mission_id,
        action, resource_risk, resource_exposure, reversibility,
        executor, requested_by, created_at
      )
      SELECT
        'auth-review', id, revision, 1, 1,
        'custom:review_cognition', 'high', 1,
        'costly_to_reverse_allowed', 'web-runtime', 'migration-test',
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      FROM authority_grants WHERE grantee = 'member:1' AND revoked_at IS NULL;

      INSERT INTO cognitive_objects (
        id, object_type, schema_version, mission_id, thread_id, decision_state,
        canonical_payload, payload_hash, created_by, accountable_member_id,
        authority_grant_id, authorization_receipt_id, created_at, updated_at
      )
      SELECT
        'candidate-test', 'CognitiveEvent', '0.5.0', 1, 'thread-test',
        'candidate', '{"id":"candidate-test","narrative_refs":["synthetic"]}',
        'synthetic-hash', 'migration-test', 1, authority_grant_id,
        'auth-create-event', created_at, created_at
      FROM cognitive_authorization_receipts WHERE id = 'auth-create-event';

      INSERT INTO cognitive_candidate_decisions (
        candidate_id, decision, decided_by_member_id, rationale,
        authorization_receipt_id, decided_at
      ) VALUES (
        'candidate-test', 'reject', 1, 'Synthetic rejection test.',
        'auth-review', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      );
    `);

    assert.throws(
      () =>
        db.exec(`
          INSERT INTO cognitive_candidate_decisions (
            candidate_id, decision, decided_by_member_id, rationale,
            authorization_receipt_id, decided_at
          ) VALUES (
            'candidate-test', 'ratify', 1, 'Concurrent second decision.',
            'auth-review', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          )
        `),
      /UNIQUE constraint failed: cognitive_candidate_decisions\.candidate_id/,
    );

    assert.throws(
      () =>
        db.exec(`
          INSERT INTO cognitive_objects (
            id, object_type, schema_version, mission_id, thread_id,
            decision_state, canonical_payload, payload_hash, created_by,
            accountable_member_id, authority_grant_id, created_at, updated_at
          )
          SELECT
            'candidate-no-auth', 'CognitiveEvent', '0.5.0', 1, 'thread-test',
            'candidate', '{}', 'hash', 'migration-test', 1, id,
            strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
            strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          FROM authority_grants WHERE revoked_at IS NULL LIMIT 1
        `),
      /cognitive object lacks atomic authorization/,
    );

    assert.throws(
      () =>
        db.exec(`
          INSERT INTO cognitive_authorization_receipts (
            id, authority_grant_id, grant_revision, member_id, mission_id,
            action, resource_risk, resource_exposure, reversibility,
            executor, requested_by, created_at
          )
          SELECT
            'auth-revoked', id, revision, 1, 1, 'custom:manage_membership',
            'high', 1, 'reversible_only', 'web-runtime', 'migration-test',
            strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          FROM authority_grants WHERE revoked_at IS NOT NULL LIMIT 1
        `),
      /authority changed before cognitive write/,
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
            self_expansion_allowed, revision
          )
          SELECT
            'duplicate-' || id, grantor, grantee, accountable_human, scope,
            allowed_actions, prohibited_actions, resource_rights, limits,
            reversibility_ceiling, evidence_obligations, escalation,
            conflict_rules, valid_from, expires_at, NULL,
            self_expansion_allowed, revision
          FROM authority_grants
          WHERE revoked_at IS NULL
          LIMIT 1
        `),
      /UNIQUE constraint failed: authority_grants\.grantee/,
    );

    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  } finally {
    db.close();
  }
});
