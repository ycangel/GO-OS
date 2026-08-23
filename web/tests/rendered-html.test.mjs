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
  assert.match(html, /A self-evolving organization for self-evolving organizations/i);
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
