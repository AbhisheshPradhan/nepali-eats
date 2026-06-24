# Code Review — `web/` (post-launch backlog)

Reviewed: 2026-06-25. Typecheck clean. Auth model (edge `proxy.ts` + per-route
`requireAdmin` + per-page `assertAdmin`) and SQL allowlisting are solid; nothing
here blocks launch. Work through after launch.

## Bugs (real, quick fixes)

- [ ] **Deleting a restaurant orphans its cover photo.** `removeRestaurantMedia`
      sweeps `["photos", "menus", "logos"]` (`lib/admin/storage.ts:99`) but covers
      live under `covers/<id>/` (`:34`). Add `"covers"` to the cats array.
- [ ] **`directionsUrl` emits a duplicate `destination` param.**
      `lib/format.ts:302-304` builds `?...&destination=<address>` then appends
      `&destination=<lat,lng>`. Drop the address `destination` from `base`, add it
      only in the no-coords branch.
- [ ] **`searchSuggest` locations query missing `NOT_CLOSED`.**
      `lib/queries.ts:458-460` — restaurants half filters permanently-closed spots,
      locations half doesn't, so suburb autocomplete counts include closed venues.
      Add `AND ${NOT_CLOSED}`.

## Lint (12 errors, 14 warnings) — get `npm run lint` green before CI

Most "setState within an effect" errors are the strict new `react-hooks/set-state-in-effect`
rule on legitimate fetch-in-effect patterns (low priority). Real smells:

- [ ] **`ExploreClient.tsx:203` — `fetchRef.current = run` during render**
      ("Cannot access refs during render"). Move into an effect or restructure
      `run` as `useCallback` + sync effect.
- [ ] **`ExploreClient.tsx:253` — `useLoc` triggers `rules-of-hooks`.** A plain
      closure named `useLoc` parses as a hook. Rename it (`locate`).
- [ ] **`ExploreClient.tsx:180`** — `reset ? setLoading(true) : setLoadingMore(true)`
      as a statement; use `if`. Same file: unused `setPrice`/`price` state, stale
      `eslint-disable` directives.
- [ ] Decide: fix the errors, or consciously downgrade the React Compiler rules in
      eslint config. Don't leave lint failing silently.

## Scaling / design (not bugs today)

- [ ] **Write-on-read on the hot path.** `api/saved` (via `currentLocalUserId`) and
      `api/me` both call `ensureCurrentUser()`, an unconditional
      `INSERT ... ON CONFLICT DO UPDATE`, on every call. A signed-in user opening
      one detail page fires two upserts just to render (SaveButton GET + EditButton
      GET). Webhook already provisions the row — make `ensureCurrentUser` a read with
      a lazy insert only when missing. Matters at launch scale on Neon free tier.
- [ ] **`LIMIT/OFFSET` interpolation inconsistent.** Admin queries `Math.trunc`
      before interpolating (`lib/admin/queries.ts:77`); public `listRestaurants`
      interpolates raw `${limit} ${offset}` (`lib/queries.ts:178`). Both currently
      fed trusted numbers, but unify: parameterize (`LIMIT $n OFFSET $m`) or
      `Math.trunc` everywhere.
- [ ] **No cache headers on `/api/restaurants` or `/api/search`.** (Search already
      tracked in root CLAUDE.md.) The bbox endpoint is the heaviest query and gets
      hit on every `moveend`; `s-maxage` would offload it at the CDN.

## Minor / polish

- [ ] Dead imports/vars: `app/page.tsx:2` (`Link`), `restaurant/[slug]/page.tsx:94`
      (`price`), `PopularCards.tsx:5` (`LatLng`).
- [ ] JSON-LD `address` block always emitted on detail pages even when every field
      is `undefined` (`restaurant/[slug]/page.tsx:153`); omit when empty.
- [ ] `pinsInBounds` silently caps at `LIMIT 3000` with no client signal when
      truncated. Fine for AU-scale data; just be aware.
