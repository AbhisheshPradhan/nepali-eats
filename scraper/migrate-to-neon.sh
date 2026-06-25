#!/usr/bin/env bash
#
# One-shot migration: local Postgres `nepali_eats` -> Neon.
#
# Local server is PG18, Neon is PG18, but the pg_dump on PATH may be v17 (which
# can't dump an 18 server), so we pin the v18 client tools explicitly.
#
# Requires DATABASE_URL in the root .env: the DIRECT (non-pooler) Neon string.
# Bulk COPY/DDL must go over the direct endpoint, not the pooler.
#
# What it does:
#   1. Enables PostGIS on Neon (idempotent).
#   2. Dumps local in custom format, EXCLUDING spatial_ref_sys *data* (that table
#      belongs to the PostGIS extension and is repopulated when the extension is
#      created; dumping its 8500 rows would just cause PK conflicts).
#   3. Restores into Neon (--no-owner/--no-privileges so objects belong to the
#      Neon role). pg_restore continues past the harmless "extension already
#      exists" / "permission denied to comment on extension" notices.
#   4. Verifies row counts match for every table.
#
# Re-runnable, but it does NOT --clean; run against an empty Neon DB the first
# time. Source of truth stays local until you flip DATABASE_URL after this.

set -euo pipefail

PGBIN="/opt/homebrew/opt/postgresql@18/bin"
LOCAL_URL="postgresql://abhisheshpradhan@localhost:5432/nepali_eats"

# Load DATABASE_URL from the root .env without exporting the whole file.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATABASE_URL="${DATABASE_URL:-$(grep -E '^DATABASE_URL=' "$ROOT/.env" 2>/dev/null | head -1 | cut -d= -f2-)}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is empty. Paste the Neon DIRECT (non-pooler) string into $ROOT/.env" >&2
  exit 1
fi
case "$DATABASE_URL" in
  *-pooler.*) echo "ERROR: that looks like the POOLER string (has '-pooler'). Use the DIRECT one for migration." >&2; exit 1 ;;
esac

DUMP="${TMPDIR:-/tmp}/nepali_eats_$(date +%Y%m%d_%H%M%S).dump"

echo "==> 1/4  Enable PostGIS on Neon"
"$PGBIN/psql" "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "CREATE EXTENSION IF NOT EXISTS postgis;"
"$PGBIN/psql" "$DATABASE_URL" -t -c "SELECT 'PostGIS ' || postgis_full_version();" | sed 's/^/    /'

echo "==> 2/4  Dump local -> $DUMP"
"$PGBIN/pg_dump" -Fc --no-owner --no-privileges \
  --exclude-table-data='public.spatial_ref_sys' \
  -d "$LOCAL_URL" -f "$DUMP"
echo "    dump size: $(du -h "$DUMP" | cut -f1)"

echo "==> 3/4  Restore into Neon (extension/comment notices are expected and harmless)"
"$PGBIN/pg_restore" --no-owner --no-privileges \
  -d "$DATABASE_URL" "$DUMP" 2> >(grep -vE 'already exists|must be owner|permission denied to (comment|create)' >&2) || true

echo "==> 4/4  Verify row counts (local vs Neon)"
TABLES="restaurants restaurant_photos restaurant_owners saved_restaurants users"
fail=0
for t in $TABLES; do
  l=$("$PGBIN/psql" "$LOCAL_URL"       -t -A -c "SELECT count(*) FROM $t")
  n=$("$PGBIN/psql" "$DATABASE_URL" -t -A -c "SELECT count(*) FROM $t")
  if [ "$l" = "$n" ]; then status="OK"; else status="MISMATCH"; fail=1; fi
  printf "    %-20s local=%-6s neon=%-6s %s\n" "$t" "$l" "$n" "$status"
done

# Spot-check PostGIS actually works (bbox query returns rows).
geo=$("$PGBIN/psql" "$DATABASE_URL" -t -A -c \
  "SELECT count(*) FROM restaurants WHERE geom && ST_MakeEnvelope(150,-34,151.5,-33,4326)")
echo "    PostGIS bbox spot-check (Sydney): $geo rows"

if [ "$fail" = "0" ]; then
  echo "==> DONE: all tables match. Neon is loaded."
else
  echo "==> WARNING: row-count mismatch above — investigate before flipping DATABASE_URL." >&2
  exit 1
fi
