# GO Society Web

**Component release:** 0.5.0

**GO OS baseline:** v0.5.0 Foundation Release / 奠基版本

**Status:** alpha self-application reference surface

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
  only after the private Site reports both `mcp_url` and `oauth_resource` and
  the fresh-conversation acceptance loop passes.
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

For browser requests, the Sites host supplies trusted
`oai-authenticated-*` identity headers. A different reverse proxy must strip
any client-supplied headers with those names before injecting its own trusted
identity. Directly exposing the application without that boundary would allow
header spoofing.

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

`GO_SOCIETY_OWNER_EMAIL` is a server-side secret/environment value. Never place
it in source, browser code, logs, local storage or a committed environment file.
For an isolated local preview, the Vite adapter accepts the command-scoped
`GO_SOCIETY_LOCAL_OWNER_EMAIL` value and maps it to the Worker binding; it is
not a production configuration source.

`GO_SOCIETY_THREAD_HMAC_SECRET` is a separate server-side secret used to bind
source conversations without storing their raw external key. Local previews
may map a command-scoped `GO_SOCIETY_LOCAL_THREAD_HMAC_SECRET`; use at least 32
random characters and never commit it.

`GO_SOCIETY_PRINCIPAL_HMAC_SECRET` is an independent, Site-scoped server secret
used to bind the native Sites authenticated-user identifier to a revocable GO
Society member link without storing the raw identifier. Local previews may map
a command-scoped `GO_SOCIETY_LOCAL_PRINCIPAL_HMAC_SECRET`; do not reuse the
thread-binding secret, expose either value to browser code or commit either
value.

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

### ChatGPT/Codex MCP connection

The repository intentionally does not commit one production connector URL.
After publishing the private Site, retrieve its deployment metadata and require
both a published `mcp_url` and `oauth_resource`. If either value is absent, the
conversation half is not deployed even if the Web page is reachable.

Connect ChatGPT/Codex to that returned `mcp_url`, complete OAuth as the intended
member and verify that the server exposes exactly the bounded bridge tools:

- `go_society_get_context`;
- `go_society_stage_checkpoint`;
- `go_society_request_human_review`.

The connection must not expose ratify, approve, commit, version,
Mission-update or head-advance tools. Tool discovery alone is not the acceptance
test. In a newly opened conversation, verify a compact ratified context read,
explicit internal-only consent before private staging, a Web review request,
no head transition before Web ratification and a second fresh-context read
after the human decision. Keep the Site owner-only until unauthorized,
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
