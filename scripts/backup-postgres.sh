#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${ELSYSTAR_BACKUP_DIR:-${ROOT}/backups}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUTPUT="${1:-${BACKUP_DIR}/elsystar_${TIMESTAMP}.dump}"
mkdir -p "$(dirname "$OUTPUT")"

if command -v pg_dump >/dev/null 2>&1 && [ -n "${DATABASE_URL:-}" ]; then
  echo "[ELSYSTAR] Creating PostgreSQL custom-format backup..."
  pg_dump --format=custom --no-owner --no-privileges --file "$OUTPUT" "$DATABASE_URL"
elif command -v docker >/dev/null 2>&1; then
  echo "[ELSYSTAR] pg_dump not found locally; using Codespaces PostgreSQL container..."
  docker compose -f "${ROOT}/.devcontainer/docker-compose.yml" exec -T db \
    pg_dump -U elsystar -d elsystar --format=custom --no-owner --no-privileges > "$OUTPUT"
else
  echo "[ELSYSTAR] pg_dump is unavailable and no Docker fallback exists." >&2
  exit 1
fi

if command -v pg_restore >/dev/null 2>&1; then
  pg_restore --list "$OUTPUT" >/dev/null
else
  cat "$OUTPUT" | docker compose -f "${ROOT}/.devcontainer/docker-compose.yml" exec -T db pg_restore --list >/dev/null
fi

sha256sum "$OUTPUT" > "${OUTPUT}.sha256"
echo "[ELSYSTAR] Backup verified: $OUTPUT"
echo "[ELSYSTAR] SHA-256 file: ${OUTPUT}.sha256"
