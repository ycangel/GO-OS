# GO OS — Reinvent Organizations

> **Vision: Reinvent Organizations.**  
> **Mission: Enable organizations to evolve themselves.**

**Current release:** `v0.5.0` — **Foundation Release**

[中文](README.zh-CN.md) · [Documentation](docs/INDEX.md) · [Quick Start](docs/QUICK_START.md) · [Release Notes](docs/RELEASE_NOTES_v0.5.0.md)

**GO OS (Godel Organization Operating System)** is an open organizational intelligence operating system for building **self-evolving organizations**.

AI is making intelligence abundant. The next transformation is not simply putting copilots into old workflows. It is changing the organization itself: how it senses reality, forms beliefs, allocates authority, acts, learns, remembers, and safely rewrites its own structure.

GO OS asks one foundational question:

> **How does intelligence become part of an organization?**

Its answer is not “add more agents.” It is to build an organizational runtime in which humans retain sovereignty over purpose, responsibility, values and irreversible consequences; machines gain meaningful agency within explicit authority; reality continuously produces evidence; and learning can change the organization itself.

**Human Sovereignty × Machine Agency × Reality as Final Arbiter**

“Foundation Release” is a software release-stage name: it means an architectural baseline on which later releases can build. It does **not** assert the existence of a “GO Foundation” or any registered foundation or other legal entity.

---

## A third organizational civilization

Human organizations have repeatedly changed their coordination technology.

### I. Relationship-driven organizations

Small groups coordinated through kinship, trust, reputation and direct human relationships. Their strength was shared context; their limit was scale.

### II. Hierarchy-driven organizations

Industrial organizations scaled through hierarchy, roles, departments, processes, approvals and management systems. Their strength was repeatability; their limit is rigidity. Information moves upward, decisions move downward, and adaptation is often slower than reality.

### III. Evolution-driven organizations

When intelligence becomes abundant and machine agency becomes practical, organizations can become recursive learning systems.

Humans define purpose and bear responsibility. Machines observe, reason, coordinate and act. Reality returns evidence. Exceptions expose failed assumptions. Organizational memory preserves learning. The organization then updates its missions, capabilities, authority boundaries, policies and structure.

The organization is no longer designed once and managed forever.

**It continuously redesigns itself.**

That is the organizational paradigm GO OS is built to explore.

---

## From automation to organizational intelligence

Most enterprise AI begins by inserting AI into an existing structure:

`Old Organization + AI Tools`

GO OS starts from a different premise:

`Human Purpose + Machine Agency + Reality Feedback → Self-Evolving Organization`

The primary unit is therefore not the task.

A task says what someone should do next. A self-evolving organization needs to know something deeper:

- What mission are we trying to advance?
- Who or what has authority to act?
- What does the organization currently believe?
- What evidence supports or contradicts that belief?
- What exceptions reveal that our model is wrong?
- What did we learn?
- What reusable capability should now exist?
- What part of the organization should change?

GO OS turns those questions into runtime objects and executable boundaries.

---

## Canonical v0.5 documentation

[`docs/INDEX.md`](docs/INDEX.md) is the canonical documentation entry point for v0.5. Earlier versioned documents remain in the repository as design history; they are authoritative for the current release only when the index explicitly identifies them as canonical.

| Start with | Use it for |
|---|---|
| [Quick Start](docs/QUICK_START.md) | Run a small, bounded GO OS loop and inspect the reference assets. |
| [Architecture Overview](docs/ARCHITECTURE_OVERVIEW.md) | Understand the layers, core objects, enforcement boundaries and current implementation coverage. |
| [Whitepaper editorial scaffold](docs/WHITEPAPER.md) | Review the planned argument, evidence obligations and research agenda; this is not yet a published whitepaper. |
| [Release Notes](docs/RELEASE_NOTES_v0.5.0.md) | See what the v0.5.0 baseline includes and what it does not claim. |
| [Migration & Deprecation](docs/MIGRATION_AND_DEPRECATION_v0.5.0.md) | Update references from earlier documents, terms and interfaces. |
| [Evaluation & Red Team](docs/EVALUATION_AND_RED_TEAM_v0.5.0.md) | Reproduce evaluations, report counterexamples and prepare adversarial review. |

---

## The GO OS constitutional model

GO OS is built on three constitutional principles.

### 1. Human Sovereignty

Humans remain responsible for purpose, value judgments, resource commitments, constitutional boundaries and irreversible consequences.

AI may advise, challenge, plan and execute. It does not inherit sovereignty merely because it is intelligent.

### 2. Machine Agency

Machines should not be trapped as passive assistants waiting for every next instruction.

