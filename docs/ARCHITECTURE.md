# ARCHITECTURE.md - how the site works

The running record of technical decisions and how the frontend behaves: what
each surface does, why it works that way, and the rules that must survive
refactors. Update this in the same pass as the decision (like VOICE_AND_TONE.md
for copy). The root `CLAUDE.md` keeps the terse agent-facing summary; this doc
is the explanation.

Related docs: menu system design -> `MENU-PLAN.md` · infra/stack -> root
`CLAUDE.md` §Stack.

---

## Big picture

- Scraper (Node + Playwright) -> Neon Postgres (PostGIS) -> Next.js 16 App
  Router app in `web/` (RSC + ISR, no ORM, raw `node-postgres` in
  `lib/queries.ts`). Photos on R2 via `mediaUrl()`.
- Postgres is the source of truth; JSON/CSV are exports. Directory query:
  `is_nepali IS NOT FALSE` + `NOT_CLOSED` (permanently-closed rows are hidden
  from every public surface but their detail pages still resolve).
- Live open/closed status is computed in the BROWSER (`OpenStatusBadge`):
  pages are ISR-cached, so server-rendered status would go stale.

## Explore page

### Data model: everything client-side

`GET /api/explore/spots` ships the entire visible directory once as thin
`ExploreSpot` rows (~438 rows, ~40KB gzipped, CDN-cached `s-maxage=3600`).
`ExploreClient` filters, sorts and paginates in memory; map pans and filter
changes never refetch. There is no bbox API; the map viewport is a client-side
clip (`inView`). Scale ceiling ~5k rows (shard by state then).

Two more fetches, both CDN-cached and viewport-independent:

- `GET /api/explore/dishes?dish=` -> per-restaurant matched menu items
  (`dishItems`: id -> pills) for the active dish search.
- `GET /api/explore/facets` -> the facet catalog: each Category cuisine's
  served dish-type/protein/diet axes, fetched once so refine dropdowns render
  instantly with no flicker. Only changes when a menu is seeded.

### The URL model: two dimensions, one query string

The Explore URL carries two independent dimensions (`lib/explore-url.ts`):

- **LOCATION** = what the map shows: `suburb`, `state`, `lat`, `lng`, `focus`,
  `venue`.
- **DISH** = what the food filters show: `dish`, `protein`, `diet`. `dish`
  carries the most specific dish/preparation slug picked (a leaf like
  `steamed-momo` or `choila`); the server's `normalizeDishTag` splits it into
  the cuisine bucket + a pre-selected facet.

Every control MERGES its change onto the current params so the dimensions
never clobber each other: a dish pick keeps your location (map holds), a
location pick keeps your dish. `withLocation` replaces the location keys
wholesale (a new suburb drops an old focus/lat-lng) and preserves the dish;
`withDish`/`withoutDish` do the reverse. The SearchBox gets `current` only on
the Explore page; everywhere else it does a plain fresh nav.

**`tag` vs `dish` are mutually exclusive (decided 2026-07-06).** `tag` filters
restaurant-level `restaurants.tags` ("known for", name-derived + coarse menu
rollup); `dish` is the menu-level search. They are two tiers of the SAME
what-food axis, so ANDing them collapses the list to a near-empty
intersection. Rules:

- `tag` is in NEITHER key list: it's an entry-only landing scope (from `/tag/…`
  and state landing pages). It seeds the map extent and list; the first filter
  change of either dimension sheds it.
- Belt and braces: `app/explore/page.tsx` ignores `sp.tag` whenever `sp.dish`
  is set (filters, extent seeding, areaLabel, cameraKey), so a stale URL
  carrying both never ANDs them.
- `venue` stays a location key on purpose: venue ∩ dish is a meaningful
  combination (momo from a food truck), like the attribute flags.

### The focused restaurant bypasses every filter (decided 2026-07-06)

Picking a restaurant by name from the search box means "show me this place".
`focus` is a location key, so the pick keeps the active dish, and the focused
spot could fail the dish filter. Rules:

