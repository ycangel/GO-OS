# GO OS v0.3.1 Authority Enforcement Runtime

## Purpose

GO OS treats Authority as an executable constitutional boundary, not metadata.

Authentication answers:

> Who are you?

Authority answers:

> Are you allowed to change organizational state?

No organizational mutation should occur without both identity and explicit authority.

## Runtime Flow

```text
Actor
  |
  v
Identity Resolution
  |
  v
Authority Grant Lookup
  |
  v
Action Validation
  |
  +--> Allowed Action
  |
  +--> Rejected Action
```

## Constitutional Rules

1. Every actor requires an explicit authority boundary.
2. Authority must specify allowed actions and limits.
3. Authority can expire or be revoked.
4. No actor may expand its own authority.
5. Higher-risk and irreversible actions require stronger authority.

## v0.3.1 Enforcement Scope

Initial protected actions:

- create evidence
- create exception
- create evolution proposal
- modify organizational authority

## Future Migration

The current implementation introduces the persistence contract before storage migration.

The next step is adding the `authority_grants` database table and connecting all mutation APIs through the authority guard.
