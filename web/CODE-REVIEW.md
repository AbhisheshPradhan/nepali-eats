# Code Review — `web/`

Reviewed: 2026-07-03 (supersedes the 2026-06-25 review). Typecheck clean
(`npx tsc --noEmit`). Lint: **14 errors, 24 warnings** (`npm run lint`).
The auth model (edge `proxy.ts` + per-route `requireAdmin` + per-page
`assertAdmin`), SQL parameterization/allowlisting (`FLAG_COLS`, `EDITABLE`,
`COVERAGE`), and the JSON-LD `<` escaping are all solid. Nothing here blocks
launch; the Bugs section is worth fixing before it, the rest is post-launch.

Fixed since the last review: `removeRestaurantMedia` now sweeps `covers/`;
LIMIT/OFFSET is `Math.trunc`ed everywhere; the Explore filters UI shipped
(flags panel + Open now + Rating).

## Bugs

- [ ] **`directionsUrl` emits a duplicate `destination` param.**
      `lib/format.ts:317-328` builds `?...&destination=<address>` then appends
      `&destination=<lat,lng>`, so the address is always ignored. Put the
      address `destination` only in the no-coords branch.
- [ ] **`searchSuggest` locations query missing `NOT_CLOSED`.**
      `lib/queries.ts:546-551` — the restaurants half filters permanently
      closed spots, the locations half doesn't, so suburb autocomplete counts
      include closed venues (and a suburb whose only spot is closed still
      suggests). Add `AND ${NOT_CLOSED}`.
- [ ] **Explore `?lat&lng` accepts NaN.** `app/explore/page.tsx:88-95`
      `parseFloat`s the params with no `Number.isFinite` guard; `?lat=abc&lng=x`
      makes `center = [NaN, NaN]` and Mapbox throws on the flyTo. Validate and
      fall through to the default branch.
- [ ] **Dead `price` filter state in ExploreClient.** `ExploreClient.tsx:132`
      declares `price`/`setPrice`; `buildParams` sends `price` but no UI ever
      sets it (the filters panel has flags/open/rating only), so it's always 0.
      Either add the price control or remove the state + param plumbing.

## Performance / scaling

- [ ] **Write-on-read on the hot path.** `/api/me` and `/api/saved` GETs call
      `ensureCurrentUser()` = an unconditional Clerk `currentUser()` network
      call + `INSERT ... ON CONFLICT DO UPDATE` (`lib/users.ts:75-87`). A
      signed-in user opening one detail page fires this twice (SaveButton +
      EditModeProvider). The webhook already provisions rows; make it a
      `SELECT` first with a lazy upsert only when missing. Matters on Neon
      free tier at launch scale.
- [ ] **Double DB fetch per detail/location page render.** `generateMetadata`
      and the page component each call `getRestaurantBySlug(slug)`
      (`restaurant/[slug]/page.tsx:74,97`); the `[location]` page's `resolve()`
      runs `suburbFacets()` (a full GROUP BY) twice the same way. Next dedupes
      `fetch()`, not pg queries — wrap the hot read helpers in `React.cache()`
      (one line each in `lib/queries.ts`) to halve query volume on every ISR
      render and build (~450 static pages).
- [ ] **No cache headers on the hottest endpoints.** `/api/restaurants` (hit on
      every map `moveend`) and `/api/search` (already tracked in root
      CLAUDE.md) send no `Cache-Control`. `/api/featured` + `/api/popular` are
      per-state and near-static too. `restaurants/[slug]/photos` already does
      it right (`s-maxage=3600, stale-while-revalidate`) — copy that pattern.
- [ ] **`searchSuggest` runs its two queries sequentially**
      (`lib/queries.ts:528-553`). `Promise.all` them; halves autocomplete
      latency for free.
- [ ] **`pinsInBounds` runs a correlated photo subquery per pin** (up to
      LIMIT 3000) on every map move. Fine at 448 rows; if the dataset grows,
      either drop `primary_photo` from the pins payload (the popup lazy-loads
      the gallery anyway and only needs the photo before that resolves) or
      LATERAL-join it. The 3000 cap is silent — fine for AU scale, just known.
- [ ] **`/api/featured` + `/api/popular` (and `FeaturedCards` + `PopularCards`)
      are copy-paste twins.** Same state-resolution block, same fetch-and-swap
      effect. One parameterized route (`?row=featured|popular`) and one
      component with a prop would halve the surface to maintain.

## Lint (get it green before CI)

Real smells, worth fixing:

- [ ] **`ExploreClient.tsx:234` — `fetchRef.current = run` assigned during
      render** ("Cannot access refs during render"). Breaks React Compiler
      assumptions. Move into an effect, or restructure `run` as `useCallback`
      reading filter state from refs. Same error in `PlaceCardMockups.tsx:39`.
- [ ] **`ExploreClient.tsx:284` — closure named `useLoc`** parses as a hook →
      `rules-of-hooks` error. Rename (`locate`).
- [ ] **`ExploreClient.tsx:211`** — `reset ? setLoading(true) :
  setLoadingMore(true)` as an expression statement; use `if`.

The other ~10 errors are `react-hooks/set-state-in-effect` firing on mostly
legitimate patterns (mount-time clock tick in `OpenStatusBadge`, fetch-in-effect
in `SearchBox`/`MapView`/`TriageClient`, localStorage read in
`useUserLocation`). Decide once: refactor them or downgrade that rule to warn
in `eslint.config.mjs`. Don't leave lint red — it hides new errors.

## Minor / polish

- [ ] Dead code: `app/page.tsx:2` (`Link`); `restaurant/[slug]/page.tsx`
      (`Clock` import, `open`, `hoursToday`, `price` — all feed only
      commented-out JSX); `PopularCards.tsx:5` (`LatLng`); several unused
      `eslint-disable` directives (`--fix` clears them).
- [ ] `restaurant/[slug]/page.tsx` carries four commented-out JSX blocks
      (price, where, description, "Read on Google"). Decide and delete; git
      remembers.
- [ ] JSON-LD `address` block always emitted even when every field is undefined
      (`restaurant/[slug]/page.tsx:192`); omit when empty.
- [ ] OG images: the satori `<img>` elements lack `alt` (3 lint warnings). Add
      `alt=""`.
- [ ] Admin photo upload (`api/admin/restaurants/[slug]/photos`) silently skips
      non-image files but still returns `ok: true`, and has no size cap
      (Vercel's ~4.5MB body limit is the only guard). Report skipped files;
      consider an explicit cap.
- [ ] `DELETE /api/admin/restaurants/[slug]` doesn't `revalidatePath`, so the
      deleted spot's ISR page can serve up to 1h. PATCH revalidates only the
      detail page (lists stay stale ≤1h — acceptable, just known).
- [ ] `GET /api/admin/media?key=` streams any R2 key. Admin-only so not a
      vulnerability, but restricting to the known prefixes
      (`photos/|covers/|logos/|menus/`) is one line of hardening.
