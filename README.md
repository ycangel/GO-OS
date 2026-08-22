# GO OS — Godel Organization Operating System

**Version:** v0.2.2  
**Status:** Public Alpha

## The organizational shift

As machine intelligence becomes abundant, the enterprise is moving beyond the industrial model of fixed hierarchy, static roles, workflows and human coordination. The emerging organization is a **recursive self-evolving system**: humans define purpose, responsibility and value boundaries; machines and agents gain broad agency to act; reality produces evidence; and the organization continuously updates its missions, capabilities, rules and structure.

**GO OS is an open framework, skill system and emerging runtime protocol for this new organizational paradigm.** Its goal is to help organizations become capable of recursively sensing reality, acting with responsible autonomy, learning from evidence and rewriting themselves without losing human sovereignty.

GO OS is not a project-management tool with agents attached, and it is not related to the Go programming language or operating-system engineering. It treats the organization itself as a continuously running intelligence system.

> **Human Sovereignty × Machine Agency × Reality as Final Arbiter**

The core operating loop is:

`Purpose → Mission → Authority → Action → Reality → Evidence → Learning → Adaptation`

## Why “GO”?

**GO = Godel Organization（哥德尔组织）.**

The name is inspired by [Kurt Gödel](https://en.wikipedia.org/wiki/Kurt_G%C3%B6del), the logician and mathematician best known for the incompleteness theorems. In simplified terms, Gödel showed that sufficiently expressive formal systems have intrinsic limits: not every truth about the system can be proved from within a fixed set of rules.

GO OS uses this as an organizational metaphor, not as a literal mathematical equivalence. No sufficiently complex organization should assume that one fixed set of rules, processes or structures can permanently resolve every future situation. A resilient organization must be able to observe reality, detect exceptions, question its own assumptions, update its beliefs and safely rewrite parts of itself.

“GO” also means movement and action: **go, test, learn, evolve.**

## What GO OS manages

GO OS does not treat tasks as the primary object. Its core objects are:

- **Mission** — what outcome must be achieved and why.
- **Authority** — what decisions and resources may be committed, by whom or by what agent.
- **State** — the best current representation of relevant reality.
- **Evidence** — observations that support, contradict or update beliefs.
- **Exception** — conditions that exceed assumptions, authority or normal operating bounds.
- **Capability** — reusable ability that improves future execution.
- **Organizational Memory** — retained decisions, evidence, models, patterns and lessons.

The canonical constitutional principles are defined in [`docs/GO_OS_CONSTITUTION_v0.2.2.md`](docs/GO_OS_CONSTITUTION_v0.2.2.md).

## The skill system

This repository ships one semantic gateway and eight specialist skills:

| Skill | Purpose |
|---|---|
| `go-os-core` | Detect the underlying organizational problem and route it to the correct GO OS capability. |
| `ai-native-organization-design` | Redesign organizations around missions, authority, loops and capabilities instead of static roles and workflows. |
| `human-sovereignty-machine-agency` | Define what humans must own, what machines may autonomously do, and where escalation is required. |
| `mission-organizational-runtime` | Compile intent and strategy into executable missions, authority and evidence. |
| `reality-loop-organizational-learning` | Increase the speed and quality of learning from reality. |
| `vision-driven-strategy` | Turn strategy into a continuously updated hypothesis-action-evidence loop. |
| `intelligent-compounding-ai-native-business` | Design business models whose data, intelligence, experience and capability loops compound over time. |
| `ai-native-talent-human-value` | Redefine human value, roles and leadership when machine intelligence becomes abundant. |
| `ai-native-organization-diagnostic` | Diagnose AI-native maturity, bottlenecks and transformation paths. |

## How to use

### 1. Use GO OS as an Agent Skill system

Install or copy `skills/go-os-core/SKILL.md` plus any specialist skills into an Agent Skills-compatible environment. Start with `go-os-core`: its `description` is designed to detect explicit requests, real-world problem signals and latent structural symptoms, then route to the right specialist skill.

### 2. Use GO OS as an organizational design framework

Read the Constitution, Open Framework, architecture and glossary under `/docs`, then apply the runtime loop to a real recurring mission. Start with one bounded, evidence-rich problem rather than redesigning the entire company at once.

### 3. Use GO OS as a machine-readable protocol

Use the JSON Schemas under `/schemas` to represent `MissionSpec`, `AuthorityGrant`, `EvidenceSpec` and `ExceptionSpec`. These are the first executable interfaces toward a GO Runtime.

## Repository structure

```text
.
├── README.md
├── README.zh-CN.md
├── AUTHORS.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── VERSION
├── docs/
│   ├── GO_OS_CONSTITUTION_v0.2.2.md
│   ├── GO_OS_OPEN_FRAMEWORK_v0.1.0.md
│   ├── PRINCIPLES_v0.1.0.md
│   ├── ARCHITECTURE_v0.1.0.md
│   ├── GLOSSARY_v0.1.0.md
│   ├── SKILL_SPEC_v0.2.2.md
│   ├── SKILL_ROUTING_AND_CONTRACTS_v0.2.0.md
│   ├── RED_TEAM_REVIEW_v0.1.1.md
│   └── ROADMAP.md
├── schemas/
│   ├── mission-spec.schema.json
│   ├── authority-grant.schema.json
│   ├── evidence-spec.schema.json
│   ├── exception-spec.schema.json
│   └── examples/
├── skills/
│   ├── go-os-core/
│   └── ... eight specialist skills
└── tests/
    ├── eval-cases-v0.2.0.yaml
    ├── trigger-evals-v0.2.1.yaml
    └── evaluation-prompts.md
```

## Versioning

GO OS uses Semantic Versioning:

- `MAJOR`: changes to core ontology or incompatible skill behavior.
- `MINOR`: new capabilities, objects or substantial framework extensions.
- `PATCH`: clarification, testing, examples, consistency fixes and non-breaking improvements.

Current version: **v0.2.2**.

## Authors

**Angelo Yu**  
Founder & CEO, PIX Moving  
angelo@pixmoving.com

**灌木丛 (Guanmucong)**  
AI Collaborator

See [AUTHORS.md](AUTHORS.md).

## License

Software and machine-executable support files are released under the Apache License 2.0. Documentation and skill text are released under CC BY 4.0. See `LICENSE` and `LICENSE-CONTENT.md`.

---

**GO — Build organizations that can evolve themselves.**
