# GO OS Skill Routing & Contracts v0.2.0

## Routing rule

Route by the **primary organizational object that must change**, not by keywords alone. The Core skill may compose multiple skills, but one skill must be designated primary.

| Skill | Trigger: use when the primary question is… | Minimum input | Required output | Route next when… |
|---|---|---|---|---|
| `go-os-core` | Which GO OS layer is actually failing? | purpose/problem, current state | diagnosis, primary route, sovereignty boundary, reality test | a primary domain is identified |
| `ai-native-organization-design` | How should structure, roles, coordination or operating model change? | current structure, desired outcome, coordination friction | target operating model, role/agent topology, transition path | authority → HSMA; execution → Mission Runtime; whole-org scoring → Diagnostic |
| `human-sovereignty-machine-agency` | Who/what may decide or act, under what limits? | action/domain, consequence owner, reversibility, risks | sovereignty boundary, AuthorityGrant draft, escalation design | execution contract → Mission Runtime; recurring governance defect → Org Design |
| `mission-organizational-runtime` | How does intent become autonomous, verifiable execution? | purpose, desired state, accountable human, evidence, constraints | MissionSpec draft, authority refs, state transitions, exception rules | authority unclear → HSMA; feedback weak → Reality Loop |
| `reality-loop-organizational-learning` | Why is the organization learning slowly or repeating mistakes? | loop, evidence sources, decision points, recurrence | loop map, latency/fidelity diagnosis, learning changes | structural cause → Org Design; strategy belief changes → Strategy |
| `vision-driven-strategy` | What should remain stable and what hypotheses should adapt under uncertainty? | vision/purpose, strategic hypothesis, evidence horizon, constraints | hypothesis portfolio, missions, evidence/kill criteria, update cadence | execution → Mission Runtime; business flywheel → Compounding |
| `intelligent-compounding-ai-native-business` | Does each cycle improve future value creation and economics? | customer/stakeholder value, loop mechanics, economics, data/capability effects | loop map, bottleneck, compounding test, value/economic reality test | organizational learning bottleneck → Reality Loop; strategic choice → Strategy |
| `ai-native-talent-human-value` | How should human roles, evaluation and development change as machine capability rises? | mission context, current role, consequence ownership, machine capability | human-value map, role redesign, development/evaluation criteria | authority → HSMA; structure → Org Design |
| `ai-native-organization-diagnostic` | What is the organization’s current AI-native operating maturity and binding constraint? | representative workflows/missions, authority, evidence, memory, examples | maturity by domain, bottleneck, evidence gaps, prioritized transformation | route each priority to its specialist skill |

## Common input contract

All skills distinguish:

- **facts** — observed or reliably supplied;
- **inferences** — conclusions derived from facts;
- **assumptions** — provisional beliefs needed to proceed;
- **unknowns** — material missing information.

Do not invent missing organizational facts. Ask only when the missing field changes the decision materially; otherwise proceed with explicit assumptions.

## Common output contract

Every skill must provide:

1. **Diagnosis** — primary failure/object.
2. **Design** — proposed change.
3. **Human sovereignty** — accountable human and non-delegable boundary.
4. **Machine agency** — autonomy that is safe to grant.
5. **Evidence** — what would support the design.
6. **Disconfirming evidence** — what would show it is wrong.
7. **Next loop** — what changes after reality responds.

When machine execution is requested, emit or reference the relevant v0.2 schema objects.

## Conflict precedence

When skills disagree:

1. Human sovereignty and legal/safety constraints override optimization.
2. Explicit AuthorityGrant overrides inferred autonomy.
3. Current high-quality Evidence overrides stale Organizational Memory.
4. Mission purpose and constraints override local task efficiency.
5. Reality tests override framework loyalty.

## Progressive formalization

- Low consequence + reversible: minimal contract; infer safe defaults.
- Medium consequence: explicit MissionSpec and AuthorityGrant.
- High/critical consequence or irreversible: explicit MissionSpec, AuthorityGrant, EvidenceSpec, ExceptionSpec and human ratification.

The schemas are an execution interface, not paperwork.
