# Pre-launch engineering plan (the last bits)

The final, launch-gating engineering tasks — to run **after** the current
priorities land. SEO internal linking + the Explore page are the important work
right now and are owned elsewhere; **do not start anything here until Abhishesh
says go.** Context lives in `LAUNCH.md` (master plan) and `GO-LIVE-CHECKLIST.md`;
this doc is just the executable task list for these four items.

Guardrails for all tasks: `npx tsc --noEmit` + `npm run build` clean before
handing back; never `git commit`/`git push` without an explicit go; any
user-facing text follows the human-copy standard (no em/en dashes, AU spelling,
copywriting skill). Stay out of files another session is actively editing
(`components/explore/*`, `PlaceCard`, the landing/`LandingPage`/`landing.ts`
files) until they're committed.

Recommended order: **1 → 2 → 3 → 4** (rate limiting is isolated and can start
first; the responsive pass is last so it doesn't collide with in-flight UI work).

---

## 1. Rate-limit the public API routes (launch-critical, isolated)

**Why:** `/api/explore/spots`, `/api/explore/dishes`, and `/api/search` are
unauthenticated and each hit Postgres on a cache miss, with no throttle. That's
a cheap DoS / Neon-cost amplification vector. Cloudflare rate rules cover the
custom domain, **but the `.vercel.app` host bypasses Cloudflare**, so we want an
app-level limiter too. `GO-LIVE-CHECKLIST.md` flags this as "before the custom
domain goes public."

**Scope (routes, heaviest first):**
- `/api/explore/spots` — full-table read (~440 rows). Highest priority.
- `/api/explore/dishes` — per-dish menu join.
- `/api/search` — per-query autocomplete.
- (Lower priority, small + already CDN-cached: `/api/featured`, `/api/popular`,
  `/api/restaurants/[slug]/photos`. Include only if cheap.)

**Approach:** `@upstash/ratelimit` + `@upstash/redis` (Upstash free tier), sliding
window, keyed by client IP (`x-forwarded-for` / Vercel's `x-real-ip`). Suggested
limits: ~60 req/min per IP on `spots`/`dishes`, ~120/min on `search` (it fires
per keystroke-batch). **Fail open** — if the limiter/Redis errors, serve the
request (never take the site down to protect the DB). Return `429` +
`Retry-After` on limit. Note: the CDN cache (`s-maxage`) already absorbs most
repeat traffic, so the limiter only guards cache-miss abuse.

**Need from Abhishesh:** create an Upstash Redis DB (free), set
`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Vercel + local `.env`.

**Decision point:** if we instead lock the `.vercel.app` host down (Cloudflare in
front of the apex only, block direct Vercel access), Cloudflare rate rules alone
could suffice and we skip the app limiter. Recommend doing the app limiter
regardless as defense-in-depth — it's cheap and host-independent.

**Done when:** exceeding the limit returns `429`; normal browsing is unaffected;
limiter failure falls open; a load test on `spots` is throttled.

---

## 2. Analytics + Search Console / Bing (needs IDs from Abhishesh)

**Why:** can't run the launch/SEO plan blind — GA4 is the instrument panel;
GSC/Bing are how Google/Bing report indexing. `LAUNCH.md` §2/§7.

**Scope:**
- **GA4:** lazy-load in `app/layout.tsx`, gated on `NEXT_PUBLIC_GA_ID` and prod
  only (use `@next/third-parties/google` `GoogleAnalytics`, or a minimal
  `next/script afterInteractive`). Later: suppress admin/own traffic (see
  `LAUNCH.md` §8 event note) — not needed for v1.
- **Search Console + Bing verification:** simplest is the verification `<meta>`
  tag via Next `metadata.verification` (or a DNS TXT record through Cloudflare).
- **Submit the sitemap** in GSC + Bing (manual, Abhishesh).

**Need from Abhishesh:** `G-XXXXXXXXXX` (GA4), GSC verification token, Bing token.

**Done when:** GA4 realtime shows prod pageviews; GSC + Bing verified; sitemap
submitted.

---

## 3. Home structured data (coordinate with the SEO lane)

**Why:** `LAUNCH.md` §5 — home currently emits no `WebSite`/`Organization`
JSON-LD. These help sitelinks + brand knowledge panel.

**Scope (MINE — isolated to home/layout):**
- `WebSite` JSON-LD on the homepage.
- `Organization` JSON-LD (name, logo, `url`, `sameAs` socials).
- `SearchAction` (sitelinks search box) — **only if** we expose a query-string
  search results URL (`/search?q=` or `/explore?q=`). We don't have one today
  (search navigates to suburb/restaurant), so this may need a small results
  route first. Defer if it's not trivial; `WebSite` + `Organization` are the
  safe wins.

**Coordinate (SEO lane may own these):** `BreadcrumbList` on detail/listing
pages, `ItemList`/`CollectionPage` on listing pages, and mapping the detail
page's `@type` from `Restaurant` to the right `FoodEstablishment` subtype
(Café/Food Truck/etc.). Confirm with the SEO session before touching
`restaurant/[slug]/page.tsx` or the listing pages so we don't double up.

**Done when:** Rich Results Test passes for the homepage with no errors.

---

## 4. Mobile responsive polish pass (do LAST)

**Why:** `LAUNCH.md` §7 site-wide mobile items. The Explore-specific ones
(`100dvh`, filter layout) are already handled; these are the rest. Do this last,
after Explore + landing settle, to avoid collisions.

**Scope:**
- Replace the hardcoded `57px` header height with a `--header-h` CSS variable
  referenced everywhere (A5).
- `clamp()` the fixed large H1s that don't scale on small phones — detail page,
  `ListingGrid`, `add-a-spot` (B1). Homepage H1 already uses `clamp()`.
- Bump sub-44px tap targets on the most-tapped controls to ≥44px on mobile (A3).
- Verify colour contrast of small `ink-500` text on tinted `paper-100/200`
  surfaces; bump to `ink-700` where it fails 4.5:1 (B4).
- (Footer duplicate/placeholder links, B6 — likely handled by the SEO
  internal-linking work; confirm before touching `Footer.tsx`.)

**Done when:** a real-device pass (iOS Safari + Android Chrome) on Home, a
restaurant, a city page, Explore looks right; Lighthouse mobile a11y improved.

---

## Not in this plan (tracked elsewhere, decided out)
- **Custom domain + Cloudflare setup** — Abhishesh has the domain; DNS/Cloudflare
  is his infra step (`LAUNCH.md` §3). Rate limiting above is written to be
  host-independent so it doesn't block on this.
- **Places API re-run** — optional refresh, not a blocker (skip unless a stale
  rating bugs us at launch). See `CLAUDE.md` re-run reminder.
- **SEO internal linking + landing pages** — the current priority, owned by the
  SEO/landing session.
