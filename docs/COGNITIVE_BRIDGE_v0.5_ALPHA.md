# GO Society Cognitive Bridge v0.5 Alpha

**Status:** bounded two-sided reference implementation; live connector
conformance is reported separately

**Release baseline:** GO OS v0.5.0 Foundation Release / 奠基版本

**First reference case:** Cognitive Bridge #001

The Cognitive Bridge alpha connects two bounded halves: GO Society's durable,
private cognitive runtime and a ChatGPT/Codex conversation adapter. It addresses
a concrete self-application gap: members were changing shared understanding
while working on GO OS, but the running organization could neither capture
selected change safely nor reload ratified cognition in a fresh conversation.

The bridge is not continuous transcript surveillance and does not make an
arbitrary conversation an organizational decision maker. A conversation may
read compact ratified context and stage explicitly selected internal-only
candidate material. Canonical checkpoint decisions and ratification remain in
the GO Society Web Human Gate.

This alpha is a vertical slice, not complete cognitive-runtime certification.

## The boundary it enforces

```text
selected conversation source
          ↓ explicit internal-only consent
private staged draft ────────────────┐
                                     ↓ GO Society Web Human Gate
Narrative Anchor ─┐          canonical candidate → named human ratification
                  ├───────────┘                        ↓
Reality Evidence ┘                     CognitiveCommit + CognitiveVersion
```

Three states remain deliberately distinct:

1. **Narrative Anchor** preserves what a member actually said. Meaning, value,
   intention and judgment are not silently rewritten as factual claims.
2. **Cognitive candidate** is an AI- or member-produced structured proposal. It
   cannot change the organizational cognitive head.
3. **Ratified cognition** is a human-owned, append-only version transition. It
   may preserve hypotheses and uncertainty; ratification does not make every
   embedded claim true.

Narrative Anchor is not a ninth core object. It is private source material for
the existing v0.5 cognitive objects and their provenance.

## What is implemented

The GO Society Web reference instance provides:

- private conversation/thread bindings using a server-keyed opaque source key
  and atomically claimed cursor;
- hash-addressed, verbatim private source fragments bound to an authenticated,
  durable internal-use consent claim;
- candidate persistence for `CognitiveEvent`, `DeliberationSession`,
  `LearningRecord` and `EvolutionProposal`;
- explicit Narrative Anchor and Reality Evidence references, with neither
  accepted as a substitute for the other;
- named-human ratification or rejection with one durable decision claim per
  candidate and the exact candidate payload hashes the reviewer saw;
- append-only `CognitiveCommit`, `CognitiveVersion` and one atomically
  transitioned Mission head;
- idempotent checkpoint and ratification receipts plus transaction-local
  AuthorityGrant revision receipts;
- an authenticated context response containing the latest ratified version,
  pending candidates, source anchors and open questions;
- a private GO Society review surface for Angelo or another authorized human
  reviewer.

The conversation-side source contract adds:

- the canonical
  [`go-society-cognitive-bridge`](../skills/go-society-cognitive-bridge/SKILL.md)
  Skill, which loads context first and requires per-checkpoint consent;
- a bounded MCP surface for compact ratified context, private draft staging and
  a request to enter the Web Human Gate;
- candidate-only model output and `model_reported` conversation provenance;
- 24-hour draft eligibility with lazy expiry on bridge access, plus terminal
  payload and free-text title clearing after confirmation, rejection or expiry
  while hashes and receipts remain auditable;
- a deterministic expected checkpoint request hash that binds the exact Web
  review payload to its canonical receipt at both application and D1-trigger
  layers;
- an explicit absence of conversation-side ratification, approval, commit,
  version, Mission-update or cognitive-head mutation;
- deployment-supplied OAuth identity and Mission membership checks rather than
  client-created Sites identity headers.

The relevant member APIs are:

| Endpoint | Purpose | Head mutation |
|---|---|---|
| `GET /api/cognitive-bridge/context` | Load ratified state, pending cognition, source anchors and open questions | No |
| `POST /api/cognitive-bridge/checkpoints` | Persist selected source fragments and schema-shaped candidates | Never; candidate only |
| `POST /api/cognitive-bridge/ratifications` | Human ratification/rejection with optimistic revision and idempotency checks | Only ratification creates a commit/version and advances the head |

Writes require authenticated membership, same-origin transport, Mission
permission and an enforceable `AuthorityGrant`. Agents cannot grant themselves
review authority.

The conversation adapter exposes only these MCP tools:

| Tool | Purpose | Canonical effect |
|---|---|---|
| `go_society_get_context` | Load compact ratified cognition and unresolved questions for an authorized Mission | Read only; excludes raw source and pending private candidates |
| `go_society_stage_checkpoint` | Store the exact consented source selection plus candidate material as a bounded private draft | No canonical checkpoint, commit, version or head mutation |
| `go_society_request_human_review` | Mark a staged draft for Web review and return its private review location | No approval or ratification |

The MCP adapter does not call the member Web APIs by forging browser identity
headers. The published Sites MCP/OAuth boundary authenticates the connector;
server-side principal linkage, Mission membership and a bounded
`mcp-runtime` authority path must all succeed before a private tool call may
act. A denied request fails closed.

