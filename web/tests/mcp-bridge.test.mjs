import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  handleMcpOptions,
  handleMcpPost,
  mcpMethodNotAllowed,
  MCP_SKILL_CANONICAL_REPO_PATH,
  MCP_SKILL_VENDORED_WEB_PATH,
} from "../runtime/mcp-server.ts";

const endpoint = "https://go-society.example/mcp";
const protocolVersion = "2025-06-18";

function mcpRequest(body, extra = {}) {
  return new Request(extra.url ?? endpoint, {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
      "mcp-protocol-version": protocolVersion,
      ...(extra.headers ?? {}),
    },
    body: JSON.stringify(body),
  });
}

test("the stateless MCP endpoint initializes with the candidate-only boundary", async () => {
  const response = await handleMcpPost(
    mcpRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion,
        capabilities: {},
        clientInfo: { name: "go-society-test", version: "1.0.0" },
      },
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.json();
  assert.equal(body.result.serverInfo.name, "go-society-cognitive-bridge");
  assert.match(body.result.instructions, /candidate-only/i);
  assert.match(body.result.instructions, /Human Gate/i);
});

test("tool discovery exposes exactly read, private stage and request-review", async () => {
  const response = await handleMcpPost(
    mcpRequest({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }),
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  const tools = body.result.tools;
  assert.deepEqual(
    tools.map((tool) => tool.name),
    [
      "go_society_get_context",
      "go_society_stage_checkpoint",
      "go_society_request_human_review",
    ],
  );
  assert.equal(tools[0].annotations.readOnlyHint, true);
  assert.deepEqual(tools[0]._meta.securitySchemes, [
    { type: "oauth2", scopes: ["go.context.read"] },
  ]);
  assert.deepEqual(tools[0].securitySchemes, [
    { type: "oauth2", scopes: ["go.context.read"] },
  ]);
  for (const tool of tools.slice(1)) {
    assert.deepEqual(tool._meta.securitySchemes, [
      { type: "oauth2", scopes: ["go.checkpoint.write"] },
    ]);
    assert.deepEqual(tool.securitySchemes, [
      { type: "oauth2", scopes: ["go.checkpoint.write"] },
    ]);
  }
  assert.doesNotMatch(
    JSON.stringify(tools.map((tool) => tool.name)),
    /ratif|approv|reject|commit|version|head|mission.*update/i,
  );
});

test("unauthenticated tool calls fail before organizational data access", async () => {
  const response = await handleMcpPost(
    mcpRequest({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "go_society_get_context", arguments: {} },
    }),
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.result.isError, true);
  assert.equal(
    body.result.structuredContent.error.code,
    "SITES_IDENTITY_REQUIRED",
  );
  assert.deepEqual(body.result._meta["mcp/www_authenticate"], [
    'Bearer resource_metadata="https://go-society.example/.well-known/oauth-protected-resource", error="invalid_token", error_description="A native Sites authenticated principal is required"',
  ]);
});

test("the Skill extension and resources/read serve the exact vendored contract", async () => {
  const canonical = await readFile(
    new URL(`../../${MCP_SKILL_CANONICAL_REPO_PATH}`, import.meta.url),
    "utf8",
  );
  const vendored = await readFile(
    new URL(`../../${MCP_SKILL_VENDORED_WEB_PATH}`, import.meta.url),
    "utf8",
  );
  assert.equal(vendored, canonical);

  const listResponse = await handleMcpPost(
    mcpRequest({ jsonrpc: "2.0", id: 4, method: "skills/list", params: {} }),
  );
  const listBody = await listResponse.json();
  assert.equal(listBody.result.skills.length, 1);
  const skill = listBody.result.skills[0];
  assert.equal(skill.frontmatter.name, "go-society-cognitive-bridge");
  assert.match(skill.resources[0].digest, /^sha256:[a-f0-9]{64}$/);

  const readResponse = await handleMcpPost(
    mcpRequest({
      jsonrpc: "2.0",
      id: 5,
      method: "resources/read",
      params: { uri: skill.uri },
    }),
  );
  const readBody = await readResponse.json();
  assert.equal(readBody.result.contents[0].text, canonical);
});

test("transport rejects batches, query credentials, unknown origins and non-POST methods", async () => {
  const batch = await handleMcpPost(
    mcpRequest([
      { jsonrpc: "2.0", id: 6, method: "tools/list", params: {} },
    ]),
  );
  assert.equal(batch.status, 400);

  const queryCredential = await handleMcpPost(
    mcpRequest(
      { jsonrpc: "2.0", id: 7, method: "tools/list", params: {} },
      { url: `${endpoint}?access_token=forbidden` },
    ),
  );
  assert.equal(queryCredential.status, 400);

  const badOrigin = await handleMcpPost(
    mcpRequest(
      { jsonrpc: "2.0", id: 8, method: "tools/list", params: {} },
      { headers: { origin: "https://attacker.example" } },
    ),
  );
  assert.equal(badOrigin.status, 403);

  const disallowed = mcpMethodNotAllowed(new Request(endpoint));
  assert.equal(disallowed.status, 405);
  assert.equal(disallowed.headers.get("allow"), "POST, OPTIONS");
});

test("CORS preflight is explicit and never wildcarded", () => {
  const response = handleMcpOptions(
    new Request(endpoint, {
      method: "OPTIONS",
      headers: {
        origin: "https://chatgpt.com",
        "access-control-request-method": "POST",
        "access-control-request-headers":
          "authorization, content-type, accept, mcp-protocol-version, mcp-method, mcp-name",
      },
    }),
  );
  assert.equal(response.status, 204);
  assert.equal(
    response.headers.get("access-control-allow-origin"),
    "https://chatgpt.com",
  );
  assert.notEqual(response.headers.get("access-control-allow-origin"), "*");
});