- In `matches()` the focused spot (`s.id === focusId`) bypasses ALL filter
  predicates (dish, tag, venue, flags, Open now). Only the viewport clip still
  applies, so panning away drops it naturally; the existing `ordered` logic
  pins it to the top of the list while present.
- When it doesn't match the active dish, its card explains the miss in the
  menu-excerpt slot (`noDishMatch` on `ExploreCard`), two variants by
  `hasMenu`: menu seeded -> "No {dish} on their menu, but the rest is worth a
  look."; no menu -> "We don't have their menu yet, so ask them about {dish}."
- The map popup tells the same story: MapView takes `focusId` and renders the
  focused pin's popup as the list card with the note, not the bare PlaceCard.
- The note only renders once `dishItems` has resolved, so it never flashes on
  a restaurant that does serve the dish.

### Dish search: menu is the source of truth (decided 2026-07-06)

`restaurants.tags` and the dish filter are different products and must not be
confused:

- **`restaurants.tags`** is a restaurant-level, cuisine-level vocabulary for
  SEO landing pages and interlinking ONLY. As of 2026-07-06 it holds exactly 7
  slugs directory-wide (momo, nepali-indian, newari, sekuwa, tibetan,
  dal-bhat, thakali), never leaf dishes: choila is on 109 seeded menus and in
  zero tag arrays.
- **The dish filter's source of truth is the menu** (seeded `menu_items` +
  `menu_item_tags`). We assume full menu coverage soon.

Match tiers today:

- **Menu-verified** (tier 0): restaurants with non-hidden menu items tagged
  with the dish; they get menu-excerpt pills (name + price) and rank above
  tier 1 in every sort.
- **Coarse** (tier 1, TEMPORARY bridge): `restaurants.tags` contains the dish
  slug ("known for momo", menu not seeded). These tags are NAME-DERIVED: a
  spot called "Momo House" gets the momo tag, so tier 1 is an assumption
  ("their name says momo, they surely serve it"), not verified menu data.
  Only fires for the 7 cuisine-level slugs (leaf dishes are never in tags)
  and only while NO facet chip is selected: a refinement needs item-level
  truth, so the tier drops out. Kept while seeding completes so the flagship
  searches don't thin out (momo: 221 tagged vs 157 menu-verified at time of
  writing). **Remove this guard once menu coverage is in** (momo gap closed):
  delete the coarse branch in `matches()` + the tier sort in ExploreClient,
  and dish search becomes purely menu-verified. Unseeded "known for" places
  keep their SEO surface via the `/tag` landing pages.

Facet selections (`facetSel`, one slot per kind) are DERIVED from the URL,
never client state (decided 2026-07-07): every facet pick navigates via
`setFacet` in ExploreClient. The dish/preparation slot rides the `?dish=` leaf
slug (round-trips through `normalizeDishTag`); protein and diet ride their own
params. So refinements survive location changes, URLs are shareable, and the
back button undoes filter steps. `viewKey` keys on the normalized BUCKET, so a
facet-only navigation never resets the map selection or refetches dish data.
The dish empty states name the most specific active thing (`dishSearchLabel`:
facet name with diet/protein qualifiers, taxonomy-label fallback for a facet
not yet served on any seeded menu).

### Camera and view keys

Explore is one route, so suburb/restaurant/dish picks are SOFT navigations:
server props re-render, the client does not remount. `cameraKey` identifies
the LOCATION part (what moves the map); `viewKey` = cameraKey + dish (what
resyncs the search box and facet chips). Separate keys mean a dish search
mid-browse filters the map you are looking at instead of teleporting you back
to your IP metro.

Initial centre priority: `?focus=<slug>` > `?lat&lng` > `?state/suburb/tag`
extent > IP-geo state capital > Sydney.

### Search box is transient (decided with `5cfb3a8`)

