# Implementation review — 2026-07-03

Architecture/product-level findings from a full pass over `web/` (separate from
the line-level code review, whose items were all fixed and pushed 2026-07-03).
"Solo" = Claude can do it without Abhishesh; "Needs A" = needs a decision,
dashboard access, or a prod-DB migration go-ahead. SEO content work is
deliberately parked (Abhishesh's call, 2026-07-03).

## 1. Explore all-pins-once redesign — ✅ DONE 2026-07-03

Shipped: `/api/explore/spots` (thin `ExploreSpot` rows: pin + card + filter
fields, 438 rows ≈ ~40KB gzipped, CDN-cached), ExploreClient
filters/sorts/paginates in memory (bbox fetch machinery deleted),
`/api/restaurants` + `pinsInBounds` removed. Bonus: the map popup card now
shows live open status (pins carry openingHours). Scale ceiling ~5k rows
(shard by state then). The payload deliberately has NO menu data — dish search
is a separate endpoint (schema verified ready 2026-07-03, see the menu-search
investigation note below).

- Note: the old bbox API already exposed the full dataset in one Australia-wide
  call, so this is NOT a new scraping exposure; Cloudflare bot protection +
  rate rules remain the mitigation either way.

### Menu/dish search readiness (investigated 2026-07-03 — schema fully supports it)

Verified against live Neon data, zero migrations needed:
- Tag pick → restaurants + matched item names (the pills): `menu_item_tags`
  joins work for `newari` (→ Yamari, Bara, Choila pills), `sekuwa` (→ Chicken
  Sekuwa · Goat Sekuwa, variant labels give "Sekuwa Stick (Chicken/Lamb/Pork)").
- `momo` matches all preps via materialized ancestors (153 restaurants, 959
  items); protein filter (buff momo → 92 restaurants) and prep filter
  (kothey-momo → 67) are one extra EXISTS each; facet counts per search are a
  cheap GROUP BY (steamed 144 / chilli 119 / jhol 112 / fried 108 / kothey 67 /
  sandheko 45; chicken 143 / veg 133 / buff 92 …).
- Typo/alias lookup is seeded: `search_aliases` maps "c-momo"→Chilli Momo,
  "dumpling"→Momo, "kukhura"→chicken, etc.
- Coverage caveat: item-level search only sees the ~144 seeded menus. For the
  rest, fall back to the coarse `restaurants.tags` rollup (two-tier results per
  MENU-PLAN.md: "serves momo" without pills).

## 2. Vercel image optimization quota — launch risk (Needs A + Solo mitigation)

Every `next/image` on R2 photos goes through Vercel's optimizer; Hobby caps
optimized SOURCE images at 1,000/month and we have ~1,125 photos + covers +
logos. Crossing the cap degrades image serving mid-month.

- [ ] Abhishesh: check Image Optimization usage on the Vercel dashboard
- [ ] Decide: `unoptimized` for R2 images (they're already pre-sized WebP) vs a
      custom loader on Cloudflare Image Resizing (already planned for crops)
- [ ] Also fix `sizes="1180px"` on the detail hero (phones fetch desktop size)

## 3. Four sources of truth for the visitor's location (Solo)

`UserLocationProvider` (localStorage + event), Explore's local `userLoc`,
`?lat&lng`, and server IP-geo don't talk to each other: Explore's "Near me"
never calls `storeLoc()`, so the homepage rows don't learn a location Explore
already has. Route all location acquisition through `storeLoc()` and have
Explore read the provider.

## 4. State-granular scoping reads broken outside the capitals (Solo)

Home featured/popular rows key on AU state, so a Newcastle/Wollongong visitor
gets Sydney picks with 80+ km distance labels. PostGIS is already there: rank
by distance from the visitor's point (state as fallback) instead of a pure
state filter.

## 5. Search has no typo tolerance (Needs A for the migration)

Autocomplete is `ILIKE '%q%'`; "momos"/"thakli"/"hurstvile" miss, and Nepali
romanizations are unstable (kothey/kothe, chhoila/choila/choyla). `pg_trgm` +
a GIN index + `similarity()` ordering fixes it cheaply. ⚠️ Needs a shared-Neon
migration (`CREATE EXTENSION pg_trgm` + index), so explicit go required; code
can be prepped first.

## 6. Revalidation is half-built; the claim flow is the trigger (Later)

PATCH/DELETE revalidate the detail page, but home rows / tag / location pages /
sitemap refresh hourly. Fine while admin-only edits; owner edits will make the
staleness visible. Move to `revalidateTag` when the claim flow lands (also in
ROADMAP).

## 7. Zero tests; format.ts deserves the only ones (Solo)

`format.ts` does timezone math across 8 AU zones with DST, past-midnight close
spillover, and week wraparound; a wrong "Open now" badge is a silent
trust-killer. One vitest file (~15 cases: Perth vs Sydney, a 1am close, `[]`
vs missing day) locks it down. Don't test anything else yet.

## 8. Menus are seeded but under-leveraged on the page (Solo)

A 195-item menu renders as one long scroll: no category anchor nav / sticky
section header, no `hasMenu`/`Menu` JSON-LD, and `price_min/max` is maintained
but never shown ("Mains $18-24" on a card is a strong signal). The display
layer is where the next user-visible menu value is.

## 9. SEO internal linking — PARKED (Abhishesh will do SEO content later)

Still the top item in `LAUNCH.md` §2 when SEO work resumes: footer "By
cuisine"/"By city" both point at `/explore`, detail pages link to
`/explore?suburb=` instead of `/nepali-restaurants/[suburb]`, no breadcrumbs.
Code-shaped (not content), so it can be picked up solo whenever unparked.

## Smaller notes

- Hardcoded `57px` header height still assumed in ExploreClient (LAUNCH UX A5).
- Admin triage menu mode does an R2 `ListObjects` per row (~24/page); fine
  admin-only, a `menu_files` table is the eventual clean shape.
- No app-level error tracking (Sentry etc.); Vercel logs only. Revisit after
  launch if debugging blind gets painful.
