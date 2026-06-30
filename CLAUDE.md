# nepali-eats

Directory of **Nepali restaurants in Australia**. Data is scraped from Google
Maps, enriched with full addresses/contact details, and stored in a local
Postgres database that will back the directory site.

## Copywriting & content voice (READ BEFORE writing any user-facing text)

Any time you write or edit user-facing text (hero/landing copy, CTAs, microcopy,
empty states, 404s, meta titles/descriptions, blog posts, the restaurant blurb
generator), you MUST:

1. Invoke the **copywriting** skill (`~/.claude/skills/copywriting/`) first. For
   editing existing copy use **copy-editing**; for blog/topic planning use
   **content-strategy**; for SEO/meta use **seo-audit**.
2. Apply the **human-copy standard** so nothing reads as AI-generated. The
   copywriting skill does NOT enforce this; the source of truth is
   `~/.claude/skills/seo-audit/references/ai-writing-detection.md`. In short:
    - **No em dashes (—) or en dashes (–) anywhere, including titles.** Use
      commas, colons, parentheses, or separate sentences. Hyphens in compound
      words are fine. For page/meta `<title>` separators use a normal hyphen "-",
      e.g. "Best momo in Australia - NepaliEats".
    - Avoid AI-tell words (delve, leverage, seamless, robust, comprehensive,
      pivotal, innovative, etc.), AI-tell phrases ("In today's...", "It's worth
      noting", "Whether you're X, Y, or Z"), and empty intensifiers (very, really,
      simply, ultimately).
    - Read it aloud: would a human say this to a friend about food?
      Do this automatically, without being asked. Voice = warm, human, food-obsessed;
      specific dish names over generic "cuisine"; AU spelling. Brand tagline:
      **"Find your momo people."**

## Dev server (do NOT start it)
Do NOT run `npm run dev` / `next dev` (or `npm start`). Abhishesh runs the dev
server himself. To verify changes, use `npx tsc --noEmit` (typecheck) or
`npm run build` when a full build check is needed, but never start the dev server.

## Git (do NOT commit or push unless told)
NEVER `git commit` or `git push` until Abhishesh explicitly says to (e.g. "commit",
"commit and push"). Make the changes, verify (typecheck/build), and leave the working
tree for review — even when a task feels finished, wait for the explicit go. Approval
is per-request: a "commit" on one change does NOT carry over to later changes.

## Stack

- **Node 25 + Playwright** (Chromium, headless) for scraping/enrichment
- **PostgreSQL** — now hosted on **Neon** (with PostGIS). Dev and prod share the
  SAME Neon DB (see "Schema changes are SHARED with prod" below). The old local
  `postgresql@17` / `nepali_eats` DB is retired.
- **Webshare proxies** (20, rotating) in `.env` as `WEBSHARE_PROXIES`
- `DATABASE_URL` in `.env` → the Neon connection string (`...neon.tech/neondb`).

## Production stack & deployment (LIVE — core stack deployed)
The site is live at **nepali-eats.vercel.app** (Vercel test domain). Neon DB,
Vercel, and R2 media are all up and serving; remaining work is the custom domain,
Cloudflare edge, and the SEO consoles (see checklist below).
Chosen low-cost launch setup (about $0/mo until traffic or commercial scale):
- **Host:** Vercel (Hobby, free). Next.js native, SSR for SEO.
- **DB:** Neon (free). Managed Postgres with PostGIS; the raw-SQL `node-postgres`
  layer works unchanged. Picked over Supabase for the $0 always-ready tier.
  Tradeoff: no free Supabase Studio admin, so editing uses a small custom
  `/admin` or Neon's SQL editor.
- **Media:** Cloudflare R2 (free tier, free egress). Photos and menus via
  `NEXT_PUBLIC_MEDIA_BASE`. Kept off Supabase/Neon because R2 egress is free.
- **Edge:** Cloudflare in front (DNS, CDN cache, bot protection, www to apex).
- First real bill is the DB (about $19 Neon paid or $25 Supabase Pro) only when
  traffic outgrows free; Vercel Pro ($20) only if it becomes commercial.

Deploy status:
- [x] Neon: project created, PostGIS enabled, schema + data loaded. `DATABASE_URL`
      points at Neon (dev AND prod share it — see "Schema changes are SHARED" below).
- [x] App `DATABASE_URL` → Neon. (Scraper/migrations use the direct connection.)
- [x] R2: bucket `nepalieats-media` live, `media/` synced via
      `scraper/upload-media-r2.sh`, `NEXT_PUBLIC_MEDIA_BASE` set
      (`pub-6334a35f40da4f7fb1e3f948b1e0dbc1.r2.dev`). Public reads serve 200.
