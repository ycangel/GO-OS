---
name: go-os-core
version: 0.2.0
framework: GO OS
status: public-alpha
language: multilingual
license: CC-BY-4.0
---

# GO OS Core v0.2.0

## Purpose

Use GO OS as an operating model for AI-native organization problems. Diagnose the correct layer, preserve effective Human Sovereignty, expand bounded Machine Agency, make organizational action falsifiable, and route to the relevant specialist skill.

GO OS itself is a hypothesis. Do not force it onto a domain where its structure adds more coordination cost than learning or outcome value.

## Trigger

Use when the problem concerns AI-native organization design, human–machine authority, agent autonomy, mission-oriented execution, organizational learning, adaptive strategy, AI-native business compounding, human roles, or organization-wide AI-native maturity.

Do not use for narrow technical questions without a meaningful organization, agency, strategy, learning, or business-design dimension.

## Input contract

Collect or infer without inventing:

- purpose / desired outcome;
- current state;
- relevant actors and accountable human;
- current decision and resource rights;
- available evidence and its quality;
- constraints, material risks and reversibility;
- assumptions and material unknowns.

Separate facts, inferences, assumptions and unknowns. Ask only when missing information would materially change the decision.

## Constitutional principles

1. **Human Sovereignty** — humans own purpose, value arbitration, legitimate authority, major resource commitments and responsibility for irreversible consequences.
2. **Effective control** — sovereignty is invalid if the accountable human lacks observability, comprehension or intervention rights.
3. **Machine Agency** — machines plan and act autonomously inside explicit, bounded, revocable authority.
4. **No self-expansion** — an agent cannot autonomously expand its own authority or remove constitutional human control.
5. **Reality as Final Arbiter** — models and metrics are representations; evidence must remain challengeable.
6. **Mission over Task** — optimize desired state transitions, not activity volume.
7. **Progressive formalization** — governance rigor scales with consequence and irreversibility.
8. **Exceptions are first-class** — recurrence must trigger structural learning, not endless escalation.
9. **Learning means convergence** — iteration speed without evidence-correcting convergence is thrashing.
10. **Self-revision is bounded** — operational rules may evolve faster than constitutional rules.
11. **Aggregate exposure matters** — multi-agent systems are governed at system level, not only per action.
12. **GO OS is falsifiable** — every intervention states evidence that would show it is wrong.

## Core runtime

`Purpose → Mission → Authority → Action → Reality → Evidence → Learning → Adaptation`

### Core machine-readable objects

- `MissionSpec` — desired state transition, purpose, accountable human, evidence, constraints and recompile conditions.
- `AuthorityGrant` — grantor, grantee, allowed/prohibited actions, resource and aggregate limits, evidence obligations, expiry/revocation and escalation.
- `EvidenceSpec` — observation, provenance, freshness, fidelity, confidence, contradictions and decision impact.
- `ExceptionSpec` — out-of-envelope condition, severity, authority status, containment, disposition, recurrence and learning target.

Schemas live in `/schemas`.

## Routing

Choose one primary skill by the object that must change:

- structure / coordination / operating model → `ai-native-organization-design`
- decision rights / autonomy / approval / consequence ownership → `human-sovereignty-machine-agency`
- intent → autonomous verifiable execution → `mission-organizational-runtime`
- feedback latency / evidence quality / repeated mistakes → `reality-loop-organizational-learning`
- strategic uncertainty / hypothesis portfolio / adaptation → `vision-driven-strategy`
- moat / economics / self-reinforcing value loops → `intelligent-compounding-ai-native-business`
- human roles / development / evaluation → `ai-native-talent-human-value`
- whole-organization maturity / transformation priorities → `ai-native-organization-diagnostic`

See `/docs/SKILL_ROUTING_AND_CONTRACTS_v0.2.0.md` for cross-skill contracts.

## Procedure

1. **Orient** — distinguish facts, inferences, assumptions and unknowns.
2. **Find the real object** — Mission, Authority, State, Evidence, Exception, Capability or Organizational Memory.
3. **Test whether GO OS is useful** — do not add formalism where it creates no meaningful value.
4. **Protect sovereignty** — identify consequence owner, constitutional boundary, reversibility and effective-control requirements.
5. **Expand agency** — remove unnecessary human routing inside a verified operating envelope.
6. **Bound exposure** — define per-action and aggregate limits, especially across multiple agents.
7. **Define reality tests** — specify supporting and disconfirming evidence; never equate a single metric with reality.
8. **Handle exceptions** — contain immediate risk; convert recurrence into structural learning.
9. **Update memory/capability** — version, evaluate, supersede or retire what the organization learned.
10. **Recompile** — change the next mission, authority, capability, policy, structure or strategy when evidence warrants it.

## Progressive formalization

- Low consequence + reversible: minimal structure and safe inferred defaults.
- Medium consequence: explicit `MissionSpec` + `AuthorityGrant`.
- High/critical or irreversible: explicit `MissionSpec` + `AuthorityGrant` + `EvidenceSpec` + `ExceptionSpec` and human ratification.

## Output contract

1. **GO OS diagnosis** — primary failing layer/object.
2. **Target state** — intended organizational state transition.
3. **Human sovereignty boundary** — accountable human and non-delegable decisions.
4. **Machine agency design** — autonomy, limits, revocation and escalation.
5. **Runtime objects** — affected Mission / Authority / State / Evidence / Exception / Capability / Memory; emit schema-compatible drafts when execution is requested.
6. **Reality test** — evidence supporting the design.
7. **Disconfirming evidence** — what would show the design is wrong.
8. **Next loop** — how execution updates future behavior.

## Evaluation

Pass only if the response:

- identifies the correct primary layer;
- does not confuse sovereignty with approval volume;
- does not confuse metrics with reality;
- bounds aggregate autonomy;
- includes disconfirming evidence;
- does not optimize maturity level for its own sake;
- can say “GO OS is unnecessary here.”

Adversarial cases: `/tests/eval-cases-v0.2.0.yaml`.

## Version notes

- v0.2.0 — Red-team hardened; explicit contracts, falsifiability, progressive formalization, schema interface and cross-skill routing.
- v0.1.0 — Initial public alpha.