Within explicit authority, agents may plan, execute, coordinate, verify, learn and propose changes. Authority is granted, bounded, revocable and auditable. An agent cannot silently expand its own authority.

### 3. Reality as Final Arbiter

Hierarchy, confidence and eloquence do not determine truth.

Reality does.

Evidence can contradict plans, leaders, agents and organizational assumptions. A healthy organization must be structurally capable of learning from that contradiction.

The canonical constitutional document is [`docs/GO_OS_CONSTITUTION_v0.2.2.md`](docs/GO_OS_CONSTITUTION_v0.2.2.md).

---

## The organizational intelligence loop

The original GO OS operating loop was:

`Purpose → Mission → Authority → Action → Reality → Evidence → Learning → Adaptation`

The runtime architecture now makes the cognitive loop explicit:

```text
Purpose
  ↓
Mission + Authority
  ↓
Action
  ↓
Reality
  ↓
Evidence
  ↓
Cognitive Event
  ↓
Human–AI Deliberation
  ↓
Learning
  ↓
Evolution Proposal
  ↓
Cognitive Commit
  ↓
Updated Organization
  ↺
```

This is the core of GO OS: not workflow automation, but **recursive organizational learning**.

---

## Core runtime objects

The v0.5 reference architecture centers on eight runtime objects:

| Object | What it represents |
|---|---|
| **Mission** | An outcome the organization commits to pursue, including intent and success conditions. |
| **AuthorityGrant** | Explicit, bounded and revocable permission for a human or machine actor to change organizational state. |
| **Evidence** | Traceable observations that support, contradict or update organizational beliefs. |
| **CognitiveEvent** | A moment when evidence, exceptions, uncertainty or capability gaps require the organization to rethink something. |
| **DeliberationSession** | Structured Human–AI reasoning around hypotheses, evidence, alternatives and decisions. |
| **LearningRecord** | A reusable change in organizational understanding produced by experience. |
| **EvolutionProposal** | A traceable proposal to change capability, policy, authority, structure or other organizational state. |
| **CognitiveVersion** | A versioned snapshot of organizational beliefs, decisions, assumptions, open questions and learning history. |

Earlier GO OS concepts such as State, Exception, Capability and Organizational Memory remain important domain concepts. The eight objects above define the frozen v0.5 reference-runtime core.

---

## Architecture

```text
 Humans / Agents / Physical World
             │
             ▼
   Cognitive Interface Layer
 ChatGPT · Claude · DeepSeek · GO Web
 Voice · Enterprise Systems · Robots
             │
             ▼
   Cognitive Interface Adapters
             │
             ▼
        Headless GO Core
             │
   ┌─────────┼─────────┐
   ▼         ▼         ▼
Authority  Evidence  Cognition
Runtime    Runtime   Runtime
   │         │         │
   └─────────┼─────────┘
             ▼
       Deliberation
             ▼
    Organizational Memory
             ▼
       Evolution Runtime
             ▼
    Cognitive Repository
             │
             └──────────────↺
```

GO OS is deliberately **headless**. ChatGPT, Claude, DeepSeek, a web application, enterprise software, sensors or robots can all become interfaces to the same organizational intelligence layer.

The interface is replaceable.

**The organization's intelligence is not.**

---

## Cognitive Portability

A major design principle of GO OS is:

> **Organizational intelligence should belong to the organization, not to an AI vendor or interface.**

A conversation history is not organizational intelligence. The durable asset is the structured cognitive state behind it:

- purpose;
- beliefs and assumptions;
- evidence;
- important decisions;
- reasoning patterns;
- unresolved questions;
- learning records;
- evolution history.

GO Cognitive Packages and Cognitive Interface Adapters are intended to make that state portable across AI systems.

In the internet era, software became portable.

In the cloud era, data became portable.

GO OS explores the next requirement:

**cognitive portability.**

---

## Cognitive Repository — Git for Organizational Intelligence

Organizations usually preserve documents and decisions, but lose the evolution of understanding behind them.

GO OS introduces a **Cognitive Repository** to version organizational intelligence.

The analogy to Git is intentional but not literal:

| Git | GO Cognitive Repository |
|---|---|
| Source repository | Cognitive repository |
| Commit | Cognitive commit |
| Diff | Cognitive diff |
| Branch | Competing hypothesis / strategic branch |
| Merge | Evidence-informed cognitive convergence |
| History | Evolution of organizational understanding |

A Cognitive Commit answers:

> What changed in our understanding, why did it change, what evidence caused the change, and who owned the decision?

This allows an organization to preserve not only **what it knows**, but **how it learned**.

That distinction matters. An organization capable of improving its ability to learn has a compounding advantage over one that merely stores more information.

