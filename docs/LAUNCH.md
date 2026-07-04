# NepaliEats — Launch, SEO & UX Master Plan

The single reference for going live: deploy checklist, SEO audit + ranking
roadmap, and the mobile UX audit, in one place.

**Replaces:** `LAUNCH_READINESS.md`, `SEO_AUDIT.md`, `SEO_LAUNCH_PLAN.md`,
`UX_AUDIT.md`. Copy lives separately (`VOICE_AND_TONE.md` for voice, `COPY.md` for
page copy).

**Strategy in one line:** ship a small, excellent core now, edit data live via
`/admin`, then release inventory in waves as quality clears a bar. Do not block
launch on manual data cleanup; do not bulk-dump 650+ thin pages on day one.

Audits dated 2026-06-21 (code-level, author: Claude). Section numbers (SEO §1–§10,
UX A1–B6) are referenced from the copy docs, keep them stable.

## Contents

1. The core principle (launch quality, not quantity)
2. Pre-launch gate (unified checklist, must be true before indexing)
3. Deploy & infra checklist + pre-flight
4. SEO audit (technical + on-page findings, §1–§10)
5. SEO ranking roadmap (phased rollout, blog plan, distribution, KPIs)
6. Page-content requirements (what each template must carry)
7. UX audit (mobile-first, A–D)
8. Deferred (post-launch) + open questions

---

# 1. The core principle: launch quality, not quantity

**Do not push 650+ pages live and submit them all at once.** On a brand-new domain
with zero authority, dumping a large set of thin, near-duplicate pages (see SEO §3/§4)
is the fastest way to get classified as a low-value/scaled-content site. Google's
Helpful Content signals are **site-wide**, a mass of thin pages drags down even your
good ones, and you burn crawl budget Google hasn't decided to give you yet.

Instead: **launch a small, excellent core, earn trust and links, then release
inventory in waves**, each page admitted to the index only when it clears a quality
bar. The DB already tracks enrichment status, so indexation can be gated on real
data completeness.

Decided: launch with the current data (522 visible, 99% rated, 100% addressed,
77% photos; 20 permanently-closed spots auto-hidden via Google `business_status`).
Fix the long tail in place after launch.

---

# 2. Pre-launch gate (do BEFORE anything is indexed)

Nothing goes live for crawling until these are true. Detail/why is in §4 (SEO),
§7 (UX). Typecheck with `npx tsc --noEmit`; do NOT start the dev server.

## Technical foundation

