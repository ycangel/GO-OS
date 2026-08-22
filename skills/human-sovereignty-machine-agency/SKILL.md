---
name: human-sovereignty-machine-agency
version: 0.1.0
framework: GO OS
status: public-alpha
language: multilingual
license: CC-BY-4.0
---

# Human Sovereignty & Machine Agency v0.1.0

## Purpose

Design a principled boundary between human sovereignty and machine agency. The goal is neither human micromanagement nor uncontrolled automation, but responsible autonomous action.

## Use when

Use for approval policies, autonomous agents, delegated decisions, AI governance, human-in-the-loop design, irreversible actions, resource commitments, or disputes over “what AI should be allowed to do.”

## Required inputs

- action or decision class;
- consequence owner;
- reversibility;
- downside magnitude;
- evidence quality;
- machine capability;
- monitoring quality;
- legal / safety constraints;
- resource limits.

## Operating model

### Human Sovereignty covers

- purpose;
- values;
- ultimate accountability;
- major or exceptional resource commitments;
- irreversible consequences;
- value conflicts;
- constitutional rules.

### Machine Agency covers, within authority

- planning;
- routine decisions;
- execution;
- coordination;
- monitoring;
- verification;
- retry and optimization;
- proposing changes.

## Procedure

### 1. Classify the action

Determine whether it is:

- reversible / recoverable;
- costly but reversible;
- hard to reverse;
- irreversible.

### 2. Quantify downside

Assess financial, operational, legal, safety, reputational and strategic downside.

### 3. Assess evidence

Is the agent acting on fresh, reliable, sufficiently complete evidence?

### 4. Assess capability

Use demonstrated performance, not assumed intelligence.

### 5. Define authority envelope

Specify:

- allowed decisions;
- resource ceiling;
- time horizon;
- forbidden actions;
- monitoring;
- escalation triggers;
- expiration / review.

### 6. Choose human involvement mode

Use one of four modes:

**H0 — Human constitutional ownership**  
Human defines purpose / rules but does not review normal execution.

**H1 — Human on exception**  
Agent acts autonomously; human is called only on predefined exceptions.

**H2 — Human before irreversible action**  
Agent prepares and recommends; human authorizes the irreversible step.

**H3 — Human-led judgment**  
Human leads because the decision is dominated by value conflict, legitimacy, novel ambiguity or unbounded downside.

### 7. Add evidence and auditability

Every high-impact autonomous decision should leave enough evidence to reconstruct what happened and why.

## Decision rules

Increase machine agency when capability, observability and reversibility rise.

Increase human involvement when irreversibility, value conflict, uncertainty or unbounded downside rise.

Do not use “AI made the decision” as an accountability model.

Do not require human approval merely because an action is performed by AI.

## Output contract

Return:

- action class;
- consequence owner;
- recommended human mode H0–H3;
- authority envelope;
- escalation conditions;
- audit evidence;
- review cadence;
- unresolved sovereignty questions.

## Failure / escalation conditions

If no legitimate consequence owner can be identified, do not recommend autonomous delegation of material decisions.

## Evaluation prompts

- “Can an AI agent hire a contractor without approval?”
- “Design spending authority for an autonomous procurement agent.”
- “When should a CEO still personally decide if AI is more accurate?”

## Version notes

v0.1.0 — Initial public alpha.