---

## GO OS is designed to run on GO OS

Self-application is an operating commitment and falsification strategy. In
v0.5, the artifacts below are a self-application program and reference records;
they are not evidence that the complete runtime loop has executed or produced
longitudinal organizational outcomes.

**GO Cognitive Repository #001** is the reference record intended to preserve
the evolution of GO OS itself: its beliefs, architectural decisions, cognitive
commits and open questions.

**GO Society Runtime Instance #001** is the first reference organizational instance designed to run the complete loop:

```text
Reality
→ Evidence
→ Cognitive Event
→ Deliberation
→ Learning
→ Evolution Proposal
→ Cognitive Commit
→ Updated State
```

This matters because the strongest test of a theory of self-evolving organizations is whether it can expose and correct its own weaknesses.

GO OS should therefore remain falsifiable. Its own operating history is evidence **for or against** its design assumptions.

---

## GO Society

**GO Society is GO OS's first reference organizational instance and alpha
self-application surface.** The name identifies a project community and
reference instance; it does not by itself assert a separate legal entity.

> **A self-evolving organization for self-evolving organizations.**

GO Society is not intended to be a showcase detached from the protocol. Its
program is to operate bounded missions, test authority boundaries, collect
evidence, surface exceptions, conduct Human–AI reasoning and propose changes to
the system that runs it. Which parts are implemented or validated are reported
separately in the [Web README](web/README.md) and release notes.

- **Reference application:** [`/web`](web)
- **Current ecosystem and governance boundary:**
  [`docs/ECOSYSTEM_AND_GOVERNANCE_BOUNDARY.md`](docs/ECOSYSTEM_AND_GOVERNANCE_BOUNDARY.md)
- **Historical founding charter:**
  [`docs/GO_SOCIETY_OPERATING_CHARTER_v0.1.md`](docs/GO_SOCIETY_OPERATING_CHARTER_v0.1.md)

---

## Why “Godel Organization”?

**GO = Godel Organization（哥德尔组织）.**

