---
name: mission-organizational-runtime
description: >
  Compile intent, goals or strategy into durable, autonomous and evidence-verifiable Missions. Use when goals are vague, work is expressed as task lists or OKRs without executable state transitions, agents lose context on long-horizon work, projects stall on coordination, actors repeatedly seek permission, or the user wants to turn intent into autonomous organizational execution. Also trigger when success criteria, authority, exception conditions or durable state are missing. Do not trigger for a simple one-off task that has clear instructions, low consequence and no need for organizational runtime semantics.
version: 0.2.1
framework: GO OS
status: public-alpha
language: multilingual
license: CC-BY-4.0
---

# Mission & Organizational Runtime v0.2.1

## Purpose
Compile intent into a durable Mission that humans and agents can execute autonomously and verify against reality.

## Required inputs
Purpose; desired outcome; current state; constraints; resources; actors/tools; horizon; risk tolerance.

## Mission model
A valid Mission defines purpose, desired state, current state, success evidence, constraints, authority, resources, risk envelope, accountable human, horizon, assumptions and mandatory exception/recompile triggers. Prefer schema-compatible `MissionSpec` plus linked `AuthorityGrant`.

## Procedure
1. Replace activity wording with observable state-transition wording.
2. Separate current-state facts, inferences, assumptions and unknowns.
3. Define observable desired state.
4. Define supporting and disconfirming evidence.
5. Grant enough bounded authority to avoid routine permission seeking.
6. Define constraints and forbidden moves.
7. Define pause, escalate and recompile triggers.
8. Allocate people, agents and tools by capability rather than title.
9. Preserve durable state, evidence and decisions across sessions/actor changes.
10. Close with evidence review, unresolved exceptions, learning, capability updates and next-mission recommendation.

## Decision rules
If success cannot be evidenced, the Mission is underspecified. If routine decisions require permission, authority is underspecified. If methods cannot change with reality, it is a workflow rather than a Mission. If no consequence owner exists, accountability is incomplete.

## Output contract
Provide schema-compatible MissionSpec, linked authority requirements, likely execution plan, actor allocation, evidence stream, exception table, completion logic and learning capture.

## Version notes
- v0.2.1 — Added discovery description and runtime symptom triggers.
- v0.1.0 — Initial public alpha.
