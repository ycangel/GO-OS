ARG NODE_IMAGE=node:24.19.0-bookworm-slim

FROM ${NODE_IMAGE} AS build

WORKDIR /opt/go-os/web

ENV NEXT_TELEMETRY_DISABLED=1 \
    npm_config_audit=false \
    npm_config_fund=false \
    npm_config_update_notifier=false

COPY web/package.json web/package-lock.json ./
RUN npm ci --include=dev

COPY web/ ./

ENV GO_SELF_HOSTED=1
RUN npm run build:self-hosted


FROM ${NODE_IMAGE} AS runtime

ARG APP_UID=10001
ARG APP_GID=10001

ENV NODE_ENV=production \
    GO_SELF_HOSTED=1 \
    GO_SQLITE_PATH=/data/go-society.sqlite \
    GO_SQLITE_MIGRATIONS_DIR=/opt/go-os/web/drizzle \
    HOSTNAME=0.0.0.0 \
    PORT=3210 \
    HOME=/tmp \
    NEXT_TELEMETRY_DISABLED=1 \
    npm_config_cache=/tmp/npm-cache \
    npm_config_update_notifier=false

RUN groupadd --gid "${APP_GID}" goos \
    && useradd --uid "${APP_UID}" --gid "${APP_GID}" --no-create-home --shell /usr/sbin/nologin goos \
    && install -d -o "${APP_UID}" -g "${APP_GID}" -m 0750 /opt/go-os/web /data \
    && command -v tar >/dev/null \
    && command -v find >/dev/null

WORKDIR /opt/go-os/web

# The npm start script runs the migration from the project root and then starts
# the Next standalone server from .next/standalone. Static/public assets must
# live beside that generated server, as required by Next standalone output.
COPY --from=build --chown=${APP_UID}:${APP_GID} /opt/go-os/web/package.json /opt/go-os/web/package-lock.json ./
COPY --from=build --chown=${APP_UID}:${APP_GID} /opt/go-os/web/scripts/migrate-self-hosted.mjs ./scripts/migrate-self-hosted.mjs
COPY --from=build --chown=${APP_UID}:${APP_GID} /opt/go-os/web/drizzle/ ./drizzle/
COPY --from=build --chown=${APP_UID}:${APP_GID} /opt/go-os/web/.next/standalone/ ./.next/standalone/
COPY --from=build --chown=${APP_UID}:${APP_GID} /opt/go-os/web/public/ ./.next/standalone/public/
COPY --from=build --chown=${APP_UID}:${APP_GID} /opt/go-os/web/.next/static/ ./.next/standalone/.next/static/

USER ${APP_UID}:${APP_GID}

EXPOSE 3210
VOLUME ["/data"]

CMD ["npm", "run", "start:self-hosted"]
