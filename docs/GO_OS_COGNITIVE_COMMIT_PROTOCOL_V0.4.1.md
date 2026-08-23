# GO OS Cognitive Commit Protocol v0.4.1

## Concept

A Cognitive Commit records why an organization changed its understanding.

It is the equivalent of a software commit, but the object being versioned is organizational intelligence.

## Structure

```yaml
CognitiveCommit:
  id:
  trigger:
  previous_version:
  new_version:
  evidence_refs:
  deliberation_refs:
  decision_owner:
  impact:
```

## Rules

- No cognitive commit without context.
- Significant belief changes require evidence references.
- Strategic or irreversible changes require human approval.
- Commits preserve evolution history instead of overwriting previous states.

## Goal

Enable organizations to understand not only what changed, but why they changed.
