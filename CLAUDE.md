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

## Stack

- **Node 25 + Playwright** (Chromium, headless) for scraping/enrichment
- **PostgreSQL** (local, `postgresql@17`) — database `nepali_eats`
- **Webshare proxies** (20, rotating) in `.env` as `WEBSHARE_PROXIES`
- `DATABASE_URL` in `.env` → `postgresql://<user>@localhost:5432/nepali_eats`

## Production stack & deployment (planned, TODO)
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

To do (deploy):
- [ ] Neon: create project, `CREATE EXTENSION postgis`, run `scraper/schema.sql`,
      load data; grab pooled (app) and direct (scraper/migrations) connection strings.
- [ ] App `DATABASE_URL` → Neon **pooled** (serverless-safe); scraper and
      migrations use the **direct** connection.
- [ ] R2: bucket plus public domain, set `NEXT_PUBLIC_MEDIA_BASE`, upload `media/`.
      The hostname is already whitelisted in `next.config.ts` images.
- [ ] Vercel: import repo (project root `web/`), set env vars, deploy, custom domain.
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
hours now come from the Places API** (`reconcile-places.js`, see below); the About
panel (kid_friendly/live_music) still needs a field-mask widening on the next run.

**Google Places API (New) pass — DONE 2026-06-25 (553 calls, free tier):**
`node scraper/enrich-places.js` — one Place Details call per restaurant (keyed off
`google_place_id`), dumps the FULL raw JSON into staging column `places_api_raw`
(+ stamps `places_api_at`). It does NOT touch any canonical column; mapping into
real columns is the separate, reviewable `reconcile-places.js` step. Direct
connection, NO proxy (it's an authed API). Hard `MAX_CALLS=600` guard in code,
stops on 429, resumable (`places_api_at IS NULL`), ordered
featured→rating→review_count. All 542 rows now have `places_api_at`. This
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
  `serves_cocktails`, `allows_dogs`, `wheelchair_accessible`. The legacy
  `kid_friendly`/`live_music` columns are NOT in the Places API basic field set
  and remain NULL; Google's `goodForChildren`/`liveMusic` would need an explicit
  field-mask addition before they fill.
- Indexes: state, suburb, postcode, (lat,lng).

## ⚠️ DB is the source of truth (do NOT re-run load-db.js)

The 400 non-Nepali rows were **hard-deleted** (`DELETE WHERE is_nepali IS FALSE`).
`nepali-restaurants-au.json` still has all 1017, so re-running `load-db.js` would
**resurrect them**. Treat Postgres as canonical; `load-db.js` was a one-time seed.
Current table: **542 rows** (all `is_nepali IS NOT FALSE`); **522 visible** after
hiding the 20 `business_status = 'CLOSED_PERMANENTLY'` spots from public surfaces.
Category field cleaned: rating-string pollution backfilled+nulled, non-Nepali categories (Taiwanese, event venues, couriers, shops, etc.) removed.

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

### Post-launch (do AFTER launch, not blocking)

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
- [ ] **Add a Spot** (`/add-a-spot` submission flow) — post-launch feature.
- [ ] **Login / auth** — post-launch feature (gates reviews, claims, saved spots).
- [ ] **Claim a restaurant** — claim portal so an owner can claim their listing
      (verify, then `grantOwnership` → `restaurant_owners`). The detail-page Edit
      button already shows for admins + owners (`/api/me?restaurantId` → `canEdit`),
      but `/admin/[slug]` is still admin-gated (`proxy.ts` + `assertAdmin`). When
      the claim portal lands, open the editor to verified owners so claiming lets
      them edit their own spot.
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
- [x] **Opening hours — DONE via Places API** (`reconcile-places.js`,
      `regularOpeningHours`): full-week `opening_hours` on 474 rows, replacing the
      headless single-day accumulation (`enrich-hours.js`, kept as a fallback).
      Price/rating/review_count + attribute columns + `business_status` also
      backfilled in the same pass. `goodForChildren`/`liveMusic` still need a
      field-mask addition (next July re-run) before `kid_friendly`/`live_music` fill.
- [ ] Menus/prices go stale — define a refresh cadence (`fetched_at` staleness)

## Conventions

- Enrichment scripts are **idempotent + resumable** (drive off `WHERE ... IS NULL`).
- Keep CSV/JSON as exports/snapshots; **Postgres is the source of truth.**
- Respect proxy rotation + asset blocking for any new Google scraping.