The name is inspired by [Kurt Gödel](https://en.wikipedia.org/wiki/Kurt_G%C3%B6del), one of the most influential logicians of the twentieth century and the author of the incompleteness theorems.

In simplified terms, Gödel demonstrated intrinsic limits in sufficiently expressive formal systems: a fixed formal system cannot, from within its own rules, settle every truth expressible within it.

GO OS uses this as an organizational metaphor—not as a claim of mathematical equivalence.

A sufficiently complex organization should not assume that one fixed hierarchy, process, policy set or management doctrine can resolve every future condition. Reality will eventually produce situations the existing model did not anticipate.

A resilient organization therefore needs mechanisms to:

- observe itself and the outside world;
- detect contradictions and exceptions;
- question assumptions;
- incorporate evidence;
- preserve learning;
- and safely rewrite parts of itself.

“GO” also carries a simpler meaning:

**Go. Test. Learn. Evolve.**

---

## Skill system

GO OS includes one semantic gateway and eight specialist Skills. They allow Agent / Codex / AI environments to apply GO OS concepts directly rather than merely read the framework.

| Skill | Purpose |
|---|---|
| `go-os-core` | Diagnose the underlying organizational problem and route to the appropriate GO OS capability. |
| `ai-native-organization-design` | Redesign organizations around missions, authority, learning loops and capabilities. |
| `human-sovereignty-machine-agency` | Define human responsibility, machine agency and escalation boundaries. |
| `mission-organizational-runtime` | Compile intent into executable missions, authority, state and evidence. |
| `reality-loop-organizational-learning` | Improve the speed and quality of learning from reality. |
| `vision-driven-strategy` | Treat strategy as an evolving hypothesis–action–evidence loop. |
| `intelligent-compounding-ai-native-business` | Design businesses whose intelligence and capabilities compound through use. |
| `ai-native-talent-human-value` | Redefine human contribution when machine intelligence becomes abundant. |
| `ai-native-organization-diagnostic` | Diagnose organizational bottlenecks and AI-native transformation paths. |

---

## Machine-readable protocols

GO OS is intended to be executable, not only philosophical.

The canonical v0.5 schema set covers all eight frozen core objects:

- `Mission`
- `AuthorityGrant`
- `Evidence`
- `CognitiveEvent`
- `DeliberationSession`
- `LearningRecord`
- `EvolutionProposal`
- `CognitiveVersion`

`Exception` and `CognitiveCommit` are supporting contracts. Earlier root-level
schemas remain as v0.2 compatibility artifacts; new integrations should start
with the [`v0.5 schema index`](schemas/README.md) and
[`manifest`](schemas/v0.5/manifest.json).

These contracts are the bridge between organizational principles and runtime enforcement.

---

## How to start

Begin with the canonical [Quick Start](docs/QUICK_START.md). There are four useful paths depending on the work you want to do.

### For leaders and organization designers

Start with this README and the Constitution. Choose one real recurring mission. Define its purpose, authority boundary, evidence and exception conditions. Do not begin by digitizing the existing org chart.

### For AI / Agent builders

Install `skills/go-os-core/SKILL.md`, then add specialist Skills as needed. Use the schemas as contracts and enforce Authority before organizational state mutations.

### For developers

Use the [Architecture Overview](docs/ARCHITECTURE_OVERVIEW.md), then explore [`/web`](web), machine-readable contracts under [`/schemas`](schemas), and evaluations under [`/tests`](tests). The reference application implements selected runtime boundaries; it is not evidence that every v0.5 architectural object is production-complete.

### For researchers and contributors

Challenge the assumptions. Produce counterexamples. Test adversarial conditions. Improve schemas, runtime semantics, evaluations and reference implementations.

GO OS should become stronger through criticism, not consensus alone.

---

## What GO OS is not

GO OS is **not**:

- project-management software with AI features;
- an agent orchestration framework with organization vocabulary added;
- a digital org chart;
- a replacement for human responsibility;
- a claim that AI should autonomously govern organizations;
- a fixed management methodology.

It is an attempt to define an open operating model and runtime for organizations that can continuously sense, reason, act, learn and evolve while preserving human sovereignty.

---

## v0.5.0 Foundation Release

**v0.5.0** is the first GO OS Foundation Release.

Here, **Foundation Release** means an **architectural baseline release**. It is not the name of a foundation, does not announce a “GO Foundation,” and does not imply that a foundation or other legal entity has been registered.

It marks the transition from exploratory organizational theory toward a coherent reference architecture built around:

- constitutional boundaries;
- organizational runtime objects;
- Human–AI cognitive loops;
- cognitive portability;
- cognitive version control;
- self-application through GO Cognitive Repository #001 and GO Society.

It is an architectural baseline, not a declaration of completeness.

| Release area | v0.5.0 status |
|---|---|
| Constitutional model, core ontology and reference architecture | Published as the v0.5 baseline. |
| Schemas, Skills, evaluations and GO Society Web | Available as reference assets with uneven implementation depth. |
| Cognitive portability, repository semantics and self-application | Specified and represented by reference artifacts; cross-system and long-running operational proof remains future validation work. |
| Production readiness for autonomous organizational governance | Not claimed. Human approval, bounded authority and context-specific validation remain required. |

The next stages focus on making the runtime increasingly executable, interoperable, testable and useful in real organizations.

See the [Release Notes](docs/RELEASE_NOTES_v0.5.0.md) for the shipped baseline and the [Migration & Deprecation Notes](docs/MIGRATION_AND_DEPRECATION_v0.5.0.md) for compatibility boundaries.

---

## Roadmap

```text
v0.5.0  Foundation Release
      ↓
v0.6  Runtime + SDK Beta
      ↓
v0.8  Multi-organization / Community Runtime
      ↓
v1.0  Production Self-Evolving Organization Runtime
```

Except for the published v0.5.0 baseline, these versions are directional plans—not shipped capabilities or delivery commitments.

The long-term objective is simple to state and difficult to achieve:

> **An organization should be able to improve not only what it does, but how it improves itself.**

---

## Contributing

GO OS is an open project. Contributions can include code, Skills, schemas, evaluations, organizational experiments, critiques and new reference implementations.

The most valuable contribution is not necessarily more code. It may be a better falsification test, a clearer authority model, a real-world exception that breaks an assumption, or a more powerful way for organizations to learn.

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

For adversarial review priorities and evidence expectations, see [Evaluation & Red Team](docs/EVALUATION_AND_RED_TEAM_v0.5.0.md).

---

## Authors

**Angelo Yu**

Founder & CEO, PIX Moving · Initiator and Maintainer of GO OS

A practitioner of complex organizational management and an explorer of new organizational paradigms.

angelo@pixmoving.com

**灌木丛 (Guanmucong)**  
AI Collaborator

See [`AUTHORS.md`](AUTHORS.md).

---

## License

Software and machine-executable support files are released under the Apache License 2.0. Documentation and Skill text are released under CC BY 4.0. See [`LICENSE`](LICENSE) and [`LICENSE-CONTENT.md`](LICENSE-CONTENT.md).

---

# Reinvent Organizations.

# 重新发明组织。

**GO — Enable organizations to evolve themselves.**
