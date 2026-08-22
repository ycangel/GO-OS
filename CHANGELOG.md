# Changelog

All notable changes to GO OS are documented here.

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

## v0.1.0 — 2026-08-22

Initial public alpha.

- Open Framework
- Core principles and architecture
- Mother Skill + eight specialist Skills
- Initial evaluation prompts
- Bilingual README
- Public contribution and licensing structure
