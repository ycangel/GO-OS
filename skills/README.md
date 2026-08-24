# GO OS Skills

This directory contains the GO OS semantic gateway, one bounded GO Society
conversation adapter and eight specialist Skills. The canonical v0.5 release
inventory is [`manifest-v0.5.0.yaml`](manifest-v0.5.0.yaml).

## Version policy

The repository release and Skill component versions are separate:

- GO OS repository release: **0.5.0 Foundation Release** (**奠基版本** in
  Chinese; this does not imply a legal foundation entity).
- Each Skill retains its own semantic version until its executable contract
  changes.
- `go-os-core` is version 0.5.0 because its runtime-object model and cognitive
  loop changed for the v0.5 architecture.
- `go-society-cognitive-bridge` begins at version 0.1.0 because it is a new,
  independently versioned conversation-side adapter contract. It reads compact
  ratified context and stages consent-bound candidates; it cannot ratify or
  advance the organizational cognitive head.
- Specialist Skills remain at 0.2.1 and their contracts at 0.2.0. The manifest
  records their reviewed compatibility with GO OS 0.5.x; it does not rewrite
  their history.

All Skills remain `public-alpha`. Compatibility means their terminology and
boundaries were reviewed against v0.5; it is not evidence of production runtime
conformance or business outcomes.

## Inventory

| Role | Skill | Component version | Contract |
|---|---|---:|---|
| Gateway | [`go-os-core`](go-os-core/SKILL.md) | 0.5.0 | Embedded in Skill |
| Conversation adapter | [`go-society-cognitive-bridge`](go-society-cognitive-bridge/SKILL.md) | 0.1.0 | [v0.1.0](go-society-cognitive-bridge/CONTRACT.md) |
| Specialist | [`ai-native-organization-design`](ai-native-organization-design/SKILL.md) | 0.2.1 | [`v0.2.0`](ai-native-organization-design/CONTRACT.md) |
| Specialist | [`human-sovereignty-machine-agency`](human-sovereignty-machine-agency/SKILL.md) | 0.2.1 | [`v0.2.0`](human-sovereignty-machine-agency/CONTRACT.md) |
| Specialist | [`mission-organizational-runtime`](mission-organizational-runtime/SKILL.md) | 0.2.1 | [`v0.2.0`](mission-organizational-runtime/CONTRACT.md) |
| Specialist | [`reality-loop-organizational-learning`](reality-loop-organizational-learning/SKILL.md) | 0.2.1 | [`v0.2.0`](reality-loop-organizational-learning/CONTRACT.md) |
| Specialist | [`vision-driven-strategy`](vision-driven-strategy/SKILL.md) | 0.2.1 | [`v0.2.0`](vision-driven-strategy/CONTRACT.md) |
| Specialist | [`intelligent-compounding-ai-native-business`](intelligent-compounding-ai-native-business/SKILL.md) | 0.2.1 | [`v0.2.0`](intelligent-compounding-ai-native-business/CONTRACT.md) |
| Specialist | [`ai-native-talent-human-value`](ai-native-talent-human-value/SKILL.md) | 0.2.1 | [`v0.2.0`](ai-native-talent-human-value/CONTRACT.md) |
| Specialist | [`ai-native-organization-diagnostic`](ai-native-organization-diagnostic/SKILL.md) | 0.2.1 | [`v0.2.0`](ai-native-organization-diagnostic/CONTRACT.md) |

## Governance boundary

Skills generate diagnoses, contracts, and change candidates. They do not
inherit organizational authority. `EvolutionProposal` outputs remain
candidate-only until reviewed and applied through an authorized decision path.
Humans retain purpose, value judgment, approval where required, and
responsibility for consequences.

The Cognitive Bridge adapter adds a stricter capture boundary: it may stage
only material the user explicitly selected and confirmed for internal-only
processing. A Narrative Anchor preserves expression and provenance; it is not
Reality Evidence. Staging and requesting review do not ratify, commit, publish
or advance a cognitive head. Those decisions remain in the GO Society Web
Human Gate.

## Conversation connection

The canonical behavior contract is
[`go-society-cognitive-bridge/SKILL.md`](go-society-cognitive-bridge/SKILL.md).
An actual ChatGPT/Codex conversation also needs an authenticated MCP connection
to the deployed GO Society instance. Its published endpoint and OAuth resource
are deployment outputs and are intentionally not hard-coded in this public
repository. See the
[`Cognitive Bridge v0.5 Alpha`](../docs/COGNITIVE_BRIDGE_v0.5_ALPHA.md)
for the connection and acceptance boundary.

## Evaluation

Trigger and behavioral vectors are indexed in [`../tests/README.md`](../tests/README.md).
Those YAML files are declarative vectors. A vector is not a claim that a model,
Skill, or runtime passed it.
