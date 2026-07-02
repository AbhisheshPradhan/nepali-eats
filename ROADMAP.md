# Roadmap (post-launch backlog)

Deferred work, moved out of CLAUDE.md so the working notes stay short. Nothing
here blocks launch. Each entry keeps the decisions already made so they aren't
re-litigated later. Related docs: `LAUNCH.md` (launch/SEO/UX master plan),
`CATERING-BACKLOG.md` (catering venue list + `catering_sets` design),
`MENU-REMAINING-PLAN.md` (menu coverage for the remaining ~300 spots),
`web/CODE-REVIEW.md` (code-level fixes).

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
- **Item-level (enable now, populate over time):** add `vegan` + `gluten-free`
  as cross-cutting facet tags in `web/lib/menu/taxonomy.ts` (same pattern as the
  `veg` protein tag). Populated ONLY when a menu explicitly marks a dish —
  accrues via normal seeding, no back-scan. "Gluten-free momo in <city>" landing
  pages are a LATER deliverable gated on real item coverage.

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

## Claim a restaurant / owner editing

Claim portal → verify → `grantOwnership` → `restaurant_owners`. The detail-page
Edit button already shows for admins + owners (`/api/me?restaurantId` →
`canEdit`). ⚠️ **Client/server authz mismatch to resolve in this work:** the
edit UI reveals for `admin OR owner`, but every write route
(`/api/admin/restaurants/[slug]/*`) is still `requireAdmin()` — a verified
owner would see the panel and 403 on save. Fails closed (no hole today), but
when claims land, widen the write routes to admin-or-owner (reuse `isOwnerOf`).
Also: owner edit policy, claims queue, owner dashboard — see LAUNCH.md §8.

## Other deferred items

- **Login / auth** — gates reviews, claims, saved spots (Clerk already in).
- **Add a Spot** — `/add-a-spot` submission flow.
- **Cache `/api/search`** — add `Cache-Control` (`s-maxage` +
  `stale-while-revalidate`), normalize the cache key (lowercase/trim/collapse
  whitespace), optionally `'use cache'` on `searchSuggest`; cache empty results
  too; skip in-memory LRU; TTL + deploy busts for invalidation, wire
  `revalidateTag` only when owner edits get frequent. ⚠️ Confirm Next 16 syntax
  against `node_modules/next/dist/docs/` first. (Also `/api/restaurants` — see
  `web/CODE-REVIEW.md`.)
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
