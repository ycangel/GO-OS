# Contributing to GO OS

GO OS welcomes contributions that improve the clarity, falsifiability, usefulness, safety and portability of the project.

The current repository baseline is **v0.5.0 Foundation Release**. “Foundation Release” is a software release-stage name, translated in Chinese as **“奠基版本”**. It does not refer to a “GO Foundation” or imply a registered foundation or other legal entity.

## Start with the canonical documentation

Before proposing a change, read:

1. the [Documentation Index](docs/INDEX.md) for the current source-of-truth map;
2. the [Architecture Overview](docs/ARCHITECTURE_OVERVIEW.md) for layers, objects and enforcement boundaries;
3. the [Migration & Deprecation Notes](docs/MIGRATION_AND_DEPRECATION_v0.5.0.md) for compatibility rules; and
4. the [Evaluation & Red-Team Guide](docs/EVALUATION_AND_RED_TEAM_v0.5.0.md) for evidence and adversarial-test expectations.

Earlier versioned documents are retained as design history. Do not silently rewrite history or treat an older file as current merely because it remains in the repository. When current guidance changes, update the canonical entry point, add migration or deprecation guidance, and preserve traceability to the earlier decision.

## Contribution principles

A contribution should improve at least one of the following:

- conceptual precision;
- practical executability;
- evidence quality;
- diagnostic power;
- machine readability;
- human accountability;
- cross-industry portability;
- safety under bounded authority;
- learning-loop quality and speed.

Avoid adding framework elements solely because they are fashionable. New concepts should solve a recurring organizational problem that cannot be handled cleanly by the existing ontology.

Preserve the constitutional boundary: humans retain purpose, value judgment, approval and responsibility; machine agency must remain explicit, bounded, revocable and auditable; reality can contradict both human and machine assumptions.

## Separate fact from intent

Documentation and pull requests must identify the status of material claims. Use clear labels such as:

- **Implemented** — present in code or a machine-readable artifact;
- **Tested** — exercised by a named, reproducible evaluation;
- **Specified** — defined as a contract or reference design but not necessarily implemented end to end;
- **Observed** — supported by traceable operating evidence;
- **Proposed** — open for deliberation and approval;
- **Roadmap** — a future direction, not a shipped capability.

Do not use a passing document-level evaluation as evidence of production readiness, real-world effectiveness or cross-system interoperability.

## What you can contribute

Contributions may include:

- runtime or reference-application code;
- schemas and compatibility fixtures;
- Skills and routing contracts;
- evaluations, counterexamples and red-team cases;
- documentation, diagrams and migration notes;
- reproducible organizational experiments and evidence;
- critiques that expose a failed assumption; or
- new reference implementations.

## What belongs in a Skill

A GO OS Skill should contain:

1. a clear trigger condition;
2. the problem it is designed to solve;
3. required inputs;
4. a repeatable reasoning procedure;
5. decision rules;
6. an explicit output contract;
7. failure and escalation conditions;
8. negative-trigger boundaries; and
9. at least three evaluation prompts, including a case where the Skill should not be used.

## Change and evaluation expectations

For code, schema, Skill or runtime changes:

- add or update the smallest relevant tests under [`/tests`](tests);
- include at least one failure, abuse or disconfirming case when authority, evidence or organizational state can change;
- state the human approval and rollback boundary;
- run the applicable checks and report exactly what was and was not executed; and
- document any incompatible behavior in the v0.5 migration and deprecation notes.

For documentation-only changes, check links, headings, terminology, version references and the distinction between canonical and historical material.

## Pull request expectations

Explain:

- what problem you observed;
- what evidence indicates the problem is real;
- why the current project is insufficient;
- what change you propose;
- the claim status: Implemented, Tested, Specified, Observed, Proposed or Roadmap;
- whether the change is backward-compatible;
- what should be deprecated or migrated;
- how the change can be falsified or tested; and
- what risks, authority boundaries and unresolved questions remain.

Small, reviewable changes are preferred. A change that alters the constitutional model, core runtime objects or canonical architecture should include an Evolution Proposal and a Cognitive Diff rather than being presented as an incidental documentation edit.

## Red-team reports

A useful red-team report names the assumption under attack, the adversarial condition, the expected safe behavior, the observed behavior, the evidence collected and the severity. A counterexample is valuable even when it arrives without a fix.

Use the [Evaluation & Red-Team Guide](docs/EVALUATION_AND_RED_TEAM_v0.5.0.md) as the entry point. Security vulnerabilities or reports containing sensitive data should not be posted publicly; share a minimal, non-sensitive description with the maintainers first.

## Human–AI collaboration

AI-assisted contributions are welcome. The human submitter must review the output, verify relevant claims and tests, disclose material AI collaboration when appropriate, and retain responsibility for publication and consequences. An AI system may generate candidates or analysis; it does not approve its own authority expansion or become the accountable maintainer.

## Public-data rule

Do not submit private company data, confidential operating information, personal data, credentials, secrets or proprietary third-party material. Use synthetic or explicitly authorized data in examples and evaluations.

## Licensing

By contributing, you agree that software and machine-executable support files are provided under Apache License 2.0, while documentation and Skill text are provided under CC BY 4.0, as described in [`LICENSE`](LICENSE) and [`LICENSE-CONTENT.md`](LICENSE-CONTENT.md).
