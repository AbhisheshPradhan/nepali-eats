# nepali-eats

Directory of **Nepali restaurants in Australia**: scraped from Google Maps,
enriched, stored in Postgres (Neon), served by the Next.js app in `web/`.

**Where things live:** launch/SEO/UX master plan → `LAUNCH.md` · frontend punch
list → `GO-LIVE-CHECKLIST.md` · menu system design → `MENU-PLAN.md` · menu
worklists → `MENU-SEEDING-PLAN.md` + `MENU-QUEUE.md` · post-launch backlog →
`ROADMAP.md` · catering → `CATERING-BACKLOG.md` · copy → `VOICE_AND_TONE.md` +
`COPY.md` · blog → `BLOG-PLAN.md` · code review → `web/CODE-REVIEW.md`.

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
      **"Find your momo people."** Full guide: `VOICE_AND_TONE.md`.

## Dev server (do NOT start it)
Do NOT run `npm run dev` / `next dev` (or `npm start`). Abhishesh runs the dev
server himself. To verify changes, use `npx tsc --noEmit` (typecheck) or
`npm run build` when a full build check is needed, but never start the dev server.

## Git (do NOT commit or push unless told)
NEVER `git commit` or `git push` until Abhishesh explicitly says to (e.g. "commit",
"commit and push"). Make the changes, verify (typecheck/build), and leave the working
tree for review — even when a task feels finished, wait for the explicit go. Approval
is per-request: a "commit" on one change does NOT carry over to later changes.

## Stack & deployment (LIVE at nepali-eats.vercel.app)

- **Scraper:** Node 25 + Playwright (Chromium, headless), 20 rotating Webshare
  proxies (`WEBSHARE_PROXIES` in root `.env`).
- **DB:** **Neon** Postgres + PostGIS. `DATABASE_URL` in root `.env` → Neon.
  ⚠️ Dev and prod share the SAME Neon DB (see "Schema changes are SHARED").
  The old local `postgresql@17` DB is retired.
- **Host:** **Vercel** (Hobby, root `web/`). Stays on Vercel, NOT Cloudflare
  Pages/Workers: Next 16 ISR/RSC/`'use cache'` work zero-adapter and the raw
  `node-postgres`/PostGIS layer needs full Node (Workers would force a DB
  rewrite). ⚠️ Hobby's terms bar monetized sites: the day we monetize we move
  to Pro ($20/mo) regardless of traffic. First real bill otherwise is the DB
  (~$19 Neon) when traffic outgrows free.
- **Media:** Cloudflare **R2** (free egress), bucket `nepalieats-media`, synced
  via `scraper/upload-media-r2.sh`, served via `NEXT_PUBLIC_MEDIA_BASE`.
- **DNS + edge (TODO):** Cloudflare proxy IN FRONT of Vercel (anti-scraping,
  decided 2026-07-02): registrar → Cloudflare (orange-cloud, Super Bot Fight
  Mode allowing verified bots, cache rules) → Vercel. ⚠️ Gotchas: SSL mode MUST
  be **Full (strict)** ("Flexible" causes redirect loops with Vercel); do NOT
  blanket-cache HTML (fights ISR) — cache static assets hard, respect origin
  headers for HTML.

Remaining deploy checklist (details in `LAUNCH.md` §3 / `GO-LIVE-CHECKLIST.md`):
- [ ] Custom domain via Cloudflare DNS → Vercel (www→apex 301 in Cloudflare),
      then set `NEXT_PUBLIC_SITE_URL` so canonicals are right.
- [ ] Cloudflare bot protection + cache rules (above).
- [ ] Rate-limit `/api/search` + `/api/restaurants` (or confirm Cloudflare rules
      cover it; the `.vercel.app` host bypasses Cloudflare).
- [ ] Search Console + Bing + GA4; submit sitemap.
- [ ] Editorial admin for `featured_rank` + descriptions (small `/admin` or Neon
      SQL editor).

## Project layout

- `scraper/` — scraping/enrichment scripts. Run from PROJECT ROOT (they read
  root `.env`, write root `media/`, resolve root `node_modules`).
