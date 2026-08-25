# GO-OS isolated self-hosted runbook

This package runs one GO-OS Web instance without reusing another Compose
project, container, network or data volume. Its default listener is
`127.0.0.1:3210`; it is not reachable from another machine until the optional
`https` profile is deliberately enabled.

The application container runs as UID/GID `10001`, has no Linux capabilities,
uses a read-only root filesystem and is limited to 1 CPU, 512 MiB RAM and 256
processes. With the optional gateway and login proxy enabled, the complete
stack is capped at 1.3 CPU and 704 MiB RAM, leaving host and Docker headroom on
the minimum 2 CPU / approximately 1 GiB host.

## Isolation contract

- Compose project: `go-os-self-hosted`
- application image: `go-os-self-hosted-app:local`
- network: `go-os-self-hosted-net-v1`
- SQLite volume: `go-os-self-hosted-data-v1`
- Caddy volumes: `go-os-self-hosted-caddy-data-v1` and
  `go-os-self-hosted-caddy-config-v1`
- default host socket: `127.0.0.1:3210`

Do not rename these resources to match another project. Do not run `docker
compose down --volumes` as routine maintenance: that explicitly deletes this
instance's database and Caddy state. None of the commands below stop, remove or
reuse containers belonging to another Compose project.

### Temporary IP-only preview

The application listener can be moved off loopback for a short-lived,
anonymous read-only preview by setting `GO_BIND_IP=0.0.0.0`. This mode is not a
member login, private cognitive workspace, write path or MCP endpoint. Plain
HTTP does not provide the confidentiality or verified origin required for
credentials, bearer tokens or private organizational cognition.

Use this mode only when the host or cloud firewall restricts `GO_HOST_PORT` to
one explicitly approved source address (`/32`). Never expose it to
`0.0.0.0/0`. Keep `GO_PUBLIC_ORIGIN=http://127.0.0.1:3210`, leave the `https`
profile disabled and do not publish ports 80 or 443 from this project. Audit
the anonymous `/api/runtime` response before opening the port because its
Mission and Capability content is public by design.

After the preview, restore `GO_BIND_IP=127.0.0.1` before configuring the shared
reverse proxy, domain, HTTPS and OIDC. The existing SSH tunnel remains the safe
fully functional access path until that work is complete.

## 1. Prerequisites and configuration

Install Docker Engine with Docker Compose v2. Run all commands from this
directory.

```sh
cp .env.example .env
chmod 600 .env
```

Fill the MCP resource-server values in `.env`. Set either
`GO_OAUTH_JWKS_URI` or `GO_OAUTH_JWKS_JSON`, not both, unless the application
auth contract explicitly says otherwise. Treat inline JWKS JSON as sensitive
configuration even when it contains public keys.

Generate the Web trusted-proxy secret locally with a cryptographically secure
secret manager or random generator. Use at least 32 random bytes rendered as
64 hexadecimal characters and place the result only in
`GO_WEB_IDENTITY_SECRET` in `.env`. The application
must stay in `GO_WEB_IDENTITY_MODE=trusted-proxy` for deployment. Requests that
do not carry the matching internal secret must fail closed rather than trust
user-supplied identity headers.

Set `GO_SOCIETY_OWNER_EMAIL` to the exact email claim of the intended initial
OIDC owner. Generate `GO_SOCIETY_PRINCIPAL_HMAC_SECRET` and
`GO_SOCIETY_THREAD_HMAC_SECRET` independently, each with at least 32 random
bytes (64 hexadecimal characters). They bind different identifiers and must
not equal each other, `GO_WEB_IDENTITY_SECRET`, the oauth2-proxy cookie secret
or an OAuth client secret. Write generated values directly into the mode-0600
`.env` file or a secrets manager; do not print them into shared terminal logs.

## 2. Build and start loopback-only

```sh
docker compose --env-file .env config --quiet
docker compose --env-file .env build app
docker compose --env-file .env up -d app
docker compose --env-file .env ps
curl --fail --silent --show-error http://127.0.0.1:3210/api/health
```

The first build downloads the pinned base image and locked npm dependencies.
Later starts use only this project's local image and volume. A healthy HTTP
response proves the process and database can answer the bounded health probe;
it does not prove OAuth, authorization policy or a real user flow.

Inspect bounded logs without exposing environment values:

```sh
docker compose --env-file .env logs --tail 100 app
```

Never share `docker compose config` output: Compose may render interpolated
secret values into that output.

## 3. Back up and restore

Backups stop only this project's `app` service briefly so the SQLite file, WAL
and any future project-owned files form one consistent snapshot. The HTTPS
gateway may return a temporary upstream error during this interval.

