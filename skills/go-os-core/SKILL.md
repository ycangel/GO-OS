---
name: go-os-core
description: >
  Diagnose and redesign organizations for AI-native operation using GO OS. Use whenever the user discusses AI-native organizations, AI transformation, organizational redesign, management systems, human-AI collaboration, agent autonomy, decision rights, organizational learning, adaptive strategy, AI-native business models, future human roles, or how a company should operate when agents perform substantial knowledge work. Also trigger on latent symptoms such as too many approvals, managers becoming coordination bottlenecks, agents unable to act autonomously, repeated organizational mistakes, slow feedback loops, stale strategy, or AI tools improving individual productivity without changing the operating model. Do not trigger for narrow Go programming, operating-system engineering, or technical questions with no meaningful organization, agency, strategy, learning, or business-design dimension.
version: 0.5.0
framework: GO OS
status: public-alpha
language: multilingual
license: CC-BY-4.0
---

# GO OS Core v0.5.0

## Purpose
Use GO OS as the semantic gateway and operating model for AI-native organization problems. Diagnose the correct layer, preserve effective Human Sovereignty, expand bounded Machine Agency, make organizational action falsifiable, and route to the relevant specialist skill. GO OS itself is a hypothesis; do not force it where its structure adds more coordination cost than learning or outcome value.

## Trigger model
Trigger on three levels: **explicit intent** (AI-native organization, agent governance, organizational learning), **problem intent** (approval congestion, management overload, slow adaptation, repeated mistakes), and **latent structural signals** (humans acting as routers between agents, autonomous systems without clear authority, dashboards that do not change action). Route by the organizational object that must change, not by keyword alone.

## Input contract
Collect or infer without inventing: purpose/desired outcome; current state; relevant actors and accountable human; decision/resource rights; available evidence and quality; constraints, material risks and reversibility; assumptions and unknowns. Separate facts, inferences, assumptions and unknowns.

## Constitutional principles
1. Human Sovereignty: humans own purpose, value arbitration, legitimate authority, major resource commitments and responsibility for irreversible consequences.
2. Effective control: sovereignty requires observability, comprehension and intervention rights.
3. Machine Agency: machines plan and act autonomously inside explicit, bounded, revocable authority.
4. No self-expansion: an agent cannot expand its own authority or remove constitutional human control.
5. Reality as Final Arbiter: models and metrics are representations; evidence remains challengeable.
6. Mission over Task: optimize desired state transitions, not activity volume.
7. Progressive formalization: governance rigor scales with consequence and irreversibility.
8. Exceptions are first-class: recurrence triggers structural learning.
9. Learning means convergence: speed without evidence-correcting convergence is thrashing.
10. Self-revision is bounded: operational rules may evolve faster than constitutional rules.
11. Aggregate exposure matters: govern multi-agent systems at system level.
12. GO OS is falsifiable: every intervention states evidence that would show it is wrong.

## Core runtime
`Purpose → Mission + Authority → Action → Reality → Evidence → CognitiveEvent → DeliberationSession → LearningRecord → EvolutionProposal → CognitiveCommit → CognitiveVersion → Updated Organization`

The frozen v0.5 runtime core is `Mission`, `AuthorityGrant`, `Evidence`, `CognitiveEvent`, `DeliberationSession`, `LearningRecord`, `EvolutionProposal`, and `CognitiveVersion`. `Exception` and `CognitiveCommit` are supporting objects. Canonical v0.5 schemas and legacy aliases live in [`/schemas`](../../schemas/README.md).

An `EvolutionProposal` is a candidate, not permission to change the organization. Preserve the named human decision owner and apply changes only through an explicit authority path. A schema contract is normative for interoperability; its presence does not prove runtime implementation or evaluation success.

## Routing
- structure / coordination / operating model → `ai-native-organization-design`
- decision rights / autonomy / approval / consequence ownership → `human-sovereignty-machine-agency`
- intent → autonomous verifiable execution → `mission-organizational-runtime`
- feedback latency / evidence quality / repeated mistakes → `reality-loop-organizational-learning`
- strategic uncertainty / hypothesis portfolio / adaptation → `vision-driven-strategy`
- moat / economics / self-reinforcing value loops → `intelligent-compounding-ai-native-business`
- human roles / development / evaluation → `ai-native-talent-human-value`
- whole-organization maturity / transformation priorities → `ai-native-organization-diagnostic`

## Procedure
1. Orient: distinguish facts, inferences, assumptions and unknowns.
2. Find the real object: Mission, AuthorityGrant, Evidence, CognitiveEvent, DeliberationSession, LearningRecord, EvolutionProposal or CognitiveVersion; use supporting domain objects such as Exception and Capability where needed.
3. Test whether GO OS is useful.
4. Protect sovereignty and effective control.
5. Expand agency inside verified operating envelopes.
6. Bound per-action and aggregate exposure.
7. Define supporting and disconfirming reality tests.
8. Handle exceptions and convert recurrence into learning.
9. Update memory/capability with versioning and evaluation.
10. Recompile the next mission, authority, policy, capability, structure or strategy.

## Progressive formalization
- Low consequence + reversible: minimal structure and safe inferred defaults, with a named accountable human.
- Medium consequence: explicit `Mission` + `AuthorityGrant` + `Evidence` contracts.
- High/critical or irreversible: add explicit Exception handling, structured deliberation, and required human ratification before organizational change.

## Output contract
Return: GO OS diagnosis; target state; human sovereignty boundary; machine agency design; affected runtime objects; supporting reality test; disconfirming evidence; next learning loop.

## Evaluation
Pass only if the response identifies the correct primary layer, distinguishes sovereignty from approval volume, distinguishes metrics from reality, bounds aggregate autonomy, includes disconfirming evidence, avoids maturity theater, and can say “GO OS is unnecessary here.”

Trigger and behavioral evals live in `/tests`.

## Version notes
- v0.5.0 — Aligned the gateway with the frozen eight-object cognitive runtime, canonical v0.5 schemas, candidate-only evolution proposals, and explicit implementation/evaluation boundaries.
- v0.2.1 — Added frontmatter discovery description and three-layer semantic triggering.
- v0.2.0 — Red-team hardened; explicit contracts, falsifiability, progressive formalization, schema interface and cross-skill routing.
- v0.1.0 — Initial public alpha.
