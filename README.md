# NepaliEats

All the Nepali food in Australia. A directory of Nepali
restaurants, cafes, food trucks and stalls across Australia: scraped from Google
Maps, enriched, stored in PostgreSQL, and served by a Next.js + Tailwind site
with a map-driven explore experience.

**Live (test):** <a href="https://nepali-eats.vercel.app/" target="_blank" rel="noopener noreferrer">nepali-eats.vercel.app</a>

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
- Node 20+ (built on 25), PostgreSQL 17/18 with **PostGIS**, `psql`.
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
- **Mapbox GL JS** (`react-map-gl`, `light-v11`) with native **clustered** pins,
  **auto-refresh on map move**, and **distance labels** when the visitor shares
  location. Flat mercator projection, camera caged to Australia.
- Default centre: searched restaurant → user geolocation → filtered extent →
  **IP-geo state capital** → Sydney (non-AU / undetected).
- `GET /api/search?q=` (after 3 chars) powers the shared autocomplete (restaurant
  name + suburb + postcode); selecting fills the box, search runs on Enter/Search.

## Deploy (live)
Hosted on **Vercel** (project root `web/`, region `syd1`) with **Neon** Postgres
(+ PostGIS) and **Cloudflare R2** for media. Neon + R2 are the source of truth.

- **App `DATABASE_URL`** → Neon **pooled** (serverless-safe). Scraper/migrations
  use the Neon **direct** string.
- **Media** served from R2 via `NEXT_PUBLIC_MEDIA_BASE`; admin uploads write to R2
  over the S3 API (`web/lib/admin/storage.ts`). Object keys equal the DB
  `storage_key`/`logo_key`/`cover_key`, so the same keys resolve in dev and prod.
- Set the app + R2 + Clerk env vars in Vercel; keep all `.env` files secret.

Operational scripts (run from repo root):
```bash
scraper/migrate-to-neon.sh        # one-shot local Postgres -> Neon (PostGIS, verify)
scraper/upload-media-r2.sh        # sync media/ -> R2 (S3 API, auto Content-Type)
scraper/backup.sh [db|media|all]  # point-in-time Neon dump + media tarball -> backups/
```

## Status
469 curated restaurants (450 shown; 19 permanently-closed spots hidden), 144 with
photos (768 files self-hosted on R2). A Google Places API pass (2026-06-25) added
full-week opening hours, business status, and attribute flags (vegetarian,
takeout, delivery, dine-in, outdoor seating, wheelchair access, etc.).
Phase 2: auth/user accounts, saved spots + reviews, menu Stage-2 (parse menus →
items + prices, needs `ANTHROPIC_API_KEY`), surfacing the attribute filters in
Explore, distance sort.