```sh
./scripts/backup.sh
```

Archives are written under ignored `backups/` with a checksum when the host has
`sha256sum` or `shasum`. Copy backups off the server using the operator's normal
encrypted backup channel.

Test restore only during a maintenance window:

```sh
./scripts/restore.sh /absolute/path/to/go-os-self-hosted-TIMESTAMP.tar.gz
```

Restore validates the archive, creates an additional `backups/pre-restore/`
safety snapshot, replaces only `go-os-self-hosted-data-v1`, and restarts the app
only if it was running before. Afterward, require both a healthy probe and an
authenticated read of expected data.

## 4. Optional domain HTTPS and OIDC Web login

Do not enable this profile until all of the following are true:

1. `GO_DOMAIN` resolves to this host and `GO_PUBLIC_ORIGIN` is exactly
   `https://<GO_DOMAIN>`.
2. `CADDY_ACME_EMAIL` is set to an address monitored by the operator.
3. Host ports 80 and 443 are unused. Inspect first; do not stop another
   project's reverse proxy to make room. If those ports are owned, keep this
   profile disabled and design an explicit integration with that existing
   gateway.
4. The OIDC provider permits
   `https://<GO_DOMAIN>/oauth2/callback` for the dedicated Web client.
5. `OAUTH2_PROXY_OIDC_ISSUER_URL`, `OAUTH2_PROXY_CLIENT_ID`,
   `OAUTH2_PROXY_CLIENT_SECRET`, `OAUTH2_PROXY_COOKIE_SECRET` and a deliberately
   restricted `OAUTH2_PROXY_EMAIL_DOMAINS` policy are set. Use `*` only after an
   explicit decision that every identity at the issuer may attempt Web login.
6. `OAUTH2_PROXY_OIDC_ISSUER_URL` exactly equals `GO_OAUTH_ISSUER`, and the
   issuer's OIDC `sub` is the same stable subject used by MCP access tokens.
   Compose fixes oauth2-proxy's user-id claim to `sub` and rejects a gateway
   start when the issuers differ; changing either condition breaks principal
   linking.

Generate a dedicated 32-byte oauth2-proxy cookie secret with a
cryptographically secure secret manager or random generator and store it only
in `.env`. Do not reuse or print any application binding secret.

Validate and start the opt-in profile:

```sh
docker compose --env-file .env --profile https config --quiet
docker compose --env-file .env --profile https up -d --build
docker compose --env-file .env --profile https ps
```

Caddy publishes 80/443 and obtains certificates for only `GO_DOMAIN`.
`/mcp`, `/mcp/*`, OAuth protected-resource metadata and `/api/health` go
directly to the application, where MCP bearer-token validation still applies.
The application also bounds MCP traffic per proxy-confirmed source and caps
concurrent MCP requests; these are minimum instance protections, not a
substitute for upstream denial-of-service protection.
All other Web paths pass through oauth2-proxy. oauth2-proxy forwards the OIDC
`sub`; an unexposed internal Caddy hop maps it to
`GO_WEB_IDENTITY_ID_HEADER` and adds `GO_WEB_IDENTITY_SECRET`. Public requests
have all trusted identity headers stripped before either route.

The application's existing `/signin-with-chatgpt` and
`/signout-with-chatgpt` links are intercepted only at this gateway. They use
fixed, same-origin return targets when redirecting to oauth2-proxy, so an
untrusted `return_to` query cannot become an open redirect. The source routes
remain unchanged for Sites compatibility.

Acceptance checks:

- unauthenticated Web navigation redirects to the intended OIDC issuer;
- login returns to the exact HTTPS origin and shows the intended member;
- a forged public trusted-identity header is ignored;
- `/mcp` without a valid bearer token fails closed;
- MCP and Web sessions for the same person resolve the same OIDC `sub`;
- revoked, wrong-audience and insufficient-scope tokens fail closed;
- `docker stats` stays below the declared 1.3 CPU / 704 MiB project envelope.

## 5. Updates and rollback

Before an update, create a backup and record the current image ID:

```sh
./scripts/backup.sh
docker image inspect go-os-self-hosted-app:local --format '{{.Id}}'
```

Build the candidate image without touching the running container, then replace
only this project after the build succeeds:

```sh
docker compose --env-file .env build app
docker compose --env-file .env up -d app
```

Run the health and authenticated acceptance checks again. An application-image
rollback and a database restore are separate decisions: do not restore data
merely because an image rollback is needed.

## 6. Stop without deleting data

```sh
docker compose --env-file .env stop
```

`docker compose --env-file .env down` removes only this project's containers
and network but retains named volumes by default. Verify a current off-host
backup before any intentional volume deletion.
