# NepaliEats — Menu parsing, schema & search plan

How we turn each restaurant's menu into structured `menu_items`, tag them against
a controlled dish vocabulary, and power **dish search on the map** + dish landing
pages. Shared canonical schema — also backs **FoodHub** later (QR-menu / ordering
upsell), so menu content stays normalised + SQL-queryable and ordering concerns
stay out of the core. See CLAUDE.md "DESIGN CONSTRAINT".

> **STATUS: schema APPLIED to Neon (2026-06-30); taxonomy seeded (41 tags via
> `scraper/seed-taxonomy.ts`).** Next: `seed-menu.js` + the `<slug>.json` contract,
> then seed restaurants one menu at a time.

## Workflow (decided)

Agent-parsed, script-seeded. No LLM API, no parse UI, **no file storage**.

1. `node scraper/menu-fetch.js <slug>` acquires the own-site menu cheaply: `pdftotext`
   first (prints TEXT for text-layer PDFs, rasterizes only image-only scans), ignores
   ordering-platform urls, warns on multi-column layouts, grabs server-rendered HTML.
2. I transcribe what it prints to `scraper/menu-data/<slug>.json`, mapping each item to the
   controlled dish tags (valid slugs via `node scraper/seed-menu.js --list-tags`), and still
   do the judgement pass (price-typo sanity, schema fit).
3. A deterministic, idempotent seeder writes the rows + rebuilds the rollups.

One restaurant at a time — you're the queue. Full worker flow: `MENU-WORKER-CHEATSHEET.md`.

## The model

| Table | Role |
| --- | --- |
| `menu_categories` | per-restaurant sections (Momo, Mains, Drinks) |
| `menu_items` | the dish line; **preparation = separate item** (steamed / fried / jhol), `restaurant_id` denormalised; `source` (provenance + reseed-ownership signal) + `is_hidden` (visibility, not a tombstone) |
| `menu_item_variants` | priced versions — **size + protein** (Veg $11 / Chicken $12 / Buff $13); single-price item = one NULL-label variant; `currency` defaults AUD |
| `dish_categories` | controlled **hierarchical tag vocabulary** (the search dropdown); `kind` ∈ dish / preparation / protein / style, `parent_id` for hierarchy |
| `menu_item_tags` | M2M item ↔ tag; seeder stores **leaf + ancestors** so a parent pick flat-matches |
| `menu_item_photos` | per-item photo carousel — **deferred** (table shaped now) |
| `restaurants.tags` | **reused** as the coarse (dish + style) rollup; name-derived baseline kept |
| `restaurants.price_min/max`, `menu_item_count`, `menu_parsed_at` | per-menu facets, rebuilt on seed |

**Why this shape:**
- **Preparation = separate items** (steamed / fried / jhol momo are distinct lines) —
  matches how menus are printed, lets each be searched + priced; protein/size are
  variants. No protein×prep×size matrix.
- **Variants, not `modifiers jsonb`** — Square/Toast "variations" model; keeps price/diet
  filterable in columns. (Add-on modifiers, if ever, are a FoodHub-only later add.)
- **Tags as a table, not a code enum** — needed for hierarchy + the curated dropdown +
  `/dish` landing-page content. `taxonomy.ts` becomes the seed.

## Tags & search (deterministic, dropdown-driven)

The searchable vocabulary **is** `dish_categories` — curated, controlled. There is
**no free-text query against the data**:

- Typed text only **filters the dropdown** (`dish_categories WHERE name ILIKE 'chick%'`
  **OR an alias matches**, via `search_aliases[]` — so "dumpling"→Momo, "c-momo"→Chilli
  Momo, "kothey"→Kothey Momo all surface). The user **clicks a tag**, and search fires on
  that **tag id**. No tokenizing, no AND. Aliases only find a tag, never create one.

