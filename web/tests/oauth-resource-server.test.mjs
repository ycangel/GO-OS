import assert from "node:assert/strict";
import test from "node:test";

globalThis.__CLOUDFLARE_TEST_ENV__ = {};

const {
  authenticateBearerRequest,
  buildOAuthProtectedResourceMetadata,
  OAuthResourceServerError,
  resolveWebIdentity,
} = await import("../runtime/oauth-resource-server.ts");
const { GET: getProtectedResourceMetadata } = await import(
  "../app/[wellKnown]/oauth-protected-resource/route.ts"
);

const runtimeEnv = globalThis.__CLOUDFLARE_TEST_ENV__;
const issuer = "https://identity.example/realms/go";
const audience = "https://go-society.example/mcp";
const keyPair = await crypto.subtle.generateKey(
  {
    name: "RSASSA-PKCS1-v1_5",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
  },
  true,
  ["sign", "verify"],
);
const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
Object.assign(publicJwk, { kid: "go-test-key", alg: "RS256", use: "sig" });

function configure(overrides = {}) {
  for (const key of Object.keys(runtimeEnv)) delete runtimeEnv[key];
  Object.assign(runtimeEnv, {
    GO_PUBLIC_ORIGIN: "https://go-society.example",
    GO_OAUTH_ISSUER: issuer,
    GO_OAUTH_AUDIENCE: audience,
    GO_OAUTH_JWKS_JSON: JSON.stringify({ keys: [publicJwk] }),
    GO_OAUTH_ALLOWED_ALGORITHMS: "RS256",
    GO_OAUTH_CLOCK_SKEW_SECONDS: "0",
    ...overrides,
  });
}

async function token(claimOverrides = {}, headerOverrides = {}) {
  const now = Math.floor(Date.now() / 1_000);
  const header = {
    alg: "RS256",
    typ: "at+jwt",
    kid: "go-test-key",
    ...headerOverrides,
  };
  const claims = {
    iss: issuer,
    sub: "member-42",
    aud: audience,
    exp: now + 300,
    nbf: now - 10,
    iat: now - 10,
    scope: "go.web go.context.read go.checkpoint.write",
    email: "member@example.com",
    name: "Verified Member",
    ...claimOverrides,
  };
  const encodedHeader = base64UrlJson(header);
  const encodedClaims = base64UrlJson(claims);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    keyPair.privateKey,
    new TextEncoder().encode(`${encodedHeader}.${encodedClaims}`),
  );
  return `${encodedHeader}.${encodedClaims}.${base64UrlBytes(new Uint8Array(signature))}`;
}

function bearerHeaders(value, extra = {}) {
  return new Headers({ authorization: `Bearer ${value}`, ...extra });
}

function base64UrlJson(value) {
  return base64UrlBytes(new TextEncoder().encode(JSON.stringify(value)));
}

