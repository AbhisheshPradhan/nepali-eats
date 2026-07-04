# Programmatic SEO Plan: dish & cuisine pages

How we scale from the ~15 hand-built landing pages to a defensible set of
dish/cuisine landing pages, built on the 10k-item menu dataset. Extends
`LAUNCH.md` §5 (indexation waves) and reuses the enriched `LandingPage` template
+ `dishRestaurants()` dish-search layer already shipped. Numbers pulled from Neon
2026-07-04.

## The one idea

Google Maps can't answer "who does **jhol momo** in Parramatta" or "the most
**Newari** menu in Melbourne." We can, because we have the menu. These pages turn
that proprietary data into search landing pages. This is the single most
defensible pSEO play we have (proprietary data > public data), so it's worth
doing properly and not thinly.

## Two axes, four page types

The dish taxonomy already separates the two axes the brief calls for:
`dish_categories.kind = 'dish'` (66 dishes) vs `kind = 'style'` (4 cuisines:
newari, nepali-indian, tibetan, thakali). Preparations (`kind='preparation'`,
e.g. jhol-momo) ride with dishes.

| # | Page type | Example | Ranking sort | Data source |
|---|-----------|---------|--------------|-------------|
| 1 | **Dish in Australia** | Jhol momo in Australia | restaurant reviews + rating (most popular spot serving it) | menu items tagged that dish |
| 2 | **Dish in a state** | Jhol momo in NSW | reviews + rating | dish tag ∩ state |
| 3 | **Cuisine in Australia** | Newari food in Australia | count of that cuisine's dishes on the menu (deepest menu first) | menu items tagged that style |
| 4 | **Cuisine in a state** | Newari food in Victoria | cuisine-dish count | style tag ∩ state |

The sort difference is deliberate and correct: for a **dish**, "best" means the
most popular venue that serves it; for a **cuisine**, "best" means the venue that
commits to it most (a place with 14 Newari dishes is more Newari than one with 2).

## ⚠️ The coverage caveat (read before sizing anything)

All four page types are **menu-derived**, so they only see the **~159 restaurants
with seeded menus**, not all 437. Implications:

- These pages are **precise, not exhaustive**. The exhaustive per-area surface
  stays the geo directory (`/nepali-restaurants/[state|suburb]`) and the map.
- Coverage **grows as menus get seeded**. Every Sydney menu seeded lifts every
  NSW dish page. This is another reason to weight remaining seeding toward NSW.
- A dish page needs enough menu'd venues to not be thin. That's why we gate on
  venue count below.

## URL scheme

Extend the existing route, no new top-level namespace:

```
/nepali-food/[slug]            dish OR cuisine, national     (type 1 & 3)
/nepali-food/[slug]/[state]    dish OR cuisine, per-state    (type 2 & 4)
/momo                          keeps its vanity root URL (canonical); /nepali-food/momo 301s to it
```

`[slug]` resolves against `dish_categories` (dish, preparation, or style). The
nested `[state]` segment reuses the 8 state codes. Clean subfolders consolidate
authority (per pSEO best practice). Breadcrumb: Home › Nepali food › {Dish} ›
{State}.

**Intent note (important):** people search "momo in **Sydney**", not "momo in
NSW". Keep the URL by state code (clean, 8 values) but **write the H1/title/copy
to the metro** ("Momo in Sydney and NSW", cluster suburbs named in the intro).
Suburb-level dish pages ("Momo in Harris Park") are a later tier, not launch.

## Selection rules (what earns a page)

1. **Distinctly-Nepali dishes only for national dish pages.** A dish page for
   *curry, butter chicken, biryani, tandoori, naan, tikka, seekh kebab* competes
   with every Indian restaurant in the country and dilutes our "Nepali"
   positioning. **Skip them** even though coverage is high. Favour dishes that are
   iconic and low-competition (jhol momo, choila, sekuwa, sukuti, sel roti,
   gundruk, chatamari, thukpa, laphing) even at lower counts.
2. **Venue-count gate per geo** (avoids thin pages):
   - National dish/cuisine page: **≥ 8** menu'd venues serve it.
   - Dish/cuisine **× state** page: **≥ 8** for launch (tighten if a page looks
     thin), relaxing to ≥ 5 in a later wave as menus fill in.
3. **No duplicate intent.** `choila` (dish) and `newari` (cuisine) can coexist,
   different queries. But don't also make a `curry` page AND a `nepali-indian`
   page fight, keep `nepali-indian` as the cuisine hub, no generic-curry page.
4. **Noindex thin ones, don't delete.** A combo under threshold renders (for
   users + internal links) but `noindex` until it clears the bar (same mechanism
   as LAUNCH.md §5).

---

# The list

## Type 3 — Cuisine in Australia (4 pages, build first)

