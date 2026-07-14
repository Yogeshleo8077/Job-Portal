#!/bin/sh
set -e

echo "⏳ Applying database migrations…"
npx prisma migrate deploy

# Seed is idempotent (uses upsert / existence checks), so safe to run every boot.
# Set SEED_ON_START=false to skip it.
if [ "${SEED_ON_START:-true}" = "true" ]; then
  echo "🌱 Seeding database (idempotent)…"
  node dist/prisma/seed.js || echo "⚠️  Seed step failed (continuing) — check logs."
fi

echo "🚀 Starting server…"
exec node dist/server.js
