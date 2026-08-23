# GO OS v0.5.0 Migration & Deprecation Notes

This guide moves a repository consumer from the exploratory v0.1–v0.4 series
to the v0.5 canonical baseline without rewriting historical evidence.

## Migration principles

1. **Preserve provenance.** Do not rename old files, fixture versions or stored
   records only to make them look like v0.5.
2. **Map before transforming.** Record how an earlier concept maps to the v0.5
   model and keep the original source reference.
3. **Fail closed on authority.** Missing or ambiguous grants do not become
   implicit permission.
4. **Separate claims from targets.** A design document is not implementation;
   a fixture is not a passed test; a build is not field validation.
5. **Scale formality with consequence.** Low-risk reversible experiments may
   use lighter records; irreversible changes require stronger gates.

## Canonical object mapping

| Earlier term or pattern | v0.5 treatment |
|---|---|
| Task as primary unit | Place the task inside a **Mission** with purpose, owner, evidence and authority |
| Informal role or permission | Create or reference an explicit **AuthorityGrant** |
| Metric, report or assertion called evidence | Record source, provenance, uncertainty, contradictions and decision impact as **Evidence** |
| Exception used as generic error | Keep **Exception** as a supporting domain object; create a **CognitiveEvent** when rethink/deliberation is required |
| Meeting or chat transcript | Create a **DeliberationSession** only when hypotheses, evidence, alternatives and decision state are structured |
| Summary or lesson learned | Create a **LearningRecord** only when organizational understanding changes and the source is traceable |
| Direct policy/process edit | Submit an **EvolutionProposal** and apply the appropriate human authority gate |
| Document revision or chat history | Use **CognitiveVersion** when a versioned organizational belief/decision state and its provenance are preserved |

`State`, `Exception`, `Capability` and `OrganizationalMemory` are not removed.
They remain supporting concepts outside the frozen eight-object core.

## Repository migration

### 1. Use the canonical index

Replace links that treat an earlier roadmap or architecture document as
current with [`docs/INDEX.md`](INDEX.md) or the appropriate v0.5 canonical
document. Keep historical links when discussing their original milestone.

### 2. Adopt the version policy

- repository release: `VERSION`;
- component contract: version declared by the component;
- stored organizational object: its own schema/data version;
- cognitive state: `CognitiveVersion` semantics;
- historical fixture: immutable original version.

These are different axes. Do not infer runtime maturity from a matching number.

### 3. Validate authority records

For each grant, confirm:

- named grantor and grantee;
- allowed and prohibited actions;
- limits, risk and reversibility ceiling;
- expiration and revocation semantics;
- `self_expansion_allowed` is explicitly false;
- the executing runtime actually checks the grant before mutation.

Text that says “a human is accountable” is not enough if the human lacks
information, time or effective control.

### 4. Upgrade evidence quality

Add missing source, provenance, freshness, confidence/uncertainty,
contradictions, alternative interpretations and decision impact. Preserve the
older record rather than backdating newly added information.

### 5. Gate organizational mutation

Convert direct capability, policy, authority, mission or structural changes
into proposals with evidence references, risk/reversibility assessment, named
sponsor, required authority and approval status.

### 6. Re-run applicable evaluations

Treat every YAML file as a declared case until a runner or reviewer records:

- repository commit;
- environment and method;
- observed result;
- pass/fail/blocked status;
- evidence or logs;
- reviewer and date.

## Deprecated interpretations

The following interpretations are deprecated in v0.5:

- **AI autonomy implies authority.** Capability never grants sovereignty.
- **Human in the loop means safe.** A ceremonial approval without effective
  control does not satisfy Human Sovereignty.
- **Metrics equal reality.** Metrics can be incomplete, delayed or gamed.
- **Iteration equals learning.** Learning requires evidence-correcting change.
- **Chat history equals organizational memory.** Durable cognition needs
  structure, provenance, ownership and versioning.
- **More agents means a more AI-native organization.** Agent count is not an
  organizational outcome.
- **A reference implementation proves the architecture.** It demonstrates a
  bounded implementation surface.
- **Every earlier specification is current.** Earlier specifications are
  historical unless the Docs Index marks them canonical.
- **Foundation means a legal foundation.** In v0.5, `Foundation Release`
  means the software **奠基版本** only.

## Deprecated documents

No historical document is deleted in v0.5. Instead:

- unchecked milestone plans are superseded as current navigation by
  [`docs/INDEX.md`](INDEX.md);
- [`docs/ROADMAP.md`](ROADMAP.md) is the current forward roadmap;
- [`docs/RED_TEAM_REVIEW_v0.1.1.md`](RED_TEAM_REVIEW_v0.1.1.md) remains the
  first historical review, while the v0.5 entry point is
  [Evaluation & Red-Team](EVALUATION_AND_RED_TEAM_v0.5.0.md);
- [`GO_SOCIETY_OPERATING_CHARTER_v0.1.md`](GO_SOCIETY_OPERATING_CHARTER_v0.1.md)
  remains the historical founding charter, while its `GO Works` and ecosystem
  proposals are superseded by the current
  [Ecosystem & Governance Boundary](ECOSYSTEM_AND_GOVERNANCE_BOUNDARY.md).

## Breaking-change policy for v0.5.x

Within the v0.5 series:

- clarify prose and add optional fields without changing meaning where
  possible;
- version a schema when validation semantics change;
- provide a mapping for renamed or split fields;
- never weaken authority or evidence invariants silently;
- record incompatible runtime behavior in the changelog and release notes;
- keep a migration path for stored organizational state.

## Migration acceptance checklist

- [ ] Current entry links point to the canonical v0.5 set.
- [ ] Historical artifacts retain original provenance and versions.
- [ ] All material actions have explicit authority checks.
- [ ] No actor can expand its own authority.
- [ ] Evidence has source and provenance.
- [ ] Exceptions can trigger structured reconsideration.
- [ ] Organizational mutations are proposed, reviewed and recorded.
- [ ] Human owners have effective control, not only nominal accountability.
- [ ] Evaluation records separate `artifact_status: declared` from
  `execution_status` (`not_executed`, `passed`, `failed`, `blocked`, or a
  justified `not_applicable`).
- [ ] No Chinese wording implies an existing legal foundation.
