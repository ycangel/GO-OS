import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("renders GO Society as the product surface", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, /GO Society/i);
  assert.match(html, /A self-evolving organization/i);
  assert.match(html, /for self-evolving organizations/i);
  assert.match(html, /alpha self-application reference (?:surface|instance)/i);
  assert.match(html, /Narrative Anchors/i);
});

test("public runtime is structurally separated from private field records", async () => {
  const source = await readFile(
    new URL("../app/api/runtime/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /publicCases/);
  assert.match(source, /human_approved/);
  assert.match(source, /reidentificationRisk, "low"/);
  assert.match(source, /consentScope, "anonymous_publication"/);
  assert.doesNotMatch(source, /fieldRecords/);
  assert.doesNotMatch(source, /privateNotes/);
  assert.doesNotMatch(source, /createdBy/);
  assert.doesNotMatch(source, /cognitiveFragments/);
  assert.doesNotMatch(source, /cognitiveObjects/);
});

test("the cognitive bridge keeps source, candidates and human head mutation separate", async () => {
  const [contextRoute, checkpointRoute, ratificationRoute, bridgeRuntime] =
    await Promise.all([
      readFile(
        new URL("../app/api/cognitive-bridge/context/route.ts", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../app/api/cognitive-bridge/checkpoints/route.ts", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../app/api/cognitive-bridge/ratifications/route.ts", import.meta.url),
        "utf8",
      ),
      readFile(new URL("../runtime/cognitive-bridge.ts", import.meta.url), "utf8"),
    ]);

  assert.match(contextRoute, /getRuntimeIdentity/);
  assert.match(contextRoute, /canAccessMission/);
  assert.match(contextRoute, /"custom:read_cognitive_context"/);
  assert.match(contextRoute, /"custom:review_cognition"/);
  assert.match(contextRoute, /sourceIsEvidence:\s*false/);
  assert.match(checkpointRoute, /mutationCameFromSameOrigin/);
  assert.match(checkpointRoute, /validateEvidenceReferences/);
  assert.match(checkpointRoute, /hmacSha256/);
  assert.match(checkpointRoute, /cognitive_checkpoint_claims/);
  assert.match(checkpointRoute, /consent_confirmed_by_member_id/);
  assert.match(checkpointRoute, /headChanged:\s*false/);
  assert.doesNotMatch(checkpointRoute, /UPDATE cognitive_heads/);
  assert.match(ratificationRoute, /canReviewMission/);
  assert.match(ratificationRoute, /"create_cognitive_commit"/);
  assert.match(ratificationRoute, /"create_cognitive_version"/);
  assert.match(ratificationRoute, /UPDATE cognitive_heads/);
  assert.match(ratificationRoute, /cognitive_candidate_decisions/);
  assert.match(ratificationRoute, /cognitive_head_transitions/);
  assert.match(ratificationRoute, /candidateHashes/);
  assert.match(ratificationRoute, /INVALID_COGNITIVE_DEPENDENCY/);
  assert.match(bridgeRuntime, /narrative anchors?/i);
  assert.match(bridgeRuntime, /pending_human_review|candidate checkpoint/i);
  assert.doesNotMatch(bridgeRuntime, /host_attested/);
});

test("constitutional mutation routes share the canonical authority vocabulary", async () => {
  const [guard, actions, fieldRecordsRoute, exceptionRoute, evolutionRoute, membersRoute] =
    await Promise.all([
      readFile(new URL("../runtime/authority-guard.ts", import.meta.url), "utf8"),
      readFile(new URL("../db/authority-grants.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/field-records/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/exception/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/evolutions/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/members/route.ts", import.meta.url), "utf8"),
    ]);

  assert.match(guard, /export async function requireAuthority/);
  assert.match(actions, /"create_evidence"/);
  assert.match(actions, /"create_exception"/);
  assert.match(actions, /"create_evolution_proposal"/);
  assert.doesNotMatch(actions, /"record_evidence"/);
  assert.match(fieldRecordsRoute, /"create_evidence"/);
  assert.match(exceptionRoute, /"create_exception"/);
  assert.match(evolutionRoute, /"create_evolution_proposal"/);
  assert.match(membersRoute, /"custom:manage_membership"/);
  assert.match(membersRoute, /executeAtomicBatch/);
});

test("member reads are membership-scoped and never expose another mission owner", async () => {
  const [runtimeRoute, memberAuth] = await Promise.all([
    readFile(new URL("../app/api/member/runtime/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/member-auth.ts", import.meta.url), "utf8"),
  ]);

  assert.match(runtimeRoute, /inArray\(missions\.id, missionIds\)/);
  assert.match(runtimeRoute, /owner: missions\.publicOwnerLabel/);
  assert.match(runtimeRoute, /missionMemberships\.canReview/);
  assert.match(runtimeRoute, /fieldRecords\.createdByMemberId/);
  assert.match(runtimeRoute, /exceptions\.createdBy/);
  assert.match(runtimeRoute, /inArray\(fieldRecords\.missionId, missionIds\)/);
  assert.match(runtimeRoute, /inArray\(exceptions\.missionId, missionIds\)/);
  assert.match(memberAuth, /missionMemberships\.status, "active"/);
  assert.doesNotMatch(memberAuth, /status:\s*"active",\s*joinedAt/);
});

test("Web identity adapters and owner configuration stay server-side trust inputs", async () => {
  const [
    authSource,
    oauthSource,
    memberAuthSource,
    inboxRoute,
    sessionRoute,
    membersRoute,
    readme,
  ] = await Promise.all([
    readFile(new URL("../app/chatgpt-auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../runtime/oauth-resource-server.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/member-auth.ts", import.meta.url), "utf8"),
    readFile(
      new URL(
        "../app/api/cognitive-bridge/mcp-drafts/route.ts",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(new URL("../app/api/session/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/members/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
  ]);

  assert.match(authSource, /resolveWebIdentity/);
  assert.match(oauthSource, /oai-authenticated-user-email/);
  assert.match(oauthSource, /GO_WEB_IDENTITY_SECRET/);
  assert.match(oauthSource, /authenticateBearerRequest/);
  assert.match(memberAuthSource, /GO_SOCIETY_OWNER_EMAIL/);
  assert.match(memberAuthSource, /GO_SOCIETY_OWNER_SUBJECT/);
  assert.match(memberAuthSource, /authenticationMethod\s*===\s*"sites"/);
  assert.match(
    inboxRoute,
    /getWebMcpPrincipalLink\([\s\S]*?identity\.user\.principalKey/,
  );
  assert.doesNotMatch(
    inboxRoute,
    /getWebMcpPrincipalLink\([\s\S]*?identity\.user\.id/,
  );
  assert.match(sessionRoute, /authenticationMethod\s*===\s*"sites"/);
  assert.match(membersRoute, /authenticationMethod\s*!==\s*"sites"/);
  assert.match(membersRoute, /stable-subject membership is not implemented/);
  assert.match(readme, /strip\s+any client-supplied headers/);
  assert.match(readme, /server-side\s+configuration/);
});
