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
  "0005_loose_banshee.sql",
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
    assert.equal(grantCount, 3);
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
    assert.deepEqual(seededGrant.limits.allowedTools, [
      "web-runtime",
      "mcp-cognitive-bridge",
    ]);
    assert.deepEqual(seededGrant.limits.toolActionScopes["mcp-cognitive-bridge"], [
      "custom:read_cognitive_context",
      "custom:capture_cognitive_source",
    ]);
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
        action: "create_cognitive_commit",
        target: "mission:1",
        resourceRisk: "high",
        resourceExposure: 1,
        tool: "mcp-cognitive-bridge",
        reversibility: "costly_to_reverse_allowed",
      }),
      false,
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
        action: "custom:read_cognitive_context",
        target: "mission:1",
        resourceRisk: "low",
        resourceExposure: 0,
        tool: "mcp-cognitive-bridge",
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

    db.exec(`
      INSERT INTO cognitive_mcp_principal_links (
        id, principal_hash, member_id, status, linked_at,
        revoked_at, created_at, updated_at
      ) VALUES (
        'mcpl-test', 'principal-hmac-test', 1, 'active',
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), NULL,
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      );

      INSERT INTO cognitive_mcp_drafts (
        id, principal_link_id, mission_id, accountable_member_id,
        source_interface, source_thread_key_hash, source_title,
        expected_cursor, staged_payload, payload_hash,
        expected_checkpoint_request_hash, idempotency_key_hash,
        status, authority_grant_id,
        authority_grant_revision, expires_at, created_at, updated_at
      )
      SELECT
        'mcpd-test', 'mcpl-test', 1, 1,
        'test', 'opaque-test-key', 'Synthetic MCP draft',
        0, '{"fragments":[],"candidates":[]}',
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        'idempotency-hash-test', 'staged', id, revision,
        datetime('now', '+1 day'),
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      FROM authority_grants
      WHERE grantee = 'member:1' AND revoked_at IS NULL;
    `);

    assert.throws(
      () =>
        db.exec(`
          UPDATE cognitive_mcp_drafts
          SET status = 'confirming', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          WHERE id = 'mcpd-test'
        `),
      /invalid MCP draft state transition/,
    );

    assert.throws(
      () =>
        db.exec(`
          UPDATE cognitive_mcp_drafts
          SET staged_payload = '{"tampered":true}',
              updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          WHERE id = 'mcpd-test'
        `),
      /MCP draft review boundary is immutable/,
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
            'auth-mcp-forbidden', id, revision, 1, 1,
            'create_cognitive_commit', 'high', 1,
            'costly_to_reverse_allowed', 'mcp-cognitive-bridge',
            'mcp-runtime', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          FROM authority_grants
          WHERE grantee = 'member:1' AND revoked_at IS NULL
        `),
      /MCP executor cannot cross the conversation bridge boundary/,
    );

    db.exec(`
      INSERT INTO cognitive_authorization_receipts (
        id, authority_grant_id, grant_revision, member_id, mission_id,
        action, resource_risk, resource_exposure, reversibility,
        executor, requested_by, created_at
      )
      SELECT
        'auth-mcp-read', id, revision, 1, 1,
        'custom:read_cognitive_context', 'low', 0, 'reversible_only',
        'mcp-cognitive-bridge', 'mcp-runtime',
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      FROM authority_grants
      WHERE grantee = 'member:1' AND revoked_at IS NULL;

      INSERT INTO cognitive_authorization_receipts (
        id, authority_grant_id, grant_revision, member_id, mission_id,
        action, resource_risk, resource_exposure, reversibility,
        executor, requested_by, created_at
      )
      SELECT
        'auth-mcp-capture', id, revision, 1, 1,
        'custom:capture_cognitive_source', 'low', 1, 'reversible_only',
        'web-runtime', 'runtime-api',
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      FROM authority_grants
      WHERE grantee = 'member:1' AND revoked_at IS NULL;

      INSERT INTO cognitive_checkpoint_claims (
        id, thread_id, cursor_from, cursor_to, request_hash,
        consent_scope, consent_confirmed_by_member_id,
        consent_confirmed_at, authorization_receipt_id, created_at
      ) VALUES (
        'claim-mcp-confirmed', 'thread-test', 0, 1,
        'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        'internal_only', 1,
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 'auth-mcp-capture',
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      );

      UPDATE cognitive_threads
      SET last_cursor = 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = 'thread-test' AND last_cursor = 0;

      INSERT INTO cognitive_sync_receipts (
        id, idempotency_key, thread_id, operation, request_hash,
        response_payload, cursor_from, cursor_to, actor, received_at
      ) VALUES (
        'csr-mcp-wrong-hash', 'mcp-confirm-wrong-hash', 'thread-test', 'checkpoint',
        'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
        '{"checkpoint":{"id":"csr-mcp-wrong-hash","missionId":1,"cursorFrom":0,"cursorTo":1}}',
        0, 1, 'member:1', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      );

      UPDATE cognitive_mcp_drafts
      SET status = 'pending_human_consent',
          review_requested_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = 'mcpd-test';

      UPDATE cognitive_mcp_drafts
      SET status = 'confirming', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = 'mcpd-test';
    `);

    assert.throws(
      () =>
        db.exec(`
          UPDATE cognitive_mcp_drafts
          SET status = 'confirmed', staged_payload = NULL,
              payload_cleared_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
              confirmed_checkpoint_receipt_id = 'csr-mcp-wrong-hash',
              confirmed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
              updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          WHERE id = 'mcpd-test'
        `),
      /confirmed MCP draft lacks its exact canonical checkpoint/,
    );

    db.exec(`
      INSERT INTO cognitive_sync_receipts (
        id, idempotency_key, thread_id, operation, request_hash,
        response_payload, cursor_from, cursor_to, actor, received_at
      ) VALUES (
        'csr-mcp-wrong-actor', 'mcp-confirm-wrong-actor', 'thread-test', 'checkpoint',
        'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        '{"checkpoint":{"id":"csr-mcp-wrong-actor","missionId":1,"cursorFrom":0,"cursorTo":1}}',
        0, 1, 'member:999', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      );
    `);

    assert.throws(
      () =>
        db.exec(`
          UPDATE cognitive_mcp_drafts
          SET status = 'confirmed', staged_payload = NULL,
              payload_cleared_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
              confirmed_checkpoint_receipt_id = 'csr-mcp-wrong-actor',
              confirmed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
              updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          WHERE id = 'mcpd-test'
        `),
      /confirmed MCP draft lacks its exact canonical checkpoint/,
    );

    db.exec(`
      INSERT INTO cognitive_sync_receipts (
        id, idempotency_key, thread_id, operation, request_hash,
        response_payload, cursor_from, cursor_to, actor, received_at
      ) VALUES (
        'csr-mcp-confirmed', 'mcp-confirm-test', 'thread-test', 'checkpoint',
        'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        '{"checkpoint":{"id":"csr-mcp-confirmed","missionId":1,"cursorFrom":0,"cursorTo":1}}',
        0, 1, 'member:1', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      );

      UPDATE cognitive_mcp_drafts
      SET status = 'confirmed', staged_payload = NULL, source_title = '[cleared]',
          payload_cleared_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
          confirmed_checkpoint_receipt_id = 'csr-mcp-confirmed',
          confirmed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = 'mcpd-test';
    `);

    const confirmedMcpDraft = db
      .prepare(`
        SELECT status, source_title AS sourceTitle, staged_payload AS stagedPayload,
          payload_cleared_at AS payloadClearedAt,
          payload_hash AS payloadHash,
          expected_checkpoint_request_hash AS expectedCheckpointRequestHash
        FROM cognitive_mcp_drafts WHERE id = 'mcpd-test'
      `)
      .get();
    assert.equal(confirmedMcpDraft.status, "confirmed");
    assert.equal(confirmedMcpDraft.sourceTitle, "[cleared]");
    assert.equal(confirmedMcpDraft.stagedPayload, null);
    assert.ok(confirmedMcpDraft.payloadClearedAt);
    assert.equal(confirmedMcpDraft.payloadHash.length, 64);
    assert.equal(confirmedMcpDraft.expectedCheckpointRequestHash.length, 64);

    assert.throws(
      () =>
        db.exec(`
          INSERT INTO cognitive_mcp_drafts (
            id, principal_link_id, mission_id, accountable_member_id,
            source_interface, source_thread_key_hash, source_title,
            expected_cursor, staged_payload, payload_hash,
            expected_checkpoint_request_hash, payload_cleared_at,
            idempotency_key_hash, status, authority_grant_id,
            authority_grant_revision, confirmed_checkpoint_receipt_id,
            confirmed_at, expires_at, created_at, updated_at
          )
          SELECT
            'mcpd-direct-confirmed', 'mcpl-test', 1, 1,
            'test-direct', 'opaque-test-key-direct', 'Invalid direct terminal insert',
            0, NULL,
            'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
            'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
            'idempotency-hash-direct', 'confirmed', id, revision,
            'csr-mcp-confirmed', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
            datetime('now', '+1 day'),
            strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
            strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          FROM authority_grants
          WHERE grantee = 'member:1' AND revoked_at IS NULL
        `),
      /MCP drafts must enter through staged state/,
    );
    assert.throws(
      () =>
        db.exec(`
          UPDATE cognitive_sync_receipts
          SET actor = 'member:999' WHERE id = 'csr-mcp-confirmed'
        `),
      /cognitive sync receipts are append-only/,
    );
    assert.throws(
      () =>
        db.exec(`
          DELETE FROM cognitive_checkpoint_claims
          WHERE id = 'claim-mcp-confirmed'
        `),
      /cognitive checkpoint claims are append-only/,
    );
    assert.equal(
      db.prepare("SELECT COUNT(*) AS count FROM cognitive_heads").get().count,
      0,
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
