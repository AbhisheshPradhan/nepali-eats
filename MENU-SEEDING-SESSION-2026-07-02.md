# Menu-seeding worker session — 2026-07-02

Context log for a parallel menu-seeding worker run. Progress went **41/147 → 57/146
seeded**. All DB seeds committed to Neon; JSON files written under
`scraper/menu-data/`. Per worker rules, **no git commit/push** was done — the main
window pushes the `<slug>.json` files together.

## Seeded this session (5 menus, 354 items — all committed, pages render 200)

| Restaurant | Slug | Suburb | Items | Source used |
|---|---|---|---|---|
| Tinkune Momo & Sekuwa House | `tinkune-momo-sekuwa-house` | Sunshine, VIC | 49 | own-site ordering page `tinkune.com.au/order-now` — rendered with Playwright, opened each item modal to read protein/prep variant prices |
| Momo Ghar Oii Oii Oii | `momo-ghar-oii-oii-oii` | Hoppers Crossing, VIC | 53 | own-site Squarespace A3 menu images (2 pages, `menu a3 ...-1/-2.png`) |
| Himali Gurkha | `himali-gurkha-nepalese-restaurant-ardross` | Ardross, WA | 59 | own-site WordPress menu (HTML parse — `w-grid-item` cards, small/large size variants) |
| Namaste Kitchen | `namaste-kitchen-south-perth` | South Perth, WA | 138 | own-site food PDF (6pp, image-based → pdftoppm + read) **+ full alcohol PDF** (bar transcribed, tagged `drinks`) |
| Everest Eatery | `everest-eatery-indian-nepalese-cuisine-hobart` | Hobart, TAS | 55 | own-site WooCommerce menu (HTML parse — 11 category tabs, `woocommerce-Price-amount`) |
| Cafe Talk Nepalese (Hornsby) | `cafe-talk-nepalese-restaurant-hornsby-hornsby` | Hornsby, NSW | 59 | own-site Elementor menu (`thecafetalk.com.au/our-menu/`) — HTML parse was messy (2-col layout, headings merged into item boxes), so verified by rendering + reading full-page screenshot slices |
| Gurkha's Fusion | `gurkhas-fusion-maroochydore` | Maroochydore, QLD | 60 | own-site 2 menu images (`gurkhasfusion.com.au` `Menu-1.jpg`/`Menu-2.jpg`) — read directly |

Notes on modelling choices:
- **Tinkune**: momo grid = one item per prep (steamed/jhol/fried/chilli) with
  veg/chicken/buff variants; "Bhatti Momo" (steamed + hot goat-bone soup) tagged
  `[momo]` (NOT a new prep tag — decided: just `momo`). Fried Rice / Curry / Choyla
  protein-only groups consolidated into single items with variants.
- **Momo Ghar**: momo prep×protein grid — 4 prep prices (Steamed | Kothey/Fried |
  Jhol | Chilli/Manchurian) × Chicken/Mutton(→`goat`)/Veg/Paneer; platters
  (Trio/Malai/Tandoori) each 4 protein variants. Family Pack (6-7ppl) transcribed.
  Schezwan chowmein/rice tagged `[chowmein]`/`[fried-rice]` (see taxonomy TODO).
- **Himali Gurkha**: every main has Small/Large size variants; "Tandruk" (their word
  for a mild curry) → `curry`; "Bhutuwa" (garlic-ginger pan-fry) tagged `[]` (logged).
- **Namaste Kitchen**: licensed venue — full alcohol list (beer/wine/spirits/
  cocktails/mocktails) transcribed as `drinks` items with Glass/Bottle or Middy/Pint
  variants where the menu priced them. `price_source: "print"` (PDF).
- **Everest Eatery**: "Spinach X" dishes → `[curry, saag]`; Kadai/Korma/Vindaloo/
  Masala → `curry`. Fixed obvious name typos (VIndaloo→Vindaloo, Saffon→Saffron).
- **Cafe Talk (Hornsby)**: 3 Cafe Talk branches exist (Kogarah/Campsie/Hornsby) —
  this is Hornsby (`thecafetalk.com.au`) only. Momo preps consolidated into one item
  each with Veg/Chicken/Buff variants. "Momo Sadeko Veg/**Chilli**/Buff $15/$16/$18"
  read as Veg/Chicken/Buff (printed "Chilli" is a menu typo — matches the $16 chicken
  price used everywhere). Sadheko momo slug = `sandheko-momo` (not `sadheko-momo`).
  "Add Waiwai/Chicken/Egg" modifier lines skipped (not items).
- **Gurkha's Fusion**: fusion pub — most Western items (schnitzel, parmi, burgers,
  steaks, pizza, wraps) tagged `[]` (no Nepali slug); Nepali sections (momos, snacks,
  curry, khaja, thali) carry the tags. Momo prices listed as chicken/buff/veg (not the
  usual veg/chicken/buff). KHAJA SET uses "Set / only" dual pricing → captured as
  variants (e.g. Choila: Chicken Set $25 / only $20, Buff Set $27 / only $22; Mutton
  Tash/Sekuwa each Set/Only). "Mutton" → `goat`. "Topper" add-ons skipped.

## Skipped (no own-site priced menu) — claim locks KEPT, logged in MENU-TAXONOMY-TODO.md
- **Indus Curry Express** (`...geebung`, Geebung QLD) — own domain
  `induscurryexpress.com` is dead/parked (114-byte JS redirect to `/lander`, which
  fails). No menu anywhere on own site.
- **Crimson and Blue** (`crimson-and-blue-millswood`, Millswood SA) — own
  `/our-menu/` page has zero menu content; it only links out to `ordereats.com.au`
  (blocklisted ordering platform). Nothing to seed.

## Released for later retry (NOT a skip)
- **De Bhatti** (`de-bhatti-mount-lawley`, Mount Lawley WA) — own domain
  `bhatti.com.au` returned **HTTP 522** (Cloudflare origin down) on all URLs at
  seeding time. Claim lock **released** so any window can retry when the origin is
  back up. The menu likely exists; this is transient, not a real skip.

## Taxonomy gaps logged for the coordinator (in MENU-TAXONOMY-TODO.md)
Tagged with fallbacks now; batch into `taxonomy.ts` + reseed later:
- **schezwan** (style; Schezwan Chowmein/Rice at Momo Ghar) → `[chowmein]`/`[fried-rice]`
- **bhutuwa** (Nepali garlic-ginger pan-fry; Himali Gurkha) → `[]`
- (Resolved inline: **bhatti-momo** is NOT a new tag — just `momo`.)

## What's next (worklist = MENU-SEEDING-PLAN.md §B, own-site pages, top-down unseeded)
Next highest-review unseeded own-site candidates (verify claim + own-site menu first):
- Lah Bros Windsor (`lah-bros-windsor-modern-nepalese-restaurant`, 352) — was claimed by another window
- Cafe Talk Nepalese (`cafe-talk-nepalese-restaurant-hornsby`, 247)
- Deurali Restaurant (`deurali-restaurant-salisbury`, 247)
- Gurkha's Fusion (`gurkhas-fusion-maroochydore`, 237)
- De Bhatti — retry when `bhatti.com.au` origin is back (522 earlier)

Then the long tail of §B, and finally §C aggregators only where a spot has **no**
own menu (per rules, platform menus are never seeded).
