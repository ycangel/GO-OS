---
name: mission-organizational-runtime
version: 0.1.0
framework: GO OS
status: public-alpha
language: multilingual
license: CC-BY-4.0
---

# Mission & Organizational Runtime v0.1.0

## Purpose

Compile intent into a durable Mission that humans and agents can execute autonomously and verify against reality.

## Use when

Use when goals are vague, teams rely on task assignment, agents need long-horizon work, projects stall on coordination, or users want to turn strategy into executable organizational behavior.

## Required inputs

- purpose;
- desired outcome;
- current state;
- constraints;
- available resources;
- actors / tools;
- time horizon;
- risk tolerance.

## Mission schema

A valid Mission should define:

1. purpose;
2. desired state;
3. current state;
4. success evidence;
5. constraints;
6. authority;
7. resources;
8. risk envelope;
9. owner of consequence;
10. horizon;
11. known assumptions;
12. mandatory exception triggers.

## Procedure

### 1. Replace activity wording with state wording

Weak: “conduct 20 customer interviews.”  
Stronger: “reduce uncertainty about the top three causes of customer churn enough to select one intervention.”

### 2. Define current state

Separate facts, inferences, assumptions and unknowns.

### 3. Define desired state

Make it observable and outcome-based.

### 4. Define evidence of success

Ask: what would reality have to show for us to say the mission succeeded?

### 5. Define authority

Grant enough action space to achieve the mission without repeated permission seeking.

### 6. Define constraints and forbidden moves

Constraints include law, safety, budget, brand, timing, privacy and strategic commitments.

### 7. Define exception triggers

State exactly when the runtime must pause, escalate or recompile the mission.

### 8. Allocate actors dynamically

Choose people, agents, tools or hybrids by capability rather than organizational title.

### 9. Run durable state

A long mission must preserve state, evidence and decisions across sessions and actor changes.

### 10. Close and learn

Mission closure requires:

- evidence review;
- unresolved exceptions;
- learning captured;
- capability updates;
- next mission recommendation.

## Decision rules

- If success cannot be evidenced, the mission is underspecified.
- If the actor must seek permission for routine decisions, authority is underspecified.
- If methods are fixed despite changing reality, the object is a workflow, not a Mission.
- If a mission has no consequence owner, accountability is incomplete.

## Output contract

Provide a `MissionSpec` with all twelve fields, plus:

- likely execution plan;
- actor allocation;
- evidence stream;
- exception table;
- completion logic;
- learning capture.

## Failure / escalation conditions

Do not manufacture success criteria when the user’s purpose is genuinely ambiguous. Surface the ambiguity.

## Evaluation prompts

- “Turn ‘improve product quality’ into a GO OS mission.”
- “Our agent gets lost after three days. Redesign the mission runtime.”
- “Convert this OKR into a mission with authority and evidence.”

## Version notes

v0.1.0 — Initial public alpha.
