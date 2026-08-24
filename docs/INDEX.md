# GO OS Documentation Index

**Release baseline:** v0.5.0

**Release name:** Foundation Release / 奠基版本

**Last aligned:** 2026-08-24

This page is the canonical entry point for GO OS v0.5 documentation. Earlier
versioned documents remain part of the project's design history; they are not
silently rewritten to look current.

> `Foundation Release` is a software milestone name. Its Chinese rendering is
> **“奠基版本”**. It does not state or imply that a legal foundation or a
> legal entity named “GO Foundation” exists.

## Start here

| If you want to… | Read |
|---|---|
| Understand the project | [English README](../README.md) or [中文 README](../README.zh-CN.md) |
| Run the smallest useful loop | [Quick Start](QUICK_START.md) |
| Deploy an isolated self-hosted GO Society instance | [Self-hosted runbook](../deploy/self-hosted/RUNBOOK.md) |
| Connect a Human–AI conversation to GO Society cognition | [Cognitive Bridge v0.5 Alpha](COGNITIVE_BRIDGE_v0.5_ALPHA.md) |
| Apply the conversation-side consent and authority contract | [GO Society Cognitive Bridge Skill](../skills/go-society-cognitive-bridge/SKILL.md) |
| Understand the frozen v0.5 model | [Architecture Overview](ARCHITECTURE_OVERVIEW.md) |
| Review the planned argument and research agenda | [Whitepaper editorial scaffold](WHITEPAPER.md) |
| See exactly what v0.5.0 includes | [Release Notes](RELEASE_NOTES_v0.5.0.md) |
| Move from an earlier release | [Migration & Deprecation Notes](MIGRATION_AND_DEPRECATION_v0.5.0.md) |
| Challenge the release | [Evaluation & Red-Team](EVALUATION_AND_RED_TEAM_v0.5.0.md) |
| Contribute | [Contributing Guide](../CONTRIBUTING.md) |

## Canonical v0.5 set

The following documents define the current release baseline.

| Document | Role | Status |
|---|---|---|
| [GO OS Constitution v0.2.2](GO_OS_CONSTITUTION_v0.2.2.md) | Constitutional principles and non-negotiable authority boundaries | **Normative** |
| [Architecture Overview](ARCHITECTURE_OVERVIEW.md) | Canonical v0.5 objects, layers, invariants and maturity boundary | **Release canonical** |
| [Ecosystem & Governance Boundary](ECOSYSTEM_AND_GOVERNANCE_BOUNDARY.md) | Public upstream, enterprise offering, PIX and GO Society role boundaries | **Release canonical** |
| [`schemas/`](../schemas) | Machine-readable object contracts | **Normative where a schema exists** |
| [Skill Specification v0.2.2](SKILL_SPEC_v0.2.2.md) | Skill format, discovery and evaluation contract | **Normative** |
| [Skill Routing & Contracts v0.2.0](SKILL_ROUTING_AND_CONTRACTS_v0.2.0.md) | Reviewed routing and contract boundary referenced by the Skill Specification | **Reviewed current reference** |
| [`skills/`](../skills) | Semantic gateway, bounded Cognitive Bridge conversation adapter and specialist application skills | **Reference implementation** |
| [`tests/`](../tests) | Evaluation cases, adversarial fixtures and release gates | **Declared tests; execution status is reported separately** |
| [`web/`](../web) | GO Society reference application | **Bounded two-sided Cognitive Bridge source; live MCP/OAuth and fresh-conversation conformance are reported separately** |
| [`deploy/self-hosted/`](../deploy/self-hosted) | Isolated Node, SQLite, OAuth proxy and HTTPS deployment package | **Reference deployment; target-environment acceptance is required** |
| [Release Notes](RELEASE_NOTES_v0.5.0.md) | Release scope, verification and known limitations | **Release record** |

## Status vocabulary

GO OS uses explicit status labels to keep aspiration separate from evidence.

- **Normative** — defines a rule or contract that conforming implementations
  are expected to follow.
- **Release canonical** — the current explanatory source of truth for v0.5.
- **Specification** — a design contract; it may precede complete implementation.
- **Reference implementation** — code that demonstrates part of the model. It
  is not proof of production readiness or business impact.
- **Declared evaluation** — a machine-readable test vector or review case. Its
  presence does not mean it has been executed or passed.
- **Historical** — an earlier design record preserved for provenance.
- **Proposal / target** — intended future work, not a current capability.

## Version policy

`VERSION` records the repository release. Schemas, Skills, protocols, the Web
application and historical evaluation fixtures may have their own component
versions. A component version is not changed merely to resemble the repository
version. The v0.5 release manifests identify which component versions are
included.

This avoids two failure modes:

1. rewriting historical evidence to create the appearance of consistency; and
2. treating a repository release number as proof that every component has the
   same maturity.

## Documentation precedence

When current documents conflict, use this order:

