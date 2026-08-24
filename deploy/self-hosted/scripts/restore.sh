#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
deploy_dir=$(CDPATH= cd -- "${script_dir}/.." && pwd)
compose_file="${deploy_dir}/compose.yaml"
env_file="${GO_OS_SELF_HOSTED_ENV_FILE:-${deploy_dir}/.env}"
backup_file="${1:-}"
confirmation="${2:-}"

usage() {
  echo "usage: $0 /absolute/path/to/backup.tar.gz [--yes]" >&2
  exit 64
}

[ -n "${backup_file}" ] || usage
[ -f "${backup_file}" ] || {
  echo "backup does not exist: ${backup_file}" >&2
  exit 66
}
[ -f "${env_file}" ] || {
  echo "missing environment file: ${env_file}" >&2
  exit 66
}
command -v docker >/dev/null 2>&1 || {
  echo "docker is required" >&2
  exit 69
}

backup_dir=$(CDPATH= cd -- "$(dirname -- "${backup_file}")" && pwd)
backup_file="${backup_dir}/$(basename -- "${backup_file}")"

if [ -f "${backup_file}.sha256" ]; then
  checksum_name="$(basename -- "${backup_file}.sha256")"
  if command -v sha256sum >/dev/null 2>&1; then
    (cd "${backup_dir}" && sha256sum --check "${checksum_name}")
  elif command -v shasum >/dev/null 2>&1; then
    (cd "${backup_dir}" && shasum -a 256 --check "${checksum_name}")
  else
    echo "warning: checksum exists but no SHA-256 tool is available" >&2
  fi
fi

if [ "${confirmation}" != "--yes" ]; then
  printf 'This replaces the isolated GO-OS data volume after making a safety backup. Type RESTORE to continue: '
  read -r answer
  [ "${answer}" = "RESTORE" ] || {
    echo "restore cancelled" >&2
    exit 1
  }
fi

compose() {
  docker compose \
    --project-directory "${deploy_dir}" \
    --env-file "${env_file}" \
    --file "${compose_file}" \
    "$@"
}

# Validate readability before stopping the live application. The second pass
# rejects absolute and parent-traversal members before anything is replaced.
# Streaming through the host process preserves operator ownership and avoids a
# bind-mount UID mismatch on Linux.
compose run --rm --no-deps --no-TTY \
  --entrypoint sh \
  app -ec 'tar -tzf - >/dev/null' < "${backup_file}"
compose run --rm --no-deps --no-TTY \
  --entrypoint sh \
  app -ec '
    tar -tzf - | while IFS= read -r member; do
      case "${member}" in
        /*|../*|*/../*|*/..) echo "unsafe archive member: ${member}" >&2; exit 65 ;;
      esac
    done
  ' < "${backup_file}"

# Always create a recoverable pre-restore snapshot first.
"${script_dir}/backup.sh" "${deploy_dir}/backups/pre-restore"

was_running=$(compose ps --status running --quiet app)
restart_if_needed() {
  if [ -n "${was_running}" ]; then
    compose start app >/dev/null
  fi
}
trap restart_if_needed EXIT HUP INT TERM

if [ -n "${was_running}" ]; then
  compose stop --timeout 30 app >/dev/null
fi

compose run --rm --no-deps --no-TTY \
  --entrypoint sh \
  app -ec '
    find /data -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
    tar -xzf - -C /data
  ' < "${backup_file}"

trap - EXIT HUP INT TERM
restart_if_needed
echo "restore complete from: ${backup_file}"
