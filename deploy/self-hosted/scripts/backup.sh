#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
deploy_dir=$(CDPATH= cd -- "${script_dir}/.." && pwd)
compose_file="${deploy_dir}/compose.yaml"
env_file="${GO_OS_SELF_HOSTED_ENV_FILE:-${deploy_dir}/.env}"
backup_root="${1:-${deploy_dir}/backups}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required" >&2
  exit 69
fi
if [ ! -f "${env_file}" ]; then
  echo "missing environment file: ${env_file}" >&2
  exit 66
fi

compose() {
  docker compose \
    --project-directory "${deploy_dir}" \
    --env-file "${env_file}" \
    --file "${compose_file}" \
    "$@"
}

mkdir -p "${backup_root}"
backup_root=$(CDPATH= cd -- "${backup_root}" && pwd)
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
archive_name="go-os-self-hosted-${timestamp}.tar.gz"
archive_path="${backup_root}/${archive_name}"
partial_path="${archive_path}.partial.$$"
was_running=$(compose ps --status running --quiet app)

restart_if_needed() {
  if [ -n "${was_running}" ]; then
    compose start app >/dev/null
  fi
}
cleanup_and_restart() {
  rm -f -- "${partial_path}"
  restart_if_needed
}
trap cleanup_and_restart EXIT HUP INT TERM

# An offline volume snapshot is deliberate: it gives SQLite, its WAL and any
# future project-owned state one consistent recovery point without requiring a
# database CLI in the application image.
if [ -n "${was_running}" ]; then
  compose stop --timeout 30 app >/dev/null
fi

umask 077
compose run --rm --no-deps --no-TTY \
  --entrypoint sh \
  app -ec 'tar -czf - -C /data .' > "${partial_path}"
mv -- "${partial_path}" "${archive_path}"

if command -v sha256sum >/dev/null 2>&1; then
  (cd "${backup_root}" && sha256sum "${archive_name}" > "${archive_name}.sha256")
elif command -v shasum >/dev/null 2>&1; then
  (cd "${backup_root}" && shasum -a 256 "${archive_name}" > "${archive_name}.sha256")
fi

trap - EXIT HUP INT TERM
restart_if_needed
echo "backup created: ${archive_path}"
