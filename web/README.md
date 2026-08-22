# GO Society Web

**GO Society is the organization behind GO OS—and its first living reference implementation.**

> A self-evolving organization for self-evolving organizations.

This application is the first deployable collaboration surface for GO OS. It is not a project-management dashboard with agents attached. It makes the core GO OS runtime objects operational:

- **Mission** — purpose compiled into accountable action.
- **Authority** — bounded permission for humans and machines to act.
- **State** — the best current representation of reality.
- **Evidence** — sourced observations that update organizational belief.
- **Exception** — conditions that exceed assumptions or authority and need attention.
- **Capability** — reusable ability distilled from verified experience.
- **Organizational Memory** — retained decisions, evidence, patterns and learning.

The first Domain Cell is GO Society itself. Its initial missions are to make GO OS runnable, build the open commons and find the first external organizations ready to evolve.

## What works in v0.1

- Sovereign Brief and constitutional operating boundaries.
- Mission Cockpit with named ownership, authority and success signals.
- Intervention Center showing only decisions that require human judgment.
- Evidence Ledger with source, freshness, reliability and attribution.
- Evolution Missions for reversible changes to the organization itself.
- Capability Network showing reusable abilities and evidence depth.
- Durable Cloudflare D1 state with seeded GO Society operating data.
- Authenticated write paths for evidence, exceptions and evolution proposals.

## Local development

Requirements: Node.js 22.13 or newer, npm and a Cloudflare-compatible D1 binding.

```bash
npm ci
npm run dev
```

The local Vinext configuration simulates declared bindings. Database migrations live in `drizzle/` and the schema is defined in `db/schema.ts`.

## Build

```bash
npm run build
```

The build emits a Cloudflare Worker-compatible application under `dist/`.

## Deployment

The application is configured for OpenAI Sites and Cloudflare D1 through `.openai/hosting.json`. For another Cloudflare-compatible host, bind a D1 database as `DB`, apply the SQL migrations in `drizzle/`, and provide an identity layer that supplies the authenticated user headers consumed in `app/chatgpt-auth.ts`.

Read-only runtime views can remain public. Write actions must stay authenticated and server-authorized.

## Constitutional invariants

1. Human Sovereignty
2. Machine Agency
3. Reality Finality
4. Named Accountability
5. Reversibility & Exit

The system may propose changes to itself. It may not expand its own authority.

## License

Apache License 2.0. See the GO OS repository license for details.
