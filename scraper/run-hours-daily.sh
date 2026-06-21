#!/usr/bin/env bash
# Daily opening-hours pass. Headless Maps only exposes TODAY's row, so this must
# run once per day for ~7-9 days to accumulate the full week per restaurant.
# Each run captures whatever weekday Google labels and merges it into
# opening_hours_raw, then rebuilds canonical opening_hours.
#
# Run manually once a day, or install as a cron (runs at 10:00 local):
#   crontab -e
#   0 10 * * * /Users/abhisheshpradhan/Documents/Abhi/nepali-eats/scraper/run-hours-daily.sh >> /tmp/nepali-hours.log 2>&1
#
# Idempotent within a day: rows already scraped today are skipped, so re-running
# only retries the misses.
set -euo pipefail
cd "$(dirname "$0")/.."   # project root (node_modules + .env live here)
CONCURRENCY="${CONCURRENCY:-6}" node scraper/enrich-hours.js
