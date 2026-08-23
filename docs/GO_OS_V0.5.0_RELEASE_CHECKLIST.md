# GO OS v0.5.0 Release Checklist

**Release name:** Foundation Release / 奠基版本

**Scope:** repository baseline on the default branch

This checklist tracks repository-release integrity. Independent red-team,
security and field-validation gates remain open after this checklist passes.

## Version and naming

- [x] `VERSION` is `0.5.0`.
- [x] Repository-level release references use v0.5.0.
- [x] Historical and component versions retain correct provenance.
- [x] Chinese uses “奠基版本”; no text implies an existing legal foundation.

## Canonical documentation

- [x] English and Chinese READMEs link the canonical set.
- [x] Docs Index defines status, precedence and complete historical navigation.
- [x] Quick Start is bounded, executable and human-gated.
- [x] Architecture Overview separates model, contract and implementation.
- [x] Whitepaper is labeled an editorial scaffold with evidence obligations.
- [x] Release Notes state included scope and known limitations.
- [x] Migration/Deprecation Notes preserve provenance.
- [x] Evaluation/Red-Team entry point is ready.

## Schemas, Skills and tests

- [x] v0.5 manifest covers all eight core objects.
- [x] JSON Schemas parse and pass available meta-validation.
- [x] Reference examples validate or state the validator limitation.
- [x] Skill and contract versions align under the component-version policy.
- [x] AI outputs remain candidate-only where human approval is required.
- [x] Historical fixtures are not rewritten as v0.5 results.
- [x] Declared evaluations are distinguished from executed results.

## Web reference application

- [x] Component/package metadata aligns to 0.5.0.
- [x] Canonical docs and red-team navigation are visible.
- [x] Authority actions use one canonical vocabulary.
- [x] Every current mutation route authenticates, checks structured authority and fails closed.
- [x] Forward migration creates required authority state without rewriting history.
- [x] Public/private data boundaries and automation limitations are documented.
- [x] Lint, build and 13 Web tests pass from installed dependencies.

## Repository checks

- [x] Canonical local links resolve.
- [x] No unintended tracked credentials or environment files exist.
- [x] Release consistency script passes.
- [x] `git diff --check` passes.
- [x] Final diff and source-control status are reviewed.
- [ ] Release commit is pushed to the default branch.

## Verification record — 2026-08-23

- `ruby tests/validate_repository.rb` — PASS: 15 JSON, 36 YAML, 21 Markdown
  entry documents and 9 Skills checked.
- `python3 tests/validate_json_schemas.py` — PASS: 14 schemas, 27 invariant
  probes and 7 reference objects.
- `python3 scripts/check_release_consistency.py` — PASS: v0.5.0 baseline, 15
  JSON files, 99 Markdown files and 232 local links.
- `cd web && npm run lint && npm test` — PASS: typecheck, Cloudflare-compatible
  build, forward migration chain and 13 tests.
- Independent documentation and runtime/code pre-release reviews identified
  claim, authorization, migration and private-read findings. Release-blocking
  findings were corrected and the automated gates rerun. This is not a
  substitute for the open independent synthesis and field gates below.

## Post-release gates

- [ ] Independent v0.5 red-team synthesis is completed.
- [ ] Critical/high findings are fixed and retested.
- [ ] One bounded real-world loop is run against a pre-recorded baseline.
- [ ] Negative results and unresolved dissent are retained.
- [ ] Release tag/announcement is approved by the human maintainer.
