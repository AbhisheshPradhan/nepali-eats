# NepaliEats, Launch Readiness Plan

Strategy: ship now, then edit data on the live site via `/admin`. Do not block
launch on manual data cleanup. This doc tracks the execution checklist to go
live. SEO strategy/roadmap lives in `SEO_LAUNCH_PLAN.md`; this is the
"get it deployed" punch list.

Decided: launch with the current data (553 visible, 99% rated, 100% addressed,
77% photos). Fix the long tail in place after launch.

---

## A. Code-side work (Claude does these now)

These are in the repo and don't depend on any external account. Typecheck with
`npx tsc --noEmit` after; do NOT start the dev server.

- [ ] **1. Admin gate via Clerk (launch blocker).** `/admin/*` and
      `/api/admin/*` have zero auth today. Because we're editing on live, the
      admin will be on the public domain, so an open admin = anyone can vandalise
      the directory. Use **Clerk** (free Hobby plan, 50k MRU; only signed-in
      users count, so effectively free). Protect `/admin/*` + `/api/admin/*` via
      Clerk middleware **plus an admin-role/allowlist check** (Clerk lets anyone
      sign up, so "signed in" is not enough; restrict to your user id or an
      `admin` role in Clerk metadata). This is the same auth layer we'll reuse for
      owner login post-launch, so it's built once, not thrown away.
- [ ] **2. Default OG image.** No `og`/`opengraph-image` asset exists, so every
      social/link preview is currently blank. Add a branded default
      (`app/opengraph-image`) + Twitter card fallback in `app/layout.tsx`.
- [ ] **3. Home page schema.** Add `WebSite` + `SearchAction` (sitelinks search
      box) and `Organization` JSON-LD to the home page. Only restaurant + stories
      pages emit JSON-LD today.
- [ ] **4. `BreadcrumbList` on inner pages.** Restaurant, city/suburb, tag, momo.
      None emit breadcrumbs today (SEO_LAUNCH_PLAN §1).
- [ ] **5. `aggregateRating` compliance.** It's emitted on restaurant detail
      pages but no reviews are shown there, which is a Google rich-results
      violation and can trigger a manual action. Either drop it or only emit it
      where review content is actually rendered. Drop for now (no reviews yet).
- [ ] **6. Sitemap `lastModified`.** Confirm `app/sitemap.ts` uses real row
      timestamps (`updated_at`/`enriched_at`), not build time. Fix if not.

## B. Infra / external (Abhishesh does these)

External accounts and DNS, can run in parallel with section A.

- [ ] **Neon:** create project, `CREATE EXTENSION postgis`, run
      `scraper/schema.sql`, load data. Grab the **pooled** URL (app) and the
      **direct** URL (scraper/migrations).
- [ ] **App env:** `DATABASE_URL` -> Neon **pooled**. Scraper + migrations use
      the **direct** connection.