1. the Constitution for sovereignty, authority and accountability;
2. machine-readable schemas for fields and validation constraints;
3. the v0.5 Architecture Overview for release terminology and object roles;
4. component specifications for behavior inside their stated scope;
5. the Release Notes and Migration Notes for compatibility;
6. historical documents for design rationale, not current status.

If a conflict changes safety, authority, data handling or backward
compatibility, do not resolve it silently. Open an issue or change proposal and
record the competing interpretations and evidence.

## v0.5 supporting release records

These documents support the release but do not outrank the canonical contracts
above.

- [Whitepaper editorial scaffold](WHITEPAPER.md) — planned argument and evidence
  obligations; no published whitepaper body yet.
- [Public Narrative](GO_OS_V0.5.0_PUBLIC_NARRATIVE.md) — communication frame,
  subject to the Release Notes' maturity boundary.
- [Foundation Release Plan](GO_OS_V0.5.0_FOUNDATION_RELEASE_PLAN.md) — release
  planning record.
- [Release Checklist](GO_OS_V0.5.0_RELEASE_CHECKLIST.md) — repository gates and
  intentionally open post-release gates.
- [ROADMAP](ROADMAP.md) — current forward plan and validation horizon.
- [Vision v0.2.2](GO_OS_VISION_v0.2.2.md) — reviewed project aspiration, not a
  capability claim.
- [Glossary, v0.2.2 content in legacy v0.1.0 path](GLOSSARY_v0.1.0.md) —
  terminology reference with an explicit filename provenance note.

## Complete historical archive

Every earlier Markdown document in `docs/` is linked below. These files are
**historical and non-canonical unless the canonical table above explicitly
promotes one as a reviewed current reference**. Wording such as “live,”
“complete,” “runtime” or “GO Works” inside them records the claim or proposal at
that point in the design history; it does not override the v0.5 Release Notes.

### v0.1–v0.2 foundations

- [Architecture v0.1.0](ARCHITECTURE_v0.1.0.md)
- [Open Framework v0.1.0](GO_OS_OPEN_FRAMEWORK_v0.1.0.md)
- [Principles v0.1.0](PRINCIPLES_v0.1.0.md)
- [Red-Team Review v0.1.1](RED_TEAM_REVIEW_v0.1.1.md)
- [Skill Specification v0.1.0](SKILL_SPEC_v0.1.0.md)
- [GO Society Operating Charter v0.1](GO_SOCIETY_OPERATING_CHARTER_v0.1.md) —
  founding record; its ecosystem/commercial proposals are superseded by the
  current Ecosystem & Governance Boundary.

The v0.2.2 Constitution and Skill Specification, and the v0.2.0 Skill Routing
document, are linked in the canonical table because v0.5 explicitly reviewed
and retained them.

### v0.3 runtime-design series

- [Runtime Architecture v0.3.0](GO_OS_RUNTIME_ARCHITECTURE_v0.3.0.md)
- [Implementation Roadmap v0.3.0](GO_OS_IMPLEMENTATION_ROADMAP_v0.3.0.md)
- [P0 Implementation v0.3.1](GO_OS_V0.3.1_P0_IMPLEMENTATION.md)
- [Authority Runtime v0.3.1](GO_OS_V0.3.1_AUTHORITY_RUNTIME.md)
- [Authority Enforcement v0.3.1](GO_OS_V0.3.1_AUTHORITY_ENFORCEMENT.md)
- [API Enforcement Plan v0.3.1](GO_OS_V0.3.1_API_ENFORCEMENT_PLAN.md)
- [Evidence Runtime v0.3.1](GO_OS_V0.3.1_EVIDENCE_RUNTIME.md)
- [Evidence API Enforcement v0.3.1](GO_OS_V0.3.1_EVIDENCE_API_ENFORCEMENT.md)
- [Cognitive Package Spec v0.3.2](GO_COGNITIVE_PACKAGE_SPEC_v0.3.2.md)
- [Cognitive Runtime Architecture v0.3.2](GO_OS_V0.3.2_COGNITIVE_RUNTIME_ARCHITECTURE.md)
- [Cognitive Event Runtime v0.3.2](GO_OS_V0.3.2_COGNITIVE_EVENT_RUNTIME.md)
- [Deliberation Runtime v0.3.2](GO_OS_V0.3.2_DELIBERATION_RUNTIME.md)
- [Organizational Memory Runtime v0.3.2](GO_OS_V0.3.2_ORGANIZATIONAL_MEMORY_RUNTIME.md)
- [Evolution Runtime v0.3.3](GO_OS_V0.3.3_EVOLUTION_RUNTIME.md)
- [GO Society Self-Operating Loop v0.3.3](GO_OS_V0.3.3_GO_SOCIETY_SELF_OPERATING_LOOP.md)
- [Cognitive Interface Adapter Spec v0.3.4](GO_COGNITIVE_INTERFACE_ADAPTER_SPEC_v0.3.4.md)
- [Headless Core Architecture v0.3.4](GO_OS_V0.3.4_HEADLESS_CORE_ARCHITECTURE.md)
- [Cognitive Package Spec v0.3.5](GO_OS_V0.3.5_COGNITIVE_PACKAGE_SPEC.md)
- [Cognitive Portability Runtime v0.3.5](GO_OS_V0.3.5_COGNITIVE_PORTABILITY_RUNTIME.md)
- [ChatGPT Cognitive Instance Spec v0.3.6](GO_OS_V0.3.6_CHATGPT_COGNITIVE_INSTANCE_SPEC.md)
- [Cognitive Interface Adapter Architecture v0.3.6](GO_OS_V0.3.6_COGNITIVE_INTERFACE_ADAPTER_ARCHITECTURE.md)
- [Cognitive Package Runtime v0.3.7](GO_OS_V0.3.7_COGNITIVE_PACKAGE_RUNTIME.md)
- [Cognitive State Versioning Spec v0.3.7](GO_OS_COGNITIVE_STATE_VERSIONING_SPEC_v0.3.7.md)
- [Cognitive Package Import/Export Runtime v0.3.8](GO_OS_V0.3.8_COGNITIVE_PACKAGE_IMPORT_EXPORT_RUNTIME.md)
- [Cognitive State Migration Protocol v0.3.8](GO_OS_COGNITIVE_STATE_MIGRATION_PROTOCOL_v0.3.8.md)
- [Cognitive Git Model v0.3.9](GO_OS_V0.3.9_COGNITIVE_GIT_MODEL.md)
- [Cognitive Commit Protocol v0.3.9](GO_OS_COGNITIVE_COMMIT_PROTOCOL_v0.3.9.md)

