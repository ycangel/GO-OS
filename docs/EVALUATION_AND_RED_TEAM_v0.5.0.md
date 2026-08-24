# GO OS v0.5.0 Evaluation & Red-Team Entry Point

**Purpose:** try to falsify the release before expanding its authority,
consequence or public claims.

**Predecessor:** [Red-Team Review v0.1.1](RED_TEAM_REVIEW_v0.1.1.md)

**Status:** ready for the next independent review round

A polished narrative is not a release argument. The v0.5 review must test the
model, contracts, code, governance and evidence boundary separately.

## Artifact and execution status

Use two separate axes so the presence of a test artifact never looks like an
execution result:

- `artifact_status: declared` — the case or review item exists.
- `execution_status: not_executed` — no recorded run exists yet.
- `execution_status: passed` — observed result met the stated acceptance
  criterion.
- `execution_status: failed` — observed result violated it.
- `execution_status: blocked` — the test could not run, with a recorded reason.
- `execution_status: not_applicable` — the reviewer documented why the case
  does not apply.

Do not use “covered” or “supported” without observable evidence.

## Evidence record for every test

Record:

```yaml
review_id: RT-0.5-XXX
repository_commit: <sha>
reviewer: <human or team>
date: <ISO-8601>
claim_under_test: <falsifiable claim>
method: <commands, scenario or inspection method>
expected: <acceptance criterion>
observed: <what actually happened>
artifact_status: declared
execution_status: not_executed | passed | failed | blocked | not_applicable
evidence_refs: []
severity: critical | high | medium | low
owner: <named human>
next_action: <fix, accept, investigate or stop>
```

## Release-gate commands

From the repository root:

```bash
python3 scripts/check_release_consistency.py
cd web
npm ci
npm run lint
npm test
```

Also run any validator documented by `schemas/`, `skills/` and `tests/`.
Automated checks establish repository integrity only. They do not close the
governance, security or real-world evidence gates below.

## A. Narrative and claim integrity

- [ ] **A1. Fact/vision boundary:** every material capability claim is
  classified as implemented, specified, demonstrated, validated or planned.
- [ ] **A2. Completeness attack:** find every place where the eight-object
  architecture could be read as fully integrated; require executable evidence
  or narrow the wording.
- [ ] **A3. Self-application attack:** determine whether “GO OS runs on GO OS” is
  supported by operating records or only design artifacts.
- [ ] **A4. Outcome attack:** reject business or organizational benefit claims
  without baseline, observation window and alternative explanations.
- [ ] **A5. Gödel boundary:** verify that mathematical fact, organizational
  metaphor and engineering hypothesis are never conflated.
- [ ] **A6. Legal-entity language:** confirm `Foundation Release` is translated
  as **“奠基版本”** and no text implies an existing legal foundation.

## B. Human sovereignty and power

- [ ] **B1. Rubber-stamp gate:** give the human incomplete, late or misleading
  information and test whether approval still proceeds.
- [ ] **B2. Named-owner reality:** verify the named human has time, access,
  competence and actual power to stop the action.
- [ ] **B3. Purpose capture:** test who can define or change purpose and how
  affected people can contest it.
- [ ] **B4. Minority protection:** test whether dissent survives deliberation
  and cognitive merge.
- [ ] **B5. Exit:** revoke an agent and replace an interface/provider without
  losing the organization's essential cognitive state.
- [ ] **B6. Accountability laundering:** verify AI involvement cannot be used
  to obscure the accountable human decision maker.

## C. Authority enforcement

- [ ] **C1. Default deny:** missing grant produces denial on every write path.
- [ ] **C2. Scope:** grantee, action, target, risk, resource, tool and time
  limits are enforced rather than merely displayed.
- [ ] **C3. Self-expansion:** an actor cannot modify or create a grant that
  increases its own authority.
- [ ] **C4. Expiry/revocation:** expired and revoked grants fail immediately and
  consistently.
- [ ] **C5. Confused deputy:** a low-authority actor cannot induce a
  higher-authority service to perform the mutation.
- [ ] **C6. Identity/authority separation:** successful authentication alone
  never authorizes organizational change.
- [ ] **C7. Race/replay:** concurrent, delayed and replayed requests cannot use
  stale authority.
- [ ] **C8. Irreversibility:** high-consequence changes require the stronger
  human gate and cannot be mislabeled reversible.

## D. Evidence and epistemic integrity