- [ ] **R2:** bucket + public domain, upload `media/`, set
      `NEXT_PUBLIC_MEDIA_BASE`. Photos 404 in prod until this is done (today
      they're a local symlink). Hostname already whitelisted in `next.config.ts`.
- [ ] **Vercel:** import repo (project root `web/`), set env vars
      (`DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_MAPBOX_TOKEN`,
      `NEXT_PUBLIC_MEDIA_BASE`, `CLERK_SECRET_KEY`,
      `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`), deploy, attach custom domain.
- [ ] **Canonical host:** pick apex vs www, 301 the other, keep it consistent
      across canonical tags, sitemap, and internal links.
- [ ] **Cloudflare:** DNS in front of Vercel, cache rules, Super Bot Fight Mode
      (skip Googlebot), www -> apex 301.
- [ ] **Measurement:** Google Search Console + Bing Webmaster + GA4 verified
      BEFORE indexing. Submit sitemap. GSC is the instrument panel.

## C. Pre-flight check (right before flipping DNS)

- [ ] `npm run build` clean in `web/`.
- [ ] Spot-check prod: home, an Explore search, a restaurant detail, a city page,
      `/momo`, a tag page, 404, robots, sitemap.
- [ ] Photos load from R2 (not 404).
- [ ] `/admin` requires Clerk sign-in AND admin role; a non-admin signed-in
      user is rejected; `/api/admin/*` rejects unauthenticated.
- [ ] OG preview renders (paste a URL into a social debugger).

---

## Deferred (NOT blocking launch, captured so decisions aren't lost)

### Event analytics pipeline (build soon, but post-launch is fine)

First-party event tracking into our own Postgres so we can later show owners
per-restaurant insights. Decisions already made:

- **Reset at go-live:** `TRUNCATE events, restaurant_stats_daily` only. Never
  touches `restaurants`. Pre-launch rows are throwaway test traffic; the point of
  building early is to validate the instrumentation, not to keep history.
- **Ignore our own traffic** even post-launch (admin cookie / env flag no-ops
  `track()`), so dev clicks never pollute owner numbers.
- **Event taxonomy** (mirrors GSC: impression -> click -> action):
    - `impression` (surface: list | map | landing | suggestion), deduped once per
      session/restaurant/surface; IntersectionObserver, buffered + batch-flushed.
    - `result_click` (surface) — card/pin click into a listing.
    - `profile_view` — detail page load.
    - `outbound_click` (target: call | website | directions | menu | facebook |
      instagram | tiktok | whatsapp) — sent via `navigator.sendBeacon` so it
      survives navigation. The highest-value owner metric.
    - `search` (query, result_count, picked) — site-level (restaurant_id null);
      zero-result queries are an operator-only content-gap goldmine.
- **Tables:** `events (id, restaurant_id nullable FK, event_type, surface,
target, query, result_count, session_id, path, referrer, created_at,
meta jsonb)` + nightly rollup `restaurant_stats_daily (restaurant_id, date,
impressions, profile_views, clicks, calls, website_clicks, directions,
menu_clicks, social_clicks)`. Owner dashboards read only the rollup.
- **Rollup job:** `scraper/rollup-events.js` (cron, like the hours pass).

### Owner admin + claim flow (post-launch)

- **Auth:** Clerk (same layer as the admin gate). Free Hobby plan covers it
  (50k MRU; only signed-in owners + admins count). Use **Clerk Organizations**
  to model "one owner owns many restaurants" + roles (`admin` vs `owner`),
  which maps onto the `restaurant_owners` M:N table.
- **Claim verification:** manual approval at launch volume. Owner emails to
  claim; we eyeball business email / website / socials and approve via a `claims`
  queue in admin. Add automated phone OTP (to the on-file Google number) only if
  volume grows.
- **Ownership:** `restaurant_owners` M:N so one owner can own many restaurants.
- **Edit policy:** safe fields go live immediately (description, hours, phone,
  website, socials, price range, menu, photos). Sensitive fields (name, tags,
  venue type) queue for review. Locked forever: rating, review_count, lat/lng,
  slug. Keep an audit trail (who/what/when, old -> new).
- **Owner dashboard:** reads `restaurant_stats_daily`; the per-listing insights
  are the hook that makes owners claim.
- **Optional owner perk:** let a verified owner paste their own **GA4 measurement
  ID** (validated `G-XXXXXXXXXX`, never a script snippet, never a GTM container)
  rendered lazily only on their own detail page. Needs a privacy-policy line.
  Secondary to our first-party dashboard, which gives richer data.

### Other deferred

- Menus Stage-2 extraction (needs `ANTHROPIC_API_KEY`).
- Opening-hours daily pass continues filling the week post-launch.
- Phased SEO rollout / indexation control per `SEO_LAUNCH_PLAN.md`
  (soft-launch ~20-30 URLs, noindex the rest, then expand).

---

## Open questions for Abhishesh

1. Admin polish punch list: what actually slows you down day to day? (guess:
   bulk multi-select edits + faster inline saves on the 329-line `/admin` list).
2. Canonical domain: apex (`nepalieats.com.au`) or www?
