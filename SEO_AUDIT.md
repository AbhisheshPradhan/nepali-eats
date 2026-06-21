# NepaliEats, SEO Audit & Recommendations

**Site:** Directory of Nepali restaurants in Australia (Next.js 16 App Router, RSC, in `web/`)
**Primary goal:** Organic search traffic → directory discovery.
**Audited:** 2026-06-21 · Author: SEO lead (Claude)
**Scope:** Code-level technical + on-page audit of `web/`. No analytics/Search Console access at audit time, so traffic baselines and live CWV are not measured here, get GSC connected (see §7).

> Status of this doc: **recommendations only, no code was changed.**

---

## Executive summary

The foundations are genuinely good for a v1: every page type has unique titles/descriptions/canonicals, the restaurant pages ship `Restaurant` JSON-LD, there's a real `sitemap.ts` + `robots.ts`, ISR is on, and images use `next/image` with WebP. That puts the site ahead of most directories.

The traffic ceiling right now is set by **three problems**, all fixable:

1. **Internal linking sends nearly all equity into `/explore` (a client-side map app) instead of the indexable landing pages.** The state/suburb/tag pages, the actual SEO money pages, are effectively orphaned: linked only from the XML sitemap, not from the homepage, nav, footer, or restaurant pages. (§2)
2. **The 570 restaurant pages are thin and near-duplicate.** The only unique prose is one templated `autoBlurb` sentence with identical structure on every page, the classic directory "scaled/thin content" risk. (§3)
3. **The city/suburb/tag landing pages are also thin**, one intro sentence + a card grid. To rank for "Nepali restaurants in Melbourne" / "best momo Sydney" they need real, unique content. (§4)

Fixing internal linking (§2) is the highest-leverage, lowest-effort win. Content depth (§3, §4) is the durable ranking work.

### Top priorities (do in this order)

| #   | Item                                                                   | Impact | Effort |
| --- | ---------------------------------------------------------------------- | ------ | ------ |
| 1   | Re-route internal links to landing/detail pages, not `/explore?param=` | High   | Low    |
| 2   | Add a browse hub + breadcrumbs (+ `BreadcrumbList` schema)             | High   | Med    |
| 3   | Enrich restaurant detail pages beyond the one-liner                    | High   | Med    |
| 4   | Enrich city/suburb/tag pages (intro copy, "what to order", FAQ)        | High   | Med    |
| 5   | `WebSite`+`SearchAction` & `Organization` schema on home               | Med    | Low    |
| 6   | Default OG image + Twitter card                                        | Med    | Low    |
| 7   | Real `lastModified` in sitemap; connect GSC                            | Med    | Low    |
| 8   | Audit `aggregateRating` schema compliance                              | Med    | Low    |

---

## 1. What's already good (keep it)

- `app/layout.tsx`: `metadataBase`, title `default` + `template`, solid default description, `lang="en-AU"`, `locale: en_AU`, canonical. ✅
- `app/sitemap.ts`: covers home, explore, momo, stories, all states, suburbs (≥2), tags, stories, all restaurants, with sensible priorities. ✅
- `app/robots.ts`: allows all, references sitemap. ✅
- `app/restaurant/[slug]/page.tsx`: per-page `generateMetadata` with canonical + OG image, `Restaurant` JSON-LD incl. `address`, `geo`, `aggregateRating`. ✅ (caveats in §3 & §8)
- Location & tag pages: unique titles/descriptions/canonicals + `generateStaticParams`. ✅
- `next/image` everywhere with `sizes`; self-hosted WebP; `priority` on LCP hero image. ✅
- ISR `revalidate = 3600` on content pages. ✅

---

## 2. Internal linking, **highest-leverage fix** (Impact: High)

The indexable landing pages exist and are in the sitemap, but almost nothing links to them. Crawlers and PageRank follow links, not sitemaps, a sitemap gets a URL discovered, not ranked. Right now equity pools in `/explore`.

**Evidence (current behaviour):**