- [ ] **D1. Provenance:** fabricated, circular or missing provenance is
  rejected or visibly downgraded.
- [ ] **D2. Contradiction:** strong disconfirming evidence reaches deliberation
  even when it conflicts with a leader or high-confidence agent.
- [ ] **D3. Goodhart attack:** optimize the visible metric and inspect damage to
  unmeasured reality.
- [ ] **D4. Staleness:** stale evidence cannot silently drive a current
  decision.
- [ ] **D5. Correlated sources:** repeated copies of one claim do not become
  independent evidence.
- [ ] **D6. Uncertainty:** confidence and missing observations survive UI,
  persistence, export and deliberation.
- [ ] **D7. Decision impact:** evidence records state what decision they could
  change; unused evidence does not masquerade as learning.

## E. Cognitive loop integrity

- [ ] **E1. Trigger:** evidence conflict, exception pattern, uncertainty and
  capability gap create the right CognitiveEvent.
- [ ] **E2. Deliberation quality:** alternative hypotheses and dissent are
  retained; eloquence does not substitute for evidence.
- [ ] **E3. Learning threshold:** a summary or task completion cannot become a
  LearningRecord without a traceable change in understanding.
- [ ] **E4. Proposal boundary:** LearningRecord does not mutate policy,
  authority or structure without an EvolutionProposal and approval.
- [ ] **E5. Cognitive commit:** every accepted change records diff, evidence,
  owner, decision and unresolved uncertainty.
- [ ] **E6. Rollback:** a reversible change can actually be reversed and the
  history remains inspectable.
- [ ] **E7. Loop closure:** post-change reality is observed; the system does not
  stop at proposal or deployment.

## F. Data, privacy and security

- [ ] **F1. Public/private boundary:** private field records cannot appear in a
  public API or page without consent and human publication approval.
- [ ] **F2. Re-identification:** apparently anonymous cases are tested for
  identity leakage through combinations of fields.
- [ ] **F3. Injection:** untrusted evidence, imported packages and user text
  cannot override constitutional or tool boundaries.
- [ ] **F4. Secret handling:** credentials never enter source, browser storage,
  logs, cognitive packages or public evidence.
- [ ] **F5. Authorization coverage:** every mutation route reaches the same
  constitutional enforcement boundary.
- [ ] **F6. Failure mode:** unavailable identity, database or policy state fails
  closed for writes and produces no misleading success state.
- [ ] **F7. Supply chain:** dependencies, lockfile, build and deployment
  configuration receive an independent security review.

## G. Portability and repository semantics

- [ ] **G1. Round trip:** export and import preserve canonical cognition without
  silent loss.
- [ ] **G2. Vendor switch:** two different interface/model stacks can operate
  on the same package with documented behavioral differences.
- [ ] **G3. Secret exclusion:** portable packages reference but do not embed
  credentials or unauthorized private data.
- [ ] **G4. Schema migration:** older component versions migrate without
  rewriting provenance.
- [ ] **G5. Branch/merge conflict:** competing strategic branches preserve
  dissent and do not auto-merge incompatible authority or facts.
- [ ] **G6. Commit integrity:** cognitive history is tamper-evident or its lack
  of tamper resistance is explicit.

## H. Implementation and operations

- [ ] **H1. Clean checkout:** documented install, checks and build pass from a
  clean clone.
- [ ] **H2. Eight-object coverage:** create a coverage matrix for schema,
  validation, persistence, API, UI, evaluation and denial path.
- [ ] **H3. Error semantics:** errors are actionable, do not leak secrets and do
  not imply a write succeeded.
- [ ] **H4. Observability:** denied and approved mutations can be audited without
  exposing private data.
- [ ] **H5. Concurrency/idempotency:** duplicate or concurrent actions do not
  create contradictory organizational state.
- [ ] **H6. Recovery:** backup, migration and recovery are tested with realistic
  state.
- [ ] **H7. Performance/cost:** human review latency, model cost and runtime
  latency are measured under a realistic mission load.

## I. Real-world falsification

- [ ] **I1. Baseline:** record current outcome and learning latency before GO OS
  intervention.
- [ ] **I2. Simpler alternative:** compare against a simpler checklist,
  workflow or management practice.
- [ ] **I3. Bounded field loop:** run one reversible mission with a named owner
  and real action.
- [ ] **I4. Counterfactual:** identify plausible reasons the outcome changed
  besides GO OS.
