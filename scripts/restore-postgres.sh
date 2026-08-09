#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP="${1:-}"

if [ -z "$BACKUP" ] || [ ! -f "$BACKUP" ]; then
  echo "Usage: ELSYSTAR_RESTORE_CONFIRM=YES bash scripts/restore-postgres.sh <backup.dump>" >&2
  exit 2
fi
if [ "${ELSYSTAR_RESTORE_CONFIRM:-}" != "YES" ]; then
  echo "[ELSYSTAR] Restore refused. Set ELSYSTAR_RESTORE_CONFIRM=YES explicitly." >&2
  exit 3
fi

if [ -f "${BACKUP}.sha256" ]; then
  (cd "$(dirname "$BACKUP")" && sha256sum -c "$(basename "${BACKUP}.sha256")")
else
  echo "[ELSYSTAR] Warning: no SHA-256 sidecar found; validating archive structure only." >&2
fi

if command -v pg_restore >/dev/null 2>&1 && [ -n "${DATABASE_URL:-}" ]; then
  pg_restore --list "$BACKUP" >/dev/null
  echo "[ELSYSTAR] Restoring PostgreSQL archive..."
  pg_restore --clean --if-exists --no-owner --no-privileges --exit-on-error --dbname "$DATABASE_URL" "$BACKUP"
  if command -v psql >/dev/null 2>&1; then psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c 'ANALYZE;' >/dev/null; fi
elif command -v docker >/dev/null 2>&1; then
  cat "$BACKUP" | docker compose -f "${ROOT}/.devcontainer/docker-compose.yml" exec -T db pg_restore --list >/dev/null
  echo "[ELSYSTAR] Restoring through Codespaces PostgreSQL container..."
  cat "$BACKUP" | docker compose -f "${ROOT}/.devcontainer/docker-compose.yml" exec -T db \
    pg_restore -U elsystar -d elsystar --clean --if-exists --no-owner --no-privileges --exit-on-error
  docker compose -f "${ROOT}/.devcontainer/docker-compose.yml" exec -T db psql -U elsystar -d elsystar -v ON_ERROR_STOP=1 -c 'ANALYZE;' >/dev/null
else
  echo "[ELSYSTAR] pg_restore is unavailable and no Docker fallback exists." >&2
  exit 1
fi

echo "[ELSYSTAR] Restore completed successfully. Restart the application before verification."