- `web/` — Next.js 16 (App Router, RSC) + Tailwind v4. Reads Postgres via
  `lib/queries.ts` (node-postgres, no ORM). Theme from `design-system/tokens`
  (Baloo 2 + Mukta, Phosphor icons, chili/marigold on cream). Pages: Home,
  Explore, `/restaurant/[slug]`, `/nepali-restaurants/[state|suburb]`, `/momo`,
  `/tag/[tag]`, Stories, `/add-a-spot`, sitemap/robots/404. Photos via
  `mediaUrl()` → `/media` (dev symlink `web/public/media -> ../../media`) → R2
  in prod. ⚠️ This Next version has breaking changes: read
  `web/node_modules/next/dist/docs/` before writing Next-specific code
  (`web/AGENTS.md`).
- `design-system/` — design system + mockup (build reference).
- `media/` — self-hosted photos/menus (gitignored; symlinked in dev, R2 in prod).

### Frontend decisions worth knowing (don't re-derive)

- **Home:** featured + popular rows are state-scoped (IP-geo → state, default
  NSW/Sydney): featured = rows with non-null `featured_rank`; popular = hand-set
  `popular` flag, never featured rows. Both self-hide when empty. Cards show
  distance from shared location or the state capital.
- **Explore = map-driven, PostGIS-backed.** `GET /api/restaurants?bbox=…` →
  page 1 returns `{items(30), total, pins(all in view)}`; later pages items
  only. Mapbox GL JS (`react-map-gl` v8, `NEXT_PUBLIC_MAPBOX_TOKEN`) with native
  clustering; pin click → popup card; list auto-refreshes on `moveend`
  (debounced); hover/selection via data-driven paint (`activeId`), not DOM
  markers. Initial centre: `?focus=<slug>` > `?lat&lng` > `?state/suburb/tag`
  extent > IP-geo state capital > Sydney. `GET /api/search?q=` (3+ chars) powers
  the shared SearchBox autocomplete. The `?flags=` filter maps allowlisted
  attribute columns (`FLAG_COLS` in `lib/queries.ts`) to true-only WHERE
  clauses; the filter UI (chips + Open now + Rating) is live in
  `ExploreClient.tsx`.
- **Permanently-closed spots are hidden from every public surface** (explore,
  home, search, sitemap, facets) via `business_status IS DISTINCT FROM
  'CLOSED_PERMANENTLY'` (`NOT_CLOSED` in `lib/queries.ts`); detail pages still
  resolve so inbound links don't 404.
- **Live open-status:** `OpenStatusBadge` computes open/closed in the BROWSER
  (pages are ISR-cached, server-rendered status would go stale) and re-ticks
  each minute. `openStatus()` in `lib/format.ts` returns a domain `kind`; badge
  maps kind → palette tone. `Badge` tones are colour-named, not feature-named.
- **Admin:** `/admin` (Clerk-gated via `proxy.ts` + `ADMIN_USER_IDS`, plus
  per-page `assertAdmin` / per-route `requireAdmin`), media triage at
  `/admin/triage`, header `AdminStateSwitcher` previews the geo-scoped home per
  state via the `ne_admin_state` cookie (honored only for admins in
  `resolveState()`, so anonymous traffic pays no auth cost).
- **Inline restaurant editor:** admins get an "Edit Details" slide-over drawer
  on the detail page (`components/edit/RestaurantEditPanel.tsx`, 3 tabs:
  General = one batched PATCH; Photos + Menu = instant uploads). Old
  `/admin/[slug]` form still exists. See `web/EDIT_RESTAURANT_PLAN.md`.
- **Image cropping is client-side + destructive:** `CropModal` bakes the crop
  into a new file (cover 16:9, gallery 4:3). Re-framing an EXISTING photo loads
  it through `GET /api/admin/media?key=…` — a same-origin admin proxy that
  streams the R2 object server-side, because the public R2 domain sends no CORS
  headers so a direct `<img crossOrigin>` + canvas export fails.

## Data pipeline (run from project root) — ENRICHMENT COMPLETE

One-time seed + enrichment passes, all idempotent/resumable:

1. `scraper/scrape.js` — Google Maps search across 82 AU areas → JSON.
2. `scraper/load-db.js` — ⚠️ ONE-TIME seed, never re-run (see below).
3. `scraper/enrich-db.js` — addresses/phone/website via place pages (proxies).
4. `scraper/enrich-google.js` — photos + rating/review_count.
   `scraper/enrich-website.js` — email + socials + own-site photos + menu links.
5. `scraper/export-db.js` — snapshot → `main-table.json`/`.csv`.

`scraper/enrich-hours.js` (headless, one weekday per run) is a free FALLBACK
only; full-week hours now come from the Places API.

