#!/usr/bin/env bash
set -euo pipefail

cd /workspace
mkdir -p .codespaces/logs .codespaces/pids

DOMAIN="${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
if [ -n "${CODESPACE_NAME:-}" ]; then
  SITE_URL="https://${CODESPACE_NAME}-6300.${DOMAIN}"
  ADMIN_URL="https://${CODESPACE_NAME}-6301.${DOMAIN}"
else
  SITE_URL="http://localhost:6300"
  ADMIN_URL="http://localhost:6301"
fi

echo "[ELSYSTAR] Syncing Prisma client and development schema..."
if ! npm run db:generate >.codespaces/logs/prisma-generate.log 2>&1; then
  tail -n 100 .codespaces/logs/prisma-generate.log >&2 || true
  exit 1
fi
if ! npm run db:push >.codespaces/logs/db-push.log 2>&1; then
  tail -n 100 .codespaces/logs/db-push.log >&2 || true
  exit 1
fi

start_service() {
  local name="$1"
  local port="$2"
  local workspace="$3"
  local log_file=".codespaces/logs/${name}.log"
  local pid_file=".codespaces/pids/${name}.pid"

  if curl -fsS "http://127.0.0.1:${port}" >/dev/null 2>&1; then
    echo "[ELSYSTAR] ${name} already listening on ${port}."
    return 0
  fi

  if [ -f "$pid_file" ]; then
    local old_pid
    old_pid="$(cat "$pid_file" 2>/dev/null || true)"
    if [ -n "$old_pid" ] && kill -0 "$old_pid" >/dev/null 2>&1; then
      kill "$old_pid" >/dev/null 2>&1 || true
      sleep 1
    fi
    rm -f "$pid_file"
  fi

  : > "$log_file"
  echo "[ELSYSTAR] Starting ${name} on ${port}..."

  setsid bash -lc "cd /workspace && export NEXT_PUBLIC_SITE_URL='${SITE_URL}' NEXT_PUBLIC_ADMIN_URL='${ADMIN_URL}' && exec npm run dev --workspace='${workspace}' -- --hostname 0.0.0.0" \
    </dev/null >>"$log_file" 2>&1 &
  local pid=$!
  echo "$pid" > "$pid_file"

  for i in $(seq 1 60); do
    if curl -fsS "http://127.0.0.1:${port}" >/dev/null 2>&1; then
      echo "[ELSYSTAR] ${name} is ready on ${port} (pid ${pid})."
      return 0
    fi

    if ! kill -0 "$pid" >/dev/null 2>&1; then
      echo "[ELSYSTAR] ${name} exited before becoming ready." >&2
      echo "----- ${log_file} -----" >&2
      tail -n 80 "$log_file" >&2 || true
      return 1
    fi

    sleep 2
  done

  echo "[ELSYSTAR] ${name} did not become ready on ${port}." >&2
  echo "----- ${log_file} -----" >&2
  tail -n 80 "$log_file" >&2 || true
  return 1
}

start_service "web" 6300 "@elsystar/web"
start_service "admin" 6301 "@elsystar/admin"

echo "[ELSYSTAR] Preview is ready."
echo "[ELSYSTAR] Public site: ${SITE_URL}"
echo "[ELSYSTAR] Admin:       ${ADMIN_URL}"
