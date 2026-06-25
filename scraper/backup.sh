#!/usr/bin/env bash
#
# Point-in-time backup of the two sources of truth: Neon (DB) + media/ (files).
# Writes timestamped artifacts into backups/ (gitignored). Re-run any time.
#
#   scraper/backup.sh          # back up both
#   scraper/backup.sh db       # DB only
#   scraper/backup.sh media    # media only
#
# DB dump uses the v18 client (local/Neon are PG18) over DATABASE_URL from .env,
# custom format, excluding spatial_ref_sys (PostGIS recreates it on restore).
# Restore with:  pg_restore --no-owner --no-privileges -d "<target>" <file>.dump

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="/opt/homebrew/opt/postgresql@18/bin"
BK="$ROOT/backups"
TS="$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BK"

what="${1:-all}"

backup_db() {
  local url
  url="$(grep -E '^DATABASE_URL=' "$ROOT/.env" | head -1 | cut -d= -f2-)"
  [ -z "$url" ] && { echo "ERROR: DATABASE_URL empty in $ROOT/.env" >&2; exit 1; }
  local out="$BK/neon_${TS}.dump"
  echo "==> DB dump -> $out"
  "$PGBIN/pg_dump" -Fc --no-owner --no-privileges \
    --exclude-table-data='public.spatial_ref_sys' -d "$url" -f "$out"
  echo "    $(du -h "$out" | cut -f1)  ($("$PGBIN/pg_restore" -l "$out" | grep -c 'TABLE DATA') tables of data)"
}

backup_media() {
  local out="$BK/media_${TS}.tar.gz"
  echo "==> media archive -> $out"
  # -C so paths inside the tar are media/... ; exclude macOS cruft
  tar --exclude='.DS_Store' -czf "$out" -C "$ROOT" media
  echo "    $(du -h "$out" | cut -f1)  ($(tar -tzf "$out" | grep -c '[^/]$') files)"
}

case "$what" in
  db)    backup_db ;;
  media) backup_media ;;
  all)   backup_db; backup_media ;;
  *) echo "usage: $0 [db|media|all]" >&2; exit 1 ;;
esac

echo "==> backups in $BK:"
ls -lh "$BK" | tail -n +2 | sed 's/^/    /'
