# NepaliEats, SEO Launch Strategy & Ranking Roadmap

**Site:** Directory of Nepali restaurants in Australia (`web/`)
**Inventory:** ~570 restaurants + state/suburb/tag landing pages (~650+ URLs total)
**Author:** SEO lead (Claude) · **Date:** 2026-06-21
**Reads with:** [SEO_AUDIT.md](SEO_AUDIT.md) (fix these first), [UX_AUDIT.md](UX_AUDIT.md)

> Status: **plan only, no code changed.**

---

## 0. The core principle: launch quality, not quantity

**Do not push 650+ pages live and submit them all at once.** On a brand-new domain with zero authority, dumping a large set of thin, near-duplicate pages (see SEO_AUDIT §3/§4) is the fastest way to get classified as a low-value/scaled-content site. Google's Helpful Content signals are **site-wide**, a mass of thin pages drags down even your good ones, and you burn crawl budget Google hasn't decided to give you yet.

Instead: **launch a small, excellent core, earn trust and links, then release inventory in waves**, each page admitted to the index only when it clears a quality bar. The DB already tracks enrichment status, so we can gate indexation on real data completeness.

This plan has four parts: (1) pre-launch gate, (2) the indexation control mechanism, (3) the phased rollout + week-by-week roadmap, (4) the blog calendar. Plus: the user-facing information every page must carry.

---

## 1. Pre-launch gate (do BEFORE anything is indexed)

Nothing goes live for crawling until these are true. Most are in the audits.

**Technical foundation**

- [ ] Pick one canonical host (`https://nepalieats.com.au`, www vs non-www) and 301 the other. Be consistent across canonical/sitemap/internal links.
- [ ] Google Search Console + Bing Webmaster Tools verified; GA4 installed. **You cannot run this plan blind**, GSC is the instrument panel.
- [ ] Fix internal linking so equity flows to landing/detail pages, not `/explore?param=` (SEO_AUDIT §2). This is the single biggest pre-launch fix.
- [ ] Add breadcrumbs + browse hub so every indexable page is reachable in ≤2 clicks (SEO_AUDIT §6).
- [ ] `WebSite`+`SearchAction` + `Organization` schema on home; `BreadcrumbList` on inner pages (SEO_AUDIT §5).
- [ ] Default OG image + Twitter card (SEO_AUDIT §7).
- [ ] Real `lastModified` in sitemap from `updated_at`/`enriched_at` (SEO_AUDIT §7).
- [ ] Fix `aggregateRating` compliance, only emit it where reviews are shown, else drop it (SEO_AUDIT §8).
- [ ] Mobile must-fixes so the core pages don't "feel broken": `100dvh`, tap targets, detail-page CTAs (UX_AUDIT A1/A3/A4).

**Content quality bar** (the gate every page must pass to be indexable)

- **Landing pages (city/suburb/tag):** 2-4 paragraphs of unique local copy + "what to order" + FAQ + ≥8 venues listed + internal cross-links. A page with 1 intro sentence and a grid is **not** ready.
- **Restaurant detail pages:** must have address + hours + at least one photo + price + ≥2 enriched fields (phone/website/rating) + a non-generic description + a "nearby spots" block. Pages that are just the templated one-liner are **not** ready → `noindex` until enriched.

---

## 2. Indexation control mechanism

Three levers, used together, decide what Google sees:

1. **Sitemap = allowlist.** Only index-ready URLs appear in `sitemap.xml`. (Today `sitemap.ts` dumps everything, change it to read an `index_ready` flag / completeness query.)
2. **`robots` meta per page.** Not-ready pages render `noindex, follow` (still reachable and crawlable for link discovery, just not indexed). Flip to `index` when they clear the bar.
3. **Internal links stay** for UX even on noindexed pages (`follow` passes equity onward).

**Restaurant detail completeness score** (gate for indexation): give each row points for has_photo, has_hours, has_phone, has_website, has_rating, has_menu, unique_description. Index when score ≥ threshold (e.g. 4/7). This naturally front-loads your best ~100-150 venues and holds back the thin tail until enrichment/menus (Stage 2) fill them in. Re-evaluate on every enrichment pass.

> Net effect: you control the _pace_ at which Google meets your inventory, and every page it meets is one that deserves to rank.

---

## 3. Phased rollout + ranking roadmap

Targets are illustrative; adjust to what GSC shows. AU has a large Nepali diaspora and a very large Nepali international-student population, that community is both your initial audience and your link/distribution engine.

### Wave 0, Pre-launch (Week -2 to 0)

Build core pages to the quality bar; set up tracking; write the 3 cornerstone blogs (see §4). Index nothing yet.

### Wave 1, Soft launch / core (~20-30 URLs), Week 0-2