**Google Places API (New) pass — DONE 2026-06-25 (553 calls, free tier):**
`scraper/enrich-places.js` dumps raw Place Details JSON into `places_api_raw`
(+`places_api_at`), one call per restaurant keyed off `google_place_id`, direct
connection (no proxy), `MAX_CALLS=600` guard, resumable. It never touches
canonical columns; `scraper/reconcile-places.js` (dry-run default, `--commit`)
maps raw → canonical: full-week `opening_hours`, rating, review_count,
price_level, `business_status`, attribute booleans, `parking`,
`editorial_summary`. Re-parseable any time from the stored raw, no API re-call.

> **⚠️ RE-RUN REMINDER — due NOW (on/after 2026-07-01).** The June pass was free
> under the monthly per-SKU allowance (~1,000); a second same-month run would
> tip over (~$2-3), so July+ is free again. Before re-running:
> 1. **Widen the field mask** in `enrich-places.js` (all in-tier/free):
>    `utcOffsetMinutes`, `primaryType`, `types`, `googleMapsUri`,
>    `formattedAddress`.
> 2. **Reset the guard:** `UPDATE restaurants SET places_api_at = NULL,
>    places_api_raw = NULL;` → `node scraper/enrich-places.js` → `node
>    scraper/reconcile-places.js --commit`.
> 3. Do NOT request `photos` (paid per-fetch SKU) or `reviews` (licensing)
>    without a deliberate decision.

## Database

- **Main table `restaurants`.** Natural key `google_feature_id` (100% present);
  `google_place_id` = Places API key. Columns: slug, name, cuisine, venue_type,
  tags[], halal_status, rating, review_count, price_level, price_range,
  opening_hours, street, suburb, state, postcode, full_address, lat, lng,
  **geom (PostGIS Point 4326)**, phone, email, website, socials
  (facebook/instagram/tiktok/whatsapp), menu_url, menu_source, google_maps_url,
  source_query, address_source, is_nepali, relevance, featured_rank, popular,
  description, logo_key, cover_key(+source/attribution), timestamps.
- **Places API columns** (populated 2026-06-25): `business_status`, attribute
  booleans (`serves_vegetarian`, `takeout`, `delivery`, `dine_in`,
  `outdoor_seating`, `reservable`, `good_for_groups`, `serves_alcohol`,
  `serves_cocktails`, `allows_dogs`, `wheelchair_accessible`, `kid_friendly`,
  `live_music`), `parking` (friendly label), `editorial_summary` (27 rows),
  staging `places_api_raw`/`places_api_at`.
- **Editorial booleans (null = unknown, never bulk-false):** `catering`
  (does off-site events; distinct from `good_for_groups`) and `fusion`
  (venue blends a cuisine beyond Nepali/Indian/Tibetan, e.g. Fuda; row-level
  on purpose so it survives menu reseeds). Nothing reads them yet (additive).
- **PostGIS:** `geom` auto-synced from lat/lng by trigger
  `trg_set_restaurant_geom`; GiST index powers the bbox queries.
- **Opening hours, two fields:** `opening_hours_raw` (per-day strings as
  scraped) + canonical `opening_hours` (`{"mon": [[600,1230]], ...}`,
  minutes-from-midnight, `[]`=closed, absent=unknown, close>1440=past
  midnight), rebuilt from raw by `scraper/hours.js`. Full week on 474 rows via
  the Places API.
- Taxonomy: `venue_type` (Restaurant/Café/Takeaway/Food Truck/Caterer/Dessert/
  Bar) + name-derived `tags[]`; `halal_status` all 'unknown' still. The old
  Google `category` column was dropped.
- Postgres regex word boundaries are `\m \M \y`, NOT `\b`.

## ⚠️ Schema changes are SHARED with prod — deploy code with them

Dev and prod point `DATABASE_URL` at the **same Neon database**, so any schema
change hits the deployed site instantly. If deployed code references a
dropped/renamed column, prod errors. Rule: when you migrate, **ship the matching
code to prod (push to `main` → Vercel) in the same go**; locally restart
`next dev`/clear `.next`.

## ⚠️ DB is the source of truth (do NOT re-run load-db.js)

Non-Nepali rows were **hard-deleted**; `nepali-restaurants-au.json` still has
all 1017, so re-running `load-db.js` would resurrect them. Postgres is
canonical; the JSON/CSV files are exports. Directory query:
`is_nepali IS NOT FALSE`. As of 2026-07-03: **~437 visible** (plus
permanently-closed hidden), 1017 originally scraped.

