#!/usr/bin/env bash
#
# Sync media/ -> Cloudflare R2 over the S3-compatible API.
#
# Reads R2_* from the root .env. Content-Type is auto-detected by the AWS CLI
# (its bundled mimetypes knows webp/avif/svg/jpg/png/pdf), so a single sync pass
# tags every object correctly. Idempotent: re-running only uploads changed files.
#
# Usage:
#   scraper/upload-media-r2.sh --dry-run   # preview what would upload
#   scraper/upload-media-r2.sh             # do it
#
# After a successful run, set NEXT_PUBLIC_MEDIA_BASE=$R2_PUBLIC_BASE in web/.env*
# (and Vercel) so the app serves from R2 instead of the local /media symlink.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENVF="$ROOT/.env"
get() { { grep -E "^$1=" "$ENVF" 2>/dev/null || true; } | head -1 | cut -d= -f2- | tr -d '\n'; }

R2_S3_API="$(get R2_S3_API)"
R2_ACCOUNT_ID="$(get R2_ACCOUNT_ID)"
R2_ACCESS_KEY_ID="$(get R2_ACCESS_KEY_ID)"
R2_SECRET_ACCESS_KEY="$(get R2_SECRET_ACCESS_KEY)"
R2_BUCKET="$(get R2_BUCKET)"
R2_PUBLIC_BASE="$(get R2_PUBLIC_BASE)"
R2_PUBLIC_BASE="${R2_PUBLIC_BASE%/}"  # strip any trailing slash

# Endpoint must be the bare account host (no bucket path). Cloudflare shows the
# S3 API as ".../<bucket>", so strip any path; the bucket goes in the s3:// URL.
ENDPOINT="$(printf '%s' "$R2_S3_API" | sed -E 's#(https?://[^/]+).*#\1#')"
[ -z "$ENDPOINT" ] && [ -n "$R2_ACCOUNT_ID" ] && ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

miss=""
[ -z "$ENDPOINT" ]             && miss="$miss R2_S3_API(or R2_ACCOUNT_ID)"
[ -z "$R2_ACCESS_KEY_ID" ]     && miss="$miss R2_ACCESS_KEY_ID"
[ -z "$R2_SECRET_ACCESS_KEY" ] && miss="$miss R2_SECRET_ACCESS_KEY"
[ -z "$R2_BUCKET" ]            && miss="$miss R2_BUCKET"
if [ -n "$miss" ]; then
  echo "ERROR: missing in $ENVF:$miss" >&2; exit 1
fi
DRY=""
[ "${1:-}" = "--dry-run" ] && DRY="--dryrun"

# R2 credentials are plain S3 credentials.
export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION="auto"          # R2 ignores region but the CLI wants one
export AWS_REQUEST_CHECKSUM_CALCULATION="when_required"  # be safe on older/newer CLIs

echo "==> sync $ROOT/media -> s3://$R2_BUCKET/  ($ENDPOINT) $DRY"
aws s3 sync "$ROOT/media" "s3://$R2_BUCKET/" \
  --endpoint-url "$ENDPOINT" \
  --no-progress \
  --exclude ".DS_Store" --exclude "*/.DS_Store" \
  --cache-control "public, max-age=86400" \
  $DRY

[ -n "$DRY" ] && { echo "(dry run; nothing uploaded)"; exit 0; }

echo "==> object count in bucket:"
aws s3 ls "s3://$R2_BUCKET/" --endpoint-url "$ENDPOINT" --recursive | wc -l | sed 's/^/    /'

# Public-read spot check: pick a real photo key from the DB and HEAD it.
if [ -n "$R2_PUBLIC_BASE" ]; then
  PG=/opt/homebrew/opt/postgresql@18/bin
  KEY="$("$PG/psql" "$(get DATABASE_URL)" -t -A -c \
    "SELECT storage_key FROM restaurant_photos WHERE NOT removed AND storage_key LIKE '%.webp' LIMIT 1" 2>/dev/null)"
  if [ -n "$KEY" ]; then
    echo "==> public spot-check: $R2_PUBLIC_BASE/$KEY"
    curl -sI "$R2_PUBLIC_BASE/$KEY" | grep -iE '^HTTP|content-type|cache-control' | sed 's/^/    /'
  fi
else
  echo "NOTE: R2_PUBLIC_BASE empty — set it to verify public reads + use as NEXT_PUBLIC_MEDIA_BASE." >&2
fi

echo "==> DONE. Next: set NEXT_PUBLIC_MEDIA_BASE=$R2_PUBLIC_BASE in web/.env* and Vercel."