**Index:** Home, /explore, /momo, the **6 metro city pages** (Sydney, Melbourne, Brisbane, Perth, Adelaide, Canberra, order by venue count: VIC/NSW/WA lead per project data), **4-6 top tag pages** (momo, thakali, newari, vegetarian, tibetan, indian-nepali), **~10-15 flagship restaurant pages** (highest completeness, in Sydney/Melbourne), and **3 cornerstone blog posts**.
**Actions:** Submit core sitemap; "Request indexing" in GSC for each core URL; start distribution (see §5). Watch Coverage report for indexation.
**Goal:** get the domain trusted and the cornerstone pages crawled + indexed. Don't expect rankings yet.

### Wave 2, Expand the head (Week 2-4)

**Add:** remaining state pages, **suburb pages with ≥3 venues that meet the bar**, the **next ~100-150 restaurant pages** that clear the completeness score, 2-3 more blogs (city guides).
**Actions:** Internal-link new blogs → city/tag pages; first backlinks landing (directory submissions, community). Re-submit sitemap.
**Goal:** start seeing impressions in GSC for city + dish + "near me" queries.

### Wave 3, Scale + programmatic intersections (Week 4-8)

**Add:** remaining qualifying suburb pages, **programmatic intersection pages** ("Momo in Sydney", "Thakali in Melbourne", "Vegetarian Nepali in Brisbane"), but only combos with enough venues to be genuinely useful (apply the same ≥2-3 gate; see `programmatic-seo`), and the bulk of remaining restaurant pages as enrichment lifts their scores.
**Actions:** Identify **striking-distance keywords** (GSC positions 5-20) and improve those specific pages. Seasonal content begins (festival calendar).
**Goal:** long-tail starts ranking; city pages climbing.

### Wave 4, Long tail + maturity (Week 8-12+)

**Add:** remaining venues (including regional/1-venue suburbs once they have menus/photos), niche tags, more intersections.
**Actions:** Content refresh cadence; double down on whatever templates GSC shows winning; pursue PR/links.
**Goal:** broad coverage with a trusted domain; compounding long-tail.

### Roadmap at a glance

| When     | Focus          | Output                               | KPI to watch                       |
| -------- | -------------- | ------------------------------------ | ---------------------------------- |
| Wk -2-0  | Foundation     | Tracking, fixes, 3 blogs, core pages | Pages pass quality bar             |
| Wk 0-2   | Soft launch    | ~25 URLs indexed                     | Indexation %, first impressions    |
| Wk 2-4   | Head expansion | +cities/suburbs/150 venues, +3 blogs | Impressions, avg position          |
| Wk 4-8   | Scale + pSEO   | Intersections, bulk venues           | Clicks, striking-distance keywords |
| Wk 8-12+ | Long tail      | Remaining inventory, refresh         | Clicks growth, indexed/total ratio |

---

## 4. Blog content plan

Blogs do two jobs: **(a)** capture informational demand ("what is thakali", "best momo sydney") and **(b)** funnel link equity into your commercial city/tag pages. Each post must link to the landing pages it supports.

### Content pillars (own these 4 topics)

1. **Nepali dishes explained** (momo, dal bhat/thakali, newari, sel roti, sukuti, choila) → feeds `/tag/*` and `/momo`.
2. **City eating guides** ("best Nepali food in [city]") → feeds `/nepali-restaurants/[city]`.
3. **Dietary & occasion** (halal, vegetarian, festivals/Dashain-Tihar, student-budget) → feeds tags + seasonal.
4. **Community & stories** (owner features, new openings, "added by locals") → shareable, builds E-E-A-T and links.

### Phase 1, Write BEFORE / AT launch (3 cornerstones, awareness-stage, hub posts)

1. **"A guide to Nepali food in Australia: the dishes you need to know"**, broad hub; links to /momo + every tag + city pages. _(searchable + shareable)_
2. **"Where to find the best momo in Australia"**, head term; links to /momo + all city pages. Cover steamed/fried/jhol/C-momo.
3. **"What is Thakali dal bhat? A beginner's guide"**, high informational intent; links to /tag/thakali + city pages.

### Phase 2, After core pages are indexed (Week 2-4): city guides + dish explainers

4. **"Best Nepali restaurants in Sydney"** → `/nepali-restaurants/sydney` (repeat per metro: Melbourne, Brisbane, Perth, Adelaide).
5. **"Momo styles explained: steamed vs fried vs jhol vs C-momo"** → /momo.
6. **"Newari cuisine 101: choila, bara, samay baji"** → /tag/newari.
7. **"Vegetarian Nepali food: what to order"** → /tag/vegetarian.

### Phase 3, Few weeks in / ongoing (consideration, dietary, seasonal, community)

8. **"Halal Nepali restaurants in Australia"** (once halal data is populated, currently all 'unknown', so this needs the data first).
9. **"Where to celebrate Dashain & Tihar in Australia"**, **seasonal, plan ahead**: Dashain ~Oct, Tihar ~Nov, Nepali New Year ~mid-April. Publish 3-4 weeks before each.
10. **Suburb-level guides** for high-density Nepali areas (e.g. Sydney's west / Rockdale, Liverpool; Melbourne's north/west) → suburb pages.
11. **"Cheap & filling: Nepali food for students"**, targets the huge AU Nepali-student audience; great for community sharing.
12. **Owner/venue features & "new openings"**, fresh, shareable, gives owners a reason to link/share (and drives `add-a-spot` signups).
13. **AEO-friendly explainers** ("how to eat momo", "what to order at a Nepali restaurant"), structured Q&A, strong for AI Overviews/Perplexity (see `ai-seo`).