function base64UrlBytes(value) {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function expectOAuthError(operation, expected) {
  await assert.rejects(operation, (error) => {
    assert.ok(error instanceof OAuthResourceServerError);
    assert.equal(error.code, expected.code);
    assert.equal(error.status, expected.status);
    if (expected.challenge) assert.match(error.wwwAuthenticate ?? "", expected.challenge);
    return true;
  });
}

test("validates a signed access token and publishes protected-resource metadata", async () => {
  configure({
    GO_OAUTH_REQUIRED_SCOPES: "organization.member",
    GO_OAUTH_AUTHORIZATION_SERVERS:
      "https://identity.example/realms/go,https://identity-backup.example",
  });
  const accessToken = await token({
    scope:
      "organization.member go.web go.context.read go.checkpoint.write",
  });
  const principal = await authenticateBearerRequest(
    bearerHeaders(accessToken),
    "https://go-society.example/mcp",
    ["go.context.read"],
  );
  assert.equal(principal.issuer, issuer);
  assert.equal(principal.subject, "member-42");
  assert.match(principal.principalKey, /^oidc:https:\/\/identity\.example/);
  assert.ok(principal.scopes.includes("go.context.read"));

  assert.deepEqual(
    buildOAuthProtectedResourceMetadata("https://internal.invalid/request"),
    {
      resource: "https://go-society.example/mcp",
      authorization_servers: [
        "https://identity.example/realms/go",
        "https://identity-backup.example",
      ],
      scopes_supported: [
        "go.checkpoint.write",
        "go.context.read",
        "go.web",
        "organization.member",
      ],
      bearer_methods_supported: ["header"],
    },
  );
  const metadataResponse = await getProtectedResourceMetadata(
    new Request("https://internal.invalid/.well-known/oauth-protected-resource"),
    { params: Promise.resolve({ wellKnown: ".well-known" }) },
  );
  assert.equal(metadataResponse.status, 200);
  assert.equal(metadataResponse.headers.get("access-control-allow-origin"), "*");
  assert.equal(
    (await metadataResponse.json()).resource,
    "https://go-society.example/mcp",
  );
  const unrelatedPath = await getProtectedResourceMetadata(
    new Request("https://go-society.example/not-well-known/oauth-protected-resource"),
    { params: Promise.resolve({ wellKnown: "not-well-known" }) },
  );
  assert.equal(unrelatedPath.status, 404);
});

test("rejects issuer, audience, expiry and not-before claim failures", async () => {
  configure();
  const now = Math.floor(Date.now() / 1_000);
  const invalidCases = [
    { iss: "https://attacker.example" },
    { aud: "https://another-resource.example" },
    { exp: now - 1 },
    { nbf: now + 60 },
    { nbf: "tomorrow" },
  ];
  for (const claims of invalidCases) {
    await expectOAuthError(
      async () =>
        authenticateBearerRequest(
          bearerHeaders(await token(claims)),
          "https://go-society.example/mcp",
        ),
      { code: "INVALID_BEARER_TOKEN", status: 401 },
    );
  }
});

test("rejects a forged signature and reports insufficient scope", async () => {
  configure();
  const signed = await token();
  const [header, payload, signature] = signed.split(".");
  const forgedPayload = base64UrlJson({
    iss: issuer,
    sub: "attacker",
    aud: audience,
    exp: Math.floor(Date.now() / 1_000) + 300,
    scope: "go.context.read",
  });
  await expectOAuthError(
    () =>
      authenticateBearerRequest(
        bearerHeaders(`${header}.${forgedPayload}.${signature}`),
        "https://go-society.example/mcp",
      ),
    { code: "INVALID_BEARER_TOKEN", status: 401 },
  );

  await expectOAuthError(
    async () =>
      authenticateBearerRequest(
        bearerHeaders(await token({ scope: "go.context.read" })),
        "https://go-society.example/mcp",
        ["go.checkpoint.write"],
      ),
    {
      code: "INSUFFICIENT_SCOPE",
      status: 403,
      challenge: /error="insufficient_scope".*scope="go\.checkpoint\.write"/,
    },
  );
  assert.ok(payload);
});

test("rejects unsupported critical JWS header semantics", async () => {
  configure();
  await expectOAuthError(
    async () =>
      authenticateBearerRequest(
        bearerHeaders(await token({}, { crit: ["b64"], b64: false })),
        "https://go-society.example/mcp",
      ),
    { code: "INVALID_BEARER_TOKEN", status: 401 },
  );
});

test("MCP-style authentication never trusts injected Sites identity headers", async () => {
  configure();
  await expectOAuthError(
    () =>
      authenticateBearerRequest(
        new Headers({
          "oai-authenticated-user-id": "spoofed",
          "oai-authenticated-user-email": "attacker@example.com",
        }),
        "https://go-society.example/mcp",
        ["go.context.read"],
      ),
    {
      code: "BEARER_TOKEN_REQUIRED",
      status: 401,
      challenge: /oauth-protected-resource/,
    },
  );
});

test("Web identity keeps native Sites compatibility and secures self-hosted proxy headers", async () => {
  configure();
  const sitesHeaders = new Headers({
    "oai-authenticated-user-id": "sites-member-42",
    "oai-authenticated-user-email": "sites@example.com",
    "oai-authenticated-user-full-name": "Sites%20Member",
    "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
  });
  const sites = await resolveWebIdentity(
    sitesHeaders,
    "https://go-society.example/",
  );
  assert.equal(sites?.authenticationMethod, "sites");
  assert.equal(sites?.principalKey, "sites-member-42");
  assert.equal(sites?.displayName, "Sites Member");

  configure({
    GO_WEB_IDENTITY_MODE: "trusted-proxy",
    GO_WEB_IDENTITY_SECRET: "a-private-proxy-secret-with-32-bytes",
  });
  assert.equal(
    await resolveWebIdentity(sitesHeaders, "https://go-society.example/"),
    null,
  );
  const proxyHeaders = new Headers(sitesHeaders);
  proxyHeaders.set("oai-authenticated-user-id", "member-42");
  proxyHeaders.set(
    "x-go-web-identity-secret",
    "a-private-proxy-secret-with-32-bytes",
  );
  proxyHeaders.set("authorization", "Bearer proxy-owned-upstream-token");
  const proxied = await resolveWebIdentity(
    proxyHeaders,
    "https://go-society.example/",
  );
  const bearer = await authenticateBearerRequest(
    bearerHeaders(await token()),
    "https://go-society.example/mcp",
  );
  assert.equal(proxied?.authenticationMethod, "trusted-proxy");
  assert.equal(proxied?.principalKey, bearer.principalKey);

  configure({ GO_WEB_IDENTITY_MODE: "oidc" });
  assert.equal(
    await resolveWebIdentity(sitesHeaders, "https://go-society.example/"),
    null,
  );
  const oidc = await resolveWebIdentity(
    bearerHeaders(await token(), {
      "oai-authenticated-user-id": "spoofed-sites-user",
    }),
    "https://go-society.example/",
  );
  assert.equal(oidc?.authenticationMethod, "oidc");
  assert.equal(oidc?.id, "member-42");
  assert.equal(oidc?.displayName, "Verified Member");
});