All 4 styles clear the bar. These already exist as `/nepali-food/[cuisine]`;
re-point their sort to menu-depth and enrich.

| Cuisine | Venues (menu'd) | Page |
|---------|-----------------|------|
| Newari | 118 | /nepali-food/newari |
| Nepali-Indian | 112 | /nepali-food/nepali-indian |
| Tibetan | 78 | /nepali-food/tibetan |
| Thakali | 37 | /nepali-food/thakali |

## Type 4 — Cuisine in a state (25 pages)

Every style × state combo with ≥ 3 menu'd venues (I'd ship these at ≥3 since the
cuisine set is small and each is genuinely distinct):

- **Newari** (7): NSW 39, VIC 24, QLD 21, WA 17, ACT 6, SA 6, TAS 4
- **Nepali-Indian** (6): NSW 40, VIC 30, QLD 20, WA 10, ACT 5, SA 4
- **Tibetan** (6): NSW 31, VIC 18, WA 9, ACT 7, TAS 5, SA 4, (QLD 3)
- **Thakali** (4): NSW 17, VIC 5, WA 5, QLD 3, TAS 3

## Type 1 — Dish in Australia (curated, ~28 pages)

National dish hubs, distinctly-Nepali, grouped. Count = menu'd venues serving it.

**Momo family** (the crown jewels, highest intent):
momo (153, = `/momo`) · steamed momo (144) · c-momo / chilli momo (119) · jhol
momo (112) · fried momo (108) · kothey momo (67) · sandheko momo (45)

**Grilled & meat:** choila (105) · sekuwa (94) · sukuti (70) · bhutan (53) ·
taas (28)

**Sets & mains:** khaja set (84) · thali (46) · dal bhat (40) · thakali set (17)
· dhido (9)

**Street & snacks:** sandheko (95) · chaat (102) · pani puri (85) · sausage
(100) · pakora (75)

**Soups & Tibetan:** thukpa (65) · laphing (32)

**Newari specials:** bara (18) · sel roti (12) · yomari (10) · chatamari (9) ·
gundruk (8)

**Noodles & rice:** chowmein (129) · fried rice (103) · keema noodle (29)

*Skipped (generic / off-positioning): curry, butter chicken, biryani, tandoori,
naan, roti, tikka, seekh kebab, saag, dal, wings, lollipop, manchurian, pulao,
sizzler, kofta, kati roll. Revisit only if we ever want the pan-Indian audience.*

## Type 2 — Dish in a state (~60–80 pages at ≥8)

Generated by rule (dish ∩ state ≥ 8), not hand-listed. The reliable core, from
the per-state matrix (venues serving the dish):

| Dish | NSW | VIC | QLD | WA | ACT | TAS | SA |
|------|-----|-----|-----|----|----|----|----|
| momo | 48 | 42 | 23 | 18 | 7 | 6 | 7 |
| chowmein | 45 | 30 | 21 | 15 | 7 | 6 | – |
| chilli momo | 40 | 28 | 21 | 15 | 6 | – | – |
| jhol momo | 41 | 22 | 20 | 13 | 6 | 6 | – |
| choila | 37 | 21 | 17 | 16 | 6 | – | 5 |
| curry* | 34 | 32 | 22 | 17 | 5 | 6 | 7 |
| sandheko | 32 | 16 | 21 | 16 | 5 | – | – |
| sekuwa | 32 | 15 | 18 | 16 | 6 | – | – |
| fried rice | 32 | 25 | 20 | 15 | – | – | 5 |
| chaat | 36 | 21 | 18 | 11 | 5 | 5 | – |

*(curry shown for scale only; skipped per rule 1.)* Across the taxonomy, **117
dish×state combos clear ≥8** and **177 clear ≥5**; after the distinctly-Nepali
filter the launchable set is roughly **60–80 pages** (momo family, choila,
sekuwa, sukuti, sandheko, thukpa, chowmein, fried rice, chaat, pani puri across
their qualifying states). The long tail (sel roti × NSW, gundruk × NSW, chatamari
× NSW) waits for more menu coverage.

## Rough totals

| Type | Pages | Wave |
|------|-------|------|
| Cuisine in Australia | 4 | 1 |
| Dish in Australia (curated) | ~28 | 1–2 |
| Cuisine in a state | ~25 | 2 |
| Dish in a state (≥8, filtered) | ~60–80 | 2–3 |
| **Total new** | **~115–135** | phased |

---

# Page template (avoiding thin content)

Reuse `LandingPage`; each page must carry unique, data-driven value, not just a
swapped noun:

- **H1 / title:** "{Dish} in {Metro} and {State}" or "{Dish} in Australia".
- **Intro (2 paras):** one hand-written dish/cuisine explainer (what it is, how to
  order it, reuse and extend the copy already in `lib/landing.ts` and the blog
  posts), plus a **live data sentence** ("14 spots in NSW serve jhol momo, most
  around Harris Park and Rockdale").
- **The ranked venue list** with the per-page sort (dish → popularity; cuisine →
  menu depth), each card showing the **matched menu items + prices** (we have
  them, this is the unique content Google can't get elsewhere, and it's the #1
  user want).
- **"What to order" / related dishes** cross-links (momo → jhol/c-momo/kothey).
- **FAQ** per dish (what is X, is it spicy, is it halal/veg) → `FAQPage`.
- **Cross-links:** dish×AU → its states; dish×state → sibling dishes in that
  state + the state directory + the cuisine it belongs to. Full hub-and-spoke.
- **Schema:** `CollectionPage` + `ItemList` (already in the template),
  `BreadcrumbList`, `FAQPage`. No `aggregateRating` (per the licensing decision).

**Uniqueness guard:** the ranked list + matched dishes/prices differ on every
page by construction, so these are not doorway pages. The risk is the *intro
copy* being templated, so each dish/cuisine gets one hand-written explainer
paragraph (28 dishes + 4 cuisines = 32 short paragraphs, a bounded writing job),
reused across that dish's national + state pages with the metro/count varied.

# Internal linking & indexation

- **Hubs:** `/momo` and each cuisine page are hubs; `/nepali-food` gets a browse
  index listing all dishes + cuisines (also fixes the LAUNCH.md §6 "browse hub"
  gap). Home "Eat by craving" tiles already point here.
- **Spokes:** dish×state pages link up to dish×AU and across to sibling dishes.
- **Sitemap:** add dish + dish×state + cuisine×state URLs, gated on the venue-count
  flag so only index-ready pages are listed (extend `app/sitemap.ts`).
- **Waves (per LAUNCH.md §5):** Wave 1 = 4 cuisines + momo family national (~11).
  Wave 2 = rest of national dishes + cuisine×state (~50). Wave 3 = dish×state
  long tail as menu coverage + domain trust grow. Watch indexation ratio before
  each wave; if thin-content warnings appear, slow down and deepen.

# Build notes (implementation, when we start)

0. **Rendering: static / ISR, server-rendered from the DB. NOT client API
   calls.** Same pattern as the existing landing pages: the RSC calls the query
   functions in `lib/queries.ts` directly (server-side, at build / revalidate
   time), so the full content, internal links and JSON-LD ship in the HTML. This
   is non-negotiable for SEO, a crawler must see the ranked list + schema without
   running JS. Concretely: `export const revalidate = 86400` (menu/ratings change
   slowly; daily is plenty, or on-demand `revalidateTag` on menu edits) +
   `generateStaticParams` prerenders the **index-ready** combos at build; rarer
   combos render on first request and cache (ISR). The `/api/*` routes stay for
   the **interactive** surfaces only (Explore map pan, dish-search autocomplete);
   these SEO pages never fetch from them.
1. **Route:** add `app/nepali-food/[slug]/[state]/page.tsx`; make `[slug]`
   resolve dishes/cuisines from `dish_categories` (not just `restaurants.tags`).
   `generateStaticParams` emits only combos clearing the gate.
2. **Queries:** two new functions in `lib/queries.ts` (or `lib/dish.ts`):
   - `dishInGeo(slug, state?)` → restaurants serving the dish, **sorted by
     review_count/rating**, each with matched item names + price range. (Extend
     the existing `dishRestaurants()`; add the geo filter + the popularity sort.)
   - `cuisineInGeo(styleSlug, state?)` → restaurants, **sorted by count of that
     style's items desc**, tiebreak rating. New aggregation.
3. **Content:** `lib/landing.ts` gains a `dishLanding()` / `cuisineLanding()`
   builder + a dictionary of 32 hand-written explainer paragraphs and per-dish
   FAQs (apply the human-copy standard).
4. **Gate flag:** a small cached count per (slug, state) decides index vs noindex
   + sitemap inclusion. Recompute on menu reseeds.

# Risks

- **Menu coverage bound** (159/437): pages thinner than the geo directory until
  seeding fills in. Mitigate: gate on count, weight seeding to NSW, noindex thin.
- **Cannibalization:** `/momo` vs `/nepali-food/momo` vs momo×state, and dish vs
  cuisine overlap (choila/newari). Mitigate: one canonical per intent, 301
  `/nepali-food/momo`→`/momo`, distinct H1s (dish = "best momo", cuisine =
  "Newari food"), state pages target the metro term.
- **Templated-intro thin-content:** the classic pSEO trap. Mitigate: hand-written
  explainer per dish/cuisine + the always-unique matched-items list.
- **Freshness:** stale prices/closed venues erode trust fastest on these
  high-intent pages. Ties to the `menu_parsed_at` refresh cadence in ROADMAP.
