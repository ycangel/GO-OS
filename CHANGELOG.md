# Changelog

All notable changes to GO OS are documented here.

## v0.3.0 — 2026-08-22

### Added
- Established **GO Society** as the self-evolving organization behind GO OS and its first living reference implementation.
- Added the deployable, open-source **GO Society Web** runtime under `/web`.
- Added Mission Cockpit, Intervention Center, Evidence Ledger, Evolution Missions and Capability Network.
- Added durable D1 organizational memory and authenticated write paths for Evidence, Exceptions and Evolution Proposals.
- Added `GO_SOCIETY_OPERATING_CHARTER_v0.1.md` defining the founding Human–Agent Cell, authority boundaries, initial missions and evolution rules.
- Published the first live GO Society runtime at https://go-society.angelo-pix.chatgpt.site.

### Changed
- Expanded GO OS from an open framework, skill system and emerging protocol into a usable and deployable software runtime.
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
