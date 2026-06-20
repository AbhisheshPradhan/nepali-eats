# nepali-eats — Nepali restaurants in Australia (Google Maps scraper)

Scrapes Google Maps for "Nepali restaurant" across every Australian state,
metro, and Nepali-community suburb, rotating your Webshare proxies, and writes
a deduped dataset.

## Setup (already done)
- `npm install` (playwright + dotenv)
- `npx playwright install chromium`
- `.env` provides `WEBSHARE_PROXIES` (rotated automatically)

## Run
```bash
# Full run (82 search areas) — direct connection
node scrape.js

# Test a single location first
LOCATION="Sydney NSW" node scrape.js

# First N locations only
LIMIT=5 node scrape.js

# Route through rotating Webshare proxies (see caveat below)
USE_PROXY=1 node scrape.js
```

Expect roughly 40–75 min for the full run (one headless browser per area,
with a 2.5–5s polite delay between areas). It's resumable — stop/restart any
time.

## Output
- `nepali-restaurants-au.json` — full records
- `nepali-restaurants-au.csv` — same data, flat

Fields: name, rating, reviews, category, address, phone, website, lat, lng,
featureId (Google place id, used for dedupe), placeUrl, foundVia (search that
found it).

## Notes
- **Connection:** runs **direct** by default. Google challenges/stalls headless
  Chromium coming from datacenter proxies (the Webshare pool's exit IP == proxy
  host), so the proxies time out on Maps even though they work for plain curl.
  `USE_PROXY=1` rotates all 20 if you want it, but direct is more reliable here.
- **Resumable & incremental:** saves after every area and reloads existing
  results on restart, so you can stop/restart safely.
- **Dedupe:** by Google place feature-ID (falls back to name+address).
- **Coverage:** edit `locations.js` to add/remove search areas. Overlap between
  metro + suburb searches is intentional — it fills gaps from any single query
  that Maps lazy-loaded incompletely.
- **Reviews are best-effort:** Google only renders review counts in some list
  cards. Rating, name, category, address, lat/lng, place ID and URL are
  reliable; phone/website aren't in list cards (would require visiting each
  place page — `placeUrl` is captured if you want to enrich later).
