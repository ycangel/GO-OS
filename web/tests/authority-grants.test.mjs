import assert from "node:assert/strict";
import test from "node:test";

import {
  canPerformAction,
  findUnambiguousActiveGrant,
  hasUnambiguousAuthority,
  parseAuthorityGrant,
} from "../db/authority-grants.ts";

function grant(overrides = {}) {
  return {
    id: "authority-test-001",
    revision: 1,
    grantor: "human:owner",
    grantee: "agent:test",
    accountableHuman: "human:owner",
    scope: "Bounded authority test",
    allowedActions: ["create_evidence", "create_evolution_proposal"],
    prohibitedActions: ["update_mission"],
    resourceRights: {
      missionMembershipRequired: false,
      allowedTargets: ["mission:test"],
    },
    limits: {
      maxRiskClass: "medium",
      maxResourceExposure: 2,
      allowedTools: ["web-runtime"],
    },
    reversibilityCeiling: "reversible_only",
    evidenceObligations: ["Record provenance"],
    escalation: ["Escalate outside scope"],
    conflictRules: ["More restrictive boundary wins"],
    selfExpansionAllowed: false,
    ...overrides,
  };
}

function actionRequest(overrides = {}) {
  return {
    actor: "agent:test",
    action: "create_evidence",
    target: "mission:test",
    resourceRisk: "low",
    resourceExposure: 1,
    tool: "web-runtime",
    reversibility: "reversible_only",
    ...overrides,
  };
}

test("valid bounded authority permits an allowed action", () => {
  assert.equal(
    canPerformAction(grant(), actionRequest()),
    true,
  );
});

test("authority fails closed across identity, lifecycle and prohibition boundaries", () => {
  const request = actionRequest();

  assert.equal(canPerformAction(grant(), { ...request, actor: "agent:other" }), false);
  assert.equal(
    canPerformAction(grant({ revokedAt: new Date().toISOString() }), request),
    false,
  );
  assert.equal(
    canPerformAction(grant({ expiresAt: "2020-01-01T00:00:00Z" }), request),
    false,
  );
  assert.equal(
    canPerformAction(grant({ expiresAt: "not-a-date" }), request),
    false,
  );
  assert.equal(
    canPerformAction(grant({ validFrom: "2999-01-01T00:00:00Z" }), request),
    false,
  );
  assert.equal(
    canPerformAction(grant({ selfExpansionAllowed: true }), request),
    false,
  );
  assert.equal(
    canPerformAction(grant({ prohibitedActions: ["create_evidence"] }), request),
    false,
  );
});

test("multiple active grants fail closed instead of letting any permissive grant win", () => {
  const request = actionRequest();

  assert.equal(hasUnambiguousAuthority([grant()], request), true);
  assert.equal(
    hasUnambiguousAuthority(
      [grant(), grant({ id: "authority-test-002" })],
      request,
    ),
    false,
  );
});

test("a revoked historical row cannot replace the one active grant", () => {
  const active = grant({ id: "authority-active" });
  const historical = grant({
    id: "authority-revoked",
    revokedAt: "2026-01-01T00:00:00Z",
  });

  assert.equal(
    findUnambiguousActiveGrant([historical, active], "agent:test")?.id,
    "authority-active",
  );
  assert.equal(
    hasUnambiguousAuthority([historical, active], actionRequest()),
    true,
  );
});

test("risk must not exceed the explicit grant ceiling", () => {
  const mediumAction = actionRequest({
    action: "create_evolution_proposal",
    resourceRisk: "medium",
  });

  assert.equal(canPerformAction(grant(), mediumAction), true);
  assert.equal(
    canPerformAction(
      grant({
        limits: {
          maxRiskClass: "low",
          maxResourceExposure: 2,
          allowedTools: ["web-runtime"],
        },
      }),
      mediumAction,
    ),
    false,
  );
  assert.equal(
    canPerformAction(
      grant({
        limits: {
          maxResourceExposure: 2,
          allowedTools: ["web-runtime"],
        },
      }),
      mediumAction,
    ),
    false,
  );
});

test("malformed persisted JSON shapes fail closed", () => {
  const request = actionRequest();

  assert.equal(
    canPerformAction(grant({ allowedActions: "xxcreate_evidencexx" }), request),
    false,
  );
  assert.equal(
    canPerformAction(grant({ limits: "not-an-object" }), request),
    false,
  );
  assert.equal(parseAuthorityGrant(grant({ validFrom: "not-a-date" })), null);
});

test("target, tool, exposure and reversibility limits are enforced", () => {
  assert.equal(
    canPerformAction(grant(), actionRequest({ target: "mission:other" })),
    false,
  );
  assert.equal(
    canPerformAction(grant(), actionRequest({ tool: "unapproved-tool" })),
    false,
  );
  assert.equal(
    canPerformAction(grant(), actionRequest({ resourceExposure: 3 })),
    false,
  );
  assert.equal(
    canPerformAction(
      grant(),
      actionRequest({ reversibility: "costly_to_reverse_allowed" }),
    ),
    false,
  );
});