The box is an entry point, not a state display: it always starts empty and
empties itself on every pick/submit. Active state shows where it belongs (the
location on the map + list heading, the dish in the filter chips), which
leaves the box free to immediately search the other dimension.

### Filters UI

- Desktop: labelled dropdowns (Category, one refine dropdown per facet kind
  present, Features = grouped attribute flags + Open now, Sort), built on the
  shared primitives in `components/explore/FilterControls.tsx`.
- Mobile: Dish pill + icon-only Features/Sort buttons opening bottom sheets
  (Radix Dialog); the dish sheet is two-stage (category -> refine).
- Flag tokens must match what `exploreSpots()` emits (`FLAG_COLS` keys +
  `"menu"`); labels are AU-facing.
- The Category cuisines live in ONE shared list, `lib/menu/categories.ts`
  (`EXPLORE_CATEGORIES`: momo, newari, sekuwa, tibetan, thakali,
  nepali-indian, editorial Nepali-first order): the dropdown/sheet, the
  icons and the facet catalog all derive from it — add a cuisine there and
  every surface picks it up. Member-dish dropdowns render alphabetised.
- A dish not in the Category cuisines shows as its own removable chip so
  every active dish is visible in the filter row.

### Zero-results camera behaviour (decided 2026-07-08)

A dish search with no matches in view resolves by CONSENT tier, gated on
whether the visitor has physically panned/zoomed (`mapTouched`, NOT
`areaScoped` — Near me sets the latter, and both "near me" paths must behave
identically):

- **Untouched map**: zoom OUT once per dish so the frame holds both the
  visitor (blue you-are-here dot, else viewport centre) and the closest
  match, with a banner naming it. Never teleport-recenter: the visitor's
  context must stay on screen.
- **After a gesture**: the map is theirs. The empty state names the closest
  match + distance and offers "Take me there" (a tap is consent to
  recentre).

The you-are-here dot renders only from real located positions (Near me,
granted geolocation, ?lat&lng), never the state-capital fallback.

### The site dropdown (decided 2026-07-08)

