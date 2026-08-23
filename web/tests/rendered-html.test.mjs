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
  assert.match(membersRoute, /d1\.batch/);
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

test("identity headers and owner configuration stay server-side trust inputs", async () => {
  const [authSource, memberAuthSource, readme] = await Promise.all([
    readFile(new URL("../app/chatgpt-auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/member-auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
  ]);

  assert.match(authSource, /oai-authenticated-user-email/);
  assert.match(memberAuthSource, /GO_SOCIETY_OWNER_EMAIL/);
  assert.match(readme, /strip any client-supplied headers/);
  assert.match(readme, /server-side secret\/environment value/);
});
