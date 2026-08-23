# GO OS v0.4.6 Cognitive Repository Live Data Model

## Purpose

This document defines the live data model for GO Cognitive Repository.

The repository stores organizational intelligence as versioned, traceable, and evolvable knowledge.

## Core Objects

### Identity

Defines organizational identity and context.

```yaml
id:
name:
purpose:
```

### Belief

Represents an organizational assumption or understanding of reality.

```yaml
id:
statement:
confidence:
evidence_refs:
status:
```

### Decision

Represents an owned organizational choice.

```yaml
id:
context:
choice:
ownership:
impact:
```

### Cognitive Commit

Records why understanding changed.

```yaml
id:
trigger:
previous_state:
new_state:
evidence_refs:
decision_owner:
```

## Design Principle

The repository stores not only outcomes, but the evolution path of organizational intelligence.