**Cadence:** 3 at launch, then ~1-2/week through month 1-2, then 1/week sustaining. Quality over volume, thin blogs hurt the same way thin directory pages do. Avoid AI-tell phrasing (see seo-audit `references/ai-writing-detection.md`).

---

## 5. Distribution & link building (you need links to rank)

Phased indexing buys trust; **links build authority**. Run alongside the waves:

- **Directory submissions** (week 0+): general + AU + food directories for initial backlinks/DR (see `directory-submissions` skill).
- **Nepali community** (week 0+): AU Nepali Facebook groups, student associations, subreddits, temple/cultural orgs. This audience drives early traffic, `add-a-spot` UGC, and natural links. _Genuine value, not spam._
- **Restaurant owners**: a "claim/feature your spot" outreach gives owners a reason to link to their NepaliEats page from their own site/socials.
- **Local press / food bloggers**: pitch the "every Nepali restaurant in Australia, mapped" angle, a genuinely novel data story (shareable).
- **Internal links** remain your highest-ROI lever, every blog → relevant city/tag pages (SEO_AUDIT §2).

---

## 6. Information users MUST find on each page

"Deserves to rank" = satisfies intent. For a food directory, missing practical info is both a UX failure and a ranking ceiling. Audit each template against this.

### Restaurant detail page, must-have

- Name, venue type, cuisine, suburb/area ✅
- **Full address + map + one-tap directions** ✅
- **Opening hours + "open now"** ✅
- **Phone / call button** ✅
- **Price level/range** ✅
- **Photos** ✅ (76%, the gate should require ≥1)
- **Rating + review count** ✅ (ideally + a couple of review snippets, also fixes schema §8)
- **What they're known for / signature dishes** (partial via tags)
- **Website + socials** ✅
- **"Nearby / similar Nepali spots"** internal links ❌ (add, UX + SEO)
- **Last updated / freshness signal** ❌ (trust)

### Restaurant detail, high-value gaps to add (biggest user needs)

- **Menu with prices** (Stage 2), _the #1 thing food-directory users want_; also unique content + future `Menu` schema.
- **Dine-in / takeaway / delivery + order/booking links**.
- **Halal status** (planned column; currently all 'unknown', populate it; high-demand filter).
- **Vegetarian options** (partial), and **kid-friendly / live music / parking / accessibility / BYO-alcohol** (planned columns), common decision factors and good filters.

### City / suburb / tag landing page, must-have

- Count + unique local intro (2-4 paras), _currently 1 sentence_ ❌
- The venue list ✅ + **map** + **filters** (open now, price, rating, exist on /explore)
- **"What to order" / top picks** ❌
- **FAQ** ❌ (supports `FAQPage` + AI answers)
- **Price expectations / neighbourhood context** ❌
- **Cross-links** to nearby suburbs, the parent state, and relevant cuisines ❌

### Home / trust (site-wide)

- Clear value prop with keyword in H1 (SEO_AUDIT §10), prominent search, "near me".
- **About / how the data is gathered**, contact, and an **owner "claim your spot"** path, E-E-A-T + trust signals Google weighs for directories.

---

## 7. Measurement & KPIs

Review weekly in GSC + GA4:

- **Indexation ratio** (indexed ÷ submitted) per page tier, catches thin-content suppression early.
- **Impressions → clicks** by template (home/city/tag/detail/blog), shows which tier earns demand.
- **Average position** for target queries: "nepali restaurant [city]", "momo [city]", "nepali food near me", "thakali [city]".
- **Striking-distance keywords** (positions 5-20) → prioritize improving those exact pages each week.
- **Coverage errors / soft-404s** as waves expand.
- **Backlinks / referring domains** growth.

**Decision rule:** before releasing the next wave, confirm the current wave is indexing cleanly and not generating thin-content/soft-404 warnings. If indexation stalls, slow down and deepen content rather than pushing more URLs.

---

## TL;DR

1. **Don't bulk-launch.** Gate indexation on a content-quality/completeness score; sitemap = allowlist, `noindex` the rest.
2. **Wave it:** ~25 core URLs → cities/suburbs/best venues → programmatic intersections → long tail, over ~12 weeks.
3. **Fix the foundation first** (internal links, schema, mobile), SEO_AUDIT/UX_AUDIT.
4. **Blogs** in 3 phases (3 cornerstones at launch → city guides + dish explainers → seasonal/dietary/community), each linking into commercial pages.
5. **Earn links** via the Nepali community, owners, directories, and the "every Nepali restaurant, mapped" data story.
6. **Pages must carry real utility**, menu/prices, halal, hours, directions, "what to order", FAQ, or they won't rank and won't convert.