- `app/page.tsx:60`, featured cards link to `/explore?focus=${slug}`, **not** `/restaurant/${slug}`. The detail pages get no homepage links.
- `app/page.tsx`, homepage has **no links** to any `/nepali-restaurants/[state|suburb]` or `/tag/*` page. The "See all spots" button → `/explore`.
- `components/Footer.tsx:58-82`, "By cuisine" and "By city" **both** point to `/explore` (duplicate anchor, generic destination). "Momo guide / thali / festival" are **three different anchors all pointing to `/stories`**.
- `app/restaurant/[slug]/page.tsx:348-355`, "More spots in {suburb}" → `/explore?suburb=…`, **not** the indexable `/nepali-restaurants/[suburb]` page.
- `components/Header.tsx:10-13`, nav is only Explore + Stories; no path to location/cuisine hubs.

**Net effect:** state/suburb/tag pages are ~orphaned (sitemap-only), and link equity flows into a JS-heavy map app with query-param URLs.

**Recommendations:**

1. **Homepage cards → `/restaurant/[slug]`** (keep the map as a separate CTA). Detail pages are your long-tail; they need internal links.
2. **Footer = real link hub.** Replace the generic `/explore` links with the actual top city pages (`/nepali-restaurants/sydney`, `…/melbourne`, etc.), top tag pages (`/momo`, `/tag/thakali`, `/tag/newari`, `/tag/vegetarian`), and the state pages. Make each anchor's text match the destination's target term.
3. **Restaurant page → location pages.** "More spots in {suburb}" should link to `/nepali-restaurants/[suburb]`, and add a sibling link to the state page. This builds the detail → suburb → state hierarchy.
4. **Add contextual cross-links** on listing pages: city page links to its suburbs and to relevant cuisine pages ("Momo in Melbourne" → `/tag/momo` filtered, or a dedicated page, see §4 programmatic note).
5. Keep `/explore` links for the _map_ interaction, but they should be secondary, not the primary discovery path.

---

## 3. Restaurant detail pages, thin & near-duplicate (Impact: High)

`app/restaurant/[slug]/page.tsx:190` renders one body paragraph: `autoBlurb(r)`.

`lib/format.ts:108` `autoBlurb` is a single template:

> "{name} is a Nepali {venueType} in {suburb}, {state}, known for {tags}. One for the list of hidden gems worth the trip."

Across ~570 pages this produces structurally identical sentences. Google's **scaled-content / thin-content** systems treat large sets of near-duplicate templated pages as low value, which caps (or suppresses) rankings for the whole set. The same string is also used as the **meta description** (`generateMetadata` → `autoBlurb`), so descriptions are templated too.

**Recommendations:**

- **Use the structured data you already have to add unique, useful, scannable content** per page: opening hours table (already shown), price range, full address + neighbourhood, "what they're known for", venue type, halal status (when populated), distance-to-nearby anchors, and a **"Nepali restaurants near {suburb}" mini-list** (3-6 internal links, doubles as §2 linking).
- **Vary the templating** meaningfully (multiple sentence patterns keyed off venue type / tags / price), or better, add a real editable `description` column for top venues and fall back to a richer auto-generator otherwise.
- **Differentiate meta description from on-page body** so the SERP snippet isn't a copy of the first paragraph.
- When menus (Stage-2) land, surface a few dishes/prices, that's unique, high-intent content and supports `Menu`/`hasMenu` schema later.
- Avoid AI-tell phrasing in any generated copy (no "nestled," "vibrant," em-dash-heavy boilerplate), see seo-audit `references/ai-writing-detection.md`.

---

## 4. City / suburb / tag pages, thin landing pages (Impact: High)

`components/ListingGrid.tsx` renders eyebrow + H1 + **one** intro sentence + a card grid. These pages target the strongest commercial terms ("Nepali restaurants in Melbourne", "best momo in Australia") but have almost no unique content, so they'll struggle against established directories and Google Business listings.

**Recommendations (per landing page):**

- 2-4 paragraphs of genuinely local, unique copy: how many spots, which suburbs/neighbourhoods cluster, signature dishes in that city, price expectations, "what to order."
- A short **FAQ block** ("Where's the best momo in {city}?", "Are there halal Nepali restaurants in {city}?"), supports `FAQPage` schema and AI-answer surfaces (see ai-seo skill).
- **Cross-links**: city → its suburbs, city → relevant cuisine pages, tag → top cities for that tag.
- `ItemList` / `CollectionPage` JSON-LD listing the venues (see §5).
- Consider **programmatic intersections** ("Momo in Sydney", "Thakali in Melbourne"), high-intent long-tail at scale. This is the `programmatic-seo` playbook; only generate combos with enough venues to be genuinely useful (you already gate suburbs at `count ≥ 2`, apply the same discipline). Don't mass-produce empty combo pages.
- The `count ≥ 2` suburb gate (`sitemap.ts:34`, `generateStaticParams`) is a reasonable thin-content guard, keep it.

