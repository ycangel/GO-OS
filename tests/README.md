# GO OS Evaluations and Validation

This directory is the canonical evaluation entry for GO OS v0.5.0.

## What the files mean

- Files named `*-evals*.yaml`, `*-scenarios*.yaml`, or `eval-cases*.yaml` are
  **declarative test vectors**. They describe expected behavior for a future or
  external harness.
- They are not executable tests by themselves and do not mean that any model,
  Skill, web runtime, or organization passed the cases.
- [`go-os-v0.5.0-release-gate-evals.yaml`](go-os-v0.5.0-release-gate-evals.yaml)
  defines the v0.5 conformance expectations.
- [`go-os-v0.5.0-red-team-evals.yaml`](go-os-v0.5.0-red-team-evals.yaml)
  is the canonical adversarial entry for the next review round.
- [`manifest-v0.5.0.yaml`](manifest-v0.5.0.yaml) records the suite taxonomy and
  the version policy.

## Version policy

The repository release is **0.5.0 Foundation Release** (**奠基版本** in
Chinese; the label does not imply a legal foundation entity). Historical
fixtures retain their filenames and internal versions because they are part of
the evolution record. Their presence does not make them current normative
contracts.

## Suite map

| Coverage | Historical vectors retained | v0.5 entry |
|---|---|---|
| Skill routing and behavior | `trigger-evals-v0.2.1.yaml`, `eval-cases-v0.2.0.yaml` | Release gate |
| Authority and evidence | v0.3.1 authority/evidence suites | Release gate + red team |
| Cognitive loop and memory | v0.3.2–v0.3.3 suites | Release gate |
| Portability and headless core | v0.3.4–v0.3.8 suites | Release gate |
| Cognitive Repository | v0.3.9–v0.4.7 suites | Release gate |
| GO Society integration | v0.4.8–v0.4.9 suites | Release gate + red team |

## Artifact and execution status

- **Normative expectation** — behavior required for v0.5 conformance.
- **Proposal** — a candidate test or design claim requiring review.
- **Reference** — historical/example material, not a current pass claim.
- **Artifact status** — `declared` means the vector exists; it says nothing
  about execution.
- **Execution status** — `not_executed`, `passed`, `failed`, `blocked`, or
  `not_applicable`, set only by an actual harness run or review with recorded
  evidence. `not_applicable` requires a reviewer and rationale.

All YAML evaluation files in this repository currently function as reference
vectors. The v0.5 files intentionally declare `artifact_status: declared` and
`execution_status: not_executed`.

## Static checks

Run from the repository root:

```bash
ruby tests/validate_repository.rb
python3 tests/validate_json_schemas.py
```

The first command validates JSON/YAML syntax and top-level structure, the Skill
manifest, component versions, canonical action vocabulary, and local Markdown
links. The second validates the JSON Schemas against Draft 2020-12. These are
static repository checks; they do not execute the behavioral evaluation
vectors.
