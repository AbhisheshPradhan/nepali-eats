# nepali-eats

Directory of **Nepali restaurants in Australia**. Data is scraped from Google
Maps, enriched with full addresses/contact details, and stored in a local
Postgres database that will back the directory site.

## Stack
- **Node 25 + Playwright** (Chromium, headless) for scraping/enrichment
- **PostgreSQL** (local, `postgresql@17`) — database `nepali_eats`
- **Webshare proxies** (20, rotating) in `.env` as `WEBSHARE_PROXIES`
- `DATABASE_URL` in `.env` → `postgresql://<user>@localhost:5432/nepali_eats`

## Project layout
- `scraper/` — all scraping/enrichment scripts (run from PROJECT ROOT, e.g.
  `node scraper/scrape.js`; they read root `.env`, write to root `media/`, and
  resolve `node_modules` at root).
- `web/` — Next.js 16 (App Router, RSC) + Tailwind v4 frontend. BUILT. Run:
  `cd web && npm run dev` (http://localhost:3000). Reads Postgres via
  `lib/queries.ts` (node-postgres, no ORM). Theme generated from
  `design-system/tokens` (Baloo 2 + Mukta, Phosphor icons, chili/marigold on cream).
  Pages: Home, **Explore** (see below), `/restaurant/[slug]` (Restaurant JSON-LD),
  `/nepali-restaurants/[state|suburb]`, `/momo`, `/tag/[tag]`, Stories, `/add-a-spot`,
  sitemap/robots/404. Photos via `mediaUrl()` → `/media` (dev symlink
  `web/public/media -> ../../media`) → R2 in prod (`NEXT_PUBLIC_MEDIA_BASE`).
- **Explore = map-driven, PostGIS-backed:**
  - `GET /api/restaurants?bbox=w,s,e,n&page&sort&tag&venue&price&rating&q` →
    PostGIS bounds query. Page 1 returns `{items(30), total, pins(all in view)}`;
    later pages return items only (load-more pagination).
  - Map (Leaflet + Mapbox tiles via `NEXT_PUBLIC_MAPBOX_TOKEN`, CARTO fallback):
    plots **all pins in the current bounds**, **clustered** (leaflet.markercluster),
    **auto-refreshes the list on `moveend`** (debounced). Hover highlight is
    imperative (updates one marker, not a full re-render) to avoid lag.
  - List paginates 30 at a time; **distance labels** (Haversine) appear when the
    user shares location ("Near me") or arrives via `?lat&lng`.
  - Initial centre: `?focus=<slug>` (centre on a restaurant, pin it to top of list)
    > `?lat&lng` > `?state/suburb/tag` (fit to extent) > **IP geo** state capital
    (Vercel `x-vercel-ip-country-region`) > **Sydney 2000** (non-AU / undetected).
  - `GET /api/search?q=` (fires after 3 chars) → restaurant-name + suburb +
    postcode suggestions. Shared `SearchBox` (home + explore); picking an option
    only fills the box, search runs on Enter/Search button.
  - Auth/reviews-text/menus-stage2/distance-sort = phase 2.
- `design-system/` — NepaliEats design system + mockup (reference for the build).
- `media/` — self-hosted photos/menus (shared; symlinked into web/public in dev → R2 in prod).
- root `.env`, `node_modules`, `package.json` — shared by the scraper.

## Data pipeline (run from project root, in order)
1. `node scraper/scrape.js` — search Google Maps for "Nepali restaurant" across 82
   AU areas (`scraper/locations.js`), dedupe by Google feature-ID. Writes JSON/CSV.
2. `node scraper/load-db.js` — parse + upsert JSON into `restaurants` (idempotent on
   `google_feature_id`; derives suburb/state/postcode/slug). One-time seed.
3. `node scraper/enrich-db.js` — fill `full_address`/phone/website/review_count via
   place pages, **direct + 20 rotating proxies**. `scraper/run-passes.sh` loops it.
4. `node scraper/enrich-google.js` — place pages → photos (download+WebP) + review_count
   + rating. `node scraper/enrich-website.js` → email + socials (cfemail decode) +
   own-site photos + menu-file discovery.
5. `node scraper/export-db.js` — snapshot table to `main-table.json` / `.csv`.

`scraper/build-table.js` / `scraper/enrich.js` are earlier file-based versions,
superseded by the DB scripts. `scraper/schema.sql` holds the table definition.

## Database
- **DB:** `nepali_eats`  •  **main table:** `restaurants`
- Natural key: `google_feature_id` (`0x..:0x..`, 100% present). Also store
  `google_place_id` (`ChIJ..`, Places API key). `google_cid` was dropped (redundant).
- Columns: slug, name, cuisine, venue_type, tags[], halal_status, rating,
  review_count, price_level, price_range, opening_hours, street, suburb, state,
  postcode, full_address, lat, lng, **geom (PostGIS Point 4326)**, phone, email,
  website, facebook, instagram, tiktok, whatsapp, menu_url, menu_source,
  google_maps_url, source_query, address_source, is_nepali, relevance,
  enriched_at, place_enriched_at, website_checked_at, timestamps.
- **PostGIS:** `geom` is auto-synced from lat/lng by trigger `trg_set_restaurant_geom`;
  GiST index `idx_restaurants_geom` powers map bounds queries
  (`geom && ST_MakeEnvelope(w,s,e,n,4326)`). Enabled via `scraper/schema.sql`.
- Taxonomy: old Google `category` was dropped (meaningless — all are Nepalese).
  `venue_type` (Restaurant/Café/Takeaway/Food Truck/Caterer/Dessert/Bar) +
  `tags[]` (momo, thakali, newari, tibetan, vegetarian, indian-nepali) derived
  from name. `halal_status` (certified/options/not_halal/unknown) — restaurant
  level; per-item halal belongs in future `menu_items`. Currently all 'unknown'.
- `email` + socials (facebook/instagram/tiktok/whatsapp) added 2026-06; populated
  from restaurant websites (see website-enrichment TODO). Only #857 done so far.
- **PLANNED FILTERS (not built yet):** `kid_friendly` BOOLEAN and `live_music`
  BOOLEAN — surface as filters in the frontend Explore page. Source: Google place
  "About" attributes ("Good for kids", "Live music/performances") are scrapeable
  from the place page (same render as enrich-google), or set manually/by claim.
  Add columns + a scrape pass when implementing; default NULL/unknown.
- Indexes: state, suburb, postcode, (lat,lng).

## ⚠️ DB is the source of truth (do NOT re-run load-db.js)
The 400 non-Nepali rows were **hard-deleted** (`DELETE WHERE is_nepali IS FALSE`).
`nepali-restaurants-au.json` still has all 1017, so re-running `load-db.js` would
**resurrect them**. Treat Postgres as canonical; `load-db.js` was a one-time seed.
Current table: **572 rows** (≈335 confirmed nepali + ≈237 review_needed). Category field cleaned: rating-string pollution backfilled+nulled, non-Nepali categories (Taiwanese, event venues, couriers, shops, etc.) removed.

## Status (1017 scraped → 570 in directory) — ENRICHMENT COMPLETE
Final coverage: address 100%, lat/lng 100%, rating 99%, phone 95%, **photos 76%**
(433 restaurants, 1125 files self-hosted WebP under media/photos/<id>/, linked via
restaurant_photos), website 73%, review_count 57%, any social 42%, menu link 41%,
email 39%. Photos: 932 from websites + 193 from Google. Scripts: enrich-google.js
(place pages → photos/review_count/rating), enrich-website.js (sites → email/
socials/own-site photos/menu discovery, incl. Cloudflare cfemail decode).
Next: menus Stage-2 (needs ANTHROPIC_API_KEY) + Next.js frontend in web/ (awaiting design file).

## (prior) Status
- ✅ Scrape complete: **1017** unique restaurants nationwide
- ✅ Loaded into Postgres; **100% lat/lng** (map-ready)
- ✅ Enrichment complete. Coverage: full_address 99%, lat/lng 100%, phone 95%,
  rating 99%, suburb 99%, website 74%, **review_count 61%**.
- ⚠️ `review_count` capped at ~61%: Google serves **inconsistent place payloads**
  (full vs. "lite" with no review data) depending on exit/throttle, so the count
  widget/data often isn't present to scrape. Rating is fine (99%). For complete
  review counts + review text, use the **Google Places API** (paid, licensed) —
  bundle with the deferred reviews/photos work.
- Exports refreshed via `node export-db.js` → `main-table.csv` / `main-table.json`.
- Coverage by state (foundVia): VIC, NSW, WA lead; then QLD, SA, NT, TAS, ACT

## Key learnings (don't re-discover these)
- **Google stalls headless Chromium from datacenter proxies.** Proxies work fine
  for plain `curl` against Google, but Playwright+proxy hangs/times out when
  loading full pages — UNLESS you **block images/media/fonts/css**; with asset
  blocking, good proxies render a place page in ~4s.
- **Direct connection throttles after ~300 place-page hits** (panel stops
  rendering, no error). Fix = rotate across **direct + all proxies** and retry
  failures on a different exit; ~60% fill per pass, converges over passes.
- Plain proxy HTTP fetch returns only the Maps **shell** (no address); the place
  data loads via JS, so rendering (Playwright) is required.
- List-card scrape only yields a **street fragment** (no suburb/state/postcode)
  and review counts render inconsistently — full address needs the place page.

## TODO / roadmap
- [ ] Finish address enrichment to plateau (~95%+ where Google has data)
- [ ] Backfill `review_count` + re-confirm `rating` from place pages (in progress —
      review counts render inconsistently on list cards, reliable on place pages)
- [x] **Relevance cleanup DONE** (flagged, nothing deleted). Columns added:
      `is_nepali` (true/false/null) + `relevance` bucket. **Directory query:**
      `WHERE is_nepali IS NOT FALSE` → **624 visible**, 393 excluded.
      Buckets: `nepali` 356 (keyword/category match, keep) · `review_needed` 268
      (generic-named, from Nepali searches, kept as likely-Nepali) · `indian_likely`
      152 (pure Indian, excluded) · `grocery_retail` 105 · `other_cuisine` 92 ·
      `manual_excluded` 27 (hand-picked famous non-Nepali leaks) · `other_venue` 17.
      Note: Postgres regex word boundaries are `\m \M \y` (NOT `\b`). Nepali signal
      always wins first, so genuine Nepali is never excluded by a cuisine rule.
- [ ] Optional precision pass: `review_needed` (268) long tail + `indian_likely`
      (152, may contain Nepali-Indian fusion) are best separated by an LLM
      name+category classifier (needs an Anthropic API key in `.env`). Reversible
      via the `relevance` column.
- [ ] Classify `website` links → add `website_type` (`own_site` | `aggregator` |
      `ordering` | `social`) so menu sourcing can route per restaurant
- [ ] **Menu scraping** → new `menu_items` table
      (restaurant_id FK, section, name, description, price, currency, photo_url,
      is_vegetarian, spice_level, source, source_url, position, fetched_at).
      Source priority: ordering platforms (Menulog/Uber Eats/DoorDash/order.store,
      structured + prices) → restaurant own-site via LLM extraction → Google
      (weak for structured menus). Promote `section` to a `menu_sections` table
      if menus get richer.
- [ ] **Website enrichment** → scrape each restaurant's `website` (451/617 have one)
      for `email` + socials (facebook/instagram/tiktok/whatsapp). Build
      `enrich-website.js` (fetch homepage + /contact, regex tel:/mailto:/social
      links). #857 done manually as the template.
- [ ] **Website / Google photos scraping** → new `restaurant_photos` table
      (restaurant_id FK, url, source, attribution, width, height, position,
      fetched_at). Sources: restaurant site / ordering platforms (item photos),
      or Google Places Photos API (licensed, paid). ⚠️ Google photos & reviews
      have storage/display licensing constraints; site photos have copyright
      considerations — confirm usage rights before storing.
- [ ] Google reviews (deferred)
- [ ] Opening hours + price level (deferred; available on the same place page)
- [ ] Menus/prices go stale — define a refresh cadence (`fetched_at` staleness)

## Conventions
- Enrichment scripts are **idempotent + resumable** (drive off `WHERE ... IS NULL`).
- Keep CSV/JSON as exports/snapshots; **Postgres is the source of truth.**
- Respect proxy rotation + asset blocking for any new Google scraping.
