# GO OS Skill Specification v0.1.0

A GO OS Skill is a reusable, testable reasoning-and-action contract for an AI system.

## Required sections

Every `SKILL.md` should contain:

1. **Name and version**
2. **Purpose**
3. **Use when**
4. **Do not use when**
5. **Required inputs**
6. **Operating principles**
7. **Procedure**
8. **Decision rules**
9. **Output contract**
10. **Failure / escalation conditions**
11. **Evaluation prompts**
12. **Version notes**

## Skill behavior requirements

A GO OS Skill should:

- distinguish facts, assumptions and unknowns;
- state when evidence is insufficient;
- avoid fabricating organizational facts;
- prefer missions and state changes over activity lists;
- identify authority boundaries;
- separate reversible from irreversible decisions;
- define evidence of success;
- capture exceptions as information;
- produce reusable learning when possible;
- avoid unnecessary human approval steps.

## Metadata convention

Recommended header:

```yaml
name: <skill-name>
version: 0.1.0
framework: GO OS
status: public-alpha
language: multilingual
license: CC-BY-4.0
```

## Compatibility

Skills should be written so they can be used by multiple agent runtimes. Avoid dependence on proprietary tool names unless the skill itself is an adapter.
