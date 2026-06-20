#!/bin/zsh
cd /Users/abhisheshpradhan/Documents/Abhi/nepali-eats
remaining() { psql -d nepali_eats -tAc "SELECT count(*) FROM restaurants WHERE google_maps_url IS NOT NULL AND (full_address IS NULL OR review_count IS NULL)"; }
prev=$(remaining)
for pass in 1 2 3 4 5 6; do
  echo "===== PASS $pass (remaining: $prev) ====="
  CONCURRENCY=6 node scraper/enrich-db.js 2>&1 | grep -vE "injected env|tip:" | grep -E "need addresses|rows need|processed|Done"
  now=$(remaining)
  echo "PASS $pass: remaining $prev -> $now"
  fixed=$((prev - now)); prev=$now
  if [ "$now" -eq 0 ] || [ "$fixed" -lt 8 ]; then echo "plateau (fixed $fixed) — stopping"; break; fi
done
echo "FINAL remaining: $prev"
psql -d nepali_eats -tAc "SELECT 'addr='||count(full_address)||' reviews='||count(review_count)||' rating='||count(rating)||' of '||count(*) FROM restaurants"