---

## 5. Structured data gaps (Impact: Med)

Current: only `Restaurant` on detail pages. Add:

- **Homepage `WebSite` + `SearchAction`** (sitelinks search box) and **`Organization`** (name, logo, sameAs socials). Cheap, high-value, and you already have a search endpoint (`/api/search`) to wire the SearchAction target to.
- **`BreadcrumbList`** on detail + listing pages (pairs with the breadcrumb UI in §6) → breadcrumb display in SERPs and clearer hierarchy.
- **`ItemList`/`CollectionPage`** on momo/tag/state/suburb listing pages.
- **`FAQPage`** where you add FAQs (§4).
- **Detail page type accuracy:** `app/restaurant/[slug]/page.tsx:84` always emits `@type: "Restaurant"` even when `venueType` is Café/Food Truck/Caterer/Dessert/Bar. Map to the right `FoodEstablishment` subtype (`CafeOrCoffeeShop`, `Bakery`, etc.) where applicable.

> Validate with the Rich Results Test (renders JS), not curl/web_fetch, which strip `<script>` JSON-LD.

---

## 6. Crawl architecture & navigation (Impact: High)

- **No breadcrumbs anywhere.** Add Home → State → Suburb → Restaurant (and Home → Cuisine → Restaurant). Improves crawl depth, internal linking, and SERP appearance.
- **No browse/hub page.** Add an HTML "Browse" page (or expand the footer) listing all states, all suburb pages, and all cuisine/tag pages, so every landing page is reachable in ≤2 clicks by users and crawlers, not just via the XML sitemap. This is the single biggest "make the long tail crawlable" lever for a directory.
- **`/explore` is the most-linked page but is a client-rendered map app** with query-param URLs. Good that its canonical is fixed to `/explore` (`app/explore/page.tsx:18`) so `?tag=`/`?suburb=` params don't spawn duplicates. Keep that, just stop using it as the primary discovery path (§2).
- **`generateStaticParams` on `/restaurant/[slug]`:** currently absent, so detail pages render on-demand (ISR). Fine functionally; consider prebuilding for faster first crawl/TTFB at 570 pages (low priority).

---

## 7. Technical / on-page details

- **Sitemap `lastModified` is `new Date()`** for every URL on every build (`app/sitemap.ts:22`). This tells Google _everything_ changed just now, every time, which trains Google to ignore your `lastModified`. Use real timestamps (`updated_at` / `enriched_at` / `place_enriched_at`) per restaurant. (Impact: Med)
- **Default OG image + Twitter card missing.** `layout.tsx` OG has no default `images`; homepage and photo-less venues share with no image card. Add a branded default OG image (`app/opengraph-image.tsx`) and `twitter: { card: "summary_large_image" }`. (Impact: Med, social/Discord/Slack/AI-preview CTR)
- **Title length:** restaurant titles `"{name}, Nepali {venueType} in {suburb}, {state}"` + template `" · NepaliEats"` will truncate >60 chars for many venues (`restaurant/[slug]/page.tsx:50`). Tighten (e.g. drop venueType or brand suffix on long names). (Impact: Low/Med)
- **Fonts:** Baloo 2 (5 weights) + Mukta (5 weights), both with `devanagari` subset = a heavy webfont payload affecting LCP/CLS on mobile. `display: swap` is correct; trim to the weights actually used. (Impact: Med, CWV)
- **Connect Google Search Console + Bing Webmaster Tools** and submit the sitemap. Without it you're flying blind on indexation coverage, queries, and CWV field data. Add GSC verification. (Impact: High for _measurement_)
- **Image alt text** is generally fine (`PlaceCard` `alt={r.name}`, hero `alt={r.name}`, gallery descriptive). Decorative logos use `alt=""` correctly. ✅
- **`robots.ts`** could optionally disallow `/api/` (not linked, harmless if crawled). Low priority.