### v0.4 reference-runtime and repository series

- [Reference Implementation Roadmap v0.4.0](GO_OS_V0.4.0_REFERENCE_IMPLEMENTATION_ROADMAP.md)
- [Reference Runtime Architecture v0.4.0](GO_OS_V0.4.0_REFERENCE_RUNTIME_ARCHITECTURE.md)
- [Cognitive Commit Protocol v0.4.1](GO_OS_COGNITIVE_COMMIT_PROTOCOL_V0.4.1.md)
- [Cognitive Repository Runtime v0.4.1](GO_OS_V0.4.1_COGNITIVE_REPOSITORY_RUNTIME.md)
- [Cognitive Branch Model v0.4.2](GO_OS_V0.4.2_COGNITIVE_BRANCH_MODEL.md)
- [Cognitive Repository Implementation v0.4.2](GO_OS_V0.4.2_COGNITIVE_REPOSITORY_IMPLEMENTATION.md)
- [Cognitive Repository API Runtime v0.4.3](GO_OS_V0.4.3_COGNITIVE_REPOSITORY_API_RUNTIME.md)
- [Cognitive Repository Branch/Merge v0.4.3](GO_OS_V0.4.3_COGNITIVE_REPOSITORY_BRANCH_MERGE.md)
- [Cognitive Repository Persistence Layer v0.4.4](GO_OS_V0.4.4_COGNITIVE_REPOSITORY_PERSISTENCE_LAYER.md)
- [Cognitive Repository #001 Spec](GO_COGNITIVE_REPOSITORY_001_SPEC.md)
- [Cognitive Repository #001 Bootstrap v0.4.5](GO_OS_V0.4.5_COGNITIVE_REPOSITORY_001_BOOTSTRAP.md)
- [Cognitive Repository #001 Evolution History v0.4.5](GO_OS_V0.4.5_COGNITIVE_REPOSITORY_001_EVOLUTION_HISTORY.md)
- [Cognitive Repository Data Model v0.4.6](GO_OS_V0.4.6_COGNITIVE_REPOSITORY_DATA_MODEL.md)
- [Cognitive Repository Schema v0.4.6](GO_OS_V0.4.6_COGNITIVE_REPOSITORY_SCHEMA.md)
- [Cognitive Commit #001 v0.4.7](GO_OS_V0.4.7_COGNITIVE_COMMIT_001.md)
- [Cognitive Repository #001 Genesis Data v0.4.7](GO_OS_V0.4.7_COGNITIVE_REPOSITORY_001_GENESIS_DATA.md)
- [GO Society Runtime Instance #001 v0.4.8](GO_OS_V0.4.8_GO_SOCIETY_RUNTIME_INSTANCE_001.md)
- [Runtime Instance State Model v0.4.8](GO_OS_V0.4.8_RUNTIME_INSTANCE_STATE_MODEL.md)
- [Architecture Freeze v0.4.9](GO_OS_V0.4.9_ARCHITECTURE_FREEZE.md)
- [Runtime Integration Release Candidate v0.4.9](GO_OS_V0.4.9_RUNTIME_INTEGRATION_RELEASE_CANDIDATE.md)

For current work, use [ROADMAP.md](ROADMAP.md), not unchecked items in a
historical milestone document.