`components/ui/SelectMenu.tsx` is THE dropdown for public and owner-facing
surfaces: white rounded-2xl panel, chili check-circle rows, menu-pattern
a11y (promoted from the Explore filter bar; Explore's FilterControls
re-exports these primitives, so the two can't drift). `SelectMenu` is the
form-field variant (input-shaped trigger, panel matches trigger width). The
shadcn Select is ADMIN-TOOLING ONLY; the RestaurantEditPanel's venue/price
selects still use it and should migrate when the panel is next touched.

### Interaction feedback (decided 2026-07-08)

Perceived performance is handled in three layers; keep them when touching
these surfaces:

- **Pressed states**: every interactive that isn't a `<Button>` gets the
  shared `pressable` recipe (exported from `components/ui/Button.tsx`,
  `active:scale-[0.97]`) or an `active:bg-*` flash for full-width rows.
  Mobile has no hover, so a raw button with neither gives zero tap feedback.
- **`app/explore/loading.tsx`**: skeleton streamed on entry into /explore
  from another page (the dynamic render + Mapbox chunk take a beat).
  Same-route filter changes are transitions and keep the live UI.
- **SearchBox navigations** run through `useTransition`: the magnifier icon
  becomes a spinner while the target render is in flight, and the first
  focus prefetches `/explore` (programmatic `router.push` never prefetches
  on its own).

## Other surfaces (short form; agent brief lives in root CLAUDE.md)

- **Home:** featured + popular rows are state-scoped (IP-geo -> state, default
  NSW). Featured = non-null `featured_rank`; popular = hand-set flag, never
  overlapping featured. Both self-hide when empty.
- **Detail page:** renders the seeded menu when items exist; admins get the
  Edit Details slide-over (`components/edit/RestaurantEditPanel.tsx`).
- **Search:** `GET /api/search?q=` (3+ chars) powers the shared SearchBox
  autocomplete (dishes, restaurants, locations).
- **Admin:** Clerk-gated `/admin` (+ per-page `assertAdmin`), media triage,
  state switcher via `ne_admin_state` cookie (honored only for admins).
- **Mockups lab:** `/admin/playground/mockups` hosts card/filter-bar
  candidates as deliberate copies of the real components; the port direction
  is mockup -> real when a design wins.
- **Client identity:** `useMe()` (`web/lib/useMe.ts`) is THE way client UI
  asks "who am I" (isAdmin/owned): one module-cached `/api/me` request per
  page, keyed by Clerk user id so modal sign-in/out refetches. Header and
  AppUserButton share it; EditModeProvider keeps its own
  `/api/me?restaurantId=` call (different question: canEdit for one
  restaurant), and that variant skips the ownership-list query server-side.
- **Rate limiting:** `web/lib/ratelimit.ts` — fixed-window counters on
  Upstash Redis via raw REST (INCR + EXPIRE NX, one pipelined call; no SDK,
  same no-dependency pattern as lib/email). FAIL-OPEN on missing env, HTTP
  errors, per-command {error} slots (an EXPIRE failure would otherwise mean a
  counter that never resets = permanent block), timeouts, and outages — each
  fail-open logs a `[ratelimit]` warn so a dead limiter is visible in Vercel
  logs. It's abuse control, never a security boundary or availability risk.
  Applied 2026-07-10 to `/api/search` (60 novel queries/min per IP; repeats
  are CDN-cached; 429 returns the full empty Suggestion shape because
  SearchBox reads `.dishes` unguarded), `/api/explore/spots` +
  `/api/explore/dishes` (60/min per IP, anti-bulk-harvest; ExploreClient
  treats non-OK as retryable/empty), and `/api/claims` (5/h per account
  keyed by Clerk id BEFORE any DB read, then 10/h per IP only if the account
  check passes, so a blocked account can't drain a shared office/CGNAT IP).
  Client IP = `cf-connecting-ip` first (behind Cloudflare, Vercel's
  x-real-ip is the edge). ACCEPTED RISKS: direct-to-origin requests can
  spoof cf-connecting-ip and rotate per-IP buckets (per-account limits and
  Cloudflare carry the real weight); a sustained attack burns the Upstash
  free tier (500k commands/mo ≈ 3 days at full throttle) after which the
  limiter fails open — the durable backstop is a Cloudflare WAF
  rate-limiting rule, post-launch. Functions, Neon, and Upstash are all
  Sydney (`web/vercel.json` pins syd1), so the limiter costs ~1ms.
- **Analytics (PostHog, added 2026-07-13, hardened same day after
  /code-review):** `web/instrumentation-client.ts` (Next 16's pre-hydration
  hook) dynamically imports the SLIM posthog-js build (39KB gzip vs 74KB
  full) inside the guard, so hydration is never blocked and a build without
  the env vars ships 0 analytics bytes. The `defaults: "2026-06-25"` snapshot
  auto-captures SPA pageviews on history changes (no per-route component);
  `autocapture: false` + `disable_session_recording: true` because every
  event transits the Vercel proxy — clicks would 5-10x request volume for
  data nothing reads yet, and replay must stay a code decision, not a PostHog
  dashboard toggle that silently pushes MBs/session through Hobby's caps. EU
  cloud. HOSTS: `web/lib/posthog.ts` is the single source of the three-host
  topology (ingest/assets/UI, all derived from `NEXT_PUBLIC_POSTHOG_HOST`);
  it normalizes trailing slashes and validates the host shape, and because
  `next.config.ts` imports it, a wrong value (e.g. the app host
  `eu.posthog.com` pasted instead of ingest `eu.i.posthog.com`) FAILS THE
  BUILD instead of silently dropping every event. Events post to same-origin
  `/ingest`, reverse-proxied by rewrites in `next.config.ts` so ad blockers
  that blocklist `*.posthog.com` don't drop them. Env guard: either var
  UNSET = analytics off, no rewrite, stock trailing-slash behaviour; dev is
  excluded via NODE_ENV and Vercel PREVIEWS via `NEXT_PUBLIC_VERCEL_ENV`
  (scope the Vercel vars to Production only anyway; local `next build +
  start` still captures, which is how to test events). TRAILING-SLASH TRADE:
  PostHog endpoints need their trailing slashes, so
  `skipTrailingSlashRedirect` (keyed to POSTHOG_ENABLED) disables Next's
  site-wide `/foo/ -> /foo` 308; `proxy.ts` re-creates it for all non-ingest
  paths, including a dedicated matcher entry for static-extension paths with
  a trailing slash (`/logo.png/`), which the main matcher's extension
  exclusion would otherwise turn into 404s. Change the flag and the proxy.ts
  redirect together or not at all. `/ingest/` is excluded from the middleware
  matcher (high volume, no auth needed). CUSTOM EVENTS live in
  `web/lib/analytics.tsx`: `trackEvent()` for client components, or
  `data-ph-event` + `data-ph-<prop>` attributes on ANY element (server
  components too; one delegated listener, `<AnalyticsClicks/>` in the root
  layout, picks them up — property names must be single words because the DOM
  dataset camel-cases hyphens away; the shared `Button` forwards data-*).
  Catalogue (2026-07-13): `search_picked` {kind, target, query, surface:
  hero|header|explore}, `search_no_results` {query, surface} (content-gap
  signal), `restaurant_card_clicked` {slug, surface: home_featured|
  home_popular|explore_list|map_popup|landing|listing|related|story} (surface
  is an opt-in prop on PlaceCard/ExploreCard; unset = untracked),
  `contact_clicked` {kind: call|directions|website|facebook|instagram|tiktok|
  whatsapp|email, slug} (detail page CTAs + icon row), `claim_submitted`
  {slug, status}. Everything else (acquisition, landing pages, journeys) is
  the automatic pageview capture; users stay anonymous (no identify() until a
  question needs it).
- **Site URL:** `SITE` in `web/lib/site.ts` (from `NEXT_PUBLIC_SITE_URL`,
  localhost fallback) is the ONLY source of the absolute site URL
  (canonicals, sitemap, OG, email links). Decided 2026-07-08 after the claim
  review found 10 per-file copies with two different hardcoded fallback
  domains: never hardcode a hostname next to a usage — a domain move must be
  a one-line env change in Vercel. Corollary: `NEXT_PUBLIC_SITE_URL` must be
  set in the Vercel project env (build-time inlined) or prod falls back to
  localhost.

---

## Architecture review (Fable, 2026-07-08 — parting assessment)

**Protect these strengths:** the data discipline (Postgres as single truth,
idempotent scripts, the taxonomy validator that HARD-ERRORS on unknown slugs —
why 9k+ items stayed clean); Explore's ship-once model with URL-derived state
(the drift bug class is structurally gone); the menu as the moat (normalized,
SQL-queryable, now in structured data); the decision-log habit (this file).

**Risks, ranked:**
1. Dev + prod share one Neon DB. Use Neon BRANCHING for risky schema work:
   branch, test the migration, apply to main with the code deploy.
2. APIs are unprotected until Cloudflare lands (downstream of the domain).
3. ExploreClient.tsx (~1,500 lines) is at the split point — extract the
   sheets/list body next time it's touched; don't refactor for sport.
4. Tests cover only format.ts. Next cheapest wins: explore-url.ts merge rules
   + normalizeDishTag (pure functions guarding the URL contract).
5. menu-fetch.js text extraction silently missed a seedable menu (De Bhatti,
   theme-dependent) — add a Playwright innerText fallback.

**Sequence:** domain/Cloudflare/Search Console first (distribution, not
construction, is the remaining work) → spend the menu moat on dish×city SEO
pages → owner claims (the flywheel that ends manual seeding and opens
FoodHub) → pg_trgm typo tolerance → media-rich reviews.
