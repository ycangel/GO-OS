# GO OS Schemas

The canonical machine-readable contracts for the GO OS v0.5.0 Foundation
Release are in [`v0.5/`](v0.5/). In Chinese, Foundation Release is **奠基版本**;
the phrase names a software release stage and does not imply that a legal
foundation entity exists.

## Status model

- **Normative** — a v0.5 interoperability contract. Conforming producers and
  consumers must honor the schema, but schema presence alone does not prove a
  runtime implementation.
- **Proposal** — a design candidate that may change and must not be treated as
  a frozen interface.
- **Reference** — an example or test vector; it is not production evidence.

The v0.5 manifest labels every artifact explicitly:
[`v0.5/manifest.json`](v0.5/manifest.json).

## v0.5 core runtime objects

| Runtime object | Canonical schema |
|---|---|
| Mission | [`v0.5/mission.schema.json`](v0.5/mission.schema.json) |
| AuthorityGrant | [`v0.5/authority-grant.schema.json`](v0.5/authority-grant.schema.json) |
| Evidence | [`v0.5/evidence.schema.json`](v0.5/evidence.schema.json) |
| CognitiveEvent | [`v0.5/cognitive-event.schema.json`](v0.5/cognitive-event.schema.json) |
| DeliberationSession | [`v0.5/deliberation-session.schema.json`](v0.5/deliberation-session.schema.json) |
| LearningRecord | [`v0.5/learning-record.schema.json`](v0.5/learning-record.schema.json) |
| EvolutionProposal | [`v0.5/evolution-proposal.schema.json`](v0.5/evolution-proposal.schema.json) |
| CognitiveVersion | [`v0.5/cognitive-version.schema.json`](v0.5/cognitive-version.schema.json) |

`Exception` and `CognitiveCommit` are supporting contracts rather than members
of the frozen eight-object core. They remain important to the learning and
versioning loop.

The v0.5 `AuthorityGrant` also freezes a shared snake-case action vocabulary.
Custom actions use the `custom:` prefix. Historical aliases such as
`record_evidence` and `modify_mission` are mapped in the manifest but are not
canonical v0.5 values.

Canonical serialized field names use `snake_case`. A TypeScript or other
runtime that uses `camelCase` internally needs an explicit, tested adapter; the
manifest does not treat differently named fields as automatically conforming.

## Compatibility history

The root-level `mission-spec`, `authority-grant`, `evidence-spec`, and
`exception-spec` schemas are retained unchanged as v0.2 compatibility
artifacts. New v0.5 integrations should use the versioned paths above. Git
history remains the authoritative record of earlier revisions.

[`examples/mission.yaml`](examples/mission.yaml) is likewise a **legacy v0.2.0
multi-object example**. Its unversioned filename and older `evidence` shape are
preserved for provenance; do not use it as a v0.5 integration contract.

The example in [`examples/cognitive-loop-v0.5.0.yaml`](examples/cognitive-loop-v0.5.0.yaml)
is non-normative reference data. It illustrates object relationships; it does
not claim that a runtime executed or passed the loop.

## Validation

From the repository root:

```bash
ruby tests/validate_repository.rb
python3 tests/validate_json_schemas.py
```

The first command checks JSON/YAML structure, Skill manifests, component
versions, and local links. The second validates every `*.schema.json` file
against the JSON Schema Draft 2020-12 meta-schema and requires Python's
`jsonschema` package.
