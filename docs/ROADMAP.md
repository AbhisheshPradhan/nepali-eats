# Roadmap (post-launch backlog)

Deferred work, moved out of CLAUDE.md so the working notes stay short. Nothing
here blocks launch. Each entry keeps the decisions already made so they aren't
re-litigated later. Related docs: `LAUNCH.md` (launch/SEO/UX master plan),
`CATERING-BACKLOG.md` (catering venue list + `catering_sets` design),
`MENU-SEEDING.md` (menu coverage for the remaining ~300 spots).

## Catering model (`catering_sets`)

See `CATERING-BACKLOG.md` for the venue list AND the locked design. Summary:
catering is not menu-shaped (set/package = per-person price + courses +
choice-lists), so build a separate `catering_sets` table (courses as JSONB, fine
because we never query into it), attached to restaurants without touching à la
carte `menu_items`. Keeps catering out of dish search and price facets by
construction. Detail page gets a "Catering & Events" section; migrate Prisha's 7
interim `menu_items` into it. Interim rule until then: skip catering menus, set
`catering=true`; if one must be seeded, do it the Prisha way (one priced item
per set, courses in the description).

## Split `catering` vs `venue_hire` + "Events & Catering" nav

START AFTER menu seeding is done. Today `catering` (editorial boolean) can't
tell "cooks at your off-site event" from "has a bookable function space." Three
distinct concepts:

- `good_for_groups` (Places API) = big table dines in normally.
- `catering` (editorial) = cooks + delivers/serves at YOUR location.
- `venue_hire` (NEW editorial boolean) = bookable private/function space on
  their premises. `null`=unknown, `true`=confirmed; never bulk-false.

Decisions: column `venue_hire`; user-facing label **"Functions"** (AU-idiomatic,
SEO-strong); boolean only (capacity/min-spend is future lead-CRM). Nav item
**"Events & Catering"** = capability directory filtering `catering OR
venue_hire`. ⚠️ Do NOT use bare "Events" — reserve **"What's On"** for the
future festivals calendar (see Discovery below) so "plan YOUR event" and
"attend an event" don't collide.

Backfill (produce → review → commit, like menus): names barely help (~4
slam-dunks: Third Eye Rooftop Function Centre/Banksia, Everest Function
Centre/Rockdale, Kathmandu Banquet/North Melbourne, Silver Salver/Wollongong).
So: (0) `ALTER TABLE restaurants ADD COLUMN venue_hire boolean;` (1) auto-true
the name slam-dunks; "banquet" rows go to review ("banquet" usually = set-feast
menu). (2) Website scan (Playwright asset-block + proxies): homepage +
`/functions`, `/events`, `/private-events`, `/venue-hire`; grep a venue-hire
lexicon (function room/centre, venue hire, seats up to N, reception hall, book
your wedding). PRECISION GUARD: "our function room" → venue_hire candidate;
"we cater for events / delivered to your venue" → catering candidate. Emit
candidates + snippet to a REVIEW file; NO auto-commit. (3) Editorial confirm.
(4) The July Places API re-run's `types`/`primaryType` is an extra signal.

## Dietary flags: vegan + gluten-free (bundle with the venue_hire scan)

Same shape as venue_hire: website-scan + editorial, confirmed-true only,
nullable, never guessed.

- **Restaurant-level (near-term):** `ALTER TABLE restaurants ADD COLUMN vegan
  boolean, ADD COLUMN gluten_free boolean;` — mirrors the vegetarian dual model
  (`serves_vegetarian` = "has options" vs `menu_items.is_vegetarian` = per-dish).
- **Item-level — DONE 2026-07-05:** `vegan` (kind protein, parent `veg`, so the
  seeder's ancestor materialisation keeps vegan ⊂ veg) + `gluten-free` (new kind
  `diet`) live in `web/lib/menu/taxonomy.ts`; `dish_categories.kind` CHECK
  widened to include 'diet'. Backfill over the pre-existing ~144 seeded menus =
  `scraper/retag-dietary.js` (dry-run default; explicit menu marks only, with
  reviewed exclusions for "option available"/"contains gluten"/ingredient
  mentions). Forward accrual via normal seeding (worker rules in
  `MENU-WORKERS.md`). Explore shows a "check with the venue" note when
  a vegan/gluten-free chip is active. "Gluten-free momo in <city>" landing pages
  are a LATER deliverable gated on real item coverage (gate: 3+ spots with
  confirmed items per page; Melbourne qualifies first for vegan).

