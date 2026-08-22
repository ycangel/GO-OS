---
name: human-sovereignty-machine-agency
description: >
  Design boundaries between human sovereignty and machine agency. Use for agent permissions, approval bottlenecks, delegated decisions, spending or resource authority, human-in-the-loop/on-the-loop design, irreversible actions, accountability, escalation, AI governance, or questions about what AI should be allowed to do. Also trigger when every AI action still needs a manager, nobody clearly owns consequences, agents are either over-controlled or dangerously unconstrained, or a team confuses accountability with manual approval. Do not trigger for general AI ethics discussion with no concrete organizational decision-rights or consequence-ownership problem.
version: 0.2.1
framework: GO OS
status: public-alpha
language: multilingual
license: CC-BY-4.0
---

# Human Sovereignty & Machine Agency v0.2.1

## Purpose
Design a principled boundary between human sovereignty and machine agency: neither human micromanagement nor uncontrolled automation, but responsible autonomous action.

## Required inputs
Action/decision class; consequence owner; reversibility; downside magnitude; evidence quality; demonstrated machine capability; monitoring quality; legal/safety constraints; resource and aggregate exposure limits.

## Operating model
**Human Sovereignty:** purpose, values, ultimate accountability, major/exceptional resource commitments, irreversible consequences, value conflicts, constitutional rules.

**Machine Agency within authority:** planning, routine decisions, execution, coordination, monitoring, verification, retry/optimization and proposing changes.

## Procedure
1. Classify reversibility: reversible, costly-but-reversible, hard-to-reverse, irreversible.
2. Assess financial, operational, legal, safety, reputational and strategic downside.
3. Assess evidence freshness, reliability and completeness.
4. Assess demonstrated capability, not assumed intelligence.
5. Define an `AuthorityGrant`: allowed/prohibited actions, resource ceiling, aggregate exposure, time horizon, monitoring, escalation, expiry and revocation.
6. Choose human involvement: **H0 constitutional ownership**, **H1 on exception**, **H2 before irreversible action**, **H3 human-led judgment**.
7. Require sufficient independent/auditable evidence for material autonomous decisions.

## Decision rules
Increase machine agency as capability, observability and reversibility rise. Increase human involvement as irreversibility, value conflict, uncertainty or unbounded downside rise. Never use “AI made the decision” as accountability. Do not require approval merely because AI performs the action. Agents may not expand their own authority.

## Output contract
Return action class; consequence owner; H0–H3 mode; authority envelope; aggregate limits; escalation/revocation conditions; audit evidence; review cadence; unresolved sovereignty questions.

## Failure / escalation
If no legitimate consequence owner exists, do not recommend autonomous delegation of material decisions.

## Version notes
- v0.2.1 — Added discovery description and latent trigger semantics.
- v0.1.0 — Initial public alpha.