- [x] Vercel: repo imported (root `web/`), env vars set, deployed to
      **nepali-eats.vercel.app**. Custom domain still TODO.
- [ ] Custom domain (still on the `.vercel.app` test URL; `NEXT_PUBLIC_SITE_URL`
      still `localhost`, update it when the real domain lands so canonicals are right).
- [ ] Cloudflare: DNS in front of Vercel, cache rules, Super Bot Fight Mode
      (skip Googlebot), www to apex 301.
- [ ] Cache content pages with static/ISR (restaurant, city, tag, momo); keep
      Explore, `/api/*`, and the geo homepage dynamic.
- [ ] Search Console + Bing Webmaster + GA4; submit sitemap (see LAUNCH.md).
- [ ] Editorial admin for `featured_rank` (non-null = featured) and descriptions: small
      custom `/admin` or Neon SQL editor.

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
  Home **featured row is state-scoped** (IP-geo state → that state's featured
  picks (rows with a non-null `featured_rank`), fallback that state's popular;
  default NSW/Sydney 2000; heading "Where
  {metro}'s eating this week"; cards show distance from shared location or the
  state capital).
- **Explore = map-driven, PostGIS-backed:**
    - `GET /api/restaurants?bbox=w,s,e,n&page&sort&tag&venue&price&rating&q` →
      PostGIS bounds query. Page 1 returns `{items(30), total, pins(all in view)}`;
      later pages return items only (load-more pagination).
    - Map = **Mapbox GL JS** (`react-map-gl` v8 + `NEXT_PUBLIC_MAPBOX_TOKEN`,
      `light-v11` vector style). GeoJSON source with **native clustering**; circle
      pins coloured by rating (marigold ≥4.7, else chili) with the rating as label.
      Click a pin → **popup card** (photo/name/rating/price, opens detail in new
      tab) = the mobile detail affordance; cluster click zooms in.
      **Auto-refreshes the list on `moveend`** (debounced). Hover/selected highlight
      via data-driven paint expressions (`activeId`), not DOM markers, so no lag.
    - List paginates 30 at a time; **distance labels** (Haversine) appear when the
      user shares location ("Near me") or arrives via `?lat&lng`.
    - Initial centre: `?focus=<slug>` (centre on a restaurant, pin it to top of list)
        > `?lat&lng` > `?state/suburb/tag` (fit to extent) > **IP geo** state capital
        > (Vercel `x-vercel-ip-country-region`) > **Sydney 2000** (non-AU / undetected).
    - `GET /api/search?q=` (fires after 3 chars) → restaurant-name + suburb +
      postcode suggestions. Shared `SearchBox` (home + explore); picking an option
      only fills the box, search runs on Enter/Search button.
    - **Permanently-closed spots are hidden from every public surface** (explore,
      home, search, sitemap, facets) via `business_status IS DISTINCT FROM
      'CLOSED_PERMANENTLY'` (`NOT_CLOSED` in `lib/queries.ts`); detail pages still
      resolve so inbound links don't 404.
    - **Flags filter** (`?flags=`) maps allowlisted attribute columns
      (`vegetarian`/`takeout`/`delivery`/`dineIn`/`outdoor`/`reservable`/`groups`/
      `dogs`/`wheelchair`, see `FLAG_COLS`) to true-only `WHERE` clauses; backend
      plumbing is live, UI scaffolded pending design.
    - Auth/reviews-text/menus-stage2/distance-sort = phase 2.
- **Live open-status:** `OpenStatusBadge` (client component) shows "Open till
  10pm / Opens today at 5pm / Closed / Temporarily/Permanently closed" on the
  detail cover and place cards. Computed in the browser (the page is ISR-cached,
  so a server-rendered status would be stale) and re-ticks each minute.
  `openStatus()` in `lib/format.ts` returns a domain `kind`
  (open/closing/opening/closed) + label; the badge maps `kind` → palette tone.
  `Badge` tones are now colour-named (`ink`/`coriander`/`marigold`/`chili`/
  `himalaya`), not feature-named.
- **Admin tooling:** `/admin` (Clerk-gated, `ADMIN_USER_IDS`) plus a media-triage
  tool at `/admin/triage` (`TriageClient` + `/api/admin/triage`, mark cover/
  reviewed). The header `AdminStateSwitcher` lets an admin preview the geo-scoped
  home for any AU state via the `ne_admin_state` cookie (`lib/stateOverride.ts`);
  the server honors it ONLY for admins (`resolveState()` in `lib/geo.ts`), so
  anonymous traffic pays no auth cost.
