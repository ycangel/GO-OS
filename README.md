# GO OS — Godel Organization Operating System

**Version:** v0.1.0  
**Status:** Public alpha

GO OS is an open framework and skill system for building **AI-native organizations**: organizations in which humans retain sovereignty over purpose, responsibility and irreversible consequences, while AI systems and agents gain broad agency to plan, execute, coordinate, verify and improve work.

GO OS is not a project-management tool with agents attached. It treats the organization itself as a continuously running intelligence system.

> **Human Sovereignty × Machine Agency × Reality as Final Arbiter**

The core operating loop is:

`Purpose → Mission → Authority → Action → Reality → Evidence → Learning → Adaptation`

## Why “GO”?

**GO = Godel Organization（哥德尔组织）.**

The name is inspired by Kurt Gödel. The organizational metaphor is simple: no sufficiently complex organization should assume that a fixed set of rules can permanently resolve every future situation. A resilient organization must be able to observe reality, detect exceptions, question its own rules, update its beliefs and rewrite parts of itself.

“GO” also means movement and action: **go, test, learn, evolve.**

## What GO OS manages

GO OS does not treat tasks as the primary object. Its core objects are:

- **Mission** — what outcome must be achieved and why.
- **Authority** — what decisions and resources may be committed, by whom or by what agent.
- **State** — the current reality of the system.
- **Evidence** — observations that support, contradict or update beliefs.
- **Exception** — conditions that exceed assumptions, authority or normal operating bounds.
- **Capability** — reusable ability that improves future execution.
- **Organizational Memory** — retained decisions, evidence, models, patterns and lessons.

## The skill system

This repository ships one routing skill and eight capability skills:

| Skill | Purpose |
|---|---|
| `go-os-core` | Route problems through the GO OS worldview and select the right capability skill. |
| `ai-native-organization-design` | Redesign organizations around missions, authority, loops and capabilities instead of static roles and workflows. |
| `human-sovereignty-machine-agency` | Define what humans must own, what machines may autonomously do, and where escalation is required. |
| `mission-organizational-runtime` | Compile vision and strategy into executable missions, states, authority and evidence. |
| `reality-loop-organizational-learning` | Increase the speed and quality of learning from reality. |
| `vision-driven-strategy` | Turn strategy into a continuously updated hypothesis-action-evidence loop. |
| `intelligent-compounding-ai-native-business` | Design business models whose data, intelligence, experience and capability loops compound over time. |
| `ai-native-talent-human-value` | Define human value when intelligence becomes abundant and machine agency expands. |
| `ai-native-organization-diagnostic` | Diagnose an organization’s AI-native maturity, bottlenecks and transformation path. |

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
│   ├── GO_OS_OPEN_FRAMEWORK_v0.1.0.md
│   ├── PRINCIPLES_v0.1.0.md
│   ├── ARCHITECTURE_v0.1.0.md
│   ├── GLOSSARY_v0.1.0.md
│   ├── SKILL_SPEC_v0.1.0.md
│   └── ROADMAP.md
├── skills/
│   └── ...
└── tests/
    └── evaluation-prompts.md
```

## Design commitments

GO OS is designed to remain:

1. **Reality-grounded** — evidence outranks hierarchy, rhetoric and model confidence.
2. **Human-sovereign** — accountability never disappears when execution is delegated.
3. **Machine-agentic** — capable machines should not be forced through unnecessary human approval loops.
4. **Mission-native** — outcomes and state transitions matter more than activity volume.
5. **Exception-driven** — humans should spend more attention on ambiguity, conflict, irreversible decisions and new frontiers.
6. **Learning-oriented** — every meaningful execution should have the potential to improve future capability.
7. **Self-revising** — the organization can update not only actions but also assumptions, policies, structure and skills.

## Versioning

GO OS uses Semantic Versioning:

- `MAJOR`: changes to core ontology or incompatible skill behavior.
- `MINOR`: new capabilities, objects or substantial framework extensions.
- `PATCH`: clarification, testing, examples and non-breaking improvements.

Current version: **v0.1.0**.

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
