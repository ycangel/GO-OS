# GO OS Skill Specification v0.2.2

A GO OS Skill is a reusable, testable reasoning-and-action contract for an AI system. This specification supersedes `SKILL_SPEC_v0.1.0.md`.

## 1. Discovery layer: frontmatter

Every `SKILL.md` must begin with YAML frontmatter containing at minimum:

```yaml
---
name: <skill-name>
description: >
  What the skill does, when it should trigger, real-world problem signals,
  latent structural signals, and important negative boundaries.
version: <semver>
framework: GO OS
status: public-alpha
language: multilingual
license: CC-BY-4.0
---
```

`description` is part of the execution interface, not marketing copy. It should cover:

- explicit intent;
- problem intent expressed in ordinary language;
- latent structural signals;
- anti-triggers / negative boundaries;
- neighboring-skill distinctions where confusion is likely.

## 2. Runtime layer: concise SKILL.md

The body should be concise enough for efficient loading and contain the operational knowledge needed after activation. Prefer:

1. Purpose
2. Core model or principles
3. Procedure / decision rules
4. Output contract
5. Failure / escalation rules
6. Routing references where needed
7. Version notes

Do not duplicate triggering logic extensively in the body when it already exists in frontmatter.

## 3. Contract layer: CONTRACT.md

Each specialist skill should include a `CONTRACT.md` defining:

- trigger boundary;
- minimum inputs;
- required outputs;
- validity / falsification tests;
- escalation conditions;
- handoff rules to neighboring skills;
- evaluation expectations.

The contract is normative for interoperability; explanatory prose in `SKILL.md` should not contradict it.

## 4. Common GO OS behavior requirements

A skill should:

- distinguish facts, inferences, assumptions and unknowns;
- avoid inventing organizational facts;
- prefer Mission and state transitions over activity volume;
- identify Authority and accountable humans;
- separate reversible from irreversible actions;
- define supporting and disconfirming evidence;
- treat recurring Exceptions as structural signals;
- preserve effective Human Sovereignty;
- expand bounded Machine Agency where justified;
- consider aggregate exposure in multi-agent systems;
- prefer progressive formalization over universal bureaucracy;
- allow the conclusion that GO OS is unnecessary.

## 5. Routing

Route by the organizational object that must change, not by surface keywords. The canonical routing guidance is `SKILL_ROUTING_AND_CONTRACTS_v0.2.0.md` until replaced by a newer version.

The `go-os-core` skill acts as the semantic gateway when the user presents a cross-layer or latent organizational problem.

## 6. Evaluation

Every skill should have both:

### Trigger evaluation
- `should_trigger`
- `should_not_trigger`
- cross-skill confusion cases
- anti-trigger cases

### Behavior evaluation
- required detections
- forbidden conclusions
- output-contract checks
- authority / sovereignty checks
- evidence and falsifiability checks

Evaluation cases belong under `/tests` and should be machine-readable where practical.

## 7. Compatibility

Skills should remain usable across multiple Agent Skills-compatible runtimes. Avoid unnecessary dependence on proprietary tool names. Runtime-specific adapters should live outside the conceptual core.

## 8. Source of truth

The constitutional source of truth is `GO_OS_CONSTITUTION_v0.2.2.md`. A Skill may summarize the Constitution, but must not silently create a competing constitutional rule set.
