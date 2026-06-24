# NepaliEats

All the Nepali food in Australia. A directory of Nepali
restaurants, cafes, food trucks and stalls across Australia: scraped from Google
Maps, enriched, stored in PostgreSQL, and served by a Next.js + Tailwind site
with a map-driven explore experience.

## Repo layout

| Path | What |
|---|---|
| `scraper/` | Node + Playwright scraping & enrichment scripts (run from repo root) |
| `web/` | Next.js 16 + Tailwind v4 frontend (its own `package.json`) |
| `design-system/` | NepaliEats design system + interactive mockup (reference) |
| `media/` | Self-hosted photos/menus (gitignored; → Cloudflare R2 in prod) |
| `scraper/schema.sql` | Postgres schema (incl. PostGIS) |
| `CLAUDE.md` | Working notes / architecture decisions |

## Prerequisites
- Node 20+ (built on 25), PostgreSQL 17 with **PostGIS**, `psql`.
- `.env` at repo root (shared by the scraper):
  ```
  DATABASE_URL=postgresql://<user>@localhost:5432/nepali_eats
  WEBSHARE_PROXIES=http://user:pass@host:port,...   # rotating proxies (scraping)
  ```

## Database setup
```bash
createdb nepali_eats
psql -d nepali_eats -f scraper/schema.sql   # tables, indexes, PostGIS geom + trigger
```

## Scraper (data pipeline — run from repo root)
```bash
npm install                       # playwright, pg, sharp, dotenv
npx playwright install chromium
node scraper/scrape.js            # 1. Google Maps search across 82 AU areas -> JSON
node scraper/load-db.js           # 2. upsert JSON -> restaurants (one-time seed)
node scraper/enrich-db.js         # 3. addresses/phone/website/reviews (rotating proxies)
node scraper/enrich-google.js     # 4. photos + price + reviews from place pages
node scraper/enrich-website.js    #    email + socials + own-site photos + menu links
node scraper/export-db.js         # 5. snapshot -> main-table.csv / .json
```
The DB is the source of truth; `load-db.js` is a one-time seed (re-running would
resurrect manually removed rows). See `CLAUDE.md` for proxy/throttle notes.

## Web app
```bash
cd web
npm install
# web/.env.local:
#   DATABASE_URL=postgresql://<user>@localhost:5432/nepali_eats
#   NEXT_PUBLIC_MAPBOX_TOKEN=pk....          # optional; CARTO tiles if omitted
#   NEXT_PUBLIC_MEDIA_BASE=                  # empty in dev (uses /media symlink)
ln -sfn ../../media public/media             # dev: serve photos locally
npm run dev                                  # http://localhost:3000
```

### Explore (map) architecture
- `GET /api/restaurants?bbox=…&page&filters` runs a **PostGIS bounds query**:
  page 1 returns 30 list items + total + **all pins in view**; later pages add 30.
- Leaflet map (Mapbox tiles) with **clustered** pins, **auto-refresh on map move**,
  and **distance labels** when the visitor shares location.
- Default centre: searched restaurant → user geolocation → filtered extent →
  **IP-geo state capital** → Sydney (non-AU / undetected).
- `GET /api/search?q=` (after 3 chars) powers the shared autocomplete (restaurant
  name + suburb + postcode); selecting fills the box, search runs on Enter/Search.

## Deploy (planned)
Vercel + Cloudflare; managed Postgres (Neon/Supabase) with PostGIS; images on
Cloudflare R2 (set `NEXT_PUBLIC_MEDIA_BASE` to the R2 domain). Keep `.env` secret.

## Status
542 curated restaurants (522 shown; 20 permanently-closed spots hidden).
Coverage: address/geo ~100%, rating 99%, phone 95%, photos 76%, website 73%,
review_count 57%, socials 42%, email 39%. A Google Places API pass (2026-06-25)
added full-week opening hours, business status, and attribute flags (vegetarian,
takeout, delivery, dine-in, outdoor seating, wheelchair access, etc.).
Phase 2: auth, user reviews, menu Stage-2 (parse menus → items + prices, needs
`ANTHROPIC_API_KEY`), surfacing the attribute filters in Explore, distance sort.
