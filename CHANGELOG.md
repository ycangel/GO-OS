# Changelog

All notable changes to GO OS are documented here.

## v0.5.0 — 2026-08-23

### Release designation

- Designated v0.5.0 as the first **Foundation Release**, translated consistently in Chinese as **“奠基版本”**.
- Clarified that “Foundation Release” is a software release-stage name. It does not announce or imply a “GO Foundation,” a registered foundation or any other legal entity.

### Added

- Canonical v0.5 documentation entry point at `docs/INDEX.md`, while retaining earlier versioned documents as design history.
- Quick Start, Architecture Overview and a Whitepaper front structure for the v0.5 baseline.
- Dedicated v0.5.0 Release Notes and Migration & Deprecation Notes.
- A unified Evaluation & Red-Team entry point for reproducible checks, counterexamples and the next adversarial review.

### Changed

- Advanced the repository version marker from `0.3.0` to `0.5.0`.
- Aligned root documentation, schemas, Skills, tests and the web reference application around the v0.5 terminology, architecture and navigation model.
- Defined eight core reference-runtime objects: Mission, AuthorityGrant, Evidence, CognitiveEvent, DeliberationSession, LearningRecord, EvolutionProposal and CognitiveVersion.
- Distinguished published specifications and reference assets from capabilities that still require interoperability, longitudinal and production validation.
- Updated contributor and authorship guidance for compatibility notes, red-team evidence, Human–AI collaboration and human responsibility.

### Compatibility and scope

- Historical documents remain available; their presence does not make them canonical for v0.5 unless `docs/INDEX.md` says so.
- Existing versioned interfaces and examples are preserved where practical. See `docs/MIGRATION_AND_DEPRECATION_v0.5.0.md` before treating earlier terms or specifications as current.
- This release establishes a coherent baseline. It does not claim production readiness for autonomous organizational governance.

## v0.4.0–v0.4.9 — 2026-08-23

### Added

- Reference-runtime architecture and implementation roadmap.
- Cognitive Repository runtime, Cognitive Commit protocol, branch and merge models, API model and persistence-layer specifications.
- GO Cognitive Repository #001 specification, bootstrap model, genesis data, evolution history and first Cognitive Commit example.
- GO Society Runtime Instance #001 specification and state model.
- Evaluations covering the reference runtime, repository semantics, persistence, genesis data, runtime instance and integrated runtime chain.

### Changed

- Froze the v0.5 reference core at v0.4.9 and assembled the final runtime-integration release candidate.
- Moved the project from isolated runtime components toward a single evidence-to-cognitive-commit loop.

## v0.3.1–v0.3.9 — 2026-08-23

### Added

- Authority, evidence and exception runtime contracts, persistence boundaries and constitutional mutation guards.
- Cognitive Event, Deliberation, Organizational Memory and Evolution runtime specifications and reference implementations.
- Headless-core, Cognitive Interface Adapter and Cognitive Package specifications.
- Cognitive portability, package import/export, state migration, cognitive versioning and the initial cognitive-Git model.
- Adversarial and integration evaluations for each runtime stage.

### Changed

- Made Human Sovereignty enforceable at selected mutation boundaries rather than leaving it as a documentation principle alone.
- Extended the reference loop from evidence collection through deliberation, learning, evolution proposals and organizational memory.

## v0.3.0 — 2026-08-22

### Added
- Introduced **GO Society** as the intended first self-application reference instance for GO OS.
- Added an early deployable, open-source **GO Society Web** alpha surface under `/web`.
- Added Mission Cockpit, Intervention Center, Evidence Ledger, Evolution Missions and Capability Network.
- Added durable D1 organizational memory and authenticated write paths for Evidence, Exceptions and Evolution Proposals.
- Added `GO_SOCIETY_OPERATING_CHARTER_v0.1.md` defining the founding Human–Agent Cell, authority boundaries, initial missions and evolution rules.
- Published the first live GO Society runtime at https://go-society.angelo-pix.chatgpt.site.

### Changed
- Expanded GO OS from an open framework, Skill system and emerging protocol into a deployable reference-runtime surface; this did not establish complete-loop or production conformance.
- Added GO Society Web as the fourth canonical usage path.

## v0.2.2 — 2026-08-22

### Fixed
- Synchronized bilingual READMEs with the current repository structure and version.
- Added a clear organization-shift narrative and positioned GO OS as a framework for recursive self-evolving organizations.
- Added a concise Kurt Gödel introduction, organizational-metaphor disclaimer and Wikipedia reference.
- Added practical How to Use paths for Skills, framework adoption and machine-readable protocol use.
- Fixed `AuthorityGrant`: `self_expansion_allowed` is now required and constrained to `false`, closing the schema-level loophole around self-expanding authority.
- Marked legacy Principles and Skill Specification files as superseded instead of allowing competing normative sources.

### Added
- Canonical `GO_OS_CONSTITUTION_v0.2.2.md` as the single source of truth for the twelve constitutional principles.
- `SKILL_SPEC_v0.2.2.md` defining description-based discovery, concise runtime instructions, `CONTRACT.md`, routing and trigger/behavior evaluation requirements.

### Governance
- Normative principles now have an explicit canonical source rather than being independently duplicated across documents.

## v0.2.1 — 2026-08-22

### Fixed
- Added `description` to the YAML frontmatter of all nine `SKILL.md` files so Agent Skills runtimes can discover and trigger them before loading the skill body.
- Reworked descriptions around three trigger layers: explicit intent, problem intent, and latent structural signals.
- Added negative trigger boundaries to reduce false positives, including Go-language/OS-engineering ambiguity.

### Added
- `tests/trigger-evals-v0.2.1.yaml` with should-trigger, should-not-trigger, cross-skill confusion, anti-trigger, and GO-OS-is-unnecessary cases.

### Changed
- `go-os-core` now acts explicitly as a semantic gateway: it routes by the organizational object that must change rather than by keywords alone.
- Specialist skills now expose symptom-based discovery language in frontmatter.

## v0.2.0 — 2026-08-22

### Added
- Red-team review with 18 theoretical failure modes and 10 resulting design constraints.
- Machine-readable JSON Schemas for `MissionSpec`, `AuthorityGrant`, `EvidenceSpec`, and `ExceptionSpec`.
- YAML execution example.
- Cross-skill routing and common input/output contracts.
- Per-skill v0.2 contracts for all eight specialist skills.
- Adversarial, routing, falsification, authority, evidence, strategy, business, talent and diagnostic eval cases.

### Changed
- `go-os-core` upgraded to v0.2.0.
- Human Sovereignty now requires effective control, not ceremonial accountability.
- Machine Agency is explicitly bounded, revocable, observable and non-self-expanding.
- Reality is distinguished from evidence and metrics.
- Organizational Learning Rate is defined as evidence-correcting convergence rather than iteration frequency.
- Formalization now scales with consequence and reversibility.
- GO OS interventions must include disconfirming evidence and may conclude that GO OS is unnecessary for a domain.

## v0.1.1 — 2026-08-22

### Added
- Red-team self-review attacking GO OS across theoretical, governance, evidence, power, multi-agent and falsifiability failure modes.

## v0.1.0 — 2026-08-22

Initial public alpha.

- Open Framework
- Core principles and architecture
- Mother Skill + eight specialist Skills
- Initial evaluation prompts
- Bilingual README
- Public contribution and licensing structure
