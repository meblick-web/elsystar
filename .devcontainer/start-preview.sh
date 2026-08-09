#!/usr/bin/env bash
set -euo pipefail

cd /workspace
mkdir -p .codespaces/logs

stop_if_running() {
  local pattern="$1"
  pkill -f "$pattern" >/dev/null 2>&1 || true
}

stop_if_running "next dev -p 6300"
stop_if_running "next dev -p 6301"

nohup npm run dev:web > .codespaces/logs/web.log 2>&1 &
nohup npm run dev:admin > .codespaces/logs/admin.log 2>&1 &

for port in 6300 6301; do
  for i in $(seq 1 45); do
    if curl -fsS "http://127.0.0.1:${port}" >/dev/null 2>&1; then
      echo "[ELSYSTAR] Port ${port} is ready."
      break
    fi
    if [ "$i" -eq 45 ]; then
      echo "[ELSYSTAR] Port ${port} did not become ready. Check .codespaces/logs/." >&2
    fi
    sleep 2
  done
done

echo "[ELSYSTAR] Public site: http://localhost:6300"
echo "[ELSYSTAR] Admin:       http://localhost:6301"
