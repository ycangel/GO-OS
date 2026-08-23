# GO OS v0.3.1 — Authority Runtime

## Purpose

Authority Runtime is the first constitutional enforcement layer of GO OS.

GO OS does not define autonomy as unlimited freedom. Machine Agency exists only inside explicit authority boundaries.

> Human Sovereignty defines who owns consequences. Authority Runtime defines what actions may be delegated.

## Core rule

No human or machine actor may perform an organizational action without a valid AuthorityGrant.

## AuthorityGrant

Required concepts:

- grantor — who grants authority
- grantee — who receives authority
- allowed actions — what may be done
- prohibited actions — what is forbidden
- limits — resource and risk boundaries
- reversibility ceiling — maximum acceptable irreversibility
- expiry / revocation — lifecycle of authority
- self_expansion_allowed — always false

## Runtime flow

```text
Actor
  |
  v
Requested Action
  |
  v
Authority Check
  |
 +---- valid ----> Execute
 |
 +---- invalid --> Escalate / Reject
```

## Design principle

Authentication answers:

> Who are you?

Authority answers:

> Are you allowed to change this organization state?

GO OS requires both.

## Evolution path

v0.3.1:
- Authority contract
- Authority guard

Future:
- Authority persistence
- Mission-bound grants
- Agent tool enforcement
- Revocation workflows
- Audit trail
