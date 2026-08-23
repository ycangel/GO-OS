# GO OS v0.5 Architecture Overview

**Status:** Release-canonical architecture

**Repository release:** v0.5.0

**Architecture baseline:** frozen at v0.4.9 and published in the v0.5.0
Foundation Release / 奠基版本

GO OS is an open organizational-intelligence model and emerging runtime for
organizations that can sense reality, reason, act within explicit authority,
learn and propose changes to themselves while humans retain sovereignty.

This document defines the canonical v0.5 architecture. It also marks the
boundary between the model, the machine-readable contracts, the current
reference implementation and future work.

## 1. Constitutional invariants

Every conforming implementation is expected to preserve these invariants:

1. **Human sovereignty** — humans own purpose, value judgments, constitutional
   limits and irreversible consequences.
2. **Named accountability** — important missions and decisions have a named
   human owner.
3. **Bounded machine agency** — agents may act only inside explicit, revocable
   authority.
4. **No self-expanding authority** — an actor cannot silently enlarge its own
   grant.
5. **Reality finality** — authority, confidence and fluency cannot override
   contradictory evidence from reality.
6. **Traceable evidence** — material belief changes retain source, provenance,
   uncertainty and decision impact.
7. **Human-gated organizational mutation** — proposed changes follow the
   authority appropriate to their consequence and reversibility.
8. **Auditability and exit** — actions, grants, decisions and changes are
   inspectable; authority can be revoked and systems can be replaced.

The normative source is the
[GO OS Constitution](GO_OS_CONSTITUTION_v0.2.2.md).

## 2. The organizational cognitive loop

```text
Purpose
  │
  ▼
Mission + Authority
  │
  ▼
Bounded Action
  │
  ▼
Reality ──► Evidence / Exception
                    │
                    ▼
              Cognitive Event
                    │
                    ▼
          Human–AI Deliberation
                    │
                    ▼
                Learning
                    │
                    ▼
          Evolution Proposal
                    │
                    ▼
             Human Decision
                    │
                    ▼
            Cognitive Commit
                    │
                    ▼
       Updated Organizational State
                    └──────────────↺
```

The loop is recursive organizational learning only when evidence can change a
decision, capability, policy, authority boundary, mission or other
organizational state. Automating a task or generating a report is not enough.

## 3. Frozen core runtime objects

The v0.5 core contains eight objects.

| Object | Role | v0.5 repository evidence |
|---|---|---|
| **Mission** | Outcome the organization commits to pursue, with purpose, owner and success conditions | Schema, example, evaluations and Web persistence |
| **AuthorityGrant** | Explicit, bounded and revocable permission to change organizational state | Schema, evaluations and enforcement-oriented Web code |
| **Evidence** | Traceable observation that supports, contradicts or updates a belief | Schema, evaluations and Web persistence/API surfaces |
| **CognitiveEvent** | Trigger that requires the organization to reconsider an assumption or decision | Schema, runtime contract and declared evaluations |
| **DeliberationSession** | Structured Human–AI reasoning over hypotheses, evidence and alternatives | Schema, runtime contract and declared evaluations |
| **LearningRecord** | Reusable update to organizational understanding | Schema, runtime contract and declared evaluations |
| **EvolutionProposal** | Traceable proposed mutation to policy, capability, authority, mission or structure | Schema, runtime contract, evaluations and Web persistence/API surface |
| **CognitiveVersion** | Versioned snapshot of organizational cognition and its history | Schema, repository specifications and declared evaluations |

The table describes artifacts present in the repository, not independent
proof that every object is integrated end-to-end in production.

### Supporting domain objects

`State`, `Exception`, `Capability`, `OrganizationalMemory`, `Actor`, `Action`
and `RealitySignal` remain important. They are supporting domain concepts, not
additional members of the frozen eight-object core.

An `Exception` is especially important: it exposes a mismatch between current
assumptions, authority or capability and what reality requires. It may trigger a
`CognitiveEvent`; it is not interchangeable with one.

