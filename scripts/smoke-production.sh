#!/usr/bin/env bash
set -Eeuo pipefail

WEB_PORT="${ELSYSTAR_SMOKE_WEB_PORT:-6310}"
ADMIN_PORT="${ELSYSTAR_SMOKE_ADMIN_PORT:-6311}"
LOG_DIR="${TMPDIR:-/tmp}/elsystar-smoke"
mkdir -p "$LOG_DIR"

WEB_PID=""
ADMIN_PID=""
cleanup() {
  if [ -n "$WEB_PID" ] && kill -0 "$WEB_PID" >/dev/null 2>&1; then kill "$WEB_PID" >/dev/null 2>&1 || true; fi
  if [ -n "$ADMIN_PID" ] && kill -0 "$ADMIN_PID" >/dev/null 2>&1; then kill "$ADMIN_PID" >/dev/null 2>&1 || true; fi
}
trap cleanup EXIT

wait_for() {
  local url="$1"
  local label="$2"
  local log="$3"
  for _ in $(seq 1 50); do
    if curl -fsS "$url" >/dev/null 2>&1; then return 0; fi
    sleep 0.2
  done
  echo "[ELSYSTAR SMOKE] ${label} did not become ready: ${url}" >&2
  tail -n 80 "$log" >&2 || true
  return 1
}

export NEXT_PUBLIC_SITE_URL="http://127.0.0.1:${WEB_PORT}"
export NEXT_PUBLIC_ADMIN_URL="http://127.0.0.1:${ADMIN_PORT}"
export SEO_INDEXING_ENABLED=false

PORT="$WEB_PORT" npm run start --workspace=@elsystar/web >"$LOG_DIR/web.log" 2>&1 &
WEB_PID=$!

ADMIN_SESSION_SECRET="smoke-admin-session-secret-0123456789abcdef" \
SECURITY_HASH_SECRET="smoke-security-hash-secret-0123456789abcdef" \
PORT="$ADMIN_PORT" npm run start --workspace=@elsystar/admin >"$LOG_DIR/admin.log" 2>&1 &
ADMIN_PID=$!

wait_for "http://127.0.0.1:${WEB_PORT}/api/health" "public app" "$LOG_DIR/web.log"
wait_for "http://127.0.0.1:${ADMIN_PORT}/api/health" "admin app" "$LOG_DIR/admin.log"

for path in / /products /solutions /projects /support /about /production /contacts /faq /robots.txt /sitemap.xml /api/health; do
  curl -fsS "http://127.0.0.1:${WEB_PORT}${path}" >/dev/null
  echo "[ELSYSTAR SMOKE] public ${path}: OK"
done

for path in /login /robots.txt /api/health; do
  curl -fsS "http://127.0.0.1:${ADMIN_PORT}${path}" >/dev/null
  echo "[ELSYSTAR SMOKE] admin ${path}: OK"
done

echo "[ELSYSTAR SMOKE] Production runtime smoke test passed."
