#!/usr/bin/env bash
set -euo pipefail

cd /workspace

echo "[ELSYSTAR] Installing dependencies..."
npm install

echo "[ELSYSTAR] Generating Prisma client..."
npm run db:generate

echo "[ELSYSTAR] Applying development database schema..."
for i in $(seq 1 30); do
  if npm run db:push; then
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "[ELSYSTAR] Database did not become ready." >&2
    exit 1
  fi
  sleep 2
done

mkdir -p .codespaces/logs

echo "[ELSYSTAR] Cloud development environment is ready."