**Granularity (LOCKED): dish-level default, momo the one deep dish.** Every dish is a
flat top-level tag (momo, chowmein, thukpa, sekuwa, bara, …) — enough for the core goal
("best momo in Sydney", "thakali in Melbourne"). **Momo is the ONLY exception**: it gets
a preparation + protein subtree, because it's the only dish people search by sub-type
("jhol momo", "chicken momo") and it's the brand. Any other dish can be deepened later
with **zero migration** (just add child rows to `taxonomy.ts`) — so we stay lean now and
expand on evidence, never speculation.

- **Hierarchy (momo only):** momo (parent) → steamed-momo / jhol-momo / fried-momo /
  chilli-momo (preparation) + chicken-momo / veg-momo / buff-momo (protein). The seeder
  materialises ancestors onto each item, so picking **"Momo"** flat-matches every momo
  item and **"Chicken Momo"** matches just those. Non-momo dishes have `parent_id = NULL`.
- **Preparation = item name; protein = name OR variant (momo only).** Preparation is the
  item's identity and comes from the **name** (steamed-momo, kothey-momo, …). Protein is a
  separate axis: the seeder reads it from the variant **labels** when the item uses variants
  ("Steamed Momo: Veg/Chicken/Buff"), AND from the item **name** when the menu lists protein
  as its own line ("Chicken Momo $12", no variants) — so neither layout is missed. Both map
  to chicken-momo/veg-momo/buff-momo. For every non-momo dish, neither name nor variant
  drives a protein/preparation tag (those dishes are flat).
- **Vocab grows by deliberate edit, never free-text.** Seed the spine up front
  (`taxonomy.ts`, ~30 entries); as new dishes show up during transcription, add a canonical
  row to `taxonomy.ts` (slug/kind/parent), then reference it. Spelling/naming variants
  ("kothey" → fried-momo, "Steam Momo" → steamed-momo) resolve to canonical via the
  `synonyms` list **at transcription time** — they never create rows. The menu seeder
  maps item → tag **by slug and HARD-ERRORS on an unknown slug** (never silent
  auto-create), which forces the deliberate add and stops the vocab fragmenting (three
  "momo" tags) — the exact thing that would break cross-restaurant search.
- `kind` = the facet distinguishing a tag from its parent: dish (momo), preparation
  (jhol-momo), protein (chicken-momo), style (newari).
- The main search box unifies **dish tags + restaurant names + addresses**. Picking a
  dish tag runs the menu search below.
- **`restaurants.tags` stays coarse** (dish + style only). "/tag/chicken" or "/tag/jhol"
  is meaningless (everyone has chicken); fine tags (prep, protein) live at item level in
  `menu_item_tags` for the precise search.

## Search result display

Pick a tag (e.g. **Steamed Momo**) → restaurants in the viewport with matching items,
each card carrying its matched items:

```
Himalayan Kitchen  ★4.7 · Harris Park · 1.2km
┌─ matched: momo ──────────────────────────┐
│ ◀  🥟 Steamed Momo                     ▶ │   slide 1
│       Veg $11 · Chicken $12 · Buff $13    │
└───────────────────────────────────────────┘
        • ○ ○      ← Steamed / Jhol / C-Momo
```

- Per restaurant: card data + `matchedItems[]` (name, description, `variants[label,price]`,
  `photos[]` later).
- **Two carousels:** (1) swipe the matched items (Steamed → Jhol → C-Momo) — just the
  array; (2) per-item photo carousel — via `menu_item_photos`, when images land.
- Server action, viewport-scoped. Cacheable per tag (tag → restaurants+items is
  viewport-independent; intersect the viewport client-side), so common dishes barely hit
  the DB.

## Locked decisions

1. **Variants** (size/protein) = structured rows; **preparation** = separate items;
   never `modifiers jsonb`.
2. **Tags** = `dish_categories` table (hierarchical, `kind` + `parent_id`) + `menu_item_tags`
   M2M (leaf + ancestors).