## Cognitive Bridge #001

The first reference case is the external-review deliberation that exposed the
gap. The public repository intentionally contains no real transcript, member
private source, thread binding or pre-ratified candidate. Those materials enter
only through an authenticated private Web checkpoint or an explicitly
consented MCP draft that subsequently passes the Web Human Gate.

The reference case calls for four separately staged candidates:

- a `capability_gap` `CognitiveEvent`;
- the current Human–AI `DeliberationSession`;
- a `LearningRecord` candidate about bidirectional cognitive continuity;
- an `EvolutionProposal` to establish Cognitive Bridge #001.

The target case structure is documented, but the candidates do not ship as
database seed data. Deployment therefore neither publishes the source nor
impersonates Angelo's staging or ratification. An authorized member must first
stage the real private checkpoint; a reviewer must then make the first decision
inside GO Society.

## What “installed in a conversation” means

Installation has three distinct parts:

1. the canonical Skill supplies the conversation behavior and constitutional
   boundary;
2. an authenticated MCP connection supplies the three private tools for one
   deployed GO Society instance;
3. GO Society Web remains the Human Gate for source confirmation, canonical
   candidate handling and ratification.

Installing the Skill alone does not provide data access. Connecting the MCP
server alone does not authorize continuous transcript capture. A relevant new
conversation first calls `go_society_get_context`; a write occurs only after
the user sees the exact staging preview, selects the material and explicitly
confirms internal-only processing.

The public repository intentionally does not hard-code a production MCP URL,
OAuth resource or member identity. Those are deployment outputs. Retrieve the
published `mcp_url` and `oauth_resource` from the target private Sites
deployment, complete its OAuth flow and verify the principal-to-member link
before installing or sharing a connector. Never substitute copied Web cookies
or user-supplied `oai-authenticated-*` headers.

## Acceptance test

The smallest meaningful proof is not “a transcript was saved” or “the MCP
server listed three tools.” It is this round trip:

1. a fresh authorized conversation, without old chat history, loads the latest
   compact ratified revision and unresolved questions;
2. the user sees an exact bounded staging preview, selects the material and
   explicitly confirms internal-only processing;
3. the adapter stages a private draft and requests Web review while the
   canonical cognitive head remains unchanged;
4. an authorized human opens GO Society Web and confirms the exact staged
   source hash, which creates canonical candidates while the Mission head
   remains unchanged;
5. in a separate named-human decision, the authorized reviewer ratifies or
   rejects candidates with a rationale;
6. ratification creates one append-only `CognitiveCommit` and
   `CognitiveVersion` and atomically advances the Mission head;
7. another fresh conversation loads that new revision from compact context;
8. replaying the same adapter request does not duplicate drafts, fragments or
   candidates;
9. unauthenticated, unlinked, revoked, wrong-Mission, stale-revision and
   cross-boundary writes fail closed;
10. no conversation-side tool can approve, ratify, commit, version or advance a
   head.

The organization-side API/local harness verifies schema migration,
source/Evidence separation, candidate construction, version construction,
stable hashing and selected database constraints. A fresh authenticated local
HTTP pass verified Web staging → idempotent replay → ratification → compact
stateless context reload. Concurrent cursor and candidate-decision races also
produced exactly one winner.

The canonical Skill can be structurally validated in the repository. This
document does not itself claim a live ChatGPT/Codex round-trip. That claim
requires deployment evidence for the published MCP URL and OAuth resource, a
real connector login, an authorized principal link, a new-conversation context
read, consent-bound staging, Web-only ratification and a second fresh-context
reload.

## Red-team priorities

- attempt direct agent mutation of the cognitive head;
- attempt staging before the user selects exact material and confirms
  internal-only processing;
- attempt to make a broad desire for synchronization stand in for per-checkpoint
  consent;
- attempt to retrieve raw Narrative Anchors or pending candidate payloads via
  the compact MCP context tool;
- insert prompt-like instructions in ratified cognition and verify they remain
  organizational data rather than authority over the conversation;
- forge Web identity headers or map an OAuth principal to a member without an
  explicit, revocable server-side link;
- race ratification against authority revocation and a concurrent head update;
- replay one idempotency key with altered content;
- mutate a staged payload or substitute a receipt with the wrong request hash,
  actor, Mission, thread, cursor or consent claim;
- confirm that rejected, expired and confirmed draft rows retain audit hashes
  but no duplicate staged source payload;
- reference private fragments from another Mission or member boundary;
- smuggle Narrative Anchors into `evidence_refs`;
- under the current v0.5 schemas, attempt a `DeliberationSession`,
  `LearningRecord`, `EvolutionProposal` or `CognitiveCommit` without persisted
  Reality Evidence; confirm that the Evidence supports empirical or process
  claims and is never presented as proof of Narrative meaning, taste or value;
- inspect whether rejected and superseded candidates remain auditable without
  re-entering the pending queue;
- verify that public APIs and pages never return Cognitive Bridge source text;
- start a fresh conversation and test semantic usefulness, not only payload
  availability.

The design remains governed by Human Sovereignty, Machine Agency, Reality as
Final Arbiter, named accountability, bounded authority and reversibility.
