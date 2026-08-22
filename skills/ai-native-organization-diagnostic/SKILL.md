---
name: ai-native-organization-diagnostic
version: 0.1.0
framework: GO OS
status: public-alpha
language: multilingual
license: CC-BY-4.0
---

# AI-Native Organization Diagnostic v0.1.0

## Purpose

Assess an organization’s AI-native maturity, identify the dominant constraint, and propose the smallest high-leverage transformation toward responsible machine agency and faster organizational learning.

## Use when

Use for whole-organization diagnosis, transformation planning, AI adoption reviews, maturity assessments, executive workshops and before/after comparisons.

## Required inputs

At minimum:

- organization purpose;
- recurring work / missions;
- current AI use;
- decision and approval structure;
- feedback loops;
- knowledge / memory systems;
- major bottlenecks;
- risk boundaries.

If inputs are sparse, score with confidence bands and explicitly list missing evidence.

## Diagnostic dimensions

Score each dimension from 0–5.

### D1 — Mission Native
0: work is primarily assigned as tasks.  
5: desired states, evidence, constraints and authority are explicit.

### D2 — Machine Agency
0: AI only drafts / advises.  
5: agents execute long-horizon missions within governed authority.

### D3 — Human Sovereignty Clarity
0: responsibility is ambiguous.  
5: purpose, consequence ownership and irreversible gates are explicit.

### D4 — Authority Design
0: nearly everything requires ad hoc approval.  
5: bounded authority enables autonomous normal operation with exception escalation.

### D5 — Reality Loop Closure
0: feedback is slow and indirect.  
5: high-fidelity evidence rapidly changes action.

### D6 — Evidence Quality
0: decisions rely mostly on opinion / stale reports.  
5: provenance, freshness, uncertainty and contradiction are visible.

### D7 — Organizational Memory
0: learning lives in people and chats.  
5: mission history, decisions, evidence, skills and exceptions reliably improve future work.

### D8 — Capability Compounding
0: every problem is solved from scratch.  
5: execution systematically creates reusable human / machine capabilities.

### D9 — Strategy Runtime
0: fixed periodic planning dominates.  
5: strategy operates as falsifiable hypotheses updated by evidence under a stable vision.

### D10 — Self-Revision
0: structure and rules are rarely questioned.  
5: the system can propose and safely implement governed changes to its own operating model.

## Maturity bands

- **0.0–0.9: Level 0 — Tool Augmentation**
- **1.0–1.9: Level 1 — Workflow Automation**
- **2.0–2.9: Level 2 — Agentic Execution**
- **3.0–3.9: Level 3 — Mission Runtime**
- **4.0–4.5: Level 4 — Organizational Learning**
- **4.6–5.0: Level 5 — Self-Revision**

The mean score is descriptive, not definitive. The lowest high-leverage dimension may matter more than the average.

## Procedure

### 1. Gather evidence

For each dimension, request examples, not slogans.

### 2. Score with confidence

For each score provide:

- score;
- confidence: low / medium / high;
- evidence;
- missing evidence.

### 3. Identify the constraint

Ask which weak dimension prevents progress elsewhere.

Examples:

- no explicit authority → agents cannot gain autonomy;
- weak evidence → autonomy creates risk;
- poor memory → learning does not compound;
- unclear purpose → automation optimizes the wrong thing.

### 4. Select transformation wedge

Choose one recurring mission with high learning value and bounded downside.

### 5. Design target state

Specify the desired change in Mission, Authority, Evidence, Exception, Capability and Memory.

### 6. Define 30/60/90-day evidence

Use evidence of changed organizational behavior, not adoption vanity metrics.

## Decision rules

- AI usage rate is not an AI-native maturity score.
- Number of agents is not a maturity score.
- Automation without authority redesign usually stalls below Mission Runtime.
- High autonomy without evidence and sovereignty is not maturity; it is unmanaged risk.

## Output contract

Return:

1. maturity level;
2. 10-dimension scorecard with confidence;
3. dominant constraint;
4. highest-leverage mission wedge;
5. target operating model;
6. 30/60/90-day transformation steps;
7. evidence of progress;
8. risks and human sovereignty gates.

## Failure / escalation conditions

Do not present low-confidence scoring as objective measurement. State uncertainty prominently.

## Evaluation prompts

- “We have copilots in every team but approvals are unchanged. Diagnose us.”
- “Give us an AI-native maturity assessment from this operating model.”
- “What is the smallest organizational change that would unlock more agent autonomy?”

## Version notes

v0.1.0 — Initial public alpha.
