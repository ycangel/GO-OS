# GO OS v0.5 Quick Start

GO OS becomes useful when it is applied to one real, bounded mission. Do not
start by redesigning an entire company or by granting an agent broad autonomy.

This guide creates the smallest GO loop that can produce evidence in days, not
an organization-wide transformation promise.

## 1. Choose a bounded mission

Pick a recurring operating problem with:

- one named human owner;
- an observable outcome;
- a short review horizon;
- actions that are reversible or cheaply contained;
- evidence available from reality; and
- a clear stop or escalation condition.

Good first missions include reducing a known handoff delay, testing one demand
hypothesis, improving one quality-control decision or shortening one recurring
review loop. Safety-critical, irreversible, legally sensitive and high-capital
decisions are poor first experiments.

## 2. Write the mission contract

Copy the v0.5
[`cognitive-loop-v0.5.0.yaml`](../schemas/examples/cognitive-loop-v0.5.0.yaml)
reference and replace its sample values. At minimum, make these explicit:

```yaml
mission:
  id: mission-example-001
  version: 0.5.0
  purpose: "The human reason this mission exists"
  current_state: "The observed baseline and uncertainty"
  desired_state: "A reality-observable outcome"
  accountable_human: "A named human owner"
  authority_ref: authority-example-001
  success_evidence_refs: [evidence-supporting-001]
  disconfirming_evidence_refs: [evidence-disconfirming-001]
  reversibility: reversible
  risk_class: low
  status: draft
```

The example's component version follows the v0.5 `Mission` schema. It does not
need to equal the GO OS repository release.

## 3. Bound authority before action

Create an `AuthorityGrant` using
[`schemas/v0.5/authority-grant.schema.json`](../schemas/v0.5/authority-grant.schema.json).
Record:

- the grantor and grantee;
- allowed and prohibited actions;
- resource, tool, time and risk limits;
- the reversibility ceiling;
- expiry and revocation conditions; and
- `self_expansion_allowed: false`.

Authentication answers *who is acting*. Authority answers *whether that actor
may change this organizational state*. A capable agent without a valid grant is
still unauthorized.

## 4. Define evidence and disconfirmation

Before acting, write down:

- the current belief or hypothesis;
- the baseline;
- the predicted result and review date;
- the source and provenance of each observation;
- at least one disconfirming signal; and
- what decision each possible result would change.

Use [`schemas/v0.5/evidence.schema.json`](../schemas/v0.5/evidence.schema.json)
for evidence records. A metric is not automatically evidence, and evidence is
not reality itself; it is a traceable observation of reality with limitations.

## 5. Run one reversible cycle

```text
Purpose
→ Mission + Authority
→ Bounded Action
→ Reality
→ Evidence / Exception
→ Cognitive Event
→ Deliberation Session
→ Learning Record
→ Evolution Proposal
→ Human Decision
→ Cognitive Commit
→ Cognitive Version / Updated Organizational State
```

If the authorized human decides that organizational state should not change,
record a **no-change closure** that links the event, evidence, deliberation,
decision owner, rationale, unresolved uncertainty and next review date. Do not
invent an empty commit merely to make the diagram appear complete.

Stop and escalate if the action exceeds its grant, the evidence is not
traceable, an irreversible consequence appears, or the named human owner cannot
review the result.

## 6. Record learning without overstating it

A completed task is not automatically organizational learning. Record:

- what changed in the organization's understanding;
- which evidence caused the change;
- plausible alternative explanations;
- what remains uncertain;
- the human owner of the decision; and
- whether a policy, capability, authority boundary or mission should change.

Changes to organizational state should be proposals until the required human
authority approves them.

## 7. Use the Skills

Begin with [`skills/go-os-core/SKILL.md`](../skills/go-os-core/SKILL.md). It is
the semantic gateway and will route the problem to a specialist Skill. Treat
all AI output as a candidate for human judgment, not as organizational
authorization.

## 8. Explore the reference Web application

The [`web/`](../web) directory is a reference application for GO Society. It
demonstrates selected mission, evidence, exception, authority and evolution
surfaces; it is not the complete eight-object runtime or a production
certification.

With Node.js 22.13 or newer:

```bash
cd web
npm ci
npm test
```

Local development also requires the database binding described in
[`web/README.md`](../web/README.md).

## 9. Check the release baseline

From the repository root, run the canonical static and schema checks:

```bash
ruby tests/validate_repository.rb
python3 tests/validate_json_schemas.py
python3 scripts/check_release_consistency.py
```

Then review the declared v0.5 cases under [`tests/`](../tests). A fixture is not
a passing result until a named runner or reviewer records its execution and
evidence.

## A useful first-cycle acceptance test

Your first loop is complete only when all of these are true:

- a named human owns the mission and its consequences;
- the agent's authority is explicit, bounded and revocable;
- at least one real action occurred;
- evidence and provenance were captured;
- counter-evidence was considered;
- a decision changed, or the decision not to change was justified;
- a changed organizational state was recorded as an evidence-backed
  `CognitiveCommit` and new `CognitiveVersion`, or a no-change closure was
  recorded without pretending that a commit occurred;
- the result and uncertainty were recorded; and
- the next review date is known.

If only a workshop, diagram, prompt or dashboard was produced, you have a
design artifact—not yet a validated organizational learning loop.
