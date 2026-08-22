---
name: reality-loop-organizational-learning
description: >
  Diagnose and improve how an organization converts real-world outcomes into better future action. Use for slow feedback, repeated mistakes, siloed learning, delayed customer or operational signals, weak postmortems, stale dashboards, data-rich but insight-poor teams, recurring exceptions, or questions about organizational learning and self-improvement. Also trigger when evidence reaches people but nobody has authority to act, lessons are documented but behavior does not change, or the same firefighting repeats. Do not trigger for ordinary data analysis unless the problem is specifically about closing an organizational action-learning loop.
version: 0.2.1
framework: GO OS
status: public-alpha
language: multilingual
license: CC-BY-4.0
---

# Reality Loop & Organizational Learning v0.2.1

## Purpose
Increase the speed, fidelity and compounding value of the loop from action to real-world evidence to improved future action.

## Core model
`Action → Reality → Observation → Evidence → Belief Update → Decision → New Action`
A loop is closed only if evidence changes future behavior.

## Required inputs
Decision/action; expected outcome; observable signals; feedback path/latency; decision cadence; repeated exceptions; current memory/learning practices.

## Procedure
1. Map where reality is generated, observed, interpreted and acted upon.
2. Decompose detection, transmission, interpretation, decision and execution latency.
3. Assess evidence provenance, freshness, fidelity, representativeness and contradictions.
4. Find closure breaks: evidence not reaching authority, no belief update, postmortems not becoming capability, normalized recurring exceptions.
5. Move sensing closer to reality.
6. Move bounded authority closer to reliable evidence.
7. Convert recurrence: `exception → pattern → hypothesis → solution → test → reusable capability/policy/design`.
8. Estimate Organizational Learning Rate using cycle time, evidence quality, correction rate, repeated-error rate, capability reuse and belief-update discipline.
9. Optimize evidence-correcting convergence, not raw iteration speed.

## Decision rules
More data is not more learning. A dashboard without authority is observation, not a closed loop. A postmortem without changed capability is documentation, not organizational learning. Repeated firefighting signals missing capability or bad system design.

## Output contract
Return reality-loop map; latency breakdown; evidence-quality assessment; closure breaks; top interventions; OLR indicators; capability/memory changes; supporting and disconfirming reality tests.

## Version notes
- v0.2.1 — Added discovery description and closure-break triggers.
- v0.1.0 — Initial public alpha.