- **Inline restaurant editor (edit from the detail page):** admins/owners get an
  "Edit Details" toggle on `/restaurant/[slug]` that opens a slide-over drawer
  (`components/edit/RestaurantEditPanel.tsx`, shadcn Sheet) instead of routing to
  the older `/admin/[slug]` form (`RestaurantEditor.tsx`, still there). Three tabs:
  **General** (every batched field + hours behind ONE Save = a single PATCH to
  `/api/admin/restaurants/[slug]`), **Photos** (cover, gallery, logo — instant
  uploads), **Menu** (menu-file uploads — instant; uploaded files are viewable
  links). Drawer media loads via `GET /api/admin/restaurants/[slug]/editor`
  (photos + menu files). Gated like all `/api/admin/*` (proxy.ts Clerk +
  `ADMIN_USER_IDS`, re-checked by `requireAdmin`). See `web/EDIT_RESTAURANT_PLAN.md`.
- **Image cropping is client-side + destructive.** `CropModal` (react-easy-crop)
  draws the chosen region to a `<canvas>` and exports a JPEG blob; the cover (16:9)
  and gallery photos (4:3) each have an upload-crop AND a re-frame Crop button. The
  crop is baked into a new file and the outside pixels are dropped (gallery
  originals survive only when a cover points at a `photos/…` key). Re-framing an
  EXISTING photo loads it through `GET /api/admin/media?key=…`
  (`getMedia()` in `lib/admin/storage.ts`), a **same-origin admin proxy** that
  streams the R2 object server-side — the public `NEXT_PUBLIC_MEDIA_BASE` R2 domain
  is cross-origin with no CORS headers, so a direct `<img crossOrigin>` + canvas
  export is blocked ("Couldn't load the image"). The proxy reuses the existing
  server-side `R2_*` creds; no new env vars.
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
    - rating. `node scraper/enrich-website.js` → email + socials (cfemail decode) +
      own-site photos + menu-file discovery.
5. `node scraper/export-db.js` — snapshot table to `main-table.json` / `.csv`.

**Opening hours (headless fallback — now superseded by the Places API pass below):**
`node scraper/enrich-hours.js` (or `scraper/run-hours-daily.sh`). Headless Maps only
exposes **today's** hours row, so this captures one weekday per run and accumulates
the week in `opening_hours_raw` over ~7-9 daily runs; it rebuilds canonical
`opening_hours` via `scraper/hours.js` and opportunistically backfills price. No
photos. Guard = `hours_scraped_at::date < CURRENT_DATE` (re-scrapes every row once
per day). Kept as a free fallback for rows the API misses, but the **full-week
hours now come from the Places API** (`reconcile-places.js`, see below). The About
panel attributes `kid_friendly` (381 rows, 377 true) and `live_music` (365 rows,
57 true) are now POPULATED from the Places API pass.

