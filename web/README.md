# GO Society Web

**Component release:** 0.5.0

**GO OS baseline:** v0.5.0 Foundation Release / 奠基版本

**Status:** alpha self-application reference surface

**Active public origin:**
[`https://go.pixmoving.net`](https://go.pixmoving.net) — public Web is live;
authenticated Web login and the production MCP/OAuth round trip are not yet
accepted. See [Deployment Status](../docs/DEPLOYMENT_STATUS.md).

GO Society Web is the first self-application reference instance for GO OS. It
demonstrates selected organizational-runtime boundaries in a deployable Web
application. The v0.5 Cognitive Bridge adds one private, durable
conversation-to-CognitiveVersion path; it does not yet certify the complete
eight-object loop or automatic ChatGPT installation.

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
- [Cognitive Bridge v0.5 Alpha](../docs/COGNITIVE_BRIDGE_v0.5_ALPHA.md)
- [Isolated self-hosted deployment](../deploy/self-hosted/RUNBOOK.md)

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
- private Narrative Anchors, conversation cursors and candidate-only cognitive
  checkpoints;
- named-human ratification/rejection with idempotent receipts, append-only
  CognitiveCommit/CognitiveVersion creation, dependency-closed ratification and
  an atomically claimed Mission head transition;
- an authenticated cognitive context API for reloading ratified state, pending
  candidates and unresolved questions;
- Cloudflare D1 persistence for the retained Sites adapter, SQLite persistence
  for self-hosting and forward migrations for both;
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
| CognitiveEvent | private candidate and ratified-copy persistence in the bounded Cognitive Bridge path; general lifecycle incomplete |
| DeliberationSession | private checkpoint persistence and human resolution in the bounded bridge path; general orchestration incomplete |
| LearningRecord | private candidate/ratified-copy persistence with epistemic status retained; capability promotion incomplete |
| EvolutionProposal | bridge candidate approval plus legacy proposal surface; application/rollback loop incomplete |
| CognitiveVersion | append-only bridge version and one Mission head implemented; branching, merge and general repository APIs incomplete |

The Web table and TypeScript type are a camelCase **enforcement projection** of
the canonical snake-case `AuthorityGrant`, not a direct canonical
serialization. The current projection does not persist canonical
`grantee_type` or the complete `revocation` policy object. Cross-boundary
conformance therefore requires an explicit adapter and contract test that this
alpha does not yet provide.

A successful build demonstrates code integrity, not production readiness,
security certification or organizational impact.

### Known enforcement gaps for the next red team

- Cognitive Bridge writes revalidate the exact AuthorityGrant revision inside
  the D1 batch and bind every object to that receipt. Private context reads also
  fail closed without `custom:read_cognitive_context`; cross-member review
  additionally requires review authority. Older mutation routes do not yet
  share this model and remain red-team scope.
- Each private checkpoint persists the authenticated member's internal-use
  consent claim. Client input cannot self-assert `host_attested` provenance;
  that trust level is reserved for a future trusted adapter boundary.
- `resourceExposure` is currently `1` because each bridge operation is bounded
  to one Mission; object counts and byte limits are separately enforced. The
  alpha does not yet measure aggregate economic or operational exposure.
- Route-level privacy and authorization tests include source-boundary checks,
  not a complete D1 HTTP integration matrix. Anonymous, cross-origin, revoked,
  `canReview=false`, rollback and replay cases remain explicit red-team work.
- The source tree now contains both halves of the bounded bridge: the
  organization-side Web Human Gate and a Skill-backed, OAuth-protected MCP
  conversation adapter. This is not a deployment claim: a release is connected
  only after the target deployment publishes valid protected-resource
  metadata, completes OAuth and passes the fresh-conversation acceptance loop.
  The active public instance has not yet met those conditions.
- In the retained Sites lifecycle, `invited` means owner-authorized and
  host-attested email-matched; an explicit invitation-acceptance transition
  and reliable `joinedAt` audit record are not yet implemented. Self-hosted
  non-owner membership by stable subject remains an open implementation gate.

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

The retained Sites adapter accepts host-supplied `oai-authenticated-*` identity
headers. Self-hosting uses a separate trusted-proxy contract. Every public
gateway must strip any client-supplied headers with the configured identity
names before an authenticated, internal hop injects the stable subject.
Directly trusting public identity headers would allow spoofing.

The conversation MCP path is a separate OAuth-protected resource boundary. It
must not copy browser cookies, accept user-authored Sites identity headers or
proxy into member Web APIs by synthesizing those headers. A published MCP
principal must be resolved through the server-side, revocable member link and
rechecked against Mission membership and bounded authority on every private
operation.

Private MCP drafts are eligible for review for 24 hours and are lazily expired
when the bridge is accessed. Confirmation, rejection and expiry clear the
duplicate staged payload and free-text source title atomically; audit hashes, bounded source keys,
authority revision and any canonical receipt remain. Web confirmation also
recomputes the deterministic checkpoint request hash, and D1 requires the
matching actor, Mission, thread, cursor, consent claim and response receipt.

`GO_SOCIETY_OWNER_SUBJECT` is the preferred owner selector for self-hosted
OIDC. It is interpreted only under the exact configured issuer and compared to
the issuer-qualified stable principal. `GO_SOCIETY_OWNER_EMAIL` remains only a
legacy fallback for the retained native Sites adapter; OIDC and trusted-proxy
identities cannot become owner by email. Both selectors are private server-side
configuration, not browser state or cryptographic secrets. Never place either
private identifier in source, browser code, logs, local storage or a committed
environment file. The Vite/Sites local preview accepts only the command-scoped
`GO_SOCIETY_LOCAL_OWNER_EMAIL` compatibility selector; self-hosted subject
bootstrap is configured and tested through the self-hosted adapter, not
silently projected into the Sites preview. Neither is a production
configuration source.

`GO_SOCIETY_THREAD_HMAC_SECRET` is a separate server-side secret used to bind
source conversations without storing their raw external key. Local previews
may map a command-scoped `GO_SOCIETY_LOCAL_THREAD_HMAC_SECRET`; use at least 32
random characters and never commit it.

`GO_SOCIETY_PRINCIPAL_HMAC_SECRET` is an independent, deployment-scoped server
secret used to bind a verified principal key—an issuer-qualified subject for
self-hosting or the retained native Sites identifier—to a revocable GO Society
member link without storing the raw key. Local previews may map a command-scoped
`GO_SOCIETY_LOCAL_PRINCIPAL_HMAC_SECRET`; do not reuse the thread-binding
secret, expose either value to browser code or commit either value.

## Build and verification

```bash
npm run lint
npm test
```

`npm test` builds the Cloudflare Worker-compatible application and checks the
rendered surface plus selected public/private and authority invariants. The
repository-level release and red-team checks remain separate.

## Deployment boundary

The application supports two explicit deployment adapters:

- OpenAI Sites with Cloudflare D1 through `.openai/hosting.json`; and
- an isolated Node runtime with SQLite, OAuth-protected MCP and an optional
  OIDC Web gateway through [`deploy/self-hosted`](../deploy/self-hosted).

The former hosted Sites instance has been permanently removed; the Sites/D1
adapter remains in source for compatibility and provenance. The active
self-hosted instance uses Node/SQLite behind shared Nginx. Both source adapters use
the same schema, migrations, AuthorityGrant checks, candidate-only MCP surface
and Web-only Human Gate. Read-only runtime views may be public. Write actions
must remain authenticated, same-origin and server-authorized.

Deployment does not by itself certify the identity proxy, database contents,
privacy process or constitutional enforcement. Review them in the target
environment before accepting real organizational data.

### ChatGPT/Codex MCP connection

The active Web origin is public, but a connector URL is useful only with a
working authorization contract. A self-hosted deployment must expose a trusted
HTTPS `/mcp` endpoint and a valid
`/.well-known/oauth-protected-resource` document. If a deployment cannot
prove its MCP URL and OAuth resource metadata, the conversation half is not
deployed even if the Web page is reachable.

Connect ChatGPT/Codex to the verified MCP URL, complete OAuth as the intended
member and verify that the server exposes exactly the bounded bridge tools:

- `go_society_get_context`;
- `go_society_stage_checkpoint`;
- `go_society_request_human_review`.

The connection must not expose ratify, approve, commit, version,
Mission-update or head-advance tools. Tool discovery alone is not the acceptance
test. In a newly opened conversation, verify a compact ratified context read,
explicit internal-only consent before private staging, a Web review request,
no head transition before Web ratification and a second fresh-context read
after the human decision. Keep the deployment owner-only until unauthorized,
unlinked, revoked, wrong-Mission and replay cases fail closed.

The canonical conversation behavior is
[`skills/go-society-cognitive-bridge`](../skills/go-society-cognitive-bridge/SKILL.md).
The complete round-trip and non-claim boundary are documented in
[Cognitive Bridge v0.5 Alpha](../docs/COGNITIVE_BRIDGE_v0.5_ALPHA.md).

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