- [x] **Admin gate via Clerk (was the #1 launch blocker) — DONE.** `/admin/*` and
      `/api/admin/*` are gated in `web/proxy.ts` (Clerk edge middleware + an
      `ADMIN_USER_IDS` allowlist), with defence-in-depth `assertAdmin()` (pages →
      404) and `requireAdmin()` (API → 401/403) in `web/lib/admin/guard.ts`. Same
      auth layer reused for owner login post-launch.
- [ ] **Canonical host.** Pick apex (`https://nepalieats.com.au`) vs www, 301 the
      other, and be consistent across canonical tags, sitemap, and internal links.
- [ ] **Measurement before indexing.** Google Search Console + Bing Webmaster Tools
      verified, GA4 installed. You cannot run this plan blind; GSC is the instrument
      panel. Submit the sitemap.
- [ ] **Internal linking (single biggest pre-launch fix).** Route equity to
      landing/detail pages, not `/explore?param=` (SEO §2).
- [ ] **Breadcrumbs + browse hub** so every indexable page is reachable in ≤2
      clicks (SEO §6); emit `BreadcrumbList` on restaurant, city/suburb, tag, momo.
- [ ] **Home schema:** `WebSite` + `SearchAction` (sitelinks search box) +
      `Organization` JSON-LD (SEO §5). Only restaurant + stories pages emit JSON-LD
      today.
- [x] **Default OG image + Twitter card — DONE.** Programmatic OG cards ship for
      home, restaurant, and location pages (`app/opengraph-image.tsx` etc.).
- [x] **Sitemap `lastModified` — DONE.** `app/sitemap.ts` now uses real row
      timestamps (`GREATEST(updated_at, enriched_at, created_at)`).
- [x] **`aggregateRating` compliance — DONE.** Dropped from the detail-page
      JSON-LD (see the comment in `restaurant/[slug]/page.tsx`); the visible
      rating UI stays.
- [x] **Home H1 carries the head term — DONE.** H1 is now "Find authentic Nepali
      food across Australia".
- [~] **Mobile must-fixes:** `100dvh` (A1) and the detail-page sticky CTA bar
      (A4) are DONE; ≥44px tap targets (A3) still to verify on device.

## Content quality bar (the gate every page must pass to be indexable)

- **Landing pages (city/suburb/tag):** 2–4 paragraphs of unique local copy +
  "what to order" + FAQ + ≥8 venues listed + internal cross-links. A page with one
  intro sentence and a grid is **not** ready.
- **Restaurant detail pages:** address + hours + ≥1 photo + price + ≥2 enriched
  fields (phone/website/rating) + a non-generic description + a "nearby spots"
  block. Pages that are just the templated one-liner are **not** ready →
  `noindex` until enriched.

---

# 3. Deploy & infra checklist + pre-flight

## Infra / external (Abhishesh; can run in parallel with the code work)

- [x] **Neon:** project created, PostGIS enabled, schema + data loaded.
      `DATABASE_URL` points at Neon (dev + prod share the same DB).
- [x] **App env:** `DATABASE_URL` → Neon. Scraper + migrations use the direct connection.
- [x] **R2:** bucket `nepalieats-media` live, `media/` synced via
      `scraper/upload-media-r2.sh`, `NEXT_PUBLIC_MEDIA_BASE` set. Public reads serve 200.
      Hostname already whitelisted in `next.config.ts`.
- [x] **Vercel:** repo imported (root `web/`), env vars set, deployed to
      **nepali-eats.vercel.app**. Custom domain still to attach.
- [ ] **Custom domain** + set `NEXT_PUBLIC_SITE_URL` to it (still `localhost` today,
      so canonicals are wrong until this lands).
- [ ] **Cloudflare:** DNS in front of Vercel, cache rules, Super Bot Fight Mode
      (skip Googlebot), www → apex 301.
- [ ] Cache content pages with static/ISR (restaurant, city, tag, momo); keep
      Explore, `/api/*`, and the geo homepage dynamic.

## Pre-flight (right before flipping DNS)

- [ ] `npm run build` clean in `web/`.
- [ ] Spot-check prod: home, an Explore search, a restaurant detail, a city page,
      `/momo`, a tag page, 404, robots, sitemap.
- [ ] Photos load from R2 (not 404).
- [ ] `/admin` requires Clerk sign-in AND admin allowlist; a non-admin signed-in
      user is rejected; `/api/admin/*` rejects unauthenticated.
- [ ] OG preview renders (paste a URL into a social debugger).

---

# 4. SEO audit (technical + on-page)

**Goal:** organic search traffic → directory discovery. No analytics access at audit
time, so traffic baselines and live CWV are not measured here, connect GSC (§7).

## Executive summary

Foundations are good for a v1: every page type has unique
titles/descriptions/canonicals, restaurant pages ship `Restaurant` JSON-LD, there's
a real `sitemap.ts` + `robots.ts`, ISR is on, images use `next/image` + WebP. That
puts the site ahead of most directories.

The traffic ceiling is set by **three problems**, all fixable:

1. **Internal linking sends nearly all equity into `/explore` (a client-side map
   app)** instead of the indexable landing pages. State/suburb/tag pages, the actual
   SEO money pages, are effectively orphaned (sitemap-only). (§2)
2. **The ~570 restaurant pages are thin and near-duplicate** (one templated
   `autoBlurb` sentence each). (§3)
3. **City/suburb/tag landing pages are also thin** (one intro sentence + a grid). (§4)

Fixing internal linking (§2) is the highest-leverage, lowest-effort win. Content
depth (§3, §4) is the durable ranking work.

### Top priorities (in order)

| # | Item | Impact | Effort |
| - | ---- | ------ | ------ |
| 1 | Re-route internal links to landing/detail pages, not `/explore?param=` | High | Low |
| 2 | Add a browse hub + breadcrumbs (+ `BreadcrumbList` schema) | High | Med |
| 3 | Enrich restaurant detail pages beyond the one-liner | High | Med |
| 4 | Enrich city/suburb/tag pages (intro copy, "what to order", FAQ) | High | Med |
| 5 | `WebSite`+`SearchAction` & `Organization` schema on home | Med | Low |
| 6 | Default OG image + Twitter card | Med | Low |
| 7 | Real `lastModified` in sitemap; connect GSC | Med | Low |
| 8 | Audit `aggregateRating` schema compliance | Med | Low |

## §1. What's already good (keep it)

- `app/layout.tsx`: `metadataBase`, title `default` + `template`, solid default
  description, `lang="en-AU"`, `locale: en_AU`, canonical.
- `app/sitemap.ts`: covers home, explore, momo, stories, all states, suburbs (≥2),
  tags, all restaurants, with sensible priorities.
- `app/robots.ts`: allows all, references sitemap.
- `app/restaurant/[slug]/page.tsx`: per-page `generateMetadata` with canonical + OG
  image, `Restaurant` JSON-LD incl. `address`, `geo`, `aggregateRating` (caveats in
  §3 & §8).
- Location & tag pages: unique titles/descriptions/canonicals + `generateStaticParams`.
- `next/image` everywhere with `sizes`; self-hosted WebP; `priority` on LCP hero.
- ISR `revalidate = 3600` on content pages.

## §2. Internal linking — highest-leverage fix (High)

The indexable landing pages exist and are in the sitemap, but almost nothing links
to them. Crawlers and PageRank follow links, not sitemaps. Equity pools in
`/explore`.

**Evidence:**

- `app/page.tsx`, featured cards link to `/explore?focus=${slug}`, **not**
  `/restaurant/${slug}`. Detail pages get no homepage links.
- Homepage has **no links** to any `/nepali-restaurants/[state|suburb]` or `/tag/*`
  page. "See all spots" → `/explore`.
- `components/Footer.tsx`, "By cuisine" and "By city" **both** → `/explore`; three
  "Hungry?" anchors all → `/stories`.
- `app/restaurant/[slug]/page.tsx`, "More spots in {suburb}" → `/explore?suburb=…`,
  **not** the indexable `/nepali-restaurants/[suburb]`.
- `components/Header.tsx`, nav is only Explore + Stories; no path to location/cuisine hubs.

**Recommendations:**

1. **Homepage cards → `/restaurant/[slug]`** (keep the map as a separate CTA).
2. **Footer = real link hub.** Replace generic `/explore` links with actual top city
   pages, top tag pages (`/momo`, `/tag/thakali`, `/tag/newari`, `/tag/vegetarian`),
   and state pages. Anchor text matches the destination's target term.
3. **Restaurant page → location pages.** "More spots in {suburb}" → 
   `/nepali-restaurants/[suburb]`, plus a sibling link to the state page.
4. **Contextual cross-links** on listing pages (city → its suburbs + relevant cuisines).
5. Keep `/explore` links for the **map** interaction, but secondary, not the primary
   discovery path.

## §3. Restaurant detail pages — thin & near-duplicate (High)

`app/restaurant/[slug]/page.tsx` renders one body paragraph: `autoBlurb(r)`, a single
template in `lib/format.ts` (`"{name} is a Nepali {venueType} in {suburb}, {state},
known for {tags}…"`). Across ~570 pages this is structurally identical, the classic
scaled/thin-content risk, and the same string is the meta description.

**Recommendations:**

- Use the structured data you already have to add unique, scannable content per page:
  hours table, price range, full address + neighbourhood, "what they're known for",
  venue type, halal (when populated), and a **"Nepali restaurants near {suburb}"
  mini-list** (3–6 internal links, doubles as §2 linking).
- Vary the templating meaningfully, or add a real editable `description` column for
  top venues with a richer auto-generator fallback. (See `COPY.md` §G1 for the
  blurb-generator spec.)
- Differentiate meta description from on-page body.
- When menus (Stage-2) land, surface a few dishes/prices (unique, high-intent; future
  `Menu`/`hasMenu` schema).
- Avoid AI-tell phrasing (`seo-audit/references/ai-writing-detection.md`).

## §4. City / suburb / tag pages — thin landing pages (High)

`components/ListingGrid.tsx` renders eyebrow + H1 + **one** intro sentence + a grid.
These target the strongest commercial terms but have almost no unique content.

**Recommendations (per landing page):**

- 2–4 paragraphs of genuinely local copy: count, which suburbs cluster, signature
  dishes, price expectations, "what to order."
- A short **FAQ block** (supports `FAQPage` + AI answers).
- **Cross-links:** city → its suburbs, city → relevant cuisine pages, tag → top cities.
- `ItemList` / `CollectionPage` JSON-LD listing the venues (§5).
- Consider **programmatic intersections** ("Momo in Sydney", "Thakali in Melbourne"),
  but only combos with enough venues (apply the same `count ≥ 2` discipline already on
  suburbs). Don't mass-produce empty combo pages.

## §5. Structured data gaps (Med)

Current: only `Restaurant` on detail pages. Add:

- **Home `WebSite` + `SearchAction`** (sitelinks search box) and **`Organization`**
  (name, logo, sameAs socials). You already have `/api/search` for the SearchAction.
- **`BreadcrumbList`** on detail + listing pages (pairs with §6 UI).
- **`ItemList`/`CollectionPage`** on momo/tag/state/suburb listing pages.
- **`FAQPage`** where you add FAQs (§4).
- **Detail type accuracy:** detail page always emits `@type: "Restaurant"` even for
  Café/Food Truck/Caterer/etc. Map to the right `FoodEstablishment` subtype.

> Validate with the Rich Results Test (renders JS), not curl/web_fetch.

## §6. Crawl architecture & navigation (High)

- **No breadcrumbs anywhere.** Add Home → State → Suburb → Restaurant (and Home →
  Cuisine → Restaurant).
- **No browse/hub page.** Add an HTML "Browse" page (or expand the footer) listing all
  states, suburb pages, and cuisine/tag pages so every landing page is ≤2 clicks for
  users and crawlers, the single biggest "make the long tail crawlable" lever.
- **`/explore` is the most-linked page but is a client-rendered map app.** Its
  canonical is fixed to `/explore` (good, `?tag=`/`?suburb=` don't spawn duplicates).
  Keep that; stop using it as the primary discovery path (§2).
- **`generateStaticParams` on `/restaurant/[slug]`** — DONE (every visible
  restaurant prerenders at build; new/edited spots still render on demand).

## §7. Technical / on-page details

- **Sitemap `lastModified` is `new Date()`** for every URL on every build. Use real
  timestamps (`updated_at`/`enriched_at`/`place_enriched_at`). (Med)
- **Default OG image + Twitter card missing.** Add `app/opengraph-image.tsx` and
  `twitter: { card: "summary_large_image" }`. (Med, social/AI-preview CTR)
- **Title length:** `"{name}, Nepali {venueType} in {suburb}, {state}"` + brand suffix
  truncates >60 chars for many venues. Tighten. (Low/Med)
- **Fonts:** Baloo 2 (5 weights) + Mukta (5 weights) with `devanagari` subset is a
  heavy payload affecting LCP/CLS. `display: swap` is correct; trim to used weights. (Med, CWV)
- **Connect GSC + Bing Webmaster Tools**, submit sitemap. (High for measurement)
- **Image alt text** is generally fine; decorative logos use `alt=""` correctly.
- **`robots.ts`** could optionally disallow `/api/` (low priority).

## §8. `aggregateRating` compliance (Med, risk)

Detail pages emit `aggregateRating` but show **no review content**, which can be
ineligible for rich results or draw a structured-data manual action. The ratings are
also **Google's data** (~57% of rows have `review_count`), with display/licensing
considerations. **Recommendation:** drop `aggregateRating` from the schema until
first-party/licensed reviews exist; keep the visible rating UI.

## §9. Content / topical authority (Med–High, durable)

- **Stories is underused** (three footer anchors point at it with no individual posts).
  Build real guides that each link into the relevant tag and city pages.
- **AI search (AEO/GEO):** directories do well in AI answers with clear extractable
  facts + FAQs. The FAQ + structured-data work above feeds this (`ai-seo` skill,
  `llms.txt`).

## §10. Homepage hero copy

The H1 ("Find your momo people.") carries **no search intent**, the keyworded string
only lives in `<title>`. Get the primary head term into the H1 (or a prominent H2),
keep "momo people" as flavour.

- **Option A (recommended):** H1 `Nepali food, all across Australia.`; sub keeps
  "Find your momo people…".
- **Option B:** keep the brand H1, add a keyworded visible H2 under it.
- **Option C:** "near me" intent lead (`Find Nepali food near you.`).

Whichever you pick, also put dish/city terms in real headings down the page (e.g. an
H2 over the cuisine carousel). Full copy in `COPY.md`.

---

# 5. SEO ranking roadmap

## Indexation control mechanism

Three levers used together decide what Google sees:

1. **Sitemap = allowlist.** Only index-ready URLs appear in `sitemap.xml`. (Today
   `sitemap.ts` dumps everything, change it to read an `index_ready` flag /
   completeness query.)
2. **`robots` meta per page.** Not-ready pages render `noindex, follow` (still
   crawlable for link discovery). Flip to `index` when they clear the bar.
3. **Internal links stay** even on noindexed pages (`follow` passes equity onward).

**Restaurant detail completeness score** (indexation gate): points for has_photo,
has_hours, has_phone, has_website, has_rating, has_menu, unique_description. Index when
score ≥ threshold (e.g. 4/7). Front-loads your best ~100–150 venues; holds back the
thin tail. Re-evaluate on every enrichment pass.

## Phased rollout

AU has a large Nepali diaspora + international-student population, your initial
audience and link/distribution engine. Targets are illustrative; adjust to GSC.

- **Wave 0 — Pre-launch (Wk -2 to 0):** build core pages to the quality bar; set up
  tracking; write the 3 cornerstone blogs. Index nothing yet.
- **Wave 1 — Soft launch / core (~20–30 URLs, Wk 0–2):** index Home, /explore, /momo,
  the 6 metro city pages, 4–6 top tag pages, ~10–15 flagship restaurant pages
  (highest completeness, Sydney/Melbourne), 3 cornerstone blogs. Submit core sitemap;
  Request Indexing in GSC; start distribution. Goal: get the domain trusted + core
  pages indexed.
- **Wave 2 — Expand the head (Wk 2–4):** remaining state pages, suburb pages with ≥3
  venues that meet the bar, the next ~100–150 restaurant pages clearing the score, 2–3
  more blogs (city guides). Goal: impressions for city + dish + "near me" queries.
- **Wave 3 — Scale + programmatic (Wk 4–8):** remaining qualifying suburbs,
  programmatic intersection pages ("Momo in Sydney" etc., gated by venue count), bulk
  remaining venues as enrichment lifts scores. Identify striking-distance keywords
  (GSC positions 5–20). Goal: long-tail starts ranking.
- **Wave 4 — Long tail + maturity (Wk 8–12+):** remaining venues, niche tags, more
  intersections; content refresh cadence; pursue PR/links.

| When | Focus | Output | KPI |
| ---- | ----- | ------ | --- |
| Wk -2–0 | Foundation | Tracking, fixes, 3 blogs, core pages | Pages pass quality bar |
| Wk 0–2 | Soft launch | ~25 URLs indexed | Indexation %, first impressions |
| Wk 2–4 | Head expansion | +cities/suburbs/150 venues, +3 blogs | Impressions, avg position |
| Wk 4–8 | Scale + pSEO | Intersections, bulk venues | Clicks, striking-distance keywords |
| Wk 8–12+ | Long tail | Remaining inventory, refresh | Clicks growth, indexed/total ratio |

## Blog content plan

Blogs (a) capture informational demand and (b) funnel link equity into commercial
city/tag pages. Each post links to the landing pages it supports. Avoid AI-tell
phrasing (thin blogs hurt like thin directory pages).

**Pillars:** (1) Nepali dishes explained → `/tag/*` + `/momo`; (2) City eating guides
→ `/nepali-restaurants/[city]`; (3) Dietary & occasion (halal, veg, festivals,
student-budget); (4) Community & stories (E-E-A-T + links).

- **Phase 1 (at launch, 3 cornerstones):** "A guide to Nepali food in Australia";
  "Where to find the best momo in Australia"; "What is Thakali dal bhat?".
- **Phase 2 (Wk 2–4):** "Best Nepali restaurants in Sydney" (repeat per metro); "Momo
  styles explained"; "Newari cuisine 101"; "Vegetarian Nepali food".
- **Phase 3 (ongoing):** "Halal Nepali restaurants" (once data lands); "Where to
  celebrate Dashain & Tihar" (seasonal: Dashain ~Oct, Tihar ~Nov, New Year ~mid-Apr,
  publish 3–4 weeks ahead); suburb guides; "Cheap & filling: Nepali food for
  students"; owner/venue features; AEO explainers ("how to eat momo").
- **Cadence:** 3 at launch, then ~1–2/week through month 1–2, then 1/week.

## Distribution & link building

- **Directory submissions** (wk 0+): general + AU + food directories
  (`directory-submissions` skill).
- **Nepali community** (wk 0+): AU Nepali Facebook groups, student associations,
  subreddits, temple/cultural orgs. Drives early traffic, `add-a-spot` UGC, links.
- **Restaurant owners:** "claim/feature your spot" gives owners a reason to link.
- **Local press / food bloggers:** pitch "every Nepali restaurant in Australia,
  mapped" (a genuinely novel data story).
- **Internal links** remain the highest-ROI lever, every blog → relevant city/tag
  pages (§2).

## Measurement & KPIs (weekly in GSC + GA4)

- **Indexation ratio** (indexed ÷ submitted) per page tier, catches thin-content
  suppression early.
- **Impressions → clicks** by template, shows which tier earns demand.
- **Average position** for "nepali restaurant [city]", "momo [city]", "nepali food
  near me", "thakali [city]".
- **Striking-distance keywords** (positions 5–20) → improve those exact pages weekly.
- **Coverage errors / soft-404s** as waves expand.
- **Backlinks / referring domains** growth.

**Decision rule:** before releasing the next wave, confirm the current wave is
indexing cleanly with no thin-content/soft-404 warnings. If indexation stalls, slow
down and deepen content rather than pushing more URLs.

---

# 6. Page-content requirements (what each template must carry)

"Deserves to rank" = satisfies intent. Audit each template against this.

## Restaurant detail page

Have: name, venue type, cuisine, area; full address + map + one-tap directions;
**live open-status badge** ("Open till 10pm / Opens today at 5pm", client-computed
so it stays accurate on the ISR-cached page); full-week hours; phone/call; price;
photos (76%, gate requires ≥1); rating + review count; website + socials;
attribute flags from the Places API (vegetarian, takeout, delivery, dine-in,
outdoor seating, groups, alcohol/cocktails, dogs, wheelchair access, parking).

Add: **"Nearby / similar Nepali spots"** internal links; **last updated / freshness**
signal; signature dishes; **menu with prices** (Stage 2, the #1 user want; unique
content + future `Menu` schema); order/booking links; **halal status** (planned
column, populate it); surface the attribute flags as UI badges + Explore filters
(data is populated, UI pending). kid-friendly / live music still need a Places API
field-mask widening on the next run.

## City / suburb / tag landing page

Have: the venue list + (on /explore) map + filters.

Add: count + unique local intro (2–4 paras); **"what to order" / top picks**; **FAQ**
(`FAQPage`); price/neighbourhood context; cross-links to nearby suburbs, parent state,
relevant cuisines.

## Home / trust (site-wide)

Clear value prop with keyword in H1 (§10), prominent search + "near me"; **About / how
the data is gathered**, contact, and an owner **"claim your spot"** path (E-E-A-T).

---

# 7. UX audit (mobile-first, critical)

**Brief:** be critical; priority is looking good on **mobile**. Method: code-level
review of layout/components/responsive classes. Items marked **(verify on device)**
need a physical/emulator check.

**Shipped since this audit (2026-07 status):** A1 `100dvh` (ExploreClient uses
`h-[calc(100dvh-57px)]`), A2 filter collapse (filters live behind a "Filters"
toggle; mobile keeps one scrollable control row), A4 detail CTAs (sticky bottom
Call/Directions bar on mobile), A7 map resize (Mapbox `resize()` on the
list→map toggle), B5 Clerk login. Still open: A3 tap targets, A5 hardcoded
57px header height, A6 z-index scale, B1 responsive H1s, B2 `_blank` rows,
B3/B4/B6.

## Verdict

The visual design system is genuinely strong (warm thali palette, prayer-flag/momo
identity, dumpling radii, tinted shadows, `prefers-reduced-motion`, visible focus
ring). **But mobile has real problems**, three of which make the site feel broken on a
phone. Explore is both the core interaction and the most-linked page, so its mobile
weakness is the biggest issue.

| # | Issue | Severity (mobile) | Effort |
| - | ----- | ----------------- | ------ |
| 1 | `100vh` → use `100dvh` (Explore clips under browser bar) | High | Trivial |
| 2 | Filter bar doesn't collapse to a sheet on mobile | High | Med |
| 3 | Sub-44px tap targets (Seg, pills, select, sm buttons) | High | Low |
| 4 | Detail: primary CTAs buried below the fold on mobile | High | Low/Med |
| 5 | Hardcoded `57px` header height (3 places) is fragile | Med | Low |
| 6 | z-index: Explore bar (`z-1200`) covers mobile nav menu (`z-26`) | Med | Low |
| 7 | Fixed `text-[2.6rem]` H1s don't scale down on small phones | Med | Low |
| 8 | CompactRow opens in `_blank`, bad on mobile | Med | Trivial |
| 9 | Hero "Near me" long label wraps into an oval | Low/Med | Low |
| 10 | Map may render grey after toggling from hidden (invalidateSize) | Med | Low |

## A. Mobile-critical

- **A1. `100vh` clips Explore under the browser bar (High).**
  `ExploreClient.tsx`, `h-[calc(100vh-57px)]`. On iOS Safari / Android Chrome `100vh`
  includes the area behind the collapsing address bar, so the bottom Map/List FAB and
  list/map end sit under the chrome. **Fix:** `100dvh` (and for the FAB offset).
- **A2. Filter bar doesn't collapse on mobile (High).** On 360–390px the top bar wraps
  to 3–4 rows before any map/list is visible. **Fix:** collapse filters behind a
  single "Filters" button → bottom sheet; keep only search + a filter-count chip
  persistent (standard maps-directory pattern).
- **A3. Touch targets below 44px (High).** Seg buttons / "Open now" pill / Sort select
  ≈26–28px; `Button size="sm"` ≈36px (borderline). These are the most-tapped controls.
  **Fix:** bump mobile control height to ≥44px.
- **A4. Detail page primary actions buried (High).** `md:grid-cols-[1fr_320px]`
  collapses to content-first, sidebar-last, so Directions / Call / hours / address land
  below the blurb + gallery + menu + reviews. **Fix:** hoist a compact action bar
  (Directions / Call) under the hero, or a sticky bottom action bar; reorder key facts
  before the gallery on mobile.
- **A5. Hardcoded `57px` header height (Med, fragile).** Assumed in ≥3 spots; the
  header is padding-driven and can grow. **Fix:** a `--header-h` variable referenced
  everywhere.
- **A6. z-index conflict (Med, verify).** Mobile nav menu/scrim are `z-[25]`/`z-[26]`,
  Explore filter bar is `z-[1200]`, FAB `z-[1100]`, header `z-30`. On Explore the
  hamburger menu may render behind the filter bar. **Fix:** one z-index scale (header +
  its menu above everything).
- **A7. Map grey after toggling from hidden (Med, verify).** Leaflet computes size on
  mount; mounting at 0×0 renders blank until `invalidateSize()`. **Fix:** call
  `map.invalidateSize()` on view-mode change / when the map becomes visible.

## B. Cross-cutting

- **B1. Fixed large H1s don't scale (Med).** `text-[2.6rem]` hardcoded on detail H1,
  `ListingGrid` H1, `add-a-spot` H1. The homepage H1 uses `clamp()` (good); apply the
  same everywhere.
- **B2. CompactRow forces new tabs (Med).** `target="_blank"` on every list result
  spawns stacked tabs and breaks the back button. **Fix:** default to same-tab nav.
- **B3. Hero "Near me" pill wraps into an oval (Low/Med).** Long sentence inside
  `rounded-full`. **Fix:** shorten the label (see `COPY.md`) or use
  `rounded-2xl` for multi-line.
- **B4. Color contrast on tinted surfaces (Med, verify).** `ink-500` (#7a6453) on
  `bg-paper-100/200` at `0.9rem`/`0.78rem` likely drops below 4.5:1. **Fix:** verify;
  bump to ink-700 for small text on tinted surfaces.
- **B5. "Log in" linked to a placeholder (Low, trust).** Header "Log in" + footer "For
  owners" routed to `/add-a-spot`. *(Now addressed: real Clerk login + an admin link
  ship in the Header.)*
- **B6. Footer duplicate/placeholder links (Low; also SEO §2).** "By cuisine"/"By city"
  both → `/explore`; three "Hungry?" links → `/stories`. Point them at real
  city/cuisine pages.

## C. Done well (keep)

Cohesive design system; `prefers-reduced-motion` handled; visible `:focus-visible`
ring (don't ship `outline:none` without it); 17px body / 1.55 line-height;
`next/image` with `sizes` + LCP `priority`; map `dynamic(..., { ssr:false })` with a
loading state; homepage H1 `clamp()`; `active:scale-95` + thoughtful `disabled` states.

## D. Device test pass

iOS Safari + Android Chrome (real or BrowserStack): Home, Explore (list+map+toggle),
detail, city page. Lighthouse **mobile** (perf + a11y) per template, watch CLS from
the two heavy webfonts (§7) and detail-hero LCP. Tap-target audit. Test 320px width +
landscape for filter wrap (A2) and H1 overflow (B1). Test with the address bar visible
and hidden for FAB/list clipping (A1).

## Suggested sequencing

1. **Trivial, high impact:** A1 (`dvh`), B2/A8 (`_blank`), A5 (header var), A6
   (z-index). Removes the "feels broken on mobile" problems.
2. **Next:** A3 (tap targets), A4 (detail CTAs), B1 (responsive H1s), A2 (filter sheet).
3. **Polish:** B3, B4 (contrast), B6.

---

# 8. Deferred (post-launch, captured so decisions aren't lost)

## Event analytics pipeline (build soon)

First-party events into our own Postgres for future per-restaurant owner insights.

- **Reset at go-live:** `TRUNCATE events, restaurant_stats_daily` only (never touches
  `restaurants`). Pre-launch rows are throwaway test traffic.
- **Ignore our own traffic** even post-launch (admin cookie / env flag no-ops
  `track()`).
- **Event taxonomy** (mirrors GSC impression → click → action): `impression`
  (surface: list|map|landing|suggestion, deduped per session/restaurant/surface via
  IntersectionObserver, buffered); `result_click`; `profile_view`; `outbound_click`
  (call|website|directions|menu|socials, via `navigator.sendBeacon`, highest-value
  owner metric); `search` (query, result_count, picked; zero-result queries are a
  content-gap goldmine).
- **Tables:** `events (id, restaurant_id nullable FK, event_type, surface, target,
  query, result_count, session_id, path, referrer, created_at, meta jsonb)` + nightly
  rollup `restaurant_stats_daily`. Owner dashboards read only the rollup.
- **Rollup job:** `scraper/rollup-events.js` (cron, like the hours pass).

## Owner admin + claim flow (post-launch)

- **Auth:** Clerk (same layer as the admin gate; free Hobby covers it). Use **Clerk
  Organizations** to model "one owner owns many restaurants" + roles (`admin` vs
  `owner`), mapping onto a `restaurant_owners` M:N table.
- **Claim verification:** manual approval at launch volume (eyeball business
  email/website/socials, approve via a `claims` queue); add phone OTP only if volume
  grows.
- **Edit policy:** safe fields go live immediately (description, hours, phone, website,
  socials, price range, menu, photos); sensitive fields (name, tags, venue type) queue
  for review; locked forever: rating, review_count, lat/lng, slug. Keep an audit trail.
- **Owner dashboard:** reads `restaurant_stats_daily`, the hook that makes owners claim.
- **Optional owner perk:** a verified owner pastes their own GA4 measurement ID
  (validated `G-XXXXXXXXXX`, never a script/GTM), rendered lazily only on their own
  detail page. Needs a privacy-policy line.

## Other deferred

- Menus Stage-2 extraction (needs `ANTHROPIC_API_KEY`).
- Opening-hours daily pass continues filling the week post-launch.
- Phased SEO rollout / indexation control per §5 (soft-launch ~20–30 URLs, noindex the
  rest, then expand).

## Open questions for Abhishesh

1. Admin polish: what actually slows you down day to day? (guess: bulk multi-select
   edits + faster inline saves on the `/admin` list).
2. Canonical domain: apex (`nepalieats.com.au`) or www?
