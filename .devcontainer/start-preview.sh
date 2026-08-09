#!/usr/bin/env bash
set -Eeuo pipefail

cd /workspace
mkdir -p .codespaces/logs .codespaces/pids

DOMAIN="${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
if [ -n "${CODESPACE_NAME:-}" ]; then
  SITE_HOST="${CODESPACE_NAME}-6300.${DOMAIN}"
  ADMIN_HOST="${CODESPACE_NAME}-6301.${DOMAIN}"
  SITE_URL="https://${SITE_HOST}"
  ADMIN_URL="https://${ADMIN_HOST}"
else
  SITE_HOST="localhost:6300"
  ADMIN_HOST="localhost:6301"
  SITE_URL="http://${SITE_HOST}"
  ADMIN_URL="http://${ADMIN_HOST}"
fi

stop_pid_file() {
  local pid_file="$1"
  local label="$2"
  if [ ! -f "$pid_file" ]; then return 0; fi
  local old_pid
  old_pid="$(cat "$pid_file" 2>/dev/null || true)"
  if [ -n "$old_pid" ] && kill -0 "$old_pid" >/dev/null 2>&1; then
    echo "[ELSYSTAR] Stopping ${label} (pid ${old_pid})..."
    kill -TERM -- "-${old_pid}" >/dev/null 2>&1 || kill -TERM "$old_pid" >/dev/null 2>&1 || true
    for _ in $(seq 1 20); do
      if ! kill -0 "$old_pid" >/dev/null 2>&1; then break; fi
      sleep 0.25
    done
    kill -KILL -- "-${old_pid}" >/dev/null 2>&1 || true
  fi
  rm -f "$pid_file"
}

stop_service() {
  local name="$1"
  local public_port="$2"
  local internal_port="$3"

  stop_pid_file ".codespaces/pids/${name}-proxy.pid" "${name} proxy"
  stop_pid_file ".codespaces/pids/${name}-next.pid" "${name} Next.js"

  pkill -f "codespaces-next-proxy.mjs --listen ${public_port}" >/dev/null 2>&1 || true
  pkill -f "next dev -p ${internal_port}" >/dev/null 2>&1 || true
  pkill -f "next-server.*${internal_port}" >/dev/null 2>&1 || true
  sleep 0.5
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

wait_for_http() {
  local url="$1"
  local pid="$2"
  local label="$3"
  local log_file="$4"

  for _ in $(seq 1 60); do
    if curl -fsS "$url" >/dev/null 2>&1; then return 0; fi
    if ! kill -0 "$pid" >/dev/null 2>&1; then
      echo "[ELSYSTAR] ${label} exited before becoming ready." >&2
      echo "----- ${log_file} -----" >&2
      tail -n 120 "$log_file" >&2 || true
      return 1
    fi
    sleep 2
  done

  echo "[ELSYSTAR] ${label} did not become ready." >&2
  echo "----- ${log_file} -----" >&2
  tail -n 120 "$log_file" >&2 || true
  return 1
}

start_service() {
  local name="$1"
  local public_port="$2"
  local internal_port="$3"
  local app_dir="$4"
  local allowed_host="$5"
  local next_log=".codespaces/logs/${name}.log"
  local proxy_log=".codespaces/logs/${name}-proxy.log"

  : > "$next_log"
  : > "$proxy_log"
  echo "[ELSYSTAR] Starting ${name} Next.js on internal port ${internal_port}..."

  setsid bash -lc "cd '/workspace/${app_dir}' && export NEXT_PUBLIC_SITE_URL='${SITE_URL}' NEXT_PUBLIC_ADMIN_URL='${ADMIN_URL}' SEO_INDEXING_ENABLED='false' && exec ../../node_modules/.bin/next dev -p '${internal_port}' --hostname 127.0.0.1" \
    </dev/null >>"$next_log" 2>&1 &
  local next_pid=$!
  echo "$next_pid" > ".codespaces/pids/${name}-next.pid"
  wait_for_http "http://127.0.0.1:${internal_port}" "$next_pid" "${name} Next.js" "$next_log"

  echo "[ELSYSTAR] Starting ${name} proxy on public port ${public_port}..."
  setsid node .devcontainer/codespaces-next-proxy.mjs --listen "$public_port" --target "$internal_port" --allowed-host "$allowed_host" \
    </dev/null >>"$proxy_log" 2>&1 &
  local proxy_pid=$!
  echo "$proxy_pid" > ".codespaces/pids/${name}-proxy.pid"
  wait_for_http "http://127.0.0.1:${public_port}" "$proxy_pid" "${name} proxy" "$proxy_log"

  echo "[ELSYSTAR] ${name} is ready on ${public_port} (Next ${next_pid}, proxy ${proxy_pid})."
}

echo "[ELSYSTAR] Restarting preview on the current repository revision..."
stop_service "web" 6300 16300
stop_service "admin" 6301 16301

rm -rf apps/web/.next apps/admin/.next

run_step "Generating Prisma client" 180 .codespaces/logs/prisma-generate.log npm run db:generate
run_step "Synchronizing development database schema" 180 .codespaces/logs/db-push.log node packages/database/scripts/codespaces-safe-push.mjs
run_step "Importing visible content into CMS" 120 .codespaces/logs/content-bootstrap.log node packages/database/scripts/bootstrap-visible-content.mjs
run_step "Synchronizing alpha9.3 CMS QA fields" 120 .codespaces/logs/content-qa-bootstrap.log node packages/database/scripts/bootstrap-content-qa-alpha9-3.mjs
run_step "Synchronizing beta2 SEO defaults and redirects" 120 .codespaces/logs/seo-bootstrap.log node packages/database/scripts/bootstrap-seo-beta2.mjs

start_service "web" 6300 16300 "apps/web" "$SITE_HOST"
start_service "admin" 6301 16301 "apps/admin" "$ADMIN_HOST"

echo "[ELSYSTAR] Preview is ready."
echo "[ELSYSTAR] Public site: ${SITE_URL}"
echo "[ELSYSTAR] Admin:       ${ADMIN_URL}"
echo "[ELSYSTAR] Search indexing is disabled for preview environments."