## Menus (schema LIVE on Neon; seeding ~144/437 done)

Canonical menu schema is BUILT and applied (it also backs FoodHub later, a
QR-menu/ordering upsell — keep menu CONTENT normalized + SQL-queryable, keep
ordering concerns like carts/modifiers OUT of the shared core). **Don't
redesign it — seed into it.** Full design + locked decisions + JSON contract:
`MENU-PLAN.md` (read before menu work).

- **Schema** (`scraper/schema-menu.sql`): `dish_categories` (controlled
  hierarchical vocab + `search_aliases`) → `menu_categories` → `menu_items` →
  `menu_item_variants` (priced), `menu_item_tags` (M2M), `menu_item_photos`
  (deferred). `restaurants` gained `price_min/max`, `menu_item_count`,
  `menu_parsed_at`. Provenance: `menu_items.source` + `is_hidden`.
- **Taxonomy:** `web/lib/menu/taxonomy.ts` is the single source of truth →
  seeded by `node scraper/seed-taxonomy.ts` (idempotent). Dish-level default;
  momo has a preparation subtree; **protein is a cross-cutting facet** tagged
  alongside the dish. Unknown dish → add to `taxonomy.ts` + re-run seed (the
  menu seeder HARD-ERRORS on unknown slugs by design). Workers log gaps to
  `MENU-TAXONOMY-TODO.md`; only the coordinator edits `taxonomy.ts`.
- **Seeding flow (one restaurant at a time):** `node scraper/menu-fetch.js
  <slug>` (resolves the own-site source, pdftotext first, rasterizes image-only
  scans) → transcribe to `scraper/menu-data/<slug>.json` → `node
  scraper/seed-menu.js <slug>` (dry-run) → `--commit`. Worker docs:
  `MENU-WORKER-CHEATSHEET.md` (the one-pager) + `MENU-WORKER-PROMPT.md`.
  Worklists: `MENU-SEEDING-PLAN.md` (menu_url buckets A/B/C) + `MENU-QUEUE.md`
  (all remaining by popularity) + `MENU-SKIPPED-SOURCES.md` (why rows were
  skipped) + `MENU-REMAINING-PLAN.md` (strategy for the rest). Progress:
  `node scraper/menu-progress.js`.
- **Hard source rule: the restaurant's OWN menu only** (own-domain page/PDF or
  physical-menu photos). Never ordering/delivery platforms (Uber Eats, Menulog,
  yumbojumbo, square.site, Foodhub white-labels, …): marked-up prices, subset
  menus. If that's the only source, SKIP. Branches of a chain each have their
  OWN menu; never reuse another branch's JSON (owner-confirmed).
- Menu item descriptions are transcribed VERBATIM (the human-copy standard does
  NOT apply to them; it does apply to the blurb generator).
- Bar/drinks ARE transcribed (`drinks`, item-level only); catering flyers are
  SKIPPED (set `catering=true` instead; see `CATERING-BACKLOG.md`).
- The detail page renders the menu when items exist (`RestaurantMenu`); dish
  search / dish×city SEO pages not built yet.

## Status

1017 scraped → ~437 visible after relevance cleanup + closures. Coverage:
address + lat/lng 100%, rating 99%, phone 95%, photos ~76% (self-hosted WebP
under `media/photos/<id>/`), website 73%, menus ~144 restaurants (~9k items).
Remaining data work: menu seeding (see queue docs), optional `review_needed`
precision pass (`ROADMAP.md`).

## Key learnings (don't re-discover these)

- **Google stalls headless Chromium from datacenter proxies** UNLESS you block
  images/media/fonts/css; with asset blocking a place page renders in ~4s.
- **Direct connection throttles after ~300 place-page hits** (panel silently
  stops rendering). Fix = rotate direct + all proxies, retry on other exits.
- Plain proxy HTTP fetch returns only the Maps shell; place data needs JS, so
  rendering (Playwright) is required.
- List-card scrape yields only a street fragment; full address needs the place
  page. Review counts render inconsistently on list cards.

## Conventions

- Enrichment scripts are **idempotent + resumable** (drive off `WHERE ... IS NULL`).
- CSV/JSON are exports/snapshots; **Postgres is the source of truth**.
- Respect proxy rotation + asset blocking for any new Google scraping.
- TODOs live in `ROADMAP.md` (post-launch) and the launch docs — not here.
