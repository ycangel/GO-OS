# GO Society Web

**Component release:** 0.5.0

**GO OS baseline:** v0.5.0 Foundation Release / 奠基版本

**Status:** alpha self-application reference surface

GO Society Web is the first self-application reference instance for GO OS. It
demonstrates selected organizational-runtime boundaries in a deployable Web
application. It does not yet implement or validate the complete eight-object
cognitive loop.

`Foundation Release` is a software milestone name. **“奠基版本”** is the
canonical Chinese rendering; the name does not imply a registered foundation
or other legal entity.

## Canonical v0.5 navigation

- [Documentation Index](../docs/INDEX.md)
- [Quick Start](../docs/QUICK_START.md)
- [Architecture Overview](../docs/ARCHITECTURE_OVERVIEW.md)
- [Whitepaper editorial scaffold](../docs/WHITEPAPER.md)
- [Release Notes](../docs/RELEASE_NOTES_v0.5.0.md)
- [Migration & Deprecation](../docs/MIGRATION_AND_DEPRECATION_v0.5.0.md)
- [Evaluation & Red-Team](../docs/EVALUATION_AND_RED_TEAM_v0.5.0.md)

## What the alpha surface implements

- public mission and capability views using public-by-design records;
- a public evidence API restricted to separately created, published,
  consent-scoped, low-reidentification-risk cases with named human approval;
- authenticated member identity and mission membership;
- atomic owner-authorized member invitation, mission assignment and bounded
  AuthorityGrant creation;
- private field-record intake with data-minimization checks;
- authenticated exception and evolution-proposal write paths;
- persisted AuthorityGrants and default-deny checks for actor, action, target,
  mission membership, lifecycle, risk, exposure, tool and reversibility on the
  current mutation routes;
- same-origin protection for write requests;
- Cloudflare D1 persistence and forward migrations;
- explicit privacy and publication policy surfaces.

The public evidence API is structurally separate from private field records.
The authorized member API can return a member's own private records. Reading
another member's private notes or exception context additionally requires an
active `canReview` assignment for that Mission. Revoking the Mission membership
removes both self-record and review access. This API must never be treated as
public.

## What remains contract or blueprint

| Core object | Current Web coverage |
|---|---|
| Mission | persisted and rendered |
| AuthorityGrant | persisted and structurally enforced for current mutation routes; free-text semantic scope and full policy composition remain incomplete |
| Evidence | private intake plus separately published public-case surface |
| CognitiveEvent | TypeScript contract; no complete durable lifecycle |
| DeliberationSession | TypeScript contract; no complete durable lifecycle |
| LearningRecord | TypeScript contract; no complete durable lifecycle |
| EvolutionProposal | persisted proposal surface; approval/apply/rollback loop incomplete |
| CognitiveVersion | repository specification and tests; not persisted by this Web app |

The Web table and TypeScript type are a camelCase **enforcement projection** of
the canonical snake-case `AuthorityGrant`, not a direct canonical
serialization. The current projection does not persist canonical
`grantee_type` or the complete `revocation` policy object. Cross-boundary
conformance therefore requires an explicit adapter and contract test that this
alpha does not yet provide.

A successful build demonstrates code integrity, not production readiness,
security certification or organizational impact.

### Known enforcement gaps for the next red team

- Authority validation and the subsequent mutation are not one atomic
  transaction. A concurrent revocation/expiry or replay can race the write;
  authority-version preconditions and idempotency keys are still required.
- `resourceExposure` is currently a declared per-route value of `1`. The guard
  enforces a ceiling, but the alpha does not yet measure actual or aggregate
  resource exposure.
- Route-level privacy and authorization tests include source-boundary checks,
  not a complete D1 HTTP integration matrix. Anonymous, cross-origin, revoked,
  `canReview=false`, rollback and replay cases remain explicit red-team work.
- In the alpha lifecycle, `invited` means owner-authorized and email-matched;
  an explicit invitation-acceptance transition and reliable `joinedAt` audit
  record are not yet implemented.

## Privacy and data boundary

The current input filter rejects obvious emails, phone numbers and URLs. It does
not prove that names, company identifiers, unusual combinations or all
reidentification risks have been removed. De-identification and publication
therefore remain explicit human review duties.

`missions` and `capabilities` are returned by the public runtime and must contain
public-by-design content only until per-record visibility and publication gates
are implemented. Private operating material belongs in the authorized member
surface.

See [Privacy and Publication Policy](PRIVACY_AND_PUBLICATION_POLICY.md).

## Local development

Requirements: Node.js 22.13 or newer, npm and a Cloudflare-compatible D1
binding.

```bash
npm ci
npm run dev
```

Database migrations live in `drizzle/`; the runtime schema is defined in
`db/schema.ts`.

### Identity trust boundary

The Sites host supplies trusted `oai-authenticated-*` identity headers. A
different reverse proxy must strip any client-supplied headers with those names
before injecting its own trusted identity. Directly exposing the application
without that boundary would allow header spoofing.

`GO_SOCIETY_OWNER_EMAIL` is a server-side secret/environment value. Never place
it in source, browser code, logs, local storage or a committed environment file.

## Build and verification

```bash
npm run lint
npm test
```

`npm test` builds the Cloudflare Worker-compatible application and checks the
rendered surface plus selected public/private and authority invariants. The
repository-level release and red-team checks remain separate.

## Deployment boundary

The application is configured for OpenAI Sites and Cloudflare D1 through
`.openai/hosting.json`. Read-only runtime views may be public. Write actions must
remain authenticated, same-origin and server-authorized.

Deployment does not by itself certify the identity proxy, database contents,
privacy process or constitutional enforcement. Review them in the target
environment before accepting real organizational data.

## Constitutional invariants

1. Human Sovereignty
2. Machine Agency
3. Reality as Final Arbiter
4. Named Accountability
5. Bounded, revocable, non-self-expanding authority
6. Reversibility and exit

The system may propose changes to itself. It may not approve or expand its own
authority.

## License

Apache License 2.0. See the repository [`LICENSE`](../LICENSE).