2b. **Granularity** = dish-level default. **Momo** also has a preparation subtree
   (steamed/jhol/kothey/sandheko/chilli/fried). **Protein is a CROSS-CUTTING facet**
   (chicken/goat/buff/veg/egg/lamb/pork/fish/prawn/paneer), NOT per-dish compounds:
   protein applies across nearly every savoury dish and sources model it inconsistently
   (priced variants vs separate "Chicken X / Goat X" items), so it's one flat facet tagged
   ALONGSIDE the dish — chicken momo → `[momo, chicken]`, goat curry → `[curry, goat]`. The
   seeder derives protein from the variant label AND the item name/description (Nepali names
   bridged via `search_aliases`: "Kukhura Ko Masu" → chicken). **Search = dish (primary,
   single pick) + optional protein filter** (this supersedes the earlier "single tag, no
   AND" rule). Protein tags go in now; the protein-filter UI can land later.
2c. **Vocab growth** = seed the spine in `taxonomy.ts`, grow at the leaves by deliberate
   edits there; the seeder hard-errors on an unknown slug (never auto-creates). Synonyms
   canonicalize printed variants at transcription time.
3. **Search** = deterministic single-tag-id pick from a dropdown; typed text only filters
   the dropdown.
4. **`restaurants.tags` reused** as the coarse rollup (name-derived baseline kept); no new
   `dish_tags` column.
5. **Price model** = absolute price per variant; single-price item → one NULL-label variant.
6. **Images** = `menu_item_photos` (deferred, shaped now); allergens/calories deferred,
   trivially additive later. **No curated category image** — dish tiles/heroes reuse a
   dish-item photo, so `dish_categories` has no `image_key`.
7. **Scope now** = content + tags + search; FoodHub ordering layer (availability,
   modifiers, carts, orders) deferred.
8. **Provenance + visibility** (additive columns, free now): `menu_items.source`
   (`admin` / `owner_upload` / `llm_extracted` — also the reseed-ownership signal) and
   `menu_items.is_hidden` (pull a bad item without deleting; NOT a tombstone — removal is
   a real DELETE on reseed). `menu_item_variants.currency` defaults `AUD`. UGC moderation
   (`pending`) and sold-out are NOT here — they land later (see FoodHub note).
9. **Variant display layout** (detail-page menu render, `web/components/RestaurantMenu.tsx`):
   a multi-variant item splits its variants **per variant by label length**. Short labels
   (≤ `VARIANT_ROW_THRESHOLD`, currently 24 chars — size/protein like "Chicken", "Large (6)")
   group into a **pill cluster**; long labels (sentence-like, e.g. Jheer House souvlaki packs
   or Chowmien's "Mixed (Buff & Chicken with egg)") each get a **full-width row** (label wraps
   left, price right-aligned) rendered **below** the pills. Grouping is intentional — rows
   always follow pills, they never interleave, so variant order isn't preserved within an item
   (acceptable: variants are alternatives, not steps). Pure cases fall out of the same rule
   (all-short → pills only; all-long → rows only). Computed server-side at render (static data,
   no client measurement). `VARIANT_LAYOUT = "pills" | "rows"` forces one bucket for eyeballing;
   `"auto"` is the shipped behaviour.

## FoodHub compatibility (shared schema — keep the line)

These tables also back **FoodHub** (QR-menu + in-app ordering). The content core is
already ordering-ready (variants are the orderable priced unit). Ordering is a
**referencing layer** built later — orders/carts, modifier groups, availability, tables/QR,
payments all FK into these tables and need **no change to the content core**. Hold the line:

- **Variant vs modifier.** *Variant* = "pick exactly one priced version" (size, protein) =
  shared core, stays column-filterable. *Modifier / add-on* ("add cheese +$1", "pick 2
  sides") = **FoodHub-only**, references the item, never inlined into the core (no
  `modifiers jsonb` — it kills the directory's column filtering).
- **Seeder vs owner-owned menus.** The directory seeder is delete-and-reinsert (JSON is
  source of truth). Once a restaurant is a FoodHub customer and owns its menu, the seeder
  **stops reseeding it** — writes become in-place owner edits + **soft-delete** (keep the
  row so live orders/history survive). `source` is the ownership signal
  (`admin`/`llm_extracted` = directory-reseedable; `owner_upload` = owner-owned).
- **Orders snapshot price.** When ordering ships, `order_items` copy name + price at order
  time, so editing/reseeding a menu never rewrites a historical order. IDs are stable
  `BIGSERIAL` already; a third-party POS `sku`/`external_id` is additive if/when needed.
- **GST/tax** is display-only (AU prices are GST-inclusive); FoodHub computes the breakdown
  at cart/receipt. No column in this core.

## UGC future (image/PDF upload → extract → seed)

Post-launch, owners upload a menu image/PDF and an LLM extracts it. Key design choices so
this slots in cleanly later:

- **Same JSON contract.** LLM extraction outputs the exact `scraper/menu-data/<slug>.json`
  shape the manual seeder consumes — the JSON is the single integration point, so the
  upload path reuses the seeder unchanged.
- **Convergence.** The dish set is bounded; after manually seeding ~50-100 menus the vocab
  is near-complete, so uploaded menus mostly map to existing tags automatically.
- **New dishes go to review, never auto-add.** A genuinely-new dish from an upload routes
  to a **pending** queue (the upload/batch table + moderation state, deferred) for a quick
  human canonicalize-or-merge — preserving the controlled vocab that powers dish search.
  File storage + the `menu_uploads` batch table are the only net-new pieces then.

## Build phases (after the schema is applied)

1. **Schema** — apply `scraper/schema-menu.sql` to Neon (additive; the only non-additive
   bit is how `restaurants.tags` is populated, and the column is unchanged so reads stay safe).
2. **Seed taxonomy (incremental, re-run often)** — load `dish_categories` from `taxonomy.ts`.
   This is NOT one-time: the vocab grows as we seed restaurants, so the seeder is an
   idempotent upsert-by-slug we re-run each time a new dish/prep is added to `taxonomy.ts`
   (e.g. kothey-momo / sandheko-momo surfaced from a real menu). New tags always go through
   `taxonomy.ts` (central, reviewed), never auto-created from a restaurant's JSON.
3. **Parse** (per restaurant) — you give a file + slug; I write `scraper/menu-data/<slug>.json`.
   Rules: preparation → separate items; size/protein → variants; map to taxonomy tags
   (leaf + ancestors); AU spelling; transcribe only what's printed; null price when illegible.
4. **Seed** — `scraper/seed-menu.js <slug>`: in one txn, replace that restaurant's
   categories/items/variants/tags, then rebuild `restaurants.tags` rollup + price/count
   facets. Idempotent (re-run = clean re-seed), `--dry-run` previews.
5. **Detail-page render** — show the menu **only when items exist** (sections, variant
   prices). Everyone else unchanged; lights up incrementally.
6. **Map dish search** — dropdown over `dish_categories` (+ names / addresses); tag pick →
   restaurants + matched-items carousel.
7. **Later** — `menu_item_photos` (image carousels); **dish × city landing pages**
   (programmatic SEO, e.g. "Newari food in Sydney"): list restaurants via
   `restaurants.tags @> '{newari}'` (full coverage now) + their actual dishes via
   `menu_item_tags` (fills in as menus are parsed) — a two-tier page that launches with
   the directory and gets richer over time; FoodHub ordering layer.

## JSON contract (`scraper/menu-data/<slug>.json`)

The transcription shape `seed-menu.js` consumes (and the future image/PDF LLM output
target). Reference example: `scraper/menu-data/sample-menu.json`.

```jsonc
{
  "slug": "restaurant-slug",      // matches restaurants.slug
  "source": "admin",              // admin | owner_upload | llm_extracted
  "price_source": "print",        // print | ubereats | website (provenance note)
  "currency": "AUD",
  "categories": [{
    "name": "Momo Nepalese Dumpling",
    "items": [{
      "name": "Steamed Momo",                  // verbatim from the menu
      "description": "...",
      "is_vegetarian": true,                    // optional; from a (V) marker
      "spice_level": 3,                         // optional 0-3
      "tags": ["steamed-momo"],                 // controlled slugs: dish/style/momo-prep ONLY
      "variants": [                             // priced versions; protein lives HERE
        { "label": "Chicken", "price": 17.00, "protein": "chicken" },
        { "label": "Vegetable", "price": 17.00, "protein": "veg", "is_vegetarian": true }
      ]
    }]
  }]
}
```

Rules the transcriber follows (the seeder enforces/derives the rest):
- **`tags`** = controlled slugs for the dish (+ style, + momo preparation). NOT protein.
  A single tag is enough; the seeder materialises ancestors (`steamed-momo` → adds `momo`).
- **Protein lives on `variants`** (`variant.protein`), the seeder unions distinct variant
  proteins onto the item as cross-cutting tags. Single-price item with no protein = one
  variant `{ "label": null, "price": N }`.
- **Consolidate** protein-only items (Chicken/Goat Thukpa) into one item with protein
  variants (see ingestion rules below).
- The seeder **hard-errors on any unknown tag/protein slug** (controlled-vocab gate), so a
  new dish forces a deliberate add to `taxonomy.ts` + a `seed-taxonomy.ts` re-run.

## Parsing real menus (Uber Eats / aggregators)

Rules learned from transcribing real aggregator menus:

- **Skip the merchandising rows.** "Featured items" and "Picked for you" are UI sections
  that DUPLICATE real items — map the real menu sections only (Starters, Curries, Momo,
  Sides, Beverages, …), never the merchandising rows, or items double-insert.
- **"Choice of filling" → variants, even at the same price.** When momo is a single price
  with a "choice of chicken/veg/buff" filling, capture the fillings as same-price variants
  so protein search still works (and it stays a clean SKU for FoodHub). Don't drop it as a
  modifier.
- **Standalone add-ons** (e.g. "Momo Sauce $1.00") = store as an item with no dish tag;
  don't model them as modifiers (that's FoodHub).
- **Curries are often Nepali-named** (Kukhura/Khasi/Bheda Ko Masu). Tag protein from the
  name/description so English search ("chicken/goat/lamb curry") reaches them.
- **Transcribe item names verbatim**, map only to controlled tags; house names with no
  controlled tag (e.g. "Kathmandu Momo") keep the name and get just the parent (`momo`).
- **Consolidate protein-only items into ONE dish + protein variants.** Aggregators flatten
  protein into separate items (Chicken Thukpa, Goat Thukpa, …); collapse them into one
  `Thukpa` item with protein variants (cleaner display, matches the print menu), tagged
  `thukpa` + each protein. Only collapse when items differ SOLELY by protein — keep distinct
  named dishes (Butter Chicken, Vindaloo) and bundled "Sets" separate.
- **`(V)` marker → `is_vegetarian = true`.** Aggregators flag veg items; read it straight
  into the column.
- **Prefer the restaurant's own / print menu** as the canonical structure + price source
  (aggregator prices are marked up); use the aggregator only to fill truncated descriptions,
  confirm options, `(V)` markers, and photos.

## Guardrails

- **Additive** on shared Neon; `restaurants.tags` column unchanged (reads safe), only its
  population enriches over time.
- **Idempotent** seed (delete + reinsert per restaurant; the JSON is the source of truth).
- **Controlled vocab** — item tags only come from `dish_categories`; new ones added
  deliberately, never free-text.
- **Licensing** — transcribe a restaurant's own menu for display; store no third-party
  files or scraped prices.
- **Staleness** — `menu_parsed_at` flags age; refresh cadence TBD.
