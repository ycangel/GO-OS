# GO Society Cognitive Bridge v0.5 Alpha

**Status:** bounded reference implementation

**Release baseline:** GO OS v0.5.0 Foundation Release / 奠基版本

**First reference case:** Cognitive Bridge #001, pending authenticated private staging

The Cognitive Bridge alpha implements the durable organization-side half of a
connection between a Human–AI conversation and GO Society's private cognitive
space. It addresses a concrete self-application gap: members were changing
shared understanding while working on GO OS, but the running organization
could neither capture that change nor reload it in a fresh conversation.

This alpha is a vertical slice, not complete cognitive-runtime certification.

## The boundary it enforces

```text
Narrative Anchor ─┐
                  ├→ member/agent candidate → named human review
Reality Evidence ┘                             ↓
                                  CognitiveCommit + CognitiveVersion
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

The GO Society Web reference instance now provides:

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

The relevant member APIs are:

| Endpoint | Purpose | Head mutation |
|---|---|---|
| `GET /api/cognitive-bridge/context` | Load ratified state, pending cognition, source anchors and open questions | No |
| `POST /api/cognitive-bridge/checkpoints` | Persist selected source fragments and schema-shaped candidates | Never; candidate only |
| `POST /api/cognitive-bridge/ratifications` | Human ratification/rejection with optimistic revision and idempotency checks | Only ratification creates a commit/version and advances the head |

Writes require authenticated membership, same-origin transport, Mission
permission and an enforceable `AuthorityGrant`. Agents cannot grant themselves
review authority.

## Cognitive Bridge #001

The first reference case is the external-review deliberation that exposed the
gap. The public repository intentionally contains no real transcript, member
private source, thread binding or pre-ratified candidate. Those materials enter
only through the authenticated private checkpoint API after explicit consent.

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

This first step establishes the durable organization-side protocol and user
interface. It does **not** yet make every ChatGPT conversation automatically
load or write GO Society cognition.

The next adapter should expose the three operations as a ChatGPT/Codex Skill
plus an MCP tool boundary:

1. call `context` when a new GO Society conversation begins;
2. create selected `checkpoints` during or at the end of deliberation;
3. send candidates to the GO Society human gate, never directly to the head.

The adapter must carry authenticated identity and server-authorized membership;
it must not imitate the trusted Sites identity headers from an untrusted
client.

## Acceptance test

The smallest meaningful proof is not “a transcript was saved.” It is this
round trip:

1. an authorized member loads Cognitive Bridge #001 and sees exact source
   anchors plus separately labeled candidates;
2. the member ratifies selected candidates with a rationale;
3. GO Society creates a `CognitiveCommit` and revision 1 `CognitiveVersion`;
4. a fresh conversation, without the old chat history, loads revision 1 and
   its unresolved questions from `context`;
5. replaying the same checkpoint does not duplicate fragments or candidates;
6. a cross-origin, unauthorized or stale-revision write fails closed.

The API/local harness verifies schema migration, source/Evidence separation,
candidate construction, version construction, stable hashing and selected
database constraints. A fresh authenticated local HTTP pass verified staging →
idempotent replay → ratification → compact stateless context reload. Concurrent
cursor and candidate-decision races also produced exactly one winner.
No newly opened ChatGPT/Codex conversation has completed this round trip:
OAuth 2.1 and the Skill/MCP adapter remain the next step.

## Red-team priorities

- attempt direct agent mutation of the cognitive head;
- race ratification against authority revocation and a concurrent head update;
- replay one idempotency key with altered content;
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
