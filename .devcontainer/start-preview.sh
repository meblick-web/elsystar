#!/usr/bin/env bash
set -Eeuo pipefail

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

stop_service() {
  local name="$1"
  local port="$2"
  local pid_file=".codespaces/pids/${name}.pid"

  if [ -f "$pid_file" ]; then
    local old_pid
    old_pid="$(cat "$pid_file" 2>/dev/null || true)"
    if [ -n "$old_pid" ] && kill -0 "$old_pid" >/dev/null 2>&1; then
      echo "[ELSYSTAR] Stopping ${name} (pid ${old_pid})..."
      kill -TERM -- "-${old_pid}" >/dev/null 2>&1 || kill -TERM "$old_pid" >/dev/null 2>&1 || true
      for _ in $(seq 1 20); do
        if ! kill -0 "$old_pid" >/dev/null 2>&1; then
          break
        fi
        sleep 0.25
      done
      kill -KILL -- "-${old_pid}" >/dev/null 2>&1 || true
    fi
    rm -f "$pid_file"
  fi

  # Fallback for processes started by an older preview script that did not
  # preserve a usable PID file.
  if curl -fsS "http://127.0.0.1:${port}" >/dev/null 2>&1; then
    echo "[ELSYSTAR] Stopping stale process on ${port}..."
    pkill -f "next dev -p ${port}" >/dev/null 2>&1 || true
    pkill -f "next-server.*${port}" >/dev/null 2>&1 || true
    sleep 1
  fi
}

run_step() {
  local label="$1"
  local timeout_seconds="$2"
  local log_file="$3"
  shift 3

  echo "[ELSYSTAR] ${label}..."
  : > "$log_file"

  set +e
  timeout "${timeout_seconds}s" "$@" 2>&1 | tee "$log_file"
  local command_status=${PIPESTATUS[0]}
  set -e

  if [ "$command_status" -eq 124 ]; then
    echo "[ELSYSTAR] ${label} timed out after ${timeout_seconds}s." >&2
    return 1
  fi
  if [ "$command_status" -ne 0 ]; then
    echo "[ELSYSTAR] ${label} failed with exit code ${command_status}." >&2
    return "$command_status"
  fi

  echo "[ELSYSTAR] ${label}: done."
}

start_service() {
  local name="$1"
  local port="$2"
  local workspace="$3"
  local log_file=".codespaces/logs/${name}.log"
  local pid_file=".codespaces/pids/${name}.pid"

  if curl -fsS "http://127.0.0.1:${port}" >/dev/null 2>&1; then
    echo "[ELSYSTAR] Port ${port} is still occupied; refusing to start a mixed-version preview." >&2
    return 1
  fi

  : > "$log_file"
  echo "[ELSYSTAR] Starting ${name} on ${port}..."

  setsid bash -lc "cd /workspace && export NEXT_PUBLIC_SITE_URL='${SITE_URL}' NEXT_PUBLIC_ADMIN_URL='${ADMIN_URL}' && exec npm run dev --workspace='${workspace}' -- --hostname 0.0.0.0" \
    </dev/null >>"$log_file" 2>&1 &
  local pid=$!
  echo "$pid" > "$pid_file"

  for _ in $(seq 1 60); do
    if curl -fsS "http://127.0.0.1:${port}" >/dev/null 2>&1; then
      echo "[ELSYSTAR] ${name} is ready on ${port} (pid ${pid})."
      return 0
    fi

    if ! kill -0 "$pid" >/dev/null 2>&1; then
      echo "[ELSYSTAR] ${name} exited before becoming ready." >&2
      echo "----- ${log_file} -----" >&2
      tail -n 100 "$log_file" >&2 || true
      return 1
    fi

    sleep 2
  done

  echo "[ELSYSTAR] ${name} did not become ready on ${port}." >&2
  echo "----- ${log_file} -----" >&2
  tail -n 100 "$log_file" >&2 || true
  return 1
}

echo "[ELSYSTAR] Restarting preview on the current repository revision..."
stop_service "web" 6300
stop_service "admin" 6301

# Server Action manifests and Turbopack state are tied to a particular source
# revision. Remove them before starting a preview after git pull.
rm -rf apps/web/.next apps/admin/.next

run_step "Generating Prisma client" 180 .codespaces/logs/prisma-generate.log npm run db:generate
run_step "Synchronizing development database schema" 180 .codespaces/logs/db-push.log npm run db:push

start_service "web" 6300 "@elsystar/web"
start_service "admin" 6301 "@elsystar/admin"

echo "[ELSYSTAR] Preview is ready."
echo "[ELSYSTAR] Public site: ${SITE_URL}"
echo "[ELSYSTAR] Admin:       ${ADMIN_URL}"