**Google Places API (New) pass — DONE 2026-06-25 (553 calls, free tier):**
`node scraper/enrich-places.js` — one Place Details call per restaurant (keyed off
`google_place_id`), dumps the FULL raw JSON into staging column `places_api_raw`
(+ stamps `places_api_at`). It does NOT touch any canonical column; mapping into
real columns is the separate, reviewable `reconcile-places.js` step. Direct
connection, NO proxy (it's an authed API). Hard `MAX_CALLS=600` guard in code,
stops on 429, resumable (`places_api_at IS NULL`), ordered
featured→rating→review_count. All rows now have `places_api_at`. This
supersedes the headless `enrich-hours.js` for hours and is the source for the
attribute columns / price / full-week hours / fresh rating+review_count /
`business_status` / `editorial_summary`.

**Reconcile (raw → canonical) — DONE 2026-06-25:** `node scraper/reconcile-places.js`
(dry run by default; `--commit` to write). Reads `places_api_raw` and maps it into
canonical columns: full-week `opening_hours` (now 474 rows, replacing the headless
accumulation), `rating`, `review_count`, `price_level`, `business_status`, the
attribute booleans (`serves_vegetarian`, `takeout`, `delivery`, `dine_in`,
`outdoor_seating`, `reservable`, `good_for_groups`, `serves_alcohol`,
`serves_cocktails`, `allows_dogs`, `wheelchair_accessible`), a friendly `parking`
label (derived from Google `parkingOptions`), and `editorial_summary`.
Re-derivable any time from the stored raw — no API re-call needed to re-parse.

**Backfill place IDs — DONE:** `node scraper/backfill-place-ids.js` resolved the 6
rows that had a NULL `google_place_id` via Places Text Search (suburb-verified),
so they now flow through the API pass.

> **⚠️ RE-RUN REMINDER — do this on/after 2026-07-01 (next calendar month).**
> The first full pass (553 calls) ran 2026-06-25 and was FREE under the monthly
> per-SKU free allowance (~1,000 calls, top SKU = Enterprise+Atmosphere). A second
> 553-call run in the SAME month would tip ~100 calls over the free cap (~$2-3), so
> WAIT until July when the allowance resets, then re-run for free. Before re-running:
> 1. **Widen the field mask** in `enrich-places.js` to also capture (all in-tier, free):
>    `utcOffsetMinutes` (correct open-now math across AU timezones/DST),
>    `primaryType`, `types` (sharpen venue_type/tags), `googleMapsUri`,
>    `formattedAddress`. (`editorialSummary` already in the mask.)
> 2. **Reset the guard** to re-fetch everyone: `UPDATE restaurants SET places_api_at
>    = NULL, places_api_raw = NULL;` then `node scraper/enrich-places.js`, then
>    `node scraper/reconcile-places.js --commit`.
> 3. ~~Backfill the 6 rows with NULL `google_place_id`~~ — DONE via
>    `backfill-place-ids.js`; all rows now have a `google_place_id`.
> Do NOT request `photos` (separate per-fetch SKU = real cost) or `reviews`
> (licensing constraints) without a deliberate decision.

`scraper/build-table.js` / `scraper/enrich.js` are earlier file-based versions,
superseded by the DB scripts. `scraper/schema.sql` holds the table definition.

## Database

- **DB:** `nepali_eats` • **main table:** `restaurants`
- Natural key: `google_feature_id` (`0x..:0x..`, 100% present). Also store
  `google_place_id` (`ChIJ..`, Places API key). `google_cid` was dropped (redundant).
- Columns: slug, name, cuisine, venue_type, tags[], halal_status, rating,
  review_count, price_level, price_range, opening_hours, street, suburb, state,
  postcode, full_address, lat, lng, **geom (PostGIS Point 4326)**, phone, email,
  website, facebook, instagram, tiktok, whatsapp, menu_url, menu_source,
  google_maps_url, source_query, address_source, is_nepali, relevance,
  featured_rank, popular, description, enriched_at, place_enriched_at,
  website_checked_at, timestamps.
- **Places API columns (added 2026-06, populated by `reconcile-places.js`):**
  `business_status` ('OPERATIONAL'/'CLOSED_TEMPORARILY'/'CLOSED_PERMANENTLY' —
  drives open-status + hiding closed spots), attribute booleans
  `serves_vegetarian`, `takeout`, `delivery`, `dine_in`, `outdoor_seating`,
  `reservable`, `good_for_groups`, `serves_alcohol`, `serves_cocktails`,
  `allows_dogs`, `wheelchair_accessible`; `parking` (friendly label) and
  `editorial_summary` (Google's one-line blurb, 27 rows). Staging:
  `places_api_raw` (jsonb, full Place Details) + `places_api_at` (timestamp).
- **`catering` (boolean, editorial — NOT from Places, added 2026-07):** does the spot
  cater off-site events. Distinct from `good_for_groups` (a large table dining in).
  Null = unknown; set true when a menu/site advertises catering (e.g. Kathmandu Momo).
  No code reads it yet (additive, safe); wire into display/filters when the
  catering/events feature lands.
- **PostGIS:** `geom` is auto-synced from lat/lng by trigger `trg_set_restaurant_geom`;
  GiST index `idx_restaurants_geom` powers map bounds queries
  (`geom && ST_MakeEnvelope(w,s,e,n,4326)`). Enabled via `scraper/schema.sql`.
- Taxonomy: old Google `category` was dropped (meaningless — all are Nepalese).
  `venue_type` (Restaurant/Café/Takeaway/Food Truck/Caterer/Dessert/Bar) +
  `tags[]` (momo, thakali, newari, tibetan, vegetarian, nepali-indian) derived
  from name. `halal_status` (certified/options/not_halal/unknown) — restaurant
  level; per-item halal belongs in future `menu_items`. Currently all 'unknown'.
- `email` + socials (facebook/instagram/tiktok/whatsapp) added 2026-06; populated
  from restaurant websites (see website-enrichment TODO). Only #857 done so far.
- **Opening hours (two-field):** `opening_hours_raw` (jsonb) holds the per-day
  strings exactly as scraped; `opening_hours` (jsonb) holds the canonical parsed
  shape the frontend reads: `{ "mon": [[600,1230]], "tue": [], ... }`
  minutes-from-midnight, `[]`=closed, absent key=unknown, close>1440=past midnight.
  `opening_hours` is rebuilt from `_raw` by `scraper/hours.js` every pass, so
  re-parsing never needs a re-scrape. `hours_scraped_at` is the per-day-run key.
  **As of 2026-06-25 the full-week `opening_hours` (474 rows) is supplied by the
  Places API via `reconcile-places.js`** (`regularOpeningHours.periods`), which
  supersedes the headless single-day accumulation. See `scraper/enrich-hours.js`
  and the "Opening hours" pipeline note above.
- **Filter attribute columns — now POPULATED** (Places API, see above): the
  Explore "flags" filter is backed by `serves_vegetarian`, `takeout`, `delivery`,
  `dine_in`, `outdoor_seating`, `reservable`, `good_for_groups`, `serves_alcohol`,
  `serves_cocktails`, `allows_dogs`, `wheelchair_accessible`. `kid_friendly`
  (381 rows, 377 true) and `live_music` (365 rows, 57 true) are ALSO populated
  from the same Places API pass (Google's `goodForChildren`/`liveMusic`).
- Indexes: state, suburb, postcode, (lat,lng).

## ⚠️ Schema changes are SHARED with prod — deploy code with them

Dev and prod (Vercel) point `DATABASE_URL` at the **same Neon database**. So any
**schema change** (e.g. `ALTER TABLE ... DROP/ADD/RENAME COLUMN`, type changes)
takes effect for the **currently-deployed** site the instant you run it. If the
deployed code still references a dropped/renamed column, prod (and your local
`.next`) start erroring (`column ... does not exist`). Rule: whenever you migrate
the DB, **ship the matching code change to prod (push to `main` → Vercel)** in the
same go — don't leave the deployed app out of sync with the schema. Locally,
restart `next dev` / clear `.next` so the stale compiled query is rebuilt.

## Menus (schema LIVE on Neon; seeding in progress) — design lives in MENU-PLAN.md

The shared canonical menu schema is BUILT and applied to Neon (it also backs FoodHub
later). **Don't redesign it — seed into it.** Full design + locked decisions + the JSON
contract are in `MENU-PLAN.md`; read it before doing menu work.

- **Schema** (`scraper/schema-menu.sql`, applied): `dish_categories` (controlled
  hierarchical tag vocab + `search_aliases`), `menu_categories` → `menu_items` →
  `menu_item_variants` (priced), `menu_item_tags` (M2M), `menu_item_photos` (deferred).
  `restaurants` gained `price_min/max`, `menu_item_count`, `menu_parsed_at`. Item
  provenance: `menu_items.source` (admin/owner_upload/llm_extracted) + `is_hidden`.
- **Taxonomy / controlled vocab:** `web/lib/menu/taxonomy.ts` is the single source of
  truth (50 tags) → seeded to `dish_categories` by `node scraper/seed-taxonomy.ts`
  (idempotent). Model: dish-level default; **momo** has a preparation subtree; **protein
  is a CROSS-CUTTING facet** (chicken/goat/buff/veg…) tagged alongside the dish, NOT
  per-dish compounds. A dish not in the vocab → add a row to `taxonomy.ts` + re-run
  `seed-taxonomy.ts` (the menu seeder HARD-ERRORS on unknown slugs by design).
- **Seeding (one restaurant at a time, manual):** transcribe the menu (image/PDF) into
  `scraper/menu-data/<slug>.json` (the JSON contract — see MENU-PLAN.md +
  `scraper/menu-data/sample-menu.json`), then `node scraper/seed-menu.js <slug>`
  (dry-run) → add `--commit` to write. The seeder consolidates protein-only items into
  variants, materialises tag ancestors, unions variant proteins, and rebuilds
  `restaurants.tags` + price/count facets in one transaction. Seed popular restaurants
  first (richest menus grow the vocab fastest). **Seeded so far:** `kathmandu-momo-surfers-paradise`
  (168), `heshela-newa-khaja-ghar-{rockdale-rockdale,hurstville-hurstville}` (91 each — same
  menu seeded to both branches), `falcha-town-hall-sydney` (53). Bar/drinks ARE transcribed
  (tagged `drinks`, item-level only so they don't roll up to `restaurants.tags`); catering
  flyers are skipped (set the `catering` flag instead — Kathmandu + both Heshela are true).
- **Menu item descriptions are transcribed VERBATIM** from the menu (not generated), so
  the copywriting/human-copy standard does NOT apply to them (it still applies to the
  separate restaurant blurb generator).
- **Nothing in the deployed web app reads these tables yet** (no frontend menu render /
  dish search), so menu schema changes stay low-risk until that ships.

## ⚠️ DB is the source of truth (do NOT re-run load-db.js)

The 400 non-Nepali rows were **hard-deleted** (`DELETE WHERE is_nepali IS FALSE`).
`nepali-restaurants-au.json` still has all 1017, so re-running `load-db.js` would
**resurrect them**. Treat Postgres as canonical; `load-db.js` was a one-time seed.
Current table (as of 2026-06-30): **467 rows** (all `is_nepali IS NOT FALSE`); **448
visible** after hiding the 19 `business_status = 'CLOSED_PERMANENTLY'` spots from public surfaces.
Category field cleaned: rating-string pollution backfilled+nulled, non-Nepali categories (Taiwanese, event venues, couriers, shops, etc.) removed.

## Status (1017 scraped → 467 in directory) — ENRICHMENT COMPLETE

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

### Post-launch (do AFTER launch, not blocking)

- [ ] **Non-destructive cropping (nice to have)** — today the admin editor crop is
      destructive: `CropModal` bakes the chosen region into a new file and the old
      one is deleted (see "Image cropping is client-side + destructive" above), so
      you can't un-crop, repeated crops soften JPEG quality, and one aspect ratio is
      baked per image. Not worth it now (crops are infrequent admin actions, storage
      is trivial, new keys cache-bust cleanly). Revisit IF the claim flow lands and
      owners start re-framing their own photos a lot, OR we need multiple aspect
      ratios from one source. Preferred approach when we do: keep the original +
      store a normalized crop rect and crop on the fly via **Cloudflare Image
      Resizing** (`/cdn-cgi/image/…`, same provider as R2) so it's lossless and
      multi-aspect with NO extra storage (avoids the ~2x cost of storing a second
      cropped file). Then every display surface builds the transformed URL.
- [ ] **Language options / Nepali translation** — add a language switcher so the
      site can be translated into Nepali (नेपाली). Covers UI strings, nav, and
      ideally restaurant blurbs. Plan for i18n routing (e.g. `/ne/...`) + a
      translation layer; English stays default.
- [ ] **Restaurant blurb generator** — only ~36 rows have a `description` today
      (12 hand-written + 24 paraphrased from Google `editorial_summary`; the other
      ~93% are blank and fall back to `autoBlurb`). Build an LLM generator (needs
      `ANTHROPIC_API_KEY`) that writes an original 1-2 sentence blurb per restaurant
      in brand voice into `description`. Feed it everything we have as signal: name,
      `venue_type`, `tags[]`, `suburb`/`state`, rating, and the Google
      `editorial_summary` as a *hint only* (do NOT republish or store its text in a
      displayed column — licensing; treat it as one input so output is "informed by",
      not "derived from"). Apply the human-copy standard (no em/en dashes, AU
      spelling, no AI-tell words; copywriting skill). Skip rows already non-NULL so
      hand-written + paraphrased blurbs are preserved. Skip the non-Nepali leaks
      flagged by `relevance`/`is_nepali`. Make it reviewable (stage to a column or
      dry-run file before writing `description`).
- [ ] **Photo carousel in the place card** — the Explore Mapbox popup card
      (`.ne-popup`, see `web/components/explore/MapView.tsx`) shows a single photo;
      add a swipeable/clickable carousel through the restaurant's `restaurant_photos`
      so users can flick through multiple shots without opening the detail page.
- [ ] **Momo Route / momo crawl** — let foodies string several momo spots into a
      route (momo-hopping, the way people do bar/café crawls): an ordered set of
      stops shown on the Explore map with walking distance/time between them and a
      shareable URL. The format is proven (food crawls, Eater/Infatuation "maps,"
      Google Maps Lists) and on-brand ("Find your momo people"), with strong SEO
      ("momo crawl <city>", "best momo route in <suburb>"). **Build editorial-first,
      UGC later:** start with admin-curated trails per city/suburb (e.g. "5 momo
      stops walking distance in Harris Park") so it ships value and SEO on day one
      and reuses what we have (PostGIS to order stops + compute leg distance/time,
      the Explore map to render). Add a user "build your own route" tool only after
      auth lands (UGC route-builders have a cold-start problem: low creation rates,
      need accounts + seeded content to not feel empty). **Caveat:** crawling only
      works where momo spots cluster, check which suburbs have 3+ momo places close
      together (PostGIS proximity) before designing the walking UX; spread-out
      spots become a drive, not a crawl. Likely a `routes` + `route_stops` table
      (slug, title, city/suburb, ordered restaurant_id stops, author) plus
      `/momo/route/[slug]` pages.
- [ ] **DISCOVERY: Event booking / Festivals promotion / lead CRM** — monetization
      discovery piece, NOT yet scoped to build. Three related-but-distinct surfaces that share
      data but monetize differently; this entry captures the thinking so it isn't lost.
    - **(A) Catering / private-event enquiries** (birthdays, bhoj, office orders) —
      diner → restaurant lead-gen. Highest-intent, highest-value transaction in the
      space and the clearest gap vs Google Maps (Maps can't do "momo + mains for 30
      in Harris Park next Sat"). Money = restaurants pay to *receive* leads
      (subscription or pay-per-lead) and/or featured "verified caterer" placement
      (reuses `featured_rank`). NOT diner-pays. Hard part is supply-side cold-start:
      we have no relationship/monitored channel with any restaurant (email 39%, phone
      95% but scraped ≠ a pipeline). v0 = concierge: form routes to admin, we broker
      manually by phone, to validate demand before building owner plumbing.
    - **(B) Festival & community events** = a PUBLIC "what's on" layer (Dashain,
      Tihar/Deusi-Bhailo, Holi, Teej, Losar, Nepali New Year, Buddha Jayanti, momo
      comps, live-music nights). Different shape from A (one-to-many, time-bound,
      public). Strongest SEO gap in the diaspora online (event info today is buried in
      FB groups/WhatsApp, unindexed) → recurring SEASONAL traffic spikes per festival.
      Primarily an audience/traffic play that makes A + the whole directory stickier
      ("the Nepali food + culture hub for AU"), not a strong direct revenue line:
      monetize via promoted/featured events + festival-season sponsorship inventory;
      ticketing cut is high-build and fights Eventbrite/Humanitix, skip early. Open
      scope call: restaurant-only vs community-wide (temples, associations host the
      best events) — leaning community-wide = bigger, more defensible surface but
      drifts from "restaurant directory". Same editorial-first → UGC-later pattern as
      momo routes: admin-curate per city first (no auth needed), add submissions later.
      ⚠️ Real cost is editorial freshness, not the build — a stale calendar is worse
      than none.
    - **(C) Lead CRM** — once A/B run, both need somewhere to land/track: an
      `enquiries` table (restaurant_id FK, contact, party size, date, event_type,
      message, status, created_at) + an `events` table (title, type, restaurant_id
      NULLABLE so community orgs qualify, datetime, suburb/state, geom, ticket_url,
      description, status). Owner-facing enquiry management basically needs the
      claim/auth flow already deferred below, so A's real launch rides on auth; B can
      ship editorial-only without it.
    - **Recommended sequence:** launch directory → B editorial-curated (audience +
      warms restaurant relationships, no auth) → A concierge on the warmed
      restaurants → monetize both via `featured_rank` once traffic exists (sells
      hardest in festival season). **Validate both sides MANUALLY before writing
      matchmaking code — first dollar is a phone call, not a feature.**
- [ ] **Add a Spot** (`/add-a-spot` submission flow) — post-launch feature.
- [ ] **Login / auth** — post-launch feature (gates reviews, claims, saved spots).
- [ ] **Claim a restaurant** — claim portal so an owner can claim their listing
      (verify, then `grantOwnership` → `restaurant_owners`). The detail-page Edit
      button already shows for admins + owners (`/api/me?restaurantId` → `canEdit`),
      but `/admin/[slug]` is still admin-gated (`proxy.ts` + `assertAdmin`). When
      the claim portal lands, open the editor to verified owners so claiming lets
      them edit their own spot.
      ⚠️ **Client/server authz mismatch to resolve in this work:** the detail-page
      edit UI is revealed when `canEdit = admin OR owner` (`EditModeProvider` →
      `/api/me?restaurantId`), but the actual write routes
      (`/api/admin/restaurants/[slug]/*`) are still `requireAdmin()` (admin ONLY).
      So once claims land, a verified owner will see the full edit panel and every
      save will 403. It fails CLOSED (server denies, so no security hole today),
      but the two authz definitions have already drifted. When opening the editor
      to owners, widen the write routes from `requireAdmin()` to an admin-or-owner
      check (reuse `isOwnerOf`) so the server matches what the client reveals.
- [ ] **Cache `/api/search` responses** — autocomplete is deterministic per query
      and data is near-static, but the route (`app/api/search/route.ts`) sends no
      cache header and `SearchBox` does a raw `fetch` into local state, so repeat
      queries (e.g. `?q=auburn`) refetch every time. Plan:
      (1) add `Cache-Control` (`s-maxage` + `stale-while-revalidate`) so the
      CDN/browser serve repeats without invoking the function — biggest win;
      (2) **normalize the cache key** (lowercase + trim + collapse whitespace) so
      `Auburn`/`auburn`/`auburn ` are one entry (SQL is already case-insensitive);
      (3) optionally wrap `searchSuggest(q)` in Next 16's `'use cache'` +
      `cacheLife`/`cacheTag` for DB protection on cold edges; cache empty/no-result
      responses too. Skip per-instance in-memory LRU. **Invalidation:** rely on TTL
      + deploy busts now; wire `revalidateTag('search')` into the `/admin` save once
      owner edits get frequent (claim flow). React Query/SWR is *not* needed for
      this — revisit a client query lib only when saved-spots/reviews land.
      ⚠️ Next 16 caching APIs changed; confirm `'use cache'`/header syntax against
      `node_modules/next/dist/docs/` before implementing (see `web/AGENTS.md`).

- [ ] **Re-enable Explore filters (data is now mostly enriched).** The Open now /
      Sort / Rating filter row is still **hidden** in `ExploreClient.tsx` (gated
      with `{false && (...)}`, search for "Filters (Open now / Sort / Rating)
      hidden"). The Places API pass (2026-06-25) filled the gaps that made this
      thin: full-week `opening_hours` (474 rows, Open now is now reliable) and the
      attribute booleans (vegetarian/takeout/delivery/dine-in/etc.); price is still
      sparse (136 rows). The backend `flags` filter is already wired
      (`FLAG_COLS`/`?flags=`). Remaining work is mostly the UI: design the filter
      surface, then remove the `{false &&}` wrapper. `openOnly`/`sort`/`minRating`/
      `price` still wire into the query.
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
- [~] **Menu scraping** → menu tables. **SCHEMA + taxonomy + seeders are now BUILT
      and live on Neon** (see the "Menus" section above + `MENU-PLAN.md`); the actual
      shape superseded the single-table sketch below. Remaining: seed restaurants one
      menu at a time, then build the frontend (detail-page menu render + dish search +
      dish×city SEO pages). Historical sketch of the original idea:
      new `menu_items` table
      (restaurant_id FK, section, name, description, price, currency, photo_url,
      is_vegetarian, spice_level, source, source_url, position, fetched_at).
      Source priority: ordering platforms (Menulog/Uber Eats/DoorDash/order.store,
      structured + prices) → restaurant own-site via LLM extraction → Google
      (weak for structured menus). Promote `section` to a `menu_sections` table
      if menus get richer.
    - **⚠️ DESIGN CONSTRAINT — the menu tables are a SHARED canonical schema,
      not directory-only.** They are intended to also back **FoodHub** (not live
      yet): a **QR-menu / in-restaurant ordering app** sold as an upsell to the
      restaurants already in this directory. So design the menu schema
      product-neutral: keep menu **content** (categories, items, priced
      **variants**, dish taxonomy, dietary flags, descriptions) **normalized and
      SQL-queryable** so it serves BOTH the directory (display + dish/price/diet
      filtering, dish landing pages) AND FoodHub (rendering orderable items).
      Keep **transactional/ordering** concerns (availability toggles, modifier
      GROUPS with select rules, carts, orders, payments) OUT of the shared core —
      those are FoodHub-specific and layer on later, referencing the shared menu.
      Notably this means NOT using FoodHub's old `modifiers Json` shortcut for
      variants (it kills the directory's column-level filtering); variants live in
      a normalized table both products read. Full design + decisions live in
      `MENU-PLAN.md`. Source of truth for now is this Neon DB; whether FoodHub
      reads it directly or the menu tables split into a shared service is a later
      call (decide when FoodHub is built).
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
- [x] **Opening hours — DONE via Places API** (`reconcile-places.js`,
      `regularOpeningHours`): full-week `opening_hours` on 474 rows, replacing the
      headless single-day accumulation (`enrich-hours.js`, kept as a fallback).
      Price/rating/review_count + attribute columns + `business_status` also
      backfilled in the same pass, including `kid_friendly` (377 true) and
      `live_music` (57 true) from Google's `goodForChildren`/`liveMusic`.
- [ ] Menus/prices go stale — define a refresh cadence (`fetched_at` staleness)

## Conventions

- Enrichment scripts are **idempotent + resumable** (drive off `WHERE ... IS NULL`).
- Keep CSV/JSON as exports/snapshots; **Postgres is the source of truth.**
- Respect proxy rotation + asset blocking for any new Google scraping.