- [ ] **I5. Repetition:** observe multiple loops; one success is not a stable
  capability.
- [ ] **I6. Negative result:** publish when GO OS adds ceremony, cost or risk
  without sufficient value.
- [ ] **I7. Scale boundary:** do not generalize from one organization, mission or
  domain without evidence.

## J. Cognitive Bridge self-hosting

- [ ] **J1. Isolation:** the project owns a unique directory, Compose project,
  network, volumes and loopback port; starting, stopping and updating it does
  not mutate another server project.
- [ ] **J2. Canonical origin:** the public origin exactly matches the HTTPS
  domain used by OAuth metadata, same-origin checks and principal binding.
- [ ] **J3. Issuer binding:** Web login and MCP access tokens use the same
  verified OIDC issuer and stable `sub`; cross-issuer subject collisions cannot
  link a member.
- [ ] **J4. Token denial matrix:** absent, malformed, expired, not-yet-valid,
  wrong-issuer, wrong-audience, forged-signature, unsupported-critical-header
  and insufficient-scope tokens all fail closed.
- [ ] **J5. Header spoofing:** public requests cannot inject the trusted Web
  identity secret or identity headers, and MCP never treats Web identity
  headers as bearer authentication.
- [ ] **J6. Tool ceiling:** discovery exposes exactly context read, private
  checkpoint staging and human-review request; no ratify, commit, version,
  authority or Mission mutation tool exists.
- [ ] **J7. Human Gate:** a staged draft cannot change the cognitive head before
  exact-hash Web review and named-human ratification.
- [ ] **J8. Load boundary:** request size, source rate, concurrency, process,
  CPU, memory and log growth remain inside the declared server envelope.
- [ ] **J9. Persistence:** migrations are checksum-verified and atomic; restart,
  backup and guarded restore preserve SQLite integrity, HMAC identity bindings
  and cognitive history.
- [ ] **J10. Fresh-conversation round trip:** a newly authorized ChatGPT/Codex
  conversation reads current context, stages selected material after explicit
  consent, reaches the Web Human Gate and observes the ratified revision on a
  second read.

## K. Governance, ecosystem and licensing

- [ ] **K1. Public upstream:** distinguish GO OS from any commercial packaging,
  customer deployment or implementation company.
- [ ] **K2. IP boundary:** verify software, documentation, Skills, trademarks,
  contributions, company IP and customer-specific IP have clear terms.
- [ ] **K3. Data return:** no customer learning returns to a public commons
  without contractual authority, consent and effective de-identification.
- [ ] **K4. Maintainer power:** document who can merge constitutional or schema
  changes and how decisions can be contested.
- [ ] **K5. Dependency on one steward:** test succession, fork and continuity
  risks.
- [ ] **K6. Legal status:** no release language invents or implies a foundation
  or other legal body that has not been established.

## Suggested review sequence

1. **Repository integrity reviewer** — links, versions, schemas, Skills, fixtures,
   build and tests.
2. **Runtime/security reviewer** — authority, identity, mutation, privacy and
   failure paths.
3. **Organization/governance reviewer** — sovereignty, power, dissent,
   accountability and adoption risks.
4. **Epistemic reviewer** — evidence, uncertainty, Goodhart effects and learning
   claims.
5. **Independent field reviewer** — baseline, operation, results and alternative
   explanations.

Reviewers should work independently before a synthesis session. Disagreement
is recorded in a dissent section, not averaged away.

## Severity and release decisions

- **Critical:** authority bypass, private-data exposure, secret leakage,
  irreversible unauthorized action or false legal/entity claim. Stop release or
  deployment expansion.
- **High:** breaks a constitutional invariant, corrupts cognitive history or
  makes a central public claim materially false. Fix before release tag or
  wider use.
- **Medium:** inconsistent contract, migration, evaluation or navigation that
  can mislead implementers. Fix or document with an owner and date.
- **Low:** editorial or ergonomic issue without material semantic impact.

## Synthesis template

```markdown
# GO OS v0.5 Red-Team Synthesis

Repository commit:
Review dates:
Reviewers:

## Release decision
pass | conditional_pass | fail

## Critical/high findings

## Claims narrowed or falsified

## Evidence still missing

## Accepted risks and accountable owners

## Required fixes and retest results

## Dissenting reviewer views

## Next field-validation gate
```

The red team succeeds when it makes GO OS more accurate, more contestable and
safer—including when it concludes that a claim, feature or deployment should
not proceed.
