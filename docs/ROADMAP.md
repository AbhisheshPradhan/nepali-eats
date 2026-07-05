# Roadmap (post-launch backlog)

Deferred work, moved out of CLAUDE.md so the working notes stay short. Nothing
here blocks launch. Each entry keeps the decisions already made so they aren't
re-litigated later. Related docs: `LAUNCH.md` (launch/SEO/UX master plan),
`CATERING-BACKLOG.md` (catering venue list + `catering_sets` design),
`MENU-REMAINING-PLAN.md` (menu coverage for the remaining ~300 spots).

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
  `MENU-WORKER-CHEATSHEET.md`). Explore shows a "check with the venue" note when
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