⚠️ Gluten-free is effectively a MEDICAL claim (coeliac): never infer, set true
only from an explicit menu/site statement, frame as "gluten-free OPTIONS /
check with venue." Vegan same rule (ghee/paneer everywhere; vegetarian ≠ vegan).
Backfill: clone the venue_hire scan (homepage + `/menu`, lexicon "gluten
free"/"GF"/"coeliac"/"vegan"/"plant-based") → review file → editorial confirm.
Expect a low hit rate; most stay `null`, which is correct. Restaurant-level is
derivable from item-level where a menu exists; never the reverse (drives the
sequencing).

## DISCOVERY: event booking / festivals / lead CRM (monetization, not scoped)

Three surfaces that share data but monetize differently:

- **(A) Catering / private-event enquiries** (birthdays, bhoj, office orders) —
  diner → restaurant lead-gen. Highest-value transaction and the clearest gap vs
  Google Maps. Money = restaurants pay for leads (subscription/pay-per-lead)
  and/or "verified caterer" placement (reuses `featured_rank`). Never
  diner-pays. Cold-start problem: no monitored channel with restaurants yet, so
  v0 = concierge (form → admin, broker by phone) to validate demand.
- **(B) Festival & community events** — public "What's On" layer (Dashain,
  Tihar, Holi, Teej, Losar, Nepali New Year, momo comps). Strongest SEO gap in
  the diaspora (event info lives in FB groups/WhatsApp, unindexed) → seasonal
  traffic spikes. Primarily an audience play; monetize via promoted events +
  festival sponsorship. Skip ticketing (fights Eventbrite/Humanitix). Open
  call: restaurant-only vs community-wide (temples/associations host the best
  events; community-wide = bigger surface but drifts from "restaurant
  directory"). Editorial-first, UGC later. ⚠️ Real cost is editorial freshness;
  a stale calendar is worse than none.
- **(C) Lead CRM** — once A/B run: `enquiries` table (restaurant_id, contact,
  party size, date, event_type, message, status) + `events` table (title, type,
  restaurant_id NULLABLE for community orgs, datetime, suburb/state, geom,
  ticket_url, status). A's real launch rides on the claim/auth flow; B ships
  editorial-only without it.

Sequence: launch directory → B editorial → A concierge on warmed restaurants →
monetize via `featured_rank` once traffic exists (sells hardest in festival
season). **Validate both sides manually before writing matchmaking code — the
first dollar is a phone call, not a feature.**

## Momo Route / momo crawl

Ordered momo stops on the Explore map with walking distance/time per leg + a
shareable URL ("momo crawl <city>" SEO). Editorial-first: admin-curated trails
per city (e.g. "5 momo stops in Harris Park") reusing PostGIS distances + the
Explore map; a user route-builder only after auth (UGC route tools have a
cold-start problem). ⚠️ Check which suburbs actually have 3+ momo spots within
walking distance (PostGIS proximity) before designing the walking UX. Likely
`routes` + `route_stops` tables + `/momo/route/[slug]` pages.

## Restaurant blurb generator

Only ~36 rows have a `description` (12 hand-written + 24 paraphrased from
Google `editorial_summary`); the rest fall back to `autoBlurb`. Build an LLM
generator (needs `ANTHROPIC_API_KEY`) writing 1-2 sentences in brand voice into
`description`. Inputs: name, venue_type, tags, suburb/state, rating, and
`editorial_summary` as a hint ONLY (licensing: never republish/store its text in
a displayed column). Apply the human-copy standard. Skip non-NULL rows and
non-Nepali leaks. Stage to a column or dry-run file for review before writing.

## Brands (franchise grouping) + detail-page internal linking

**Status: CORE SHIPPED (2026-07).** Schema, both detail-page blocks, and the
first 9 brands are live. Remaining work = **brand backfilling (POST-LAUNCH)** +
the `/brand/[slug]` hub-page fast-follow. See "Seeded so far" / "POST-LAUNCH"
below.

**Concept split (locked):** a **brand** is a PUBLIC, editorial grouping of
locations under one name (8848 Momo House ×15). It is for SEO + internal linking
+ nav ONLY — it carries **zero authz weight**. Ownership/claims are a SEPARATE,
private, per-restaurant system (`restaurant_owners`). They are decoupled on
purpose: one brand ≠ one owner (8848 is franchised, each branch may be
independently owned, so claiming one branch must NOT grant the others), and one
owner can hold restaurants across brands. Never derive ownership from brand.
- Brand block is owner-friendly: it cross-promotes an owner's own network instead
  of only surfacing nearby competitors.
- The future owner dashboard ("restaurants I own") is keyed by **user account**
  (`restaurant_owners.user_id`), NOT by brand — may span brands or be one spot.
  Ships with the claim flow (see next section), not now.
- "Same email → claim their other listings" is a claim-STREAMLINING signal only,
  never an auto-grant (scraped `email` is spoofable): verify per restaurant, then
  offer to batch-claim other listings sharing the contact.

**Schema (additive, safe on shared Neon — nothing in prod reads it until UI ships,
so deploy migration + code together):**
```
brands (id, slug, name, description?, website?, logo_key?)
restaurants.brand_id  -> brands.id   (nullable FK) + index
```

**Populate:** 8848 ×15 first (unambiguous). Then a clustering script proposes
other franchises (Momo Central, Heshela ×2, Falcha ×3, Chulho ×2, Aagaman ×3,
Khukuri…) to a REVIEW file — never auto-commit. Generic tokens ("Himalayan",
"Everest", "Momo Bar") over-cluster unrelated spots, so editorial confirm before
setting `brand_id`.

**Seeded so far (2026-07 — 9 brands, 37 restaurants tagged, live on Neon):**
8848 Momo House (15), Falcha (4), Aagaman Indian Nepalese (3), Khukuri (3),
Momo Central (4), Chulho (2), Chulesi (2), Heshela Newa Khaja Ghar (2),
The Momos Hub (2). All tagged by explicit per-branch slug lists with a count
guard, disambiguated by hand from name-similar-but-unrelated spots (e.g. Chulho ≠
Chulo Perth / Fresh Chulo / Chulo on Wheels; The Momos Hub ≠ Chautari Momo Hub /
365 Momo Hub).

**⚠️ POST-LAUNCH: continue brand backfilling.** Only ~37 of 437 visible spots are
grouped. Keep tagging franchises as they surface:
- Known next candidates: **Kalapani** (Ingleburn, Town Hall), **Mayalu**
  (Hurstville, Strathfield). Verify branches before tagging.
- Longer tail: run the clustering script (full normalized-name prefix, NOT first
  token — first-token grouping is mostly noise: "the"/"momo"/"himalayan"/"namaste"
  /"kathmandu"/"everest"/"cafe" span unrelated businesses) → REVIEW file →
  editorial confirm → set `brand_id`. Same per-branch-slug + count-guard method.
- Ambiguous names ("Kathmandu Momo House", "Namaste" ×several) need a human eye —
  same name may be different operators; only group confirmed same-brand.
- Ownership stays decoupled (brand ≠ authz), so backfilling is low-risk and can
  run incrementally after launch.

**Detail-page blocks (reuse `PlaceCard`; both below the menu, brand above nearby):**
- **A. "More {brand} locations"** — live sibling branches, ordered by distance
  from the current one. Render only when ≥1 sibling. Exclude self + closed.
- **B. "Other Nepali spots nearby"** — KNN `geom <-> point` nearest **6**,
  excluding self, **excluding same brand** (block A covers those), excluding
  permanently-closed + `is_nepali IS FALSE` (reuse the `NOT_CLOSED` predicate).
  **Cap ~50km: hide the block if nothing's within it** (so a lone regional spot
  doesn't show an hour-away "nearby").

**Locked build decisions:** (1) nearby count = 6; (2) distance cap ~50km, hide if
empty; (3) label "Other Nepali spots nearby" (discovery tone, honest re:
competitors); (4) `/brand/[slug]` hub page = FAST-FOLLOW, not now (bigger SEO
asset but more build); (5) both blocks below the menu, brand above nearby.

**Sequencing:** 8848 + both blocks now (proves the path end-to-end, improves all
15 8848 pages + every page's nearby links). Defer multi-franchise clustering and
the `/brand/[slug]` hub to fast-follows.

**Brand + claims interactions (later, nice-to-have):** owner dashboard can group
your restaurants by brand; brand membership can SUGGEST sibling claims (still
per-location verified); a franchisor claiming a whole brand or brand-level menu
editing (edit once → push to branches) needs a heavier brand-level ownership
concept — defer.

## Claim a restaurant / owner editing

Claim portal → verify → `grantOwnership` → `restaurant_owners`. The detail-page
Edit button already shows for admins + owners (`/api/me?restaurantId` →
`canEdit`). ⚠️ **Brand ≠ ownership** (see the Brands section above): brand
membership grants no edit rights; claims stay per-restaurant. The owner dashboard
"restaurants I own" is keyed by `restaurant_owners.user_id`, not `brand_id`. ⚠️ **Client/server authz mismatch to resolve in this work:** the
edit UI reveals for `admin OR owner`, but every write route
(`/api/admin/restaurants/[slug]/*`) is still `requireAdmin()` — a verified
owner would see the panel and 403 on save. Fails closed (no hole today), but
when claims land, widen the write routes to admin-or-owner (reuse `isOwnerOf`).
Also: owner edit policy, claims queue, owner dashboard — see LAUNCH.md §8.

## ~~Explore mobile sheet — Stage 2 + follow-ups~~ (REDUNDANT — sheet abandoned 2026-07-04)

**Decided out.** The Google-Maps-style bottom sheet (vaul drawer over a
full-bleed map, Stage 1 behind `/explore?ui=sheet`) was abandoned and its
components deleted. Mobile Explore is back to the **list/map toggle** — the
compact flat list card (`ExploreListCard`, with a "View on map" CTA) plus the
docked map card. Reason: copying a native-app sheet onto the web hit too many
iOS Safari platform limits (an `<input>` layered over the Mapbox WebGL canvas
won't take focus/taps; drag-gesture vs list-scroll arbitration; pull-to-refresh
fighting the non-modal drawer). Not worth the friction pre-launch; a real
mobile app is the better home for that UX if the product ever needs it.

The one idea worth keeping if we ever revisit in-panel detail (desktop OR
mobile), independent of the sheet: **detail via intercepting routes.** Tapping a
spot navigates to `/restaurant/[slug]` for real, but an intercepted parallel
route (`app/explore/@drawer/(.)restaurant/[slug]`) renders it inside a panel
without unmounting ExploreClient (map/spots/camera/filters); hard loads and new
tabs still get the full standalone page, so SEO (canonical, sitemap, JSON-LD,
static generation) is untouched. Deferred and speculative — not planned work.

## Other deferred items

- **Explore: sync the selected pin to `?focus=`** — pin tap / "View on map" is
  pure client state (`selected` in `ExploreClient`), so refresh/share loses the
  open card. The server already restores from `?focus=<slug>` (camera +
  focusId + initialQuery), so the only missing piece is writing the param:
  native `window.history.replaceState` (NOT `router.replace` — a router
  navigation refetches the RSC payload, bumps viewKey and triggers the resync
  effect), map id → slug via the in-memory `spots`, remove the param on
  deselect, keep dish/protein params intact. replaceState only; no
  pushState/popstate back-button handling. From the 2026-07-04 Explore review.
- **Explore: popup can outlive its pin** — the popup/docked card holds a spot
  object, so if a filter change (or the Open-now minute tick) drops the spot
  from `matches`, the highlighted pin vanishes while its card stays open.
  Low priority; close (or keep-alive) the popup when its spot leaves `matches`.
  From the 2026-07-04 Explore review.
- **Login / auth** — gates reviews, claims, saved spots (Clerk already in).
- **Add a Spot** — `/add-a-spot` submission flow.
- **API cache follow-ups** — `/api/search` + `/api/restaurants` now send
  `Cache-Control` and the search box normalizes queries (done 2026-07-03).
  Remaining, only if needed: `'use cache'` on `searchSuggest` for DB protection
  on cold edges (⚠️ confirm Next 16 syntax against
  `node_modules/next/dist/docs/` first), and `revalidateTag` invalidation once
  owner edits get frequent (claim flow). If the dataset ever grows well past AU
  scale, also revisit `pinsInBounds` (correlated photo subquery per pin, silent
  3000 cap).
- **Non-destructive cropping** — current admin crop is destructive (baked into
  a new file). Fine for now; revisit if owners re-frame photos a lot or we need
  multi-aspect. Preferred: keep original + crop rect, transform via Cloudflare
  Image Resizing (`/cdn-cgi/image/…`) — lossless, no extra storage.
- **Nepali translation / i18n** — language switcher, `/ne/...` routing,
  translation layer; English default.
- **Photo carousel in the Explore popup card** — swipe through
  `restaurant_photos` in the map popup (partially done: popup lazy-loads a
  gallery; extend to full carousel UX).
- **Website classification** — add `website_type`
  (`own_site`/`aggregator`/`ordering`/`social`) so menu sourcing routes cleanly.
- **Menus/prices refresh cadence** — `menu_parsed_at`/`fetched_at` staleness.
- **Optional relevance precision pass** — LLM classifier over `review_needed`
  (268) + `indian_likely` (152) buckets; reversible via `relevance`.
- **Event analytics pipeline + owner admin** — first-party events →
  `restaurant_stats_daily` rollups; see LAUNCH.md §8 for the full design.

---

<!-- ================= Appendix: was ROADMAP.md (image appendix) (merged 2026-07-07) ================= -->

# Food image wishlist

**Aspect ratio: 4:3 landscape. Minimum 1200x900px. jpg or webp.**

Every file goes in `web/public/categories/<category>/` and the filename must
match exactly (it equals the slug in `web/lib/food.ts`). Drop the file in and
the tile/hero appears on the next render, no code change. Missing files
self-hide, so ship these in any order.

**What makes a good shot (applies to all of them):**

- Real photos of real plates. No AI renders, no watermarked stock.
- Natural light, shot from above or at about 45 degrees, food filling the
  frame. Phone photos are fine if the light is good.
- Steam is gold. A blurred hand, a torn momo, a dipped spoon all help. A
  sterile studio plate on white does not.
- The image gets centre-cropped in some slots, so keep the hero of the shot
  (the food) in the middle of the frame.
- If the photo is a restaurant's, get their OK and note the credit so we can
  attribute it.

## Priority 1: category covers (unlock homepage carousel tiles + landing heroes)

| File                      | The shot I want                                                                                                                                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `thakali/cover.jpg`       | A full Thakali dal bhat set from above: the plate ringed with small bowls, black dal front and centre, gundruk and pickles visible, rice still steaming. The whole spread in one frame, it should look like abundance. |
| `grill/cover.jpg`         | Sekuwa skewers over the coals, char on the edges, ideally a little smoke. Fire in frame beats plated here.                                                                                                             |
| `nepali-indian/cover.jpg` | One table, both menus: a plate of momo beside a curry and naan or biryani. The point of the category in a single frame.                                                                                                |

## Priority 2: momo dish shots (heroes for the /nepali-food momo pages)

| File                     | The shot I want                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `momo/steamed-momo.jpg`  | A fresh steamed plate, skins glossy and slightly translucent, the achaar bowl in frame. One momo lifted or dipped if possible. |
| `momo/jhol-momo.jpg`     | Momo half-sunk in the sesame-tomato jhol, a spoon in the bowl. The soup should look drinkable, not like a garnish.             |
| `momo/chilli-momo.jpg`   | C-momo glazed deep red and glossy, onion and capsicum in the toss. Shine is everything here.                                   |
| `momo/fried-momo.jpg`    | Golden and blistered, one broken open so the juicy filling shows against the crisp shell.                                      |
| `momo/kothey-momo.jpg`   | Crisp base facing the camera, soft steamed top visible. The two-texture contrast is the shot.                                  |
| `momo/sandheko-momo.jpg` | Momo tossed and coated in the red dressing, coriander and raw onion through it, a little oil sheen.                            |

## Priority 3: the other dish heroes

| File                   | The shot I want                                                                                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `newari/choila.jpg`    | Smoky choila piled dark and glistening, chiura (beaten rice) beside it. Should look fierce, not tidy.                                                            |
| `thakali/dal-bhat.jpg` | A closer, simpler frame than the Thakali cover: dal pouring or poured over rice, a curry and pickle at the edge. Everyday comfort rather than the full ceremony. |
| `grill/sekuwa.jpg`     | Plated skewers, charred edges and raw onion, lemon wedge. Different from the cover: this one is on the table, not on the fire.                                   |
| `tibetan/thukpa.jpg`   | A steaming bowl, noodles mid-lift on a fork or chopsticks, broth and veg visible. Cold-day food.                                                                 |

## Already covered (no action)

Covers for momo, newari, tibetan and vegetarian are in. The kwati story has
both its photos. Extra gallery shots per dish are a nice-to-have later
(`FOOD_GALLERIES` in `web/lib/food.ts` is wired but empty).

---

<!-- ================= Appendix: was ROADMAP.md (implementation-review appendix) (merged 2026-07-07; item 1 was DONE, items 2-9 remain open backlog) ================= -->

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

## 9. SEO internal linking — 🔧 IN PROGRESS (2026-07)

No longer parked. Being built: a homepage `BrowseHub` (state/suburb/dish links)
is live, and programmatic landing pages (`/nepali-food/[slug]`) are in flight
(see `SEO-PROGRAMMATIC-PLAN.md`). Remaining to verify as it lands: footer "By
cuisine"/"By city" and detail-page links routed to
`/nepali-restaurants/[suburb]` (not `/explore?suburb=`), plus breadcrumbs.

## Smaller notes

- Hardcoded `57px` header height still assumed in ExploreClient (LAUNCH UX A5).
- Admin triage menu mode does an R2 `ListObjects` per row (~24/page); fine
  admin-only, a `menu_files` table is the eventual clean shape.
- No app-level error tracking (Sentry etc.); Vercel logs only. Revisit after
  launch if debugging blind gets painful.
