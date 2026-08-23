# GO OS v0.3.1 API Enforcement Plan

## Goal

Move GO OS from recording organizational state to governing organizational state.

Every organizational mutation must pass through a constitutional boundary.

## Mutation Flow

```
Identity
  ↓
AuthorityGrant lookup
  ↓
Action validation
  ↓
Mutation allowed or rejected
  ↓
Evidence recorded
```

## Protected mutations

- create evidence
- create exception
- create evolution proposal
- update mission state

## Principle

Authentication answers:

> Who are you?

Authority answers:

> Are you allowed to change this organization?

GO OS requires both.

## v0.3.1 completion criteria

- [x] Authority contract
- [x] Authority guard
- [x] Persistence contract
- [x] Mutation boundary
- [ ] Database-backed authority grants
- [ ] API route integration
- [ ] Runtime audit trail
