import assert from "node:assert/strict";
import test from "node:test";

globalThis.__CLOUDFLARE_TEST_ENV__ = {};

const {
  getOwnerBootstrapConfiguration,
  matchesOwnerBootstrapIdentity,
} = await import(
  "../app/member-auth.ts"
);
const runtimeEnv = globalThis.__CLOUDFLARE_TEST_ENV__;

const issuer = "https://identity.example/realms/go";
const subject = "dingtalk-union-subject-42";

function identity(overrides = {}) {
  return {
    id: subject,
    principalKey: `oidc:${issuer}\u0000${subject}`,
    displayName: "Verified DingTalk Member",
    email: null,
    fullName: "Verified DingTalk Member",
    authenticationMethod: "trusted-proxy",
    scopes: ["go.web"],
    ...overrides,
  };
}

test("owner bootstrap accepts an issuer-qualified subject without email", () => {
  assert.equal(
    matchesOwnerBootstrapIdentity(identity(), {
      issuer,
      subject,
      email: "",
    }),
    true,
  );
});

test("configured owner subject overrides the legacy email fallback", () => {
  const sameEmailWrongSubject = identity({
    id: "another-subject",
    principalKey: `oidc:${issuer}\u0000another-subject`,
    email: "owner@example.com",
  });
  assert.equal(
    matchesOwnerBootstrapIdentity(sameEmailWrongSubject, {
      issuer,
      subject,
      email: "owner@example.com",
    }),
    false,
  );
});

test("owner bootstrap rejects the same subject from a different issuer", () => {
  assert.equal(
    matchesOwnerBootstrapIdentity(
      identity({
        principalKey: `oidc:https://attacker.example\u0000${subject}`,
      }),
      { issuer, subject, email: "" },
    ),
    false,
  );
});

test("native Sites identity cannot claim an OIDC owner subject", () => {
  assert.equal(
    matchesOwnerBootstrapIdentity(
      identity({ authenticationMethod: "sites" }),
      { issuer, subject, email: "" },
    ),
    false,
  );
});

test("email fallback is confined to the retained native Sites adapter", () => {
  assert.equal(
    matchesOwnerBootstrapIdentity(identity({ email: "OWNER@example.com" }), {
      issuer,
      subject: "",
      email: "owner@example.com",
    }),
    false,
  );
  assert.equal(
    matchesOwnerBootstrapIdentity(
      identity({
        principalKey: "sites-member-42",
        email: "OWNER@example.com",
        authenticationMethod: "sites",
      }),
      { issuer: "", subject: "", email: "owner@example.com" },
    ),
    true,
  );
  assert.equal(
    matchesOwnerBootstrapIdentity(identity({ email: null }), {
      issuer,
      subject: "",
      email: "owner@example.com",
    }),
    false,
  );
});

test("owner configuration reads the subject and its issuer together", () => {
  Object.assign(runtimeEnv, {
    GO_OAUTH_ISSUER: issuer,
    GO_SOCIETY_OWNER_SUBJECT: subject,
    GO_SOCIETY_OWNER_EMAIL: "LEGACY@example.com",
  });
  assert.deepEqual(getOwnerBootstrapConfiguration(), {
    issuer,
    subject,
    email: "legacy@example.com",
  });
});
