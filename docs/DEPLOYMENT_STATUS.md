# GO Society Deployment Status

**As of:** 2026-08-29 (Asia/Shanghai)

**Repository baseline:** GO OS v0.5.0 Foundation Release / 奠基版本

**Current operational stage:** `public_read_only`

This is the current source of truth for the public GO Society instance. It
separates source availability, observed deployment behavior and uncompleted
integration work. Historical release records remain unchanged.

> A healthy public Web deployment does not prove authenticated member access,
> OAuth/OIDC, MCP authorization, DingTalk identity linkage or a complete
> Cognitive Bridge round trip.

## Current instance

| Item | Observed status |
|---|---|
| Public origin | [`https://go.pixmoving.net`](https://go.pixmoving.net) |
| Public health | `GET /api/health` returned HTTP 200 with GO Society `0.5.0` |
| Public Mission/Capability runtime | Anonymous public-by-design records are available |
| Published case evidence | Only human-approved, low-reidentification-risk records with `anonymous_publication` consent are returned |
| Private member runtime | Unauthenticated `GET /api/member/runtime` returned HTTP 401 |
| Edge topology | Shared host Nginx terminates HTTPS and routes this hostname only |
| Application listener | `127.0.0.1:3210`; the application port is not published directly |
| Persistence | Project-owned SQLite volume under Compose project `go-os-self-hosted` |
| Server checkout observed | `b19e237` (`fix: use bundled Dockerfile frontend`); this is not an image attestation |
| Repository `main` at this audit | `fefb0a8` before this status update |
| Former Sites deployment | Permanently removed; Sites/D1 source remains only as a compatibility and historical adapter |

The server shares Nginx and host resources with other projects. GO Society
does not own or replace host ports 80/443, another virtual host, or another
project's containers, networks or volumes.

## Identity and conversation bridge

| Capability | Status | Evidence boundary |
|---|---|---|
| Web OIDC login | `not_configured` | The production issuer, client and authenticated redirect flow have not passed acceptance |
| OAuth protected-resource metadata | `blocked` | `/.well-known/oauth-protected-resource` returned HTTP 503 because the production issuer/audience/JWKS contract is unset |
| MCP source and route | `source_present_not_operational` | The bounded source and three-tool ceiling exist, but OAuth discovery and private access are not operational |
| Web/MCP principal link | `not_executed` | No production proof that Web and MCP resolve the same issuer-qualified `sub` |
| Fresh-conversation round trip | `not_executed` | No authorized new conversation has completed context read, consented staging, Web review, ratification and second context read |
| DingTalk human identity | `selected_upstream` | DingTalk is the intended human sign-in source; it is not itself the MCP authorization server |
| DingTalk-to-OIDC broker | `proposal` | A compatible authorization layer is still being selected and tested; Casdoor is one discussed candidate only and has not been selected, configured, deployed or accepted |
| DingTalk conversation capture | `not_implemented` | A DWS login or documentation session is not a GO Society cognitive bridge |

GO Society must validate access tokens issued by one standards-compatible
OAuth/OIDC authorization server. A deployment may federate DingTalk as the
upstream human identity, but it must not treat a DingTalk token, an email or a
client-supplied identity header as sufficient organizational authority.

The source now supports an owner bootstrap by the exact stable OIDC `sub`
under the configured issuer. Email bootstrap is confined to the retained
native Sites compatibility adapter; self-hosted OIDC and trusted-proxy
identities cannot acquire owner authority through email. This source capability
is not evidence that the production identity flow is active.

## Promotion gates

The operational stage may advance only with recorded evidence:

1. **`oauth_ready`** — protected-resource and authorization-server metadata
   are valid; PKCE uses `S256`; issuer, audience, JWKS and scopes are exact;
   Web login succeeds; forged identity headers and invalid tokens fail closed.
2. **`mcp_ready`** — a predefined or otherwise controlled client completes
   OAuth; the same issuer-qualified subject links Web and MCP; only the three
   bounded bridge tools are available; revocation and denial cases pass.
3. **`cognitive_round_trip_ready`** — a fresh conversation reads ratified
   context, stages only explicitly selected internal material, reaches the Web
   Human Gate, preserves the unchanged head before ratification and observes
   the new revision in a second fresh conversation.
4. **`dingtalk_identity_ready`** — DingTalk federation uses a stable corporate
   identifier, deprovisioning is tested and no unverified email is used as the
   durable identity key.

Until those gates pass, the correct public claim is: **GO Society Web is live;
the authenticated Cognitive Bridge is not yet connected.**

## Verification and rollback references

- Deployment procedure: [self-hosted runbook](../deploy/self-hosted/RUNBOOK.md)
- Source boundary: [GO Society Web](../web/README.md)
- Conversation contract: [Cognitive Bridge v0.5 Alpha](COGNITIVE_BRIDGE_v0.5_ALPHA.md)
- Adversarial gates: [Evaluation & Red-Team](EVALUATION_AND_RED_TEAM_v0.5.0.md)

Before changing the running instance, create and checksum a project backup,
record the current image ID and change only the `go-os-self-hosted` project.
Health after rollback is necessary but not sufficient; repeat the private and
OAuth acceptance checks applicable to the claimed stage.
