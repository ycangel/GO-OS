# GO OS v0.5.0 Release Notes

**Release name:** Foundation Release / 奠基版本

**Release date:** 2026-08-23

**Release type:** architecture and repository baseline

GO OS v0.5.0 turns the v0.1–v0.4 design sequence into one navigable public
baseline. It freezes the core organizational-intelligence model, identifies the
canonical documentation set and makes implementation maturity explicit.

`Foundation Release` names a software milestone. It does not refer to, announce
or imply a legally registered foundation.

## Highlights

- A canonical v0.5 documentation entry point and status vocabulary.
- A frozen eight-object core: Mission, AuthorityGrant, Evidence,
  CognitiveEvent, DeliberationSession, LearningRecord, EvolutionProposal and
  CognitiveVersion.
- A constitutional architecture connecting authority, evidence, cognition,
  memory, evolution and versioned organizational state.
- Machine-readable schemas for the core objects and supporting exceptions.
- A semantic gateway plus specialist GO OS Skills aligned to the release.
- A Quick Start centered on one real, bounded and reversible mission.
- A whitepaper editorial scaffold with explicit evidence obligations.
- Migration, deprecation, evaluation and red-team entry points.
- A current public-upstream, enterprise-offering and self-application
  [ecosystem/governance boundary](ECOSYSTEM_AND_GOVERNANCE_BOUNDARY.md).
- A GO Society Web reference application with its scope and limitations stated.
- A repeatable repository consistency check.

## What is included

### Canonical model

The architecture frozen at v0.4.9 is published as the v0.5 baseline. Earlier
specifications remain available as the design record.

### Machine-readable contracts

The repository includes schemas, examples and declared evaluation fixtures.
Schema and fixture presence means that a contract can be inspected and tested;
it does not mean every runtime path is implemented or every fixture has passed.

### Reference application

GO Society Web demonstrates selected mission, authority, evidence, exception,
membership, privacy and evolution surfaces. Its own component version and
implementation coverage are reported in `web/`.

### Self-application artifacts

GO Cognitive Repository #001 and GO Society Runtime Instance #001 provide a
design and evaluation path for GO OS to record and challenge its own evolution.
They are reference artifacts, not independent proof that GO OS has achieved a
complete self-evolving runtime.

## Compatibility and versioning

- `VERSION` is the GO OS repository release: `0.5.0`.
- Historical documents and fixtures keep their original versions.
- Component contracts may evolve independently and are listed by release
  manifests in their directories.
- The Constitution remains v0.2.2 because v0.5 does not silently revise its
  normative principles.

See [Migration & Deprecation Notes](MIGRATION_AND_DEPRECATION_v0.5.0.md).

## Verification

The release baseline is expected to pass:

- repository version and canonical-link checks;
- JSON parsing and JSON Schema meta-validation where supported;
- Skill frontmatter and contract alignment checks;
- declared evaluation-file structure checks;
- Web lint, build and rendered-output tests;
- scans for ambiguous Chinese legal-entity wording;
- a clean source-control diff review.

The exact commands and results should be recorded in the release commit or
red-team report. A successful automated check does not replace security,
governance or field validation.

## Known limitations

- The eight core objects are not yet all proven through one durable,
  end-to-end production runtime.
- Several evaluation files are declarative fixtures rather than results from a
  common executable runner. They declare `artifact_status: declared` and
  `execution_status: not_executed` until evidence from a run exists.
- The current reference application is not a stable public SDK.
- Cognitive package portability has design artifacts and tests but needs
  repeated cross-vendor interoperability evidence.
- Cognitive branching and merge remain early reference semantics.
- Security, privacy and authority controls require independent adversarial
  review before high-consequence use.
- No claim of improved organizational or commercial outcomes is made without
  a documented baseline and field evidence.
- License, trademark, contributor governance, commercial distribution rights
  and customer-data arrangements may require further formalization outside
  this release.

## Explicitly not claimed

v0.5.0 is not:

- a declaration that GO OS is complete or production-certified;
- proof that self-evolving organizations outperform other models;
- authorization for agents to govern an organization autonomously;
- evidence that GO Society is a registered legal entity;
- the announcement of a legal foundation;
- a guarantee of compliance in any regulated domain;
- a promise that every historical specification is implemented.

## Upgrade path

1. Read the [Docs Index](INDEX.md) and use its precedence rules.
2. Review the [Architecture Overview](ARCHITECTURE_OVERVIEW.md).
3. Preserve historical object data; map it rather than rewriting provenance.
4. Validate authority grants, especially self-expansion, expiry and revocation.
5. Add source/provenance and disconfirming evidence where earlier records lack
   them.
6. Run the release checks and applicable declared evaluations.
7. Require red-team review before expanding the consequence or autonomy level.

## Next gate

The next milestone is not determined by document count. It is determined by
evidence that a complete loop can operate safely and improve a real mission.
Use [Evaluation & Red-Team](EVALUATION_AND_RED_TEAM_v0.5.0.md) as the review
entry point.