## 4. Layers

```text
Humans · Agents · Enterprise Systems · Physical World
                         │
                         ▼
              Cognitive Interface Layer
        Chat / Web / Voice / APIs / Sensors / Robots
                         │
                         ▼
              Cognitive Interface Adapters
       identity · translation · context · tool boundaries
                         │
                         ▼
                    Headless GO Core
                         │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼
Constitutional Runtime      Cognitive Runtime
Authority · Evidence       Events · Deliberation
Exceptions · Mutation      Learning · Evolution
         └─────────────────────┼─────────────────────┘
                         ▼
              Organizational Memory
                         │
                         ▼
                Cognitive Repository
     versions · commits · diffs · branches · provenance
                         │
                         └──────────────────────────↺
```

### Cognitive Interface Layer

Interfaces let people, agents and systems perceive and act on organizational
state. They are replaceable. They must not become the sole owner of the
organization's durable intelligence.

### Cognitive Interface Adapters

Adapters translate interface-specific messages and tool calls into canonical
objects and authority-aware actions. Authentication and interface convenience
do not bypass GO OS authority.

### Headless GO Core

The headless core is the intended vendor-neutral contract boundary. In v0.5,
it is represented by schemas, specifications, Skills, evaluations and selected
reference code. A complete stable SDK is a later milestone.

### Constitutional and cognitive runtimes

The constitutional side enforces who may act and what evidence or escalation
is required. The cognitive side turns conflict, uncertainty and experience into
structured deliberation, learning and candidate change.

### Organizational Memory and Cognitive Repository

Memory retains usable context. The Cognitive Repository adds versioning and
provenance: what the organization believed, what changed, why, on whose
authority and because of which evidence. The Git analogy is conceptual; v0.5
does not claim full Git feature parity.

## 5. Mutation path

Every material organizational mutation should follow this decision path:

```text
authenticated actor
→ valid AuthorityGrant
→ action inside scope, risk and time limits
→ required evidence and human gate
→ mutation or explicit denial
→ immutable/auditable record
→ review and possible revocation
```

High-consequence or irreversible changes require stronger evidence and a
stronger human gate. A system should fail closed when identity, authority or
required evidence is missing.

## 6. Portability boundary

A portable cognitive package should preserve at least:

- purpose, missions and named owners;
- beliefs, assumptions and open questions;
- evidence, provenance and uncertainty;
- decisions and dissent;
- authority references without leaking secrets;
- learning records and evolution proposals;
- cognitive versions and migration history.

Portability means the organization can move or reconstruct its intelligence
without depending on a single chat interface or model vendor. It does not mean
all vendor behavior is identical or that secrets should be embedded in a
package.

## 7. Reference implementation boundary

The GO Society Web application demonstrates selected runtime surfaces and
durable state. It should be evaluated as a reference application with known
limitations:

- it does not yet prove end-to-end persistence for all eight core objects;
- declared YAML evaluations require an explicit runner or human review record;
- a successful build is not a security audit;
- seeded/demo records are not evidence of organizational impact;
- GO OS self-application is a test strategy, not proof that the theory works;
- real-world improvement claims require baselines, outcomes, counterfactuals
  and repeated deployment evidence.

See the [Release Notes](RELEASE_NOTES_v0.5.0.md) for the verified release state
and [Evaluation & Red-Team](EVALUATION_AND_RED_TEAM_v0.5.0.md) for the next
falsification gates.

## 8. Conformance levels

v0.5 uses three practical conformance levels:

| Level | Minimum evidence |
|---|---|
| **Model-aligned** | Uses canonical object meanings and preserves constitutional invariants |
| **Contract-aligned** | Produces schema-valid objects and passes applicable declared evaluations |
| **Runtime-validated** | Executes an end-to-end loop with recorded authorization, evidence, denial paths, human decisions and state/version changes |

Production readiness, regulatory compliance, safety certification and
demonstrated business impact are separate claims and require separate evidence.