---

## 8. `aggregateRating` compliance (Impact: Med, risk)

`restaurant/[slug]/page.tsx:103-111` emits `aggregateRating` (Google rating + reviewCount) but the page shows **no review content** (`Review` objects / visible review text), only the aggregate number and a "Read on Google" link. Google's policy is that review rich results must be backed by review content the user can see on that page; self-serve aggregate ratings without on-page reviews can be ineligible or, at worst, draw a structured-data manual action.

Also note these ratings are **Google's data** (only ~57% of rows have `review_count`), which carries display/licensing considerations (already flagged in project `CLAUDE.md`).

**Recommendation:** either (a) show genuine review content on the page to back the markup, or (b) drop `aggregateRating` from the schema until first-party/licensed reviews exist. Keep the visible rating UI either way, this is only about the JSON-LD claim.

---

## 9. Content / topical authority (Impact: Med-High, durable)

- **Stories is underused.** It's your content engine for topical authority and contextual internal links into city/cuisine pages. Footer points three different anchors at `/stories` with no individual posts. Build real guides ("A beginner's guide to momo," "Where to find Thakali dal bhat in Australia," "Dashain & Tihar feasts") that each link out to the relevant tag and city pages.
- **AI search (AEO/GEO):** directories do well in AI answers when pages have clear, extractable facts and FAQs. The FAQ + structured-data work above also feeds this. See the `ai-seo` skill for `llms.txt` / answer-engine optimisation once the content layer exists.

---

## 10. Homepage hero copy, review & suggestions

**Current:**

> _All across Australia_ (eyebrow)
> **Find your momo people.** (H1)
> Every hidden gem serving real Nepali food, gathered in one happy place. (sub)

**SEO problem:** the **H1 carries no search intent.** "Find your momo people." is charming brand voice but contains none of the terms people actually search ("Nepali restaurants," "Nepali food," "Australia," "momo"). The H1 is one of the strongest on-page signals and the homepage is your most authoritative page, wasting it on a pure-brand line leaves the main head term unsupported. The keyworded string only lives in the `<title>` tag, not the visible H1.

**Goal:** keep the personality, but get the primary head term into the H1 (or a prominent H2), and keep "momo people" as flavour.

### Option A, keyword H1, brand sub (recommended)

- Eyebrow: `All across Australia`
- **H1: Nepali food, all across Australia.**
- Sub: _Find your momo people, every hidden gem serving real Nepali food, from steamy momo windows to Sunday market stalls._
- _Why:_ H1 owns "Nepali food + Australia"; "momo people" survives in the sub. Best SEO/brand balance.

### Option B, keep the brand H1, add a keyworded H2 immediately under it

- H1: **Find your momo people.**
- **H2 (visible): Nepali restaurants, cafés and food trucks across Australia.**
- _Why:_ preserves the exact current line; recovers keyword signal via a real H2. Slightly weaker than A (H1 still non-keyword) but lowest change to brand.

### Option C, "near me" intent lead

- Eyebrow: `All across Australia`
- **H1: Find Nepali food near you.**
- Sub: _Momo, Thakali dal bhat, sel roti and Newari feasts, every hidden gem in Australia, gathered in one happy place._
- _Why:_ targets the high-volume "near me" pattern and front-loads dish terms (momo/dal bhat/sel roti) that map to your tag pages.

**Recommendation:** **Option A.** Whichever you pick, also make sure dish/city terms appear in real headings down the page (e.g. an H2 over the cuisine carousel like "Eat by craving: momo, Thakali, Newari, Tibetan"), since the homepage currently leans on brand-voice headings ("This week's hidden gems") that carry no keyword.

---

## Suggested sequencing

1. **Week 1 (quick, high impact):** §2 internal-link rewiring, §5 homepage `WebSite`/`Organization`/`SearchAction`, §7 default OG image + real sitemap `lastModified`, §10 hero H1, connect GSC.
2. **Weeks 2-3:** §6 breadcrumbs + browse hub + `BreadcrumbList`, §8 aggregateRating fix.
3. **Ongoing:** §3 detail-page enrichment, §4 landing-page content + FAQ + `ItemList`, §9 Stories content engine, then §4 programmatic intersections once content patterns are proven.
