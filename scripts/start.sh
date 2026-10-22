#!/bin/sh
# Production start. On first boot the database file does not exist yet, so it is
# copied from deploy/initial.db (a snapshot that includes LLM results), or built
# from the team dataset if no snapshot is present. After that the file persists.
set -e
DB="${AI_TRACE_DB:-/app/data/ai-trace.db}"
mkdir -p "$(dirname "$DB")"
if [ ! -f "$DB" ]; then
  if [ -f deploy/initial.db ]; then
    echo "First boot: copying deploy/initial.db to $DB"
    cp deploy/initial.db "$DB"
  else
    echo "First boot: seeding $DB from the team dataset"
    AI_TRACE_DB="$DB" npx tsx scripts/seed.ts
  fi
fi
exec npx next start -H 0.0.0.0 -p "${PORT:-3000}"
