# Menu seeding — worklists, queue & skip log

One doc for the whole seeding effort (merged 2026-07-07 from
MENU-SEEDING-PLAN + MENU-QUEUE + MENU-REMAINING-PLAN + MENU-SKIPPED-SOURCES,
content preserved verbatim). `node scraper/menu-progress.js --write`
regenerates the Checklist section in Part 1.

---

<!-- ================= Part 1: was MENU-SEEDING.md ================= -->

# Menu seeding from existing `menu_url` data — plan + checklist

Goal: seed menus for the spots that already have a `menu_url` in the DB, instead of
manually hunting/pasting each menu. Companion to `MENU-PLAN.md` (the schema + JSON
contract + `seed-menu.js`). This doc is the **worklist**; tick items as we go.

## The numbers (visible, unseeded, has `menu_url`)

447 visible restaurants · 174 have a `menu_url` · 4 already seeded → **~144 usable candidates**:

| Bucket | Count | Feasibility |
| --- | --- | --- |
| **Own-site PDF** | 26 (most already downloaded to `media/menus/`) | **Easiest.** fetch → `pdftoppm` → I read pages → transcribe. Start here. |
| **Own-site page** | 82 | Mixed. ~16 are shared menu platforms (yumbojumbo ×9, tapnorder ×3, tuckerfox ×2, grubbio, ordereats) → one parser could pre-extract many. The rest are bespoke (HTML text or images like Heshela). |
| **Aggregator** | 36 (Uber Eats ×26, Menulog/DoorDash ×3 each…) | **Hardest / last.** Bot-walled (Uber Eats returns 403 to plain fetch; needs Playwright + proxies), and prices are marked up. Use only where there's no own menu. |
| Junk (CSS files, `http://menu/`, logos) | 25 | Excluded (scraper false-positives). |
| Social | 1 | Skip. |

## How we'll run it (recommended: small batches, produce → review → commit)

The transcription step (reading menu images/PDFs into the JSON) is **me in the loop**,
there's no LLM vision API wired in (no `ANTHROPIC_API_KEY`), so this is NOT an unattended
batch; it runs one menu at a time either way. So the only real choice is commit cadence.

**Recommendation: work in batches of ~6-8, easiest bucket first.** For each batch:
1. I fetch each `menu_url` (PDF → rasterize; own-page → render + pull menu images/text).
2. I transcribe each to `scraper/menu-data/<slug>.json` (**no DB writes**).
3. `seed-menu.js <slug>` **dry-run** on each; I surface counts + judgment calls.
4. You skim the batch; I add any new dish tags to `taxonomy.ts` (deliberate).
5. `--commit` the batch.

Why not "transcribe ALL 144 → then review → then commit"? The seeder **hard-errors on
unknown dish slugs**, so 144 menus' worth of new dishes would pile into one messy
reconciliation; value lands nowhere until the end; and reviewing 144 JSONs cold is worse
than reviewing a fresh batch against its sources. Batches keep the vocab clean, land value
incrementally, and keep your review cheap. Why not strict one-at-a-time? Too many approval
round-trips for 140+ menus.

**Order:** (1) the 26 PDFs (cleanest, mostly downloaded) → (2) spike one `yumbojumbo`
page; if structured, sweep the 9 → (3) the rest of the own-site pages → (4) aggregators
only where a spot has no own menu.

## Caveats / decisions

- **Dirty data:** ~25 `menu_url`s are junk (CSS files, `http://menu/`, a logo PDF) — skip.
  A few "own-page" links are homepages/`#menu` anchors; may need to find the real menu page.
- **⛔ RESTAURANT'S OWN MENU ONLY — never seed from an online ordering/delivery platform.**
  Platform menus (marked-up prices, subset of items, platform-only combos) are NOT the real
  restaurant menu. This excludes aggregators (Uber Eats, DoorDash, Menulog, Deliveroo,
  HungryPanda, order.store) AND third-party ordering/menu hosts (`yumbojumbo`, `tuckerfox`,
  `tapnorder`, `grubbio`, `ordereats`, `bopple`, `mryum`). Use only the restaurant's own
  website (its own domain) PDF/menu page, or physical-menu photos. If the only source is a
  platform, SKIP the restaurant rather than seed wrong data.
- **⚠️ Do NOT assume branches share a menu.** Each branch of a chain (Falcha, Aagaman,
  Momo Central, Little Magic Momo, Khukuri, etc.) has its OWN menu and prices — confirmed
  by the owner. Transcribe every branch from ITS OWN menu source; never reuse one branch's
  JSON for another. (Little Magic Momo and both Heshela were each seeded from their own
  branch menus, not by reuse.)
- **Catering flag** — set `catering = true` when a menu/site advertises catering.
- **SKIPPED (catering-only, no prices):** `everest-function-centre-rockdale` — its
  `menu_url` PDF is a function-centre catering menu (ENTREE/MAIN/DESSERT bubble
  diagrams, no prices, DJ/Mandap/Fireworks). Per the "skip catering flyers" rule it
  was not seeded; `catering=true` set instead. Don't re-attempt as a priced menu.
- **`source = "admin"`**, `price_source` = `print`/`website` per where it came from.

### ⚠️ Prices to confirm with the owner

- **Galli Kitchen (`galli-kitchen`, id 492) — momo prep prices (inferred split).** Seeded
  2026-07-02 from the restaurant's own Square Online menu (`gallikitchen.com.au/s/order`,
  `price_source: "website"`; full 79-item menu, dine-in-level prices, NOT marked up). Each
  protein momo (Veg/Chicken/Buff/Pork) offers 5 preps (Steam/Jhol/Kothey/Fried/Chilli) with a
  confirmed base→+$2 price range (Veg $16→18, Chicken $17→19, Buff $18→20, Pork $18→20). The
  Square modal would not expose the per-prep delta to the scraper, so the split was **inferred
  by the standard pattern**: Steam/Jhol/Kothey at base, Fried/Chilli at +$2. Base prices are
  verified; which preps carry the +$2 is the only assumption. Confirm the fried/chilli uplift
  with the owner and correct + reseed if the split differs. Everything else on 492 is exact.

- **Flavours of Nepal (`flavours-of-nepal-granville`, id 116) — 6 momos.** The physical
  menu we seeded from had NO momo section, so the momos were taken from the yumbojumbo
  site (an ordering platform we otherwise ignore) and rounded to whole dollars. The names
  are trustworthy; the **prices are unconfirmed** because a cross-check of shared items
  showed yumbojumbo runs a few cents/dollars off the real menu (e.g. Chhoila $17 vs $18,
  Goat Curry $22.99 vs $23, Laphing $9.99 vs $10/$12). Momos seeded (yumbojumbo → rounded):
  Steam $12.50→**$13**, Kothey $13.90→**$14**, Fried $13.90→**$14**, Chilli $15.90→**$16**,
  Sadeko $15.90→**$16**, Jhol $14.99→**$15**. **Confirm these 6 prices (and whether protein
  options exist) with the owner, then correct the JSON + reseed.** Everything else on 116 is
  from the real printed menu.

- **Kutumba Lounge (`kutumba-lounge`, id 932) — whole menu (51 items).** Seeded from the
  restaurant's own site `kutumbalounge.com.au/menu` (`price_source: "website"`). The dish
  names + descriptions are clearly real and specific (Kutumba spice, Party Time Nepal, Unley),
  but the page footer carries a **"Menu and prices are sample placeholders and can be updated
  by the restaurant"** disclaimer (Webnity template boilerplate). Prices look sane and on-market
  ($1.99–$37.99) so they were seeded as-is, but treat **all prices as website-stated /
  unconfirmed** until verified with the owner. `catering=true` set (has a Catering page; brand
  is "Party Time Nepal" catering). No drinks/bar section published on the menu page.

---

## Checklist

Source of truth = DB (`menu_item_count`); regenerate with `node scraper/menu-progress.js --write`. `📁local` = file under `media/menus/`.

**Progress: 153 / 184 seeded (83%)** · refreshed 2026-07-05

### A. PDF menus — start here — 30/31 done
- [x] **Kathmandu Momo** (Surfers Paradise, QLD) · 3795 rev · ✓ 170 items
    https://kathmandumomo.com.au/wp-content/uploads/2026/06/kathmandu-momo-FOODDRINK-regular-m
- [x] **Falcha Town Hall** (Sydney, NSW) · 2853 rev · ✓ 53 items
    https://falcha.com.au/wp-content/uploads/2026/04/Falcha_Townhall_Menu_Nov2025.pdf
- [x] **Funky Momo** (Victoria Park, WA) · 1406 rev · ✓ 89 items
    http://funkymomo.com.au/wp-content/uploads/2023/03/Food-Menu-funky-final.pdf
- [x] **Galli Galli Nepalese Indian** (Sydney, NSW) · 1166 rev · ✓ 50 items
    https://galligalli.com.au/wp-content/uploads/2025/06/Galli-Galli-Menu.pdf
- [x] **Tasty Momo Restaurant Nepalese & India** (Dianella, WA) · 723 rev · ✓ 90 items
    https://tastymomo.com.au/wp-content/uploads/2026/01/TASTY-MOMO-MENU-Cloverdale-V.6.pdf
- [x] **Taste of Nepal** (Norwood, SA) · 697 rev · ✓ 51 items
    https://www.tasteofnepal.com.au/uploads/tonmenu/1734847921_6989_TON%20New%20%20Dine%20In%2
- [x] **Chomolungma Nepalese Cuisine** (Griffith, ACT) · 642 rev · ✓ 59 items
    https://chomolungmacuisine.com.au/wp-content/uploads/2024/03/White-Minimal-Restaurant-Food
- [x] **Elektra - Himalayan Alchemy House** (Fitzroy, VIC) · 549 rev · ✓ 47 items
    https://elektrafitzroy.com.au/wp-content/uploads/2022/11/Elektra-menu-2023.pdf
- [x] **The Saffron House** (Blackburn South, VIC) · 531 rev · ✓ 94 items
    https://www.thesaffronhouse.com.au/s/HimalayanBelt_J42140_A4_Menus_SaffronHouseTakeawayAug
- [x] **Indus Indian &Nepalese Restaurant Gold** (Surfers Paradise, QLD) · 522 rev · ✓ 82 items
    https://indusrestaurant.com.au/storage/app/public/branch_images/1765795615-5289.pdf
- [x] **Little Magic Momo** (Osborne Park, WA) · 521 rev · ✓ 51 items
    https://littlemagicmomo.com.au/wp-content/uploads/2026/03/little-magic-momo-menu-V.4.pdf
- [x] **Spring Hill Kitchen** (Spring Hill, QLD) · 516 rev · ✓ 43 items
    http://springhillkitchen.com.au/wp-content/uploads/2023/12/spring-hill-Menu.pdf
- [x] **Jhigu Bhoye Chhen Nepalese Restaurant** (Coorparoo, QLD) · 503 rev · ✓ 93 items
    https://jhigubhoyechhen.com.au/wp-content/uploads/2026/04/menu.pdf
- [x] **Baar Pipaal - Restaurant & Bar** (Glenroy, VIC) · 493 rev · ✓ 46 items
    https://baarpipaal.com.au/wp-content/uploads/2024/07/menu-07-2024-updated.pdf
- [x] **New Farm Curry House** (New Farm, QLD) · 442 rev · ✓ 46 items
    https://www.newfarmcurryhouse.com.au/uploads/b/88d86020-c3ca-11ee-914d-699eba735d74/NFCH-T
- [x] **Little Magic Momo wembley** (Wembley, WA) · 404 rev · ✓ 51 items
    https://littlemagicmomo.com.au/wp-content/uploads/2026/03/little-magic-momo-menu-V.4.pdf
- [x] **Namaste Nepalese Restaurant** (Parkside, SA) · 384 rev · ✓ 51 items
    https://namasterestaurant.com.au/wp-content/uploads/2022/09/Namaste-Food-Menu-August-2022.
- [x] **Laltin Nepalese Cuisine** (Rockdale, NSW) · 367 rev · ✓ 54 items
    https://www.laltin.com.au/_files/ugd/fe3d47_3538932b699e42aba270a3e4ec8deebe.pdf
- [x] **Chillies Indian and Nepalese Restauran** (Sandy Bay, TAS) · 361 rev · ✓ 103 items
    https://chilliesindnep.com.au/wp-content/uploads/2025/03/Chillies-Menu.pdf
- [ ] **Everest Function Centre** (Rockdale, NSW) · 329 rev · 📁local
    http://www.everesttandoori.com.au/images/menu/everest-tandoori-menu.pdf
- [x] **Lahana Restaurant and Bar** (Hurstville, NSW) · 317 rev · ✓ 158 items
    http://lahanahurstville.com.au/wp-content/uploads/2024/03/Lahana_menu.pdf
- [x] **Lababdar** (Ryde, NSW) · 282 rev · ✓ 111 items
    http://lababdar.com.au/wp-content/uploads/2025/11/Lababdar-New-Menu-Nov-2025_Compressed.pd
- [x] **Himalayan Tandoor & Curry House** (Bellerive, TAS) · 266 rev · ✓ 79 items
    https://www.himalayantandoorandcurryhouse.com.au/images/dineinmenu.pdf
- [x] **Kathmandu Cuisine** (Hobart, TAS) · 265 rev · ✓ 24 items
    http://kathmanducuisine.com.au/ktm-cusine-menu-01-converted.pdf
- [x] **Momoland - Newcastle, Australia** (Jesmond, NSW) · 257 rev · ✓ 36 items
    https://momoland.com.au/wp-content/uploads/2025/11/Momo-Land-Menu.pdf
- [x] **Little Nepal Nepalese Restaurant** (Currambine, WA) · 227 rev · ✓ 96 items
    http://littlenepalrestaurant.com.au/wp-content/uploads/2017/12/Little_Nepal_Take_AWay.pdf
- [x] **Tasty momo Nepalese Restaurant** (Cloverdale, WA) · 140 rev · ✓ 66 items
    https://tastymomo.com.au/wp-content/uploads/2026/01/TASTY-MOMO-MENU-Cloverdale-V.6.pdf
- [x] **Street Eats Mt Hawthorn** (Scarborough, WA) · 106 rev · ✓ 82 items
    https://assets.cdn.filesafe.space/fBmNTES4lOqZJFIgBQJs/media/69fd9642a3dd25aa2a87ebde.pdf
- [x] **Himalayan BBQ** (Greenway, ACT) · 103 rev · ✓ 29 items
    https://img1.wsimg.com/blobby/go/a4c3634e-3b7b-4194-9e8a-f28ec52cb11a/HIMALAYAN%20BBQ%20(A
- [x] **Indus Indian and Nepalese Restaurant- ** (Ipswich, QLD) · 80 rev · ✓ 85 items
    https://indusrestaurant.com.au/storage/app/public/branch_images/1766108179-8190.pdf
- [x] **Tusa Canberra** (Barton, ACT) · 19 rev · ✓ 19 items
    https://tusanepal.com/wp-content/uploads/2026/06/Tusa-Canberra.pdf

### B. Own-site pages — 107/131 done
- [x] **The Momos Hub Townhall** (Sydney, NSW) · 3689 rev · ✓ 47 items
    menus/17/menu-1782054769586-3g5g.webp
- [x] **Chulho - Harris Park** (Harris Park, NSW) · 2448 rev · ✓ 132 items
    https://www.chulho.com.au/menu
- [x] **Heshela Newa Khaja Ghar Rockdale** (Rockdale, NSW) · 2357 rev · ✓ 95 items
    https://restaurant.heshela.com.au/table-menu/
- [x] **Chilli Everest** (Melbourne, VIC) · 2249 rev · ✓ 49 items
    https://chillieverest.com.au/menu/
- [x] **Momo Central Little Collins St** (Melbourne, VIC) · 1998 rev · ✓ 27 items
    https://momocentral.com.au/menus/
- [x] **Lakeside Gurkhas** (Kingston, ACT) · 1953 rev · ✓ 195 items
    http://lakesidegurkhas.com.au/menu
- [x] **Khukuri Nepali Restaurant** (Campsie, NSW) · 1442 rev · ✓ 87 items
    https://khukurirestaurant.com.au/menu/khukuri-campsie
- [x] **Magic Momo Kafe West Footscray** (West Footscray, VIC) · 1299 rev · ✓ 18 items
    https://magicmomokafe.com.au/menu/
- [x] **Old Durbar Nepalese & Indian Restauran** (Melbourne, VIC) · 1279 rev · ✓ 42 items
    https://old-durbar.com.au/our-cuisines/
- [x] **Sambandha Restaurant** (Auburn, NSW) · 1215 rev · ✓ 30 items
    https://sambandharestaurant.shop/menu
- [x] **SPICE MIX- Indian, Nepalese & Halal Re** (Brunswick East, VIC) · 1015 rev · ✓ 178 items
    https://spicemixrestaurant.com/menu
- [x] **Mul Chowk Kitchen Sydney** (Campsie, NSW) · 995 rev · ✓ 85 items
    https://mccatering.com.au/menu
- [x] **MoMo Planet** (Victoria Park, WA) · 968 rev · ✓ 121 items
    http://www.momoplanetperth.com/menu.html
- [x] **Khukuri Restaurant Adelaide** (Adelaide, SA) · 929 rev · ✓ 87 items
    https://khukurirestaurant.com.au/menu/khukuri-adelaide
- [x] **Prisha Catering and Events** (Yennora, NSW) · 925 rev · ✓ 7 items
    https://www.prishacateringandevents.com.au/newmenu.html
- [x] **Maicha - Nepalese Restaurant** (Burwood, NSW) · 905 rev · ✓ 74 items
    https://maicharestaurant.com.au/menu/
- [x] **Danphe** (Hobart, TAS) · 892 rev · ✓ 68 items
    https://danphenepalese.com.au/category/starters/
- [x] **Cafe Talk Kogarah** (Kogarah, NSW) · 888 rev · ✓ 57 items
    https://cafetalk.com.au/menu/
- [x] **Old Durbar Nepalese & Indian Restauran** (Brunswick, VIC) · 887 rev · ✓ 97 items
    https://old-durbar.com.au/our-cuisines/
- [x] **Tapari Momo** (Granville, NSW) · 869 rev · ✓ 118 items
    https://taparimomo.com.au/menu
- [x] **Falcha Rockdale** (Rockdale, NSW) · 867 rev · ✓ 101 items
    https://falcha.com.au/menu-rockdale/
- [x] **The Hungry Buddha | Nepalese & Indian ** (Belconnen, ACT) · 813 rev · ✓ 93 items
    https://thehungrybuddha.com.au/menu-1
- [x] **Momo Central Brunswick** (Brunswick, VIC) · 787 rev · ✓ 49 items
    https://momocentralbrunswick.shop/menu
- [x] **Aagaman Indian Nepalese Restaurant: Po** (Port Melbourne, VIC) · 756 rev · ✓ 74 items
    https://aagamanrestaurant.com.au/menu.html
- [x] **Chulho Town Hall** (Sydney, NSW) · 743 rev · ✓ 132 items
    https://www.chulho.com.au/menu
- [ ] **Indus Curry Express - Authentic Indian** (Geebung, QLD) · 735 rev
    https://induscurryexpress.com/menus
- [x] **Aagaman Indian Nepalese Restaurant: Me** (Melbourne, VIC) · 723 rev · ✓ 76 items
    https://aagamanrestaurant.com.au/menu.html
- [x] **Third Eye Rooftop Restaurant & Functio** (Banksia, NSW) · 721 rev · ✓ 75 items
    https://thirdeyerockdale.com.au/restaurant-menu/
- [x] **Jery Solti rockdale** (Rockdale, NSW) · 703 rev · ✓ 63 items
    https://jerrysoltirockdale.com.au/menu/
- [x] **Tinkune Momo & Sekuwa House** (Sunshine, VIC) · 698 rev · ✓ 49 items
    http://tinkune.com.au/order-now
- [x] **Momo Central Bourke street** (Melbourne, VIC) · 671 rev · ✓ 27 items
    https://momocentral.com.au/menus/
- [x] **Heshela Newa Khaja Ghar Hurstville** (Hurstville, NSW) · 655 rev · ✓ 95 items
    https://restaurant.heshela.com.au/table-menu/
- [x] **Baithak Restaurant** (Kogarah, NSW) · 636 rev · ✓ 164 items
    https://baithakrestaurant.com.au/menu-2/
- [x] **Kathmandu Newa Chhe'n** (Paddington, QLD) · 612 rev · ✓ 87 items
    http://www.kathmandunewa.com.au/menu
- [x] **Momo Station** (Melbourne, VIC) · 586 rev · ✓ 65 items
    https://momostation.com.au/menu-2/
- [x] **BHOYE CHHEN** (Edwardstown, SA) · 553 rev · ✓ 120 items
    https://bhoyechhen.com.au/menu
- [ ] **Spice Town** (Inglewood, WA) · 537 rev
    https://spicetown.tuckerfox.com.au/menu
- [x] **Ayla Bar & Restaurant** (Melbourne, VIC) · 531 rev · ✓ 45 items
    https://aylamelbourne.com/menu/
- [x] **Chulesi Sydney** (Auburn, NSW) · 521 rev · ✓ 64 items
    https://chulesi.com.au/#menu
- [x] **HAMRO NEPALI KITCHEN** (Karawara, WA) · 507 rev · ✓ 59 items
    http://hamronepalikitchen.com/menu
- [x] **Galli Kitchen** (Coburg, VIC) · 501 rev · ✓ 79 items
    https://www.gallikitchen.com.au/s/order
- [x] **Mad Momos** (Glenroy, VIC) · 499 rev · ✓ 48 items
    https://madmomos.com.au/store/mad-momos
- [x] **Spicy Momo & Bar** (Lutwyche, QLD) · 498 rev · ✓ 76 items
    https://spicymomohouse.com/menu/
- [ ] **Everest BBQ** (Rockdale, NSW) · 497 rev
    https://everestbbq.yumbojumbo.com.au/menu
- [x] **Falcha Penshurst** (Penshurst, NSW) · 462 rev · ✓ 139 items
    https://falcha.com.au/menu-penshurst/
- [x] **Muskan Bar and Kitchen** (Morningside, QLD) · 448 rev · ✓ 21 items
    https://muskanbarandkitchenonline.com.au/
- [ ] **Kalapani Nepalese Restaurant Town hall** (Sydney, NSW) · 438 rev
    https://kalapaninepalesecbd.yumbojumbo.com.au/menu
- [x] **MOMO CHAA CRAIGIEBURN** (Craigieburn, VIC) · 426 rev · ✓ 16 items
    https://momochaacraigieburn.com.au/
- [x] **Sukuti Ghar** (Granville, NSW) · 418 rev · ✓ 26 items
    https://sukutighar.com.au/menu/
- [ ] **PANS ON FIRE** (Werribee, VIC) · 415 rev
    https://pansonfire.yumbojumbo.com.au/menu
- [x] **Yogi's Way** (Stuart Park, NT) · 414 rev · ✓ 23 items
    https://yogisways.com/yogis-way-menu/
- [x] **Momo Ghar Oii Oii Oii** (Hoppers Crossing, VIC) · 413 rev · ✓ 53 items
    https://www.momoghar.com.au/home#menu
- [ ] **De Bhatti** (Mount Lawley, WA) · 409 rev
    https://bhatti.com.au/menus/
- [x] **Old Durbar Nepalese & Indian Restauran** (Nunawading, VIC) · 406 rev · ✓ 116 items
    https://old-durbar.com.au/our-cuisines/
- [x] **Tasmandu "A Taste of Nepal"** (Newstead, TAS) · 406 rev · ✓ 49 items
    https://www.tasmandu.com.au/menu
- [x] **MoMoCha Nepalese & Indian Restaurant** (Strathfield, NSW) · 404 rev · ✓ 91 items
    https://momocha.com.au/menu/
- [x] **Himali Gurkha Nepalese Restaurant** (Ardross, WA) · 404 rev · ✓ 59 items
    https://himaligurkha.com/menu/
- [x] **Saffron Mordialloc** (Mordialloc, VIC) · 370 rev · ✓ 43 items
    https://saffronindianonline.com.au/
- [x] **Rolling Flavors** (Subiaco, WA) · 370 rev · ✓ 81 items
    https://www.rollingflavors.com.au/menu
- [x] **Namaste Kitchen** (South Perth, WA) · 365 rev · ✓ 138 items
    https://namastekitchen.com.au/our-menus/
- [x] **The Momo's & More Cafe & Restaurant** (Claremont, WA) · 352 rev · ✓ 35 items
    https://themomoandmore.com.au/
- [x] **Lah Bros Windsor | Modern Nepalese Res** (Windsor, VIC) · 352 rev · ✓ 44 items
    https://www.lahbros.com.au/eat
- [ ] **Crimson and Blue** (Millswood, SA) · 351 rev
    https://crimsonandblue.com.au/our-menu/
- [x] **Nepal Dining Room** (Malvern East, VIC) · 348 rev · ✓ 49 items
    https://nepaldiningroom.com.au/dine-in-menu/
- [x] **Everest Eatery - Indian & Nepalese Cui** (Hobart, TAS) · 346 rev · ✓ 55 items
    http://everesteatery.com.au/our-menu/
- [x] **The Summit - Indian Nepalese Restauran** (South Wharf, VIC) · 343 rev · ✓ 106 items
    https://thesummitclub.com.au/
- [x] **Nepa Bliss Rosebud - Modern Indian And** (Rosebud, VIC) · 330 rev · ✓ 57 items
    https://rosebud.nepabliss.com.au/
- [x] **Mountain Gate Indian and Nepalese Rest** (Ferntree Gully, VIC) · 305 rev · ✓ 50 items
    https://mountaingateindiannnepalese.com.au/order-now
- [ ] **Downtown MoMo** (Parramatta, NSW) · 298 rev
    https://downtownmomo.yumbojumbo.com.au/menu
- [x] **A1 Tandoori n Momo Restro Bar** (Sunshine, VIC) · 297 rev · ✓ 73 items
    https://a1tandoorimomorestrobar.com.au/menu/
- [x] **Nepa Bliss Narre Warren - Modern India** (Narre Warren, VIC) · 295 rev · ✓ 82 items
    https://narrewarren.nepabliss.com.au/
- [x] **Momo Ghar** (Glen Huntly, VIC) · 291 rev · ✓ 9 items
    https://momogharonline.com.au/
- [x] **Nepa kitchen** (Darwin City, NT) · 287 rev · ✓ 15 items
    https://nepakitchen.com.au/
- [x] **Khukuri Restaurant Melbourne** (Melbourne, VIC) · 287 rev · ✓ 87 items
    https://khukurirestaurant.com.au/menu/khukuri-melbourne
- [x] **Bhetghat Restaurant & Bar ( Nepalese R** (Preston, VIC) · 277 rev · ✓ 39 items
    https://bhetghat.com.au/
- [x] **The Kathmandu Cottage** (West Melbourne, VIC) · 276 rev · ✓ 68 items
    https://www.kathmanducottage.com.au/menu
- [x] **Real Mountain Nepalese and Indian Rest** (Glen Forrest, WA) · 276 rev · ✓ 96 items
    https://www.realmountainglenforrest.com.au/menu
- [x] **Mt.Everest Indian And Nepalese Restaur** (Hunters Hill, NSW) · 275 rev · ✓ 92 items
    https://mounteverestrestaurant.com.au/menu.php
- [x] **Himalayan Nepalese Restaurant and Cafe** (Mosman Park, WA) · 272 rev · ✓ 64 items
    https://himalayanrestaurant.com.au/menu
- [x] **Ghumti Kitchen** (Allawah, NSW) · 271 rev · ✓ 44 items
    https://ghumti.au/menu
- [x] **Base Camp** (Northcote, VIC) · 260 rev · ✓ 68 items
    http://www.basecamprestaurant.com.au/menu
- [x] **Deurali Restaurant** (Salisbury, SA) · 247 rev · ✓ 61 items
    https://deurali.com.au/our-menus/
- [x] **Cafe Talk Nepalese Restaurant - Hornsb** (Hornsby, NSW) · 247 rev · ✓ 59 items
    https://thecafetalk.com.au/our-menu/
- [x] **Everest Eats** (Clayton South, VIC) · 244 rev · ✓ 8 items
    https://everesteatsonline.com.au/menu
- [ ] **The momos** (Hornsby, NSW) · 240 rev
    https://themomos-hornsby.yumbojumbo.com.au/menu
- [x] **Gurkha's Fusion** (Maroochydore, QLD) · 237 rev · ✓ 60 items
    https://gurkhasfusion.com.au/menu/
- [ ] **Kantipur Indian Nepalese Restaurant & ** (Caulfield North, VIC) · 218 rev
    https://tapnorder.online/
- [x] **JHEER HOUSE | Gyros/Souvlaki/Kebab/Bur** (Rockdale, NSW) · 204 rev · ✓ 49 items
    https://jheerhouse.com.au/order-now/
- [x] **Crazy MoMo House** (Rockhampton, QLD) · 198 rev · ✓ 35 items
    https://crazymomohouse.com.au/
- [ ] **Nepal House Restaurant** (Greenacres, SA) · 196 rev
    https://ordereats.com.au/menu-nepal-house-restaurant#menu
- [x] **Food House Nepal** (Dee Why, NSW) · 195 rev · ✓ 26 items
    https://www.foodhousenepal.com.au/online-ordering
- [x] **MomOZ Vibes** (Strathfield, NSW) · 195 rev · ✓ 27 items
    https://momozvibesstrathfield.com.au/
- [x] **The Hungry Hiker Indian & Nepali Resta** (Tecoma, VIC) · 194 rev · ✓ 94 items
    https://www.thehungryhiker.com.au/menu.html
- [x] **Momo Star** (Werribee, VIC) · 193 rev · ✓ 26 items
    https://momostar.com.au/
- [x] **momo shop** (Hughesdale, VIC) · 190 rev · ✓ 24 items
    http://momoshop.com.au/
- [x] **Shasa Momo** (Granville, NSW) · 190 rev · ✓ 34 items
    https://shasamomo.com.au/menu/
- [x] **Kathmandu Banquet** (North Melbourne, VIC) · 188 rev · ✓ 28 items
    https://www.kathmandubanquet.com/menu
- [x] **Third Eye Windsor** (South Windsor, NSW) · 188 rev · ✓ 75 items
    https://thirdeyewindsor.com.au/restaurant-menu
- [ ] **Bhok Laagyo Franklin** (Franklin, ACT) · 178 rev
    https://bhoklaagyocanberra.com.au/menu/
- [x] **Nepali Food Mandala** (Dubbo, NSW) · 170 rev · ✓ 86 items
    http://www.nepalifoodmandala.com.au/menu
- [x] **Tasty Tibetan Treats** (Wagga Wagga, NSW) · 168 rev · ✓ 27 items
    https://tastytibetantreats.com.au/
- [x] **Losaa On Wheels** (Belconnen, ACT) · 162 rev · ✓ 17 items
    https://losaaonwheels.com.au/
- [ ] **Gorkha Palace** (Kallaroo, WA) · 161 rev
    https://gorkha-palace.tuckerfox.com.au/menu
- [ ] **Royal Durbar Restro** (Kogarah, NSW) · 157 rev
    https://royaldurbarrestro.yumbojumbo.com.au/menu
- [ ] **TIBETAN PEACE RESTAURANT** (Dee Why, NSW) · 152 rev
    https://tibetan-peace-restaurant.grubbio.com/menu
- [ ] **ChiyaHub** (Kogarah, NSW) · 148 rev
    https://www.chiyahub.com/menu
- [x] **Everest Tea House** (Hallett Cove, SA) · 137 rev · ✓ 32 items
    https://everestteahouseonline.com.au/
- [x] **Nepa Bliss - Warragul Modern Indian & ** (Warragul, VIC) · 134 rev · ✓ 62 items
    https://warragul.nepabliss.com.au/
- [x] **Falcha Wollongong** (Wollongong, NSW) · 132 rev · ✓ 23 items
    https://falcha.com.au/menu-wollogong/
- [ ] **Khaja** (Villawood, NSW) · 122 rev
    https://khaja.com.au/menu/
- [x] **FEWA KITCHEN** (Chippendale, NSW) · 112 rev · ✓ 99 items
    https://fewakitchen.wordpress.com/home/menu/
- [x] **Aagaman Indian Nepalese Restaurant: Ro** (Rosanna, VIC) · 109 rev · ✓ 76 items
    https://aagamanrestaurant.com.au/menu.html
- [x] **FÜDA : GLOBAL STREET BITES** (Darwin City, NT) · 106 rev · ✓ 44 items
    https://www.fuda.com.au/menu
- [x] **Tibetan Happy Momo** (Footscray, VIC) · 96 rev · ✓ 30 items
    https://tibetanhappymomo.com.au/
- [ ] **Amala Kitchen (Taste of Himalayan and ** (Subiaco, WA) · 95 rev
    https://www.amalakitchen.com.au/kids-menu
- [ ] **Newa Bhoye** (Craigieburn, VIC) · 91 rev
    https://newabhoye.com/fixed-menu/
- [ ] **Himalayan Hub** (Launceston, TAS) · 90 rev
    http://www.tresrestaurant.com.au/menu
- [x] **Newy MO:MO Chaa** (Hamilton, NSW) · 85 rev · ✓ 22 items
    http://newymomochaa.com.au/
- [x] **The Nepalese Corner ( Restaurant & Caf** (Coburg, VIC) · 82 rev · ✓ 31 items
    https://thenepalesecorner.com.au/our-menu
- [x] **Raato Ghar** (Granville, NSW) · 79 rev · ✓ 58 items
    https://raatoghar.com/menus/
- [x] **Newari kitchen** (Seven Hills, NSW) · 72 rev · ✓ 18 items
    https://newarikitchen.com.au/menus/
- [ ] **Avatar Indian & Nepalese Restaurant - ** (Bundoora, VIC) · 68 rev
    https://tapnorder.online
- [x] **KUTUMBA LOUNGE** (Unley, SA) · 66 rev · ✓ 51 items
    https://kutumbalounge.com.au/menu
- [x] **Momonbitez** (Oakleigh, VIC) · 66 rev · ✓ 33 items
    https://momonbitez.com.au/
- [ ] **Cafe Himalayan Brew Phillip** (Phillip, ACT) · 65 rev
    https://cafehimalayanbrew.com.au/menu
- [x] **Chulo on Wheels** (Mowbray, TAS) · 60 rev · ✓ 14 items
    http://chuloonwheels.com.au/
- [x] **Himalayan Food Corner** (Glenorchy, TAS) · 53 rev · ✓ 16 items
    https://himalayanfoodcorner.com.au/menus/
- [ ] **Silver Salver Restaurant and function ** (North Wollongong, NSW) · 39 rev
    https://www.silversalver.com.au/dine-menu.html
- [ ] **Rucira foods** (Burwood, NSW) · 31 rev
    https://rucira-foods.yumbojumbo.com.au/menu
- [x] **Tandoori Night Indian Nepalese Cuisine** (Crows Nest, NSW) · 0 rev · ✓ 65 items
    https://tandoorinight.com.au/foods/
- [x] **Himalayan Nepalese Restaurant & Cafe** (Mosman Park, WA) · 0 rev · ✓ 64 items
    https://www.himalayanrestaurant.com.au/menu

### C. Aggregators — last resort (bot-walled, marked-up prices) — 16/22 done
- [x] **8848 Momo House Forest Lake** (Forest Lake, QLD) · 856 rev · ✓ 43 items
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [x] **8848 Momo House** (Fortitude Valley, QLD) · 777 rev · ✓ 43 items
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [x] **8848 Momo House Goldcoast** (Surfers Paradise, QLD) · 761 rev · ✓ 43 items
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [x] **8848 Momo House Maroochydore (Sunshine** (Maroochydore, QLD) · 682 rev · ✓ 43 items
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [x] **8848 Momo House Mount Gravatt** (Upper Mount Gravatt, QLD) · 638 rev · ✓ 43 items
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [x] **8848 Momo House Melbourne** (Melbourne, VIC) · 626 rev · ✓ 43 items
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [x] **8848 Momo House Parramatta** (Parramatta, NSW) · 551 rev · ✓ 43 items
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [x] **8848 Momo House Nundah** (Nundah, QLD) · 406 rev · ✓ 43 items
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [ ] **Anu Kitchen and Catering Services** (Campsie, NSW) · 324 rev
    https://www.ubereats.com/au/store/anu-kitchen-and-catering-services/Ba9mOu-rSZWD7TUXrHauVQ
- [ ] **The Everest spice & curryhouse** (Toowoomba City, QLD) · 309 rev
    https://www.ubereats.com/au/store/everest-spice-indian-restaurant/EbObJ7FmQL-9HOFSnN2_Dg
- [x] **Durbar Cafe & Restaurant** (Kearneys Spring, QLD) · 304 rev · ✓ 75 items
    https://www.doordash.com/store/durbar-cafe-kearneys-spring-23546564/?utm_campaign=gpa
- [ ] **Laphing Central Broadmeadows** (Broadmeadows, VIC) · 291 rev
    https://www.ubereats.com/au/store/laphing-central/Z4Y_SY65XP2KnqJH5gSAQQ
- [ ] **Aaku Momo Moments** (Harris Park, NSW) · 258 rev
    https://bopple.app/14880
- [x] **8848 Momo House Rockhampton** (Rockhampton City, QLD) · 254 rev · ✓ 43 items
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [x] **8848 Momo House Mango hill** (Mango Hill, QLD) · 234 rev · ✓ 43 items
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [x] **8848 Momo House Springfield** (Springfield Lakes, QLD) · 228 rev · ✓ 43 items
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [ ] **Kathmandu Kitchen** (Kingscliff, NSW) · 220 rev
    https://www.menulog.com.au/restaurants-kathmandu-kitchen/menu
- [x] **8848 Momo House Warner** (Warner, QLD) · 201 rev · ✓ 43 items
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [x] **8848 Momo House Cairns** (Cairns City, QLD) · 184 rev · ✓ 43 items
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [x] **8848 Momo House Town Hall (Sydney)** (Sydney, NSW) · 170 rev · ✓ 43 items
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [ ] **Langhali Cafe & Restaurant** (Warrane, TAS) · 145 rev
    https://www.ubereats.com/au/store/langhali-cafe-%26-restaurant/HZet7ZjvSVSvtz7f1FqMfg?dini
- [x] **8848 Momo House Victoria Park (Perth)** (Victoria Park, WA) · 131 rev · ✓ 43 items
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw

---

<!-- ================= Part 2: was MENU-SEEDING.md ================= -->

# Menu-seeding queue (un-menued restaurants, by popularity)

Generated 2026-07-03. 293 remaining (144 seeded). Order: review_count desc, then rating.
Menus supplied manually - the [source] tag is just a hint.

| # | Reviews | Rating | Name | Suburb | State | Source hint | slug |
|---|---|---|---|---|---|---|---|
| 1 | 974 | 3.9 | Namaste Restaurant - Sydney | Sydney | NSW | own-domain | namaste-restaurant-sydney-sydney |
| 2 | 856 | 4.8 | 8848 Momo House Forest Lake | Forest Lake | QLD | aggregator | 8848-momo-house-forest-lake-forest-lake |
| 3 | 842 | 4.1 | Momo Bar Manly | Manly | NSW | own-domain | momo-bar-manly-manly |
| 4 | 787 | 4.5 | Momo Central Brunswick | Brunswick | VIC | own-domain | momo-central-brunswick |
| 5 | 786 | 3.3 | Namaste Strathfield(Nepali Indian Restaurant) | Strathfield | NSW | own-domain | namaste-strathfieldnepali-indian-restaurant-strathfield |
| 6 | 777 | 4.0 | 8848 Momo House | Fortitude Valley | QLD | aggregator | 8848-momo-house-fortitude-valley |
| 7 | 765 | 3.4 | Halal Ali Dine Inn & Take Away | Lakemba | NSW | no-source | halal-ali-dine-inn-take-away |
| 8 | 761 | 4.3 | 8848 Momo House Goldcoast | Surfers Paradise | QLD | aggregator | 8848-momo-house-goldcoast-surfers-paradise |
| 9 | 751 | 4.2 | AD's Kitchen@Catherine Field | Catherine Field | NSW | own-domain | ads-kitchencatherine-field-catherine-field |
| 10 | 738 | 4.0 | Momo Central Glenroy | Glenroy | VIC | no-source | momo-central-glenroy |
| 11 | 735 | 4.3 | Indus Curry Express - Authentic Indian & Nepalese Restaurant | Geebung | QLD | own-domain | indus-curry-express-authentic-indian-nepalese-restaurant-geebung |
| 12 | 734 | 4.6 | Himalayan Cafe | New Farm | QLD | no-source | himalayan-cafe-new-farm |
| 13 | 724 | 3.6 | The Muglan In Rockdale | Rockdale | NSW | no-source | the-muglan-in-rockdale-rockdale |
| 14 | 699 | 4.0 | Traboulsi Bakery | Lakemba | NSW | no-source | traboulsi-bakery |
| 15 | 684 | 4.9 | MOMO CHAA | Melbourne | VIC | no-source | momo-chaa |
| 16 | 682 | 4.4 | 8848 Momo House Maroochydore (Sunshine Coast) | Maroochydore | QLD | aggregator | 8848-momo-house-maroochydore-sunshine-coast-maroochydore |
| 17 | 667 | 4.3 | Melbourne Laphing Station Glenroy | Glenroy | VIC | no-source | melbourne-laphing-station-glenroy |
| 18 | 665 | 4.4 | Mirmire Nepali Taste- (Nepali and Indian cuisine) | Hobart | TAS | own-domain | mirmire-nepali-taste-nepali-and-indian-cuisine-hobart |
| 19 | 645 | 3.5 | Himalayan Fusion Restro And Bar | Auburn | NSW | own-ordering | himalayan-fusion-restro-and-bar-auburn |
| 20 | 639 | 4.6 | Laneway Dumplings and Momo | Sydney | NSW | own-domain | laneway-dumplings-and-momo-sydney |
| 21 | 638 | 4.4 | 8848 Momo House Mount Gravatt | Upper Mount Gravatt | QLD | aggregator | 8848-momo-house-mount-gravatt-upper-mount-gravatt |
| 22 | 637 | 4.3 | Chilli Everest on Collins | Melbourne | VIC | own-ordering | chilli-everest-on-collins |
| 23 | 629 | 4.7 | Mustang Palace Nepalese Restaurant | Coburg | VIC | own-domain | mustang-palace-nepalese-restaurant |
| 24 | 626 | 4.2 | 8848 Momo House Melbourne | Melbourne | VIC | aggregator | 8848-momo-house-melbourne |
| 25 | 616 | 3.4 | Mayalu Street Food - Hurstville | Hurstville | NSW | own-domain | mayalu-street-food-hurstville-hurstville |
| 26 | 593 | 3.9 | Majheri Restaurant | Strathfield | NSW | own-domain | majheri-restaurant-strathfield |
| 27 | 590 | 4.4 | Nepali Momo Harris Park | Harris Park | NSW | no-source | nepali-momo-harris-park-harris-park |
| 28 | 585 | 4.5 | Himalayan sukuti house | Auburn | NSW | no-source | himalayan-sukuti-house-auburn |
| 29 | 579 | 3.9 | Subhakamana Restaurant Rockdale | Rockdale | NSW | no-source | subhakamana-restaurant-rockdale-rockdale |
| 30 | 568 | 4.7 | STREET FLAVOURS Northumberland Road( halal) | Auburn | NSW | no-source | street-flavours-northumberland-road-halal-auburn |
| 31 | 560 | 4.4 | Magic Momo Kafe On Flinders | Melbourne | VIC | no-source | magic-momo-kafe-on-flinders |
| 32 | 555 | 4.5 | Rashmin Indian Nepalese Restaurant | Roseville | NSW | own-domain | rashmin-indian-nepalese-restaurant-roseville |
| 33 | 551 | 3.6 | 8848 Momo House Parramatta | Parramatta | NSW | aggregator | 8848-momo-house-parramatta-parramatta |
| 34 | 537 | 4.7 | Spice Town | Inglewood | WA | own-ordering | spice-town-inglewood |
| 35 | 532 | 4.5 | Kalapani Nepalese Restaurant- Ingleburn | Ingleburn | NSW | own-ordering | kalapani-nepalese-restaurant-ingleburn-ingleburn |
| 36 | 528 | 3.6 | Royal Bhatti MoMo | Parramatta | NSW | own-domain | royal-bhatti-momo-parramatta |
| 37 | 523 | 4.8 | Mithho Nepalese Cuisine | Lidcombe | NSW | own-ordering | mithho-nepalese-cuisine-lidcombe |
| 38 | 521 | 4.9 | The Hangout Cafe and Restaurant | Moonah | TAS | own-domain | the-hangout-cafe-and-restaurant-moonah |
| 39 | 521 | 4.8 | Chulesi Sydney | Auburn | NSW | aggregator | chulesi-sydney-auburn |
| 40 | 517 | 4.2 | Capital Laphing Ashfield | Ashfield | NSW | no-source | capital-laphing-ashfield-ashfield |
| 41 | 511 | 3.6 | Bota Corner | Parramatta | NSW | own-domain | bota-corner-parramatta |
| 42 | 509 | 4.2 | momo & chillies | Point Cook | VIC | own-ordering | momo-chillies |
| 43 | 504 | 4.4 | The Mustang Nepalese Restaurant & Bar | Farrer | ACT | no-source | the-mustang-nepalese-restaurant-bar-farrer |
| 44 | 497 | 3.8 | Everest BBQ | Rockdale | NSW | own-ordering | everest-bbq-rockdale |
| 45 | 487 | 4.1 | Tapari Tucker | Auburn | NSW | own-domain | tapari-tucker-auburn |
| 46 | 469 | 4.5 | Piro | Glenroy | VIC | no-source | piro |
| 47 | 464 | 4.2 | The Kathmandu Momo House Nepalese and Indian Cusines | Canberra | ACT | facebook | the-kathmandu-momo-house-nepalese-and-indian-cusines-canberra |
| 48 | 461 | 4.2 | The Chimney Nepalese Restaurant & Bar | Gungahlin | ACT | no-source | the-chimney-nepalese-restaurant-bar-gungahlin |
| 49 | 453 | 4.5 | Roxy Kitchen and Bar | Melbourne | VIC | no-source | roxy-kitchen-and-bar |
| 50 | 451 | 4.5 | Chulo Nepalese Perth | Dianella | WA | no-source | chulo-nepalese-perth-dianella |
| 51 | 445 | 4.3 | Chitwan Taas and Momo House | Auburn | NSW | no-source | chitwan-taas-and-momo-house-auburn |
| 52 | 444 | 3.8 | Mayalu Streetfoods Strathfield | Strathfield | NSW | own-domain | mayalu-streetfoods-strathfield-strathfield |
| 53 | 438 | 4.5 | Kalapani Nepalese Restaurant Town hall | Sydney | NSW | own-ordering | kalapani-nepalese-restaurant-town-hall-sydney |
| 54 | 433 | 4.3 | Flavours Favor | Coburg North | VIC | no-source | flavours-favor |
| 55 | 432 | 4.7 | Mount View Nepalese Resturant | Albury | NSW | own-domain | mount-view-nepalese-resturant |
| 56 | 423 | 4.2 | The Darbar | South Fremantle | WA | own-domain | the-darbar-south-fremantle |
| 57 | 415 | 4.4 | PANS ON FIRE | Werribee | VIC | own-ordering | pans-on-fire |
| 58 | 414 | 4.3 | The Himalaya Bites | Sydney | NSW | own-domain | the-himalaya-bites-sydney |
| 59 | 412 | 4.6 | Hamro Jamghat Nepalese Restaurant | Homebush | NSW | no-source | hamro-jamghat-nepalese-restaurant-homebush |
| 60 | 409 | 4.2 | De Bhatti | Mount Lawley | WA | own-domain | de-bhatti-mount-lawley |
| 61 | 408 | 4.4 | Chulesi Nepalese Resturant | Moonah | TAS | facebook | chulesi-nepalese-resturant-moonah |
| 62 | 406 | 4.5 | 8848 Momo House Nundah | Nundah | QLD | aggregator | 8848-momo-house-nundah |
| 63 | 406 | 4.0 | Thela Auburn Park | Auburn | NSW | no-source | thela-auburn-park-auburn |
| 64 | 401 | 4.3 | Taste of the Himalayas | Brighton | SA | own-domain | taste-of-the-himalayas-brighton |
| 65 | 396 | 4.6 | Chitwan Taas and Momo House West Ryde | West Ryde | NSW | own-domain | chitwan-taas-and-momo-house-west-ryde-west-ryde |
| 66 | 386 | 4.2 | The Bhatti Lounge | Fortitude Valley | QLD | own-domain | the-bhatti-lounge-fortitude-valley |
| 67 | 379 | 4.4 | Da vatti Nepalese Restaurant | Campbelltown | NSW | no-source | da-vatti-nepalese-restaurant-campbelltown |
| 68 | 368 | 4.4 | Turmeric: The Golden Touch | Liverpool | NSW | own-ordering | turmeric-the-golden-touch-liverpool |
| 69 | 365 | 3.9 | The Mango Tree | Dandenong | VIC | own-domain | the-mango-tree |
| 70 | 351 | 4.9 | Crimson and Blue | Millswood | SA | own-domain | crimson-and-blue-millswood |
| 71 | 351 | 4.4 | Naab Restaurant | Bedford | WA | facebook | naab-restaurant |
| 72 | 344 | 4.6 | Jans | Thornlie | WA | own-domain | jans |
| 73 | 334 | 4.0 | Mandi king Auburn | Auburn | NSW | no-source | mandi-king-auburn |
| 74 | 329 | 4.5 | Everest Function Centre | Rockdale | NSW | own-domain | everest-function-centre-rockdale |
| 75 | 329 | 3.9 | Thamel Chowk Restaurant and Bar | Glenroy | VIC | own-domain | thamel-chowk-restaurant-and-bar |
| 76 | 324 | 4.3 | Anu Kitchen and Catering Services | Campsie | NSW | aggregator | anu-kitchen-and-catering-services-campsie |
| 77 | 316 | 4.4 | RockSea House | Moonah | TAS | no-source | rocksea-house-moonah |
| 78 | 313 | 3.8 | Fresh Chulo | Glandore | SA | own-domain | fresh-chulo-glandore |
| 79 | 309 | 3.8 | The Everest spice & curryhouse | Toowoomba City | QLD | aggregator | the-everest-spice-curryhouse |
| 80 | 300 | 4.5 | Munchy Monk | Northbridge | WA | own-domain | munchy-monk |
| 81 | 298 | 4.7 | Downtown MoMo | Parramatta | NSW | own-ordering | downtown-momo-parramatta |
| 82 | 297 | 4.3 | Durbar Restaurant | Charlestown | NSW | own-domain | durbar-restaurant |
| 83 | 294 | 4.5 | MoMo cha | Harris Park | NSW | own-domain | momo-cha-harris-park |
| 84 | 293 | 4.3 | Yarcha Restaurant And Bar | Hurstville | NSW | no-source | yarcha-restaurant-and-bar-hurstville |
| 85 | 293 | 4.1 | Capital Laphing Canberra | Weston | ACT | own-domain | capital-laphing-canberra-weston |
| 86 | 292 | 4.4 | Elenika & Co | Malvern East | VIC | own-domain | elenika-co |
| 87 | 292 | 3.6 | Mountain Mantras | Bentley | WA | no-source | mountain-mantras-bentley |
| 88 | 291 | 4.8 | Laphing Central Broadmeadows | Broadmeadows | VIC | aggregator | laphing-central-broadmeadows |
| 89 | 285 | 4.7 | Friends & Momos Woden | Phillip | ACT | own-domain | friends-momos-woden |
| 90 | 285 | 4.2 | Chef Binas's Kitchen शेफ विनसको किचेन | Merrylands | NSW | own-ordering | chef-binass-kitchen-merrylands |
| 91 | 282 | 4.0 | Zakhang House of Cuisines | Applecross | WA | no-source | zakhang-house-of-cuisines |
| 92 | 279 | 4.5 | Sherpa Nepalese Restaurant | Launceston | TAS | own-domain | sherpa-nepalese-restaurant-launceston |
| 93 | 279 | 3.8 | Cafe Talk Campsie | Campsie | NSW | own-domain | cafe-talk-campsie-campsie |
| 94 | 268 | 4.3 | Momo's Hunt | Granville | NSW | no-source | momos-hunt-granville |
| 95 | 266 | 4.5 | Taste of Himalaya | Ashfield | NSW | own-domain | taste-of-himalaya-ashfield |
| 96 | 266 | 3.7 | Sunrise Indian and Nepalese Restaurant | Plympton | SA | no-source | sunrise-indian-and-nepalese-restaurant-plympton |
| 97 | 258 | 4.9 | Aaku Momo Moments | Harris Park | NSW | own-ordering | aaku-momo-moments |
| 98 | 258 | 3.2 | Mirchi Indian and Nepalese Restaurant | Kogarah | NSW | aggregator | mirchi-indian-and-nepalese-restaurant-kogarah |
| 99 | 254 | 4.6 | 8848 Momo House Rockhampton | Rockhampton City | QLD | aggregator | 8848-momo-house-rockhampton |
| 100 | 248 | 4.9 | Momo Hungers | Maroochydore | QLD | no-source | momo-hungers |
| 101 | 248 | 4.1 | Shubhakamana Restaurant Strathfield | Strathfield | NSW | no-source | shubhakamana-restaurant-strathfield-strathfield |
| 102 | 247 | 3.4 | Bajeko sekuwa ( Himalayan Grill) | Melbourne | VIC | no-source | bajeko-sekuwa-himalayan-grill |
| 103 | 241 | 3.9 | MoMo Vibe Ashfield (Food Truck) | Ashfield | NSW | no-source | momo-vibe-ashfield-food-truck-ashfield |
| 104 | 240 | 4.2 | The momos | Hornsby | NSW | own-ordering | the-momos |
| 105 | 238 | 4.1 | Malaysia House Restaurant | Mount Gambier | SA | facebook | malaysia-house-restaurant |
| 106 | 234 | 3.7 | 8848 Momo House Mango hill | Mango Hill | QLD | aggregator | 8848-momo-house-mango-hill |
| 107 | 231 | 4.6 | IL FALCO | Mount Hawthorn | WA | own-domain | il-falco |
| 108 | 229 | 4.8 | momo me (CLOSED TILL FURTHER NOTICE ) | Rockdale | NSW | no-source | momo-me-closed-till-further-notice |
| 109 | 228 | 4.7 | Mantra Khaja Ghar | Strathfield | NSW | no-source | mantra-khaja-ghar |
| 110 | 228 | 4.5 | 8848 Momo House Springfield | Springfield Lakes | QLD | aggregator | 8848-momo-house-springfield-springfield-lakes |
| 111 | 227 | 4.7 | The Druk Family Restaurant | Mawson | ACT | no-source | the-druk-family-restaurant-mawson |
| 112 | 226 | 4.8 | Green Cabin Food Truck | Cranbourne | VIC | no-source | green-cabin-food-truck |
| 113 | 220 | 4.4 | Kathmandu Kitchen | Kingscliff | NSW | aggregator | kathmandu-kitchen |
| 114 | 220 | 2.9 | Mt Everest Mo:mo , Tarneit | Tarneit | VIC | own-ordering | mt-everest-momo-tarneit |
| 115 | 219 | 4.6 | spicyheaven | North Ward | QLD | facebook | spicyheaven |
| 116 | 218 | 4.3 | Nepalese Accent | Gosford | NSW | facebook | nepalese-accent-gosford |
| 117 | 218 | 3.7 | Kantipur Indian Nepalese Restaurant & Bar | Caulfield North | VIC | own-ordering | kantipur-indian-nepalese-restaurant-bar |
| 118 | 214 | 4.6 | Cardamom Restaurant | Marrickville | NSW | no-source | cardamom-restaurant |
| 119 | 209 | 4.8 | Lutfiye’s Cafe | Shepparton | VIC | no-source | lutfiyes-cafe |
| 120 | 209 | 4.6 | Early Bird Xpresso (nepalese food truck) | Belconnen | ACT | own-domain | early-bird-xpresso-nepalese-food-truck-belconnen |
| 121 | 209 | 4.1 | Gurkhas Himalayan Nepalese Restaurant | Cairns City | QLD | no-source | gurkhas-himalayan-nepalese-restaurant |
| 122 | 208 | 4.8 | Tibet Momo Kitchen Byo | Fortitude Valley | QLD | own-domain | tibet-momo-kitchen-byo-fortitude-valley |
| 123 | 207 | 4.5 | Spiced Up Indian & Nepalese | Mill Park | VIC | own-ordering | spiced-up-indian-nepalese |
| 124 | 206 | 4.3 | 9 Meal Cafe and Nepalese Restaurant | Coburg | VIC | own-domain | 9-meal-cafe-and-nepalese-restaurant |
| 125 | 201 | 4.6 | 8848 Momo House Warner | Warner | QLD | aggregator | 8848-momo-house-warner |
| 126 | 199 | 4.6 | Smokey Loft by Mountain Mantras | Osborne Park | WA | no-source | smokey-loft-by-mountain-mantras |
| 127 | 199 | 3.5 | Coffee House Auburn | Auburn | NSW | facebook | coffee-house-auburn-auburn |
| 128 | 196 | 4.8 | Sarangi Kitchen and Bar | Granville | NSW | own-domain | sarangi-kitchen-and-bar-granville |
| 129 | 196 | 4.3 | Nepal House Restaurant | Greenacres | SA | own-ordering | nepal-house-restaurant-greenacres |
| 130 | 194 | 4.8 | Nepal Ghar | Hurstville | NSW | own-domain | nepal-ghar-hurstville |
| 131 | 193 | 4.8 | Sekuwa House | Cooks Hill | NSW | own-domain | sekuwa-house-cooks-hill |
| 132 | 184 | 4.0 | 8848 Momo House Cairns | Cairns City | QLD | aggregator | 8848-momo-house-cairns |
| 133 | 182 | 5.0 | Dumpling(Momo) and burger bites | East Corrimal | NSW | own-domain | dumplingmomoand-burger-bites |
| 134 | 181 | 4.0 | Manakamana Grocery Store | Auburn | NSW | no-source | manakamana-grocery-store-auburn |
| 135 | 179 | 4.2 | Kinmel on Wheels Lidcombe | Lidcombe | NSW | no-source | kinmel-on-wheels-lidcombe-lidcombe |
| 136 | 178 | 4.8 | Bhok Laagyo Franklin | Franklin | ACT | own-domain | bhok-laagyo-franklin-franklin |
| 137 | 176 | 4.7 | Dhaka Topi Khaja Ghar | Kogarah | NSW | own-ordering | dhaka-topi-khaja-ghar-kogarah |
| 138 | 175 | 3.6 | Bajeko Sekuwa (The Himalayan Grill and Bar) | Merrylands | NSW | own-domain | bajeko-sekuwa-the-himalayan-grill-and-bar-merrylands |
| 139 | 172 | 4.4 | The Momos hub Burwood | Burwood | NSW | own-domain | the-momos-hub-burwood-burwood |
| 140 | 171 | 4.4 | MOMO Square | Holroyd | NSW | no-source | momo-square-holroyd |
| 141 | 171 | 2.8 | Namaste Restaurant Hurstville | Hurstville | NSW | own-domain | namaste-restaurant-hurstville-hurstville |
| 142 | 170 | 4.3 | 8848 Momo House Town Hall (Sydney) | Sydney | NSW | aggregator | 8848-momo-house-town-hall-sydney-sydney |
| 143 | 168 | 4.8 | SILAUTO NEPALESE RESTAURANT | Subiaco | WA | own-domain | silauto-nepalese-restaurant |
| 144 | 167 | 5.0 | Slice Station | Pakenham | VIC | own-domain | slice-station |
| 145 | 165 | 4.8 | Hoodie and Foodie | Greenway | ACT | own-domain | hoodie-and-foodie-greenway |
| 146 | 162 | 4.8 | Tibet Stove | Fremantle | WA | no-source | tibet-stove |
| 147 | 161 | 4.6 | Gorkha Palace | Kallaroo | WA | own-ordering | gorkha-palace-kallaroo |
| 148 | 157 | 4.1 | Delicious Momo House | Homebush West | NSW | own-domain | delicious-momo-house-homebush-west |
| 149 | 157 | 4.0 | Momochha | Auburn | NSW | no-source | momochha-auburn |
| 150 | 157 | 3.9 | Royal Durbar Restro | Kogarah | NSW | own-ordering | royal-durbar-restro |
| 151 | 152 | 4.9 | TIBETAN PEACE RESTAURANT | Dee Why | NSW | own-ordering | tibetan-peace-restaurant-dee-why |
| 152 | 152 | 4.4 | Hungry Eye | Summer Hill | NSW | no-source | hungry-eye-summer-hill |
| 153 | 148 | 4.3 | ChiyaHub | Kogarah | NSW | own-domain | chiyahub |
| 154 | 147 | 4.9 | Nepalese Nomad & Co | Gungahlin | ACT | facebook | nepalese-nomad-co-gungahlin |
| 155 | 147 | 4.8 | MOMO@Penrith | Penrith | NSW | no-source | momopenrith |
| 156 | 146 | 5.0 | Pasa Ya Kitchen | Footscray | VIC | own-domain | pasa-ya-kitchen |
| 157 | 146 | 4.4 | A Spoonful of Sauce | Bundaberg Central | QLD | no-source | a-spoonful-of-sauce |
| 158 | 145 | 4.8 | Langhali Cafe & Restaurant | Warrane | TAS | aggregator | langhali-cafe-restaurant-warrane |
| 159 | 142 | 5.0 | Momo Cartel | Springvale | VIC | own-domain | momo-cartel |
| 160 | 138 | 4.9 | Sekuwa Sansar | Morphettville | SA | own-domain | sekuwa-sansar-morphettville |
| 161 | 135 | 4.8 | Early Bird Nepalese Restaurant | Braddon | ACT | no-source | early-bird-nepalese-restaurant-braddon |
| 162 | 133 | 4.7 | Bhok & Bhojan | Kogarah | NSW | no-source | bhok-bhojan-kogarah |
| 163 | 133 | 4.3 | Cherry Blossom | Aitkenvale | QLD | no-source | cherry-blossom |
| 164 | 131 | 3.8 | 8848 Momo House Victoria Park (Perth) | Victoria Park | WA | aggregator | 8848-momo-house-victoria-park-perth |
| 165 | 130 | 4.2 | THE NEPALESE JOINT | Dee Why | NSW | own-domain | the-nepalese-joint-dee-why |
| 166 | 129 | 4.8 | Ram Dai Ko Food Truck | Crestwood | NSW | no-source | ram-dai-ko-food-truck-crestwood |
| 167 | 129 | 4.7 | Yak & Yeti Cafe and Restaurant | Merrylands | NSW | own-domain | yak-yeti-cafe-and-restaurant |
| 168 | 129 | 4.5 | Thul Dai Khaja Ghar | Auburn | NSW | no-source | thul-dai-khaja-ghar-auburn |
| 169 | 129 | 3.9 | Yatri food truck | Auburn | NSW | own-domain | yatri-food-truck-auburn |
| 170 | 127 | 4.5 | Desi Momo | Morley | WA | no-source | desi-momo |
| 171 | 126 | 4.4 | Galli Bites | Salisbury | SA | no-source | galli-bites |
| 172 | 125 | 4.5 | Light Of Asia Bundaberg | Bundaberg Central | QLD | own-domain | light-of-asia-bundaberg |
| 173 | 122 | 4.9 | Khaja | Villawood | NSW | own-domain | khaja-villawood |
| 174 | 119 | 4.8 | Mitho Mitho | Homebush | NSW | own-domain | mitho-mitho |
| 175 | 117 | 4.6 | Palate Food & Drink | Burnie | TAS | facebook | palate-food-drink |
| 176 | 116 | 4.3 | Momo gadi | Nundah | QLD | own-domain | momo-gadi-nundah |
| 177 | 115 | 3.8 | Mt. Everest MO:MO, Werribee | Werribee | VIC | no-source | mt-everest-momo-werribee |
| 178 | 114 | 4.7 | Cafe Dharma | Boulder | WA | own-ordering | cafe-dharma |
| 179 | 114 | 4.3 | Momo Foods Lidcombe | Lidcombe | NSW | no-source | momo-foods-lidcombe-lidcombe |
| 180 | 113 | 4.8 | Sukunda Werribee | Werribee | VIC | no-source | sukunda-werribee |
| 181 | 113 | 4.8 | The Monkey Temple | Belconnen | ACT | own-domain | the-monkey-temple-belconnen |
| 182 | 111 | 4.0 | Himalifood | Hurstville | NSW | no-source | himalifood-hurstville |
| 183 | 111 | 4.0 | Li’l TEN’S Cafe | Perth | WA | no-source | lil-tens-cafe |
| 184 | 102 | 3.8 | Eat and Joy | Osborne Park | WA | no-source | eat-and-joy |
| 185 | 101 | 4.8 | Emoji Momoz | Thornlie | WA | no-source | emoji-momoz |
| 186 | 100 | 4.3 | New Tapari | Clyde | NSW | own-ordering | new-tapari-clyde |
| 187 | 99 | 4.5 | THE MOMO POT | Belconnen | ACT | own-domain | the-momo-pot-belconnen |
| 188 | 97 | 4.8 | Friends & Momos Gungahlin | Gungahlin | ACT | own-domain | friends-momos-gungahlin-gungahlin |
| 189 | 97 | 4.5 | MoMoMandoo | Belmont | WA | no-source | momomandoo-belmont |
| 190 | 97 | 4.1 | MOMO MATES CITY | Adelaide | SA | own-domain | momo-mates-city-adelaide |
| 191 | 95 | 4.9 | Amala Kitchen (Taste of Himalayan and beyond) | Subiaco | WA | own-domain | amala-kitchen-taste-of-himalayan-and-beyond |
| 192 | 92 | 4.5 | Moss Black Cafe/Druk Fusion | Jolimont | WA | own-domain | moss-black-cafedruk-fusion |
| 193 | 91 | 5.0 | Newa Bhoye | Craigieburn | VIC | own-domain | newa-bhoye |
| 194 | 90 | 4.5 | Himalayan Hub | Launceston | TAS | own-domain | himalayan-hub-launceston |
| 195 | 90 | 4.4 | Momo's on the Wheels | Reservoir | VIC | own-domain | momos-on-the-wheels |
| 196 | 88 | 4.7 | Langtang Lounge | Ballarat Central | VIC | own-domain | langtang-lounge |
| 197 | 88 | 4.4 | FUSION FLAMES | Innaloo | WA | own-domain | fusion-flames |
| 198 | 86 | 4.7 | The Potala Kitchen | Glenroy | VIC | facebook | the-potala-kitchen |
| 199 | 85 | 4.9 | Dharan Sekuwa Corner | Granville | NSW | no-source | dharan-sekuwa-corner |
| 200 | 85 | 4.8 | Rajmati Food Truck Momo Blacktown near me | Blacktown | NSW | own-domain | rajmati-food-truck-momo-blacktown-near-me |
| 201 | 84 | 4.5 | Sydney Momo Junction Nepalese restaurant | Liverpool | NSW | own-domain | sydney-momo-junction-nepalese-restaurant-liverpool |
| 202 | 77 | 4.6 | Kathmandu Momos Melbourne | Cranbourne | VIC | no-source | kathmandu-momos-melbourne |
| 203 | 75 | 3.5 | The Junktion street food | Auburn | NSW | no-source | the-junktion-street-food-auburn |
| 204 | 74 | 4.4 | Mustang Palace Lalor | Lalor | VIC | facebook | mustang-palace-lalor |
| 205 | 72 | 3.8 | Danphe Nepalese and Indian Food Claremont | Claremont | TAS | own-domain | danphe-nepalese-and-indian-food-claremont-claremont |
| 206 | 71 | 3.8 | Khaja Junction | Allawah | NSW | no-source | khaja-junction-allawah |
| 207 | 69 | 4.9 | Maniac Kitchen | Glenroy | VIC | no-source | maniac-kitchen |
| 208 | 68 | 5.0 | Avatar Indian & Nepalese Restaurant - Bundoora | Bundoora | VIC | own-ordering | avatar-indian-nepalese-restaurant-bundoora |
| 209 | 68 | 4.4 | Himalayan Curry House | Panania | NSW | own-domain | himalayan-curry-house |
| 210 | 65 | 4.8 | Sukunda Craigieburn | Craigieburn | VIC | own-domain | sukunda-craigieburn |
| 211 | 65 | 4.8 | Cafe Himalayan Brew Phillip | Phillip | ACT | own-domain | cafe-himalayan-brew-phillip |
| 212 | 65 | 4.6 | Momo Villas | Glenroy | VIC | own-domain | momo-villas |
| 213 | 64 | 2.9 | Mirchi Indian and Nepalese Restaurant Rockdale plaza | Rockdale | NSW | own-domain | mirchi-indian-and-nepalese-restaurant-rockdale-plaza |
| 214 | 63 | 4.6 | Momos Taste of Tibet | Greenway | ACT | own-domain | momos-taste-of-tibet-greenway |
| 215 | 63 | 4.6 | Dazzu Auburn | Auburn | NSW | no-source | dazzu-auburn |
| 216 | 61 | 4.5 | MOMO PALACE | Clayton South | VIC | no-source | momo-palace |
| 217 | 59 | 4.8 | The Thakali Lounge and Bar | Gungahlin | ACT | no-source | the-thakali-lounge-and-bar-gungahlin |
| 218 | 57 | 4.8 | Swa-ad Nepalese Food Truck | Coburg | VIC | own-domain | swa-ad-nepalese-food-truck |
| 219 | 57 | 4.2 | Momo Centre | Applecross | WA | facebook | momo-centre-applecross |
| 220 | 56 | 4.5 | Thela Momo | Best Nepali Momos in Brisbane | Top Food Cart in Brisbane | Zillmere | QLD | own-ordering | thela-momo-best-nepali-momos-in-brisbane-top-food-cart-in-brisbane-zillmere |
| 221 | 56 | 4.1 | Himalayan Fusion Hub | Balcatta | WA | no-source | himalayan-fusion-hub |
| 222 | 53 | 4.6 | Dumplings & MoMo House | Surry Hills | NSW | own-domain | dumplings-momo-house-surry-hills |
| 223 | 53 | 4.3 | YAK & YETI Cullen Bay | Larrakeyah | NT | no-source | yak-yeti-cullen-bay-larrakeyah |
| 224 | 52 | 5.0 | Midnight Tipsy | Perth | WA | aggregator | midnight-tipsy |
| 225 | 51 | 4.9 | Momomex | Wentworthville | NSW | no-source | momomex-wentworthville |
| 226 | 50 | 5.0 | Momo Pasa: | Hurstville | NSW | own-domain | momo-pasa-hurstville |
| 227 | 49 | 4.8 | Port Spices - South Indian, Indian, Nepalese & All Asian Groceries | Port Macquarie | NSW | no-source | port-spices-south-indian-indian-nepalese-all-asian-groceries |
| 228 | 48 | 4.6 | Jerry Nepali Momo & Food | Wyong | NSW | no-source | jerry-nepali-momo-food-wyong |
| 229 | 47 | 3.6 | Nepali Treats | Bentley | WA | no-source | nepali-treats |
| 230 | 45 | 4.8 | DARJEELING MOMO HOUSE | Glenroy | VIC | no-source | darjeeling-momo-house |
| 231 | 45 | 4.0 | Darpan On Wheels | Burwood | NSW | no-source | darpan-on-wheels |
| 232 | 44 | 4.4 | Bhurbhure Momo ( Healthy Feather and Fin) | Rockdale | NSW | own-domain | bhurbhure-momo-healthy-feather-and-fin-rockdale |
| 233 | 43 | 4.9 | Nepalese Momo House / Gemini | Phillip | ACT | no-source | nepalese-momo-house-gemini-phillip |
| 234 | 42 | 2.7 | Auburn Khaja Ghar | Auburn | NSW | no-source | auburn-khaja-ghar |
| 235 | 41 | 4.9 | Momo Pasa: | Brighton-Le-Sands | NSW | no-source | momo-pasa |
| 236 | 41 | 4.0 | STREET FLAVOURS Parramatta Road | Auburn | NSW | no-source | street-flavours-parramatta-road |
| 237 | 39 | 5.0 | Didi’s Recipe | Parklea | NSW | facebook | didis-recipe-parklea |
| 238 | 39 | 4.8 | Xito Mitho Fast Food Ashfield | Ashfield | NSW | no-source | xito-mitho-fast-food-ashfield-ashfield |
| 239 | 39 | 4.7 | Silver Salver Restaurant and function Center - Best Restaurant in Wollongong | North Wollongong | NSW | own-domain | silver-salver-restaurant-and-function-center-best-restaurant-in-wollongong |
| 240 | 39 | 2.4 | Chautari Restaurant | Auburn | NSW | own-domain | chautari-restaurant-auburn |
| 241 | 38 | 4.9 | The Pahad And Plate | Ravenhall | VIC | no-source | the-pahad-and-plate |
| 242 | 38 | 4.4 | Yeti Kitchen | Queanbeyan East | NSW | no-source | yeti-kitchen-queanbeyan-east |
| 243 | 38 | 3.6 | Batika Restaurant & Garden Bar | Auburn | NSW | own-domain | batika-restaurant-garden-bar |
| 244 | 37 | 4.9 | Nepal Ghar Restaurant & Bar | Hurstville | NSW | own-ordering | nepal-ghar-restaurant-bar-hurstville |
| 245 | 37 | 4.1 | The Annapurna Restraunt | Sydney | NSW | no-source | the-annapurna-restraunt-sydney |
| 246 | 36 | 5.0 | The Pasaz Kitchen | Queanbeyan East | NSW | own-domain | the-pasaz-kitchen-queanbeyan-east |
| 247 | 36 | 5.0 | Chautari Momo Hub & Cafe | Cardiff | NSW | no-source | chautari-momo-hub-cafe |
| 248 | 34 | 4.8 | Spicy Paradise Clayton | Clayton South | VIC | own-domain | spicy-paradise-clayton |
| 249 | 33 | 4.9 | Mo:Mo Kazzi | Auburn | NSW | no-source | momo-kazzi |
| 250 | 33 | 4.5 | OM MOMO | Carseldine | QLD | no-source | om-momo-carseldine |
| 251 | 31 | 4.8 | Rucira foods | Burwood | NSW | own-ordering | rucira-foods-burwood |
| 252 | 31 | 4.6 | Lekali Momo | Morley | WA | no-source | lekali-momo-morley |
| 253 | 31 | 4.1 | Hakus Thela | Auburn | NSW | no-source | hakus-thela |
| 254 | 29 | 4.7 | Spice Route | Lidcombe | NSW | own-domain | spice-route |
| 255 | 29 | 3.3 | DADA DI ( CITY KEBAB) | Darwin City | NT | no-source | dada-di-city-kebab |
| 256 | 28 | 5.0 | Taste of Nepal-Momo's & More | Minto | NSW | no-source | taste-of-nepal-momos-more-minto |
| 257 | 28 | 4.9 | Soul Marry Savour | Hobart | TAS | no-source | soul-marry-savour-hobart |
| 258 | 27 | 4.0 | Xito Mitho Fast Food | Rockdale | NSW | no-source | xito-mitho-fast-food-rockdale |
| 259 | 26 | 4.7 | Little Sherpa | Westminster | WA | no-source | little-sherpa-westminster |
| 260 | 25 | 5.0 | 365 Momo Hub | Parramatta | NSW | own-domain | 365-momo-hub |
| 261 | 23 | 5.0 | Namaste express food truck | Ardeer | VIC | own-domain | namaste-express-food-truck |
| 262 | 23 | 5.0 | Hoodie and Foodie Sydney Nepali | Liverpool | NSW | no-source | hoodie-and-foodie-sydney-nepali-liverpool |
| 263 | 20 | 4.9 | The Tibetan momos Nepalese restaurant | Harris Park | NSW | no-source | the-tibetan-momos-nepalese-restaurant-harris-park |
| 264 | 20 | 4.5 | Gumbah tapari | Maroochydore | QLD | no-source | gumbah-tapari-maroochydore |
| 265 | 20 | 4.2 | Nepali Eatery | Hurstville | NSW | no-source | nepali-eatery-hurstville |
| 266 | 19 | 5.0 | Mirchi Melbourne | Broadmeadows | VIC | no-source | mirchi-melbourne |
| 267 | 19 | 4.8 | Mithu Burgers & Biceps | North Parramatta | NSW | own-domain | mithu-burgers-biceps |
| 268 | 18 | 4.9 | Lekali Street Food | Edgeworth | NSW | no-source | lekali-street-food |
| 269 | 18 | 4.7 | The Nepalese Kitchen | Strathfield | NSW | no-source | the-nepalese-kitchen-strathfield |
| 270 | 18 | 4.7 | Healthy Feather and Fin | Rockdale | NSW | own-ordering | healthy-feather-and-fin |
| 271 | 17 | 5.0 | JOJOLAPA - JHIGU PASAH | Geraldton | WA | facebook | jojolapa-jhigu-pasah |
| 272 | 17 | 4.2 | Melbourne Laphing Station Coburg | Coburg | VIC | no-source | melbourne-laphing-station-coburg |
| 273 | 16 | 4.3 | Sakri Crunch | Derwent Park | TAS | no-source | sakri-crunch-derwent-park |
| 274 | 15 | 5.0 | Namaste Bites | Werribee | VIC | own-ordering | namaste-bites |
| 275 | 14 | 4.9 | Muchhad Nukkad Food Truck - Indo-Nepalese Street Food in Sydney | Lidcombe | NSW | own-domain | muchhad-nukkad-food-truck-indo-nepalese-street-food-in-sydney-lidcombe |
| 276 | 14 | 4.9 | Khwopa Food And Catering | Kearneys Spring | QLD | no-source | khwopa-food-and-catering |
| 277 | 9 | 5.0 | Nepali khaja ghar (Cafe de Haus) | Hurstville | NSW | no-source | nepali-khaja-ghar-cafe-de-haus-hurstville |
| 278 | 7 | 5.0 | Carkey's Cafe & Nepalese Food | Blacktown | NSW | no-source | carkeys-cafe-nepalese-food |
| 279 | 7 | 4.9 | Chitwan Tass and Momo House | Auburn | NSW | no-source | chitwan-tass-and-momo-house |
| 280 | 6 | 3.7 | Newari Khaja Ghar | Rockdale | NSW | no-source | newari-khaja-ghar |
| 281 | 5 | 4.6 | HIMALAYAN FOODS AND GROCERY / OZ Star | Wollongong | NSW | no-source | himalayan-foods-and-grocery-oz-star |
| 282 | 4 | 5.0 | Whyalla MoMo House | Whyalla Norrie | SA | no-source | whyalla-momo-house |
| 283 | 4 | 5.0 | Timmur Symphony | Fannie Bay | NT | no-source | timmur-symphony |
| 284 | 4 | 4.0 | Kathmandu momos-Clayton | Clayton South | VIC | own-domain | kathmandu-momos-clayton |
| 285 | 3 | 5.0 | Himalayan Street Foods | Rockdale | NSW | no-source | himalayan-street-foods |
| 286 | 2 | 4.0 | VietBest Pty Ltd | Geelong | VIC | no-source | vietbest-pty-ltd |
| 287 | 1 | 5.0 | AAMA FOODS ROCKDALE | Rockdale | NSW | own-domain | aama-foods-rockdale |
| 288 | 1 | 5.0 | Gill&Glow Nepali food | East Point | NT | facebook | gillglow-nepali-food |
| 289 | 1 | 5.0 | Mp Bar And Restaurant | Kalgoorlie | WA | no-source | mp-bar-and-restaurant |
| 290 | 0 | - | Authentic Nepalese Cuisine | Brighton | SA | no-source | authentic-nepalese-cuisine-brighton |
| 291 | 0 | - | Thela group of companies | Auburn | NSW | no-source | thela-group-of-companies |
| 292 | 0 | - | Kathmandu Restro Modern Nepalese Cuisine | Merrylands | NSW | no-source | kathmandu-restro-modern-nepalese-cuisine-merrylands |
| 293 | 0 | - | Namaste express food | Craigieburn | VIC | no-source | namaste-express-food |

---

<!-- ================= Part 3: was MENU-SEEDING.md ================= -->

# Plan: covering the remaining un-menued restaurants

Status at 2026-07-02: **135 / ~440 visible restaurants have menus** (8,756 items). The
easily-seedable pool (own-site PDFs, own-site HTML menu pages, own-domain ordering menus
with *published* prices) is **exhausted**. This doc is the plan for the ~300 that remain.

## The remaining pool (visible, `menu_item_count IS NULL`) ≈ 304

| Bucket | Count | What it is |
|--------|-------|-----------|
| **No source** | ~125 | No `website` and no `menu_url` on record at all |
| **Own domain, not a clean menu** | ~115 | Has an own domain, but it's an ordering-widget (prices load only after picking location/time), a marketing teaser, a Wix/social page with no menu, or the long tail we haven't hand-probed |
| **Own white-label ordering platform** | ~25 | `yumbojumbo` / `tuckerfox` / `square.site` / `foodhub` / `posapt` etc. on their own account |
| **Aggregator only** | ~24 | Uber Eats / DoorDash / Menulog is the only source (marked-up, bot-walled) |
| **Facebook-only** | ~15 | Only web presence is a Facebook page |

These are ordered below by **value-per-effort**. Each needs a capability we don't have in
the current text/render pipeline; that's why they're left.

---

## Approach 1 — LLM vision on menu IMAGES (unlocks the most, esp. "no source")

The biggest bucket (125 no-source + many own-domain) fails because there is no
*machine-readable* menu, but there almost always is a **menu photo**: on the Google
Business Profile, on Facebook, or as an image/PDF on their own site. We already OCR
image-only PDFs via `menu-fetch.js` (pdftoppm → read). Extend that to arbitrary images.

- **Google Places Photos API** — pull the photos for each place (we already store
  `google_place_id`). Many businesses upload a menu board / printed-menu photo. Filter to
  likely-menu images (aspect ratio, lots of text via a cheap OCR pass), then transcribe
  with the same vision flow we use for scanned PDFs. ⚠️ Places Photos is a **paid per-fetch
  SKU** — budget it, and it has display/caching licensing limits (see CLAUDE.md), but
  fetching for one-off transcription (not redisplay) is the lower-risk use.
- **Facebook page photos** (the 15 FB-only + others) — the "Menu" album or timeline photos
  are usually the menu. Manual/download + vision transcribe.
- **Owner-supplied** — the `/add-a-spot` + claim flow (post-launch) should let owners upload
  a menu photo/PDF that routes straight into this vision pipeline.

Value: **high** (only realistic path for the 125 no-source). Effort: medium (build the
image-fetch + vision-extract step; wire a review/dry-run like `seed-menu.js`).

## Approach 2 — Drive the ordering widgets (own white-label + own-domain widget)

~25 own-platform + a chunk of the 115 own-domain are white-label ordering apps
(foodbooking, posapt, nextorder, tapnorder, restaurantongo, Square) where prices only
appear **after** selecting a pickup location/time in the cart. Our render bailed at <20
price tokens.

- Extend the Playwright step to **complete the location/pickup selection** (click the store,
  choose "Pickup", dismiss modals) before scraping — then the full priced menu renders.
  Per-vendor selectors, but there are only ~6 vendors, so ~6 small handlers cover most.
- Skepticism rule still applies: these are online-order prices. Seed them but consider a
  `price_source='ordering'` (already used) so we can caveat "online-order pricing" in the UI.

Value: medium-high (recovers many 300-review spots: taste-of-the-himalayas, the-everest-spice,
thamel-chowk, kantipur, aaku-momo, etc.). Effort: medium (per-vendor Playwright handlers).

## Approach 3 — Aggregator scrape, clearly flagged (24 aggregator-only)

For spots whose ONLY source is Uber/DoorDash/Menulog. Currently skipped because (a) prices
are marked up and (b) bot-walled.

- Scrape via Playwright + the existing Webshare proxies + asset-blocking (same trick that
  works for Google). Uber Eats returns JSON in the page state; parse that rather than DOM.
- Store with a distinct `menu_source='aggregator'` and a **markup caveat** so the UI can
  label prices "via delivery app (may be higher than dine-in)". This is a product decision:
  approximate prices + full dish coverage vs. no menu at all.

Value: medium (fills a real gap for delivery-only brands). Effort: medium; **needs your
call** on whether marked-up prices are acceptable to display with a caveat.

## Approach 4 — Discover a source for the "no source" rows (125)

Many no-source rows just never got a website scraped. Before vision (Approach 1), try to
*find* a source:

- **Places API `websiteUri`** — re-pull; some now have a site since the original scrape.
- **Google search** `"<name> <suburb> menu"` → often surfaces an own site / ordering page /
  a menu PDF we can then run through the normal pipeline.
- Cross-check socials (IG/FB linktree) for an ordering link.
- What's left after that is genuinely "call them / wait for the claim flow."

Value: medium (feeds Approaches 1-2). Effort: low-medium (mostly re-running enrichment).

## Approach 5 — Partial-seed completion (small, already-seeded)

A few seeded rows are **partial** because the ordering platform lazy-loaded and some
sections didn't render: `the-momos-more`, `mountain-gate`, `nepa-kitchen` (momo section
missing), `everest-tea-house`. Approach 2's location-selection fix would let us re-render
and complete these. Low volume, quick wins once Approach 2 exists.

---

## Recommended sequence

1. **Approach 2** first (highest yield for lowest new capability — 6 vendor handlers on the
   render we already have; recovers ~30-50 mid/high-review spots + completes the partials).
2. **Approach 4** (cheap re-enrichment) to refresh `websiteUri` and find sources, feeding 1 & 2.
3. **Approach 1** (vision on images) — the strategic unlock for the 125 no-source; also the
   engine the claim/owner-upload flow will reuse.
4. **Approach 3** (aggregator, flagged) — only if you decide marked-up prices are OK to show.

## Explicitly leave alone
- Non-Nepali leaks (pizza/Thai/Korean/Vietnamese/South-Indian) — see `MENU-SEEDING.md`
  sections L & O; reclassify/hide, don't seed.
- Dead / parked / cert-broken domains — recheck only if the business relaunches.
- Catering-only sites — `catering=true` is set; no à-la-carte menu to seed.

---

<!-- ================= Part 4: was MENU-SEEDING.md ================= -->

# Unseeded restaurants whose `menu_url` / `website` is NOT a usable own-site menu

These rows LOOK seedable (they have a `menu_url` and/or `website` in the DB, so they
show up in the worklist as "ownpage"/"aggregator"), but the URL is actually a
third-party ordering platform, not the restaurant's own website. Per the worker rule
(source the menu from the restaurant's OWN website only; ignore ordering/delivery
platforms because their menus are marked-up / a subset), these cannot be seeded from
the stored URL. Left UNSEEDED until a real own-site menu is found.

Scan date: 2026-07-02. Filter: `menu_item_count IS NULL` and not permanently closed.

## A. `website` field is a third-party ordering platform (no own domain on file) — SKIP

The restaurant's stored "website" is itself the platform storefront, so there is no own
site to fetch. Would need to hunt for a real domain (Google/socials) or skip entirely.

| # | Name | Suburb | State | Platform host |
|---|------|--------|-------|---------------|
| 199 | Spice Town | Inglewood | WA | spicetown.tuckerfox.com.au |
| 9 | Chulesi Sydney | Auburn | NSW | order.store |
| 92 | Everest BBQ | Rockdale | NSW | everestbbq.yumbojumbo.com.au |
| 12 | Kalapani Nepalese Restaurant Town Hall | Sydney | NSW | kalapaninepalesecbd.yumbojumbo.com.au |
| 558 | PANS ON FIRE | Werribee | VIC | pansonfire.yumbojumbo.com.au |
| 15 | Downtown MoMo | Parramatta | NSW | downtownmomo.yumbojumbo.com.au |
| 437 | The momos | Hornsby | NSW | themomos-hornsby.yumbojumbo.com.au |
| 215 | Nepal House Restaurant | Greenacres | SA | ordereats.com.au |
| 208 | Gorkha Palace | Kallaroo | WA | gorkha-palace.tuckerfox.com.au |
| 346 | Royal Durbar Restro | Kogarah | NSW | royaldurbarrestro.my-order.online (menu_url: yumbojumbo) |
| 125 | Rucira foods | Burwood | NSW | rucira-foods.yumbojumbo.com.au |
| 883 | Midnight Tipsy | Perth | WA | order.store |

## B. Only lead is a platform `menu_url`, no `website` at all — SKIP

| # | Name | Suburb | State | Platform host |
|---|------|--------|-------|---------------|
| 100 | TIBETAN PEACE RESTAURANT | Dee Why | NSW | tibetan-peace-restaurant.grubbio.com |

## C. `square.site` (Square Online ordering storefront) — SKIP (skeptical)

`square.site` is a Square **Online ordering** storefront. Even though it is the
restaurant's own Square account (not a third-party aggregator markup), it is still an
**online-order-specific menu + prices**, which can be a subset or carry online-order
pricing rather than the true dine-in menu. Per the rule "anywhere there's a chance of
an online-order-specific menu + prices, be skeptical," treat these as SKIP too. Seed
only if a genuine dine-in menu (own `/menu` page, PDF, or in-store menu image) turns up.

| # | Name | Suburb | State | Store |
|---|------|--------|-------|-------|
| 918 | Cafe Dharma | Boulder | WA | https://cafedharma.square.site/ |
| 175 | Thela Momo | Zillmere | QLD | https://thelamomo.square.site/ |
| 557 | Namaste Bites | Werribee | VIC | https://namaste-bites.square.site/ |
| 137 | Momo Bar Manly | Manly | NSW | http://www.momo.bar/ — Square **Online ordering** storefront on custom domain (`/s/order`, `app.squareup.com` gift cards). 842 rev. Franchise QSR (Dumplings/Poke Bowls/Nepalese Favourites); only web presence is the Square online-order menu (pickup, loyalty, gift cards), no dine-in/printed menu. Per the square skepticism rule → SKIP. Recheck if a real dine-in menu/PDF turns up. |

## D. No source at all (neither website nor menu_url) — separate problem, not "thought we had it"

Noting for completeness (encountered this session): these have NOTHING to fetch, so
they were never really "seedable" and need a source discovered first.

| # | Name | Suburb | State |
|---|------|--------|-------|
| 6 | Hamro Jamghat Nepalese Restaurant | Homebush | NSW |

## E. Own-domain `/menu` page exists but is an UNPOPULATED template — SKIP (no content to transcribe)

The `menu_url` is genuinely the restaurant's own website (own domain, not a platform),
but the menu page itself has no menu content published: the section tabs render, but no
items and zero prices appear even after full Playwright render + clicking each tab. There
is nothing to transcribe.

| # | Name | Suburb | State | Own-site menu page | Note |
|---|------|--------|-------|--------------------|------|
| 403 | Lankan Railway Cafe | Mortdale | NSW | https://lankanrailwaycafemortdale.com.au/menu.html | **DELETED from DB 2026-07-02** (not Nepali — a **Sri Lankan** cafe mis-flagged `cuisine=Nepalese`). Menu page was also an empty template (tabs blank, 0 prices). Row + 1 photo removed. |

## F. Own site shows only a marketing TEASER, no full priced menu — SKIP (would falsely mark "done")

The own-domain page renders a small "popular items" teaser (a handful of dishes, usually
no prices) with an explicit "Request Full Menu" call to action — the real menu is not
published online. Seeding the teaser would set `menu_item_count` and mark the row done,
blocking a proper seed later. Leave unseeded until a full menu (PDF / real `/menu` page /
in-store photos) turns up.

| # | Name | Suburb | State | Own site | Note |
|---|------|--------|-------|----------|------|
| 973 | YUVI KITCHEN | Burnie | TAS | https://www.yuvikitchen.com/ | **DELETED from DB 2026-07-02** (not Nepali — fast-food burger/wraps/fries/shakes spot, only momos are Nepali). Own site was a 4-item teaser with no prices anyway. Row + 3 photos removed. |
| 571 | The Hungry Hiker Indian & Nepali Restaurant | Tecoma | VIC | https://www.thehungryhiker.com.au/menu.html | 194 rev. Own-site menu links to a PDF (`/menus/2026 website menu.pdf`) that is a **degustation-selection teaser**: one price ($75 per guest set, min 2), plus a handful of dish descriptions with NO à-la-carte prices. PDF header: "The menu presented here offers a SELECTION … Our FULL menu includes additional specialties … available in restaurant." Not a full priced menu. Recheck if a full priced à-la-carte menu/PDF turns up. |
| 504 | Momo Central Brunswick | Brunswick | VIC | https://momocentralbrunswick.shop/menu | Own thin marketing site (not a platform/cart). `/menu` renders only a 3-item "Vegan Snacks" teaser (Fried Bhatmas A$9.95, Waiwai Sadheko A$10.95, Piro Aalu A$10.95) even after full Playwright JS render; the prose names momos, momo platter, thakali khana set, chatpatey, shyabhaley, pressure-cooker momo but none are priced/listed. 787 reviews — high value, recheck if they publish a full menu (or in-store photos). |
| 276 | Bhok Laagyo Franklin | Franklin | ACT | https://bhoklaagyocanberra.com.au/menu/ | 178 rev. Own domain (WordPress + WooCommerce), but plain fetch 403s and full Playwright render shows only a 4-item teaser with NO prices (Chicken Momos, Buffalo Chowmein, Jhol Laphing, Pani Puri). `/order-online/` (own domain) is an empty/placeholder WooCommerce shop ("Uncategorized", "hhh", no products, no prices). No real priced menu published. Recheck if they populate the shop or publish a full menu/PDF/in-store photos. |
| 341 | ChiyaHub | Kogarah | NSW | https://www.chiyahub.com/menu | 148 rev. Own-domain Nepalese tea café site; the `/menu` page re-renders the marketing homepage with ZERO prices even after full Playwright JS render. Explicit banner "Check our wall menu for daily deals!" = the real menu is an in-store WALL menu, not published online. Prose names snacks (momo, samosa, sel-roti, aloo anda chana, samosa chat) and teas (masala chiya, ginger max chiya, lassis) but nothing priced. Recheck if they publish a priced menu / in-store photos. |
| ALL | 8848 Momo House (whole chain) | Fortitude Valley + 7 others | QLD/NSW/VIC/WA | https://www.8848momos.com.au/ | ~777 rev flagship (8+ branches share this site, all `menu_url` = ubereats). Own site's `/new-menu/` + `/oriental-fusion-restaurant-menu/` publish only **3D promo mockup renders** (folded-brochure / stacked-booklet images — `mockup_menu3-1.png`, `menu.png`), NOT a legible flat priced menu; 0 prices anywhere on the site ("NEW MENU NOW AVAILABLE INSTORE!"). "ORDER ONLINE" → `order8848momohouse.com.au` (white-label online-ordering storefront, online-order pricing). No readable dine-in menu. Recheck if they publish a flat menu image/PDF. Affects all branches: Fortitude Valley, Gold Coast/Surfers, Maroochydore, Mount Gravatt, Melbourne, Parramatta, + others. |

## G. Self-hosted white-label ORDERING storefront (own domain/subdomain, but online-order menu/prices) — SKIP

Same rule as section C (`square.site`): the URL is on the restaurant's own domain, but the
page is a white-label **online-ordering** app (pre-order / pickup / delivery cart, vouchers,
loyalty) whose prices are online-order pricing, not the true dine-in menu. Skepticism rule
applies → SKIP. Vendor is identifiable from the JS bundle host.

> ⚠️ Reconcile against `MENU-SEEDING.md` before re-attempting: a few rows
> below were LATER judged seedable (own-account ordering menu with restaurant-set
> prices, marked `price_source: "website"`) and are now seeded — e.g. Galli
> Kitchen (79 items), Mad Momos (48), Momo Chaa Craigieburn (16), Muskan (21).
> The DB (`menu_item_count`) is the source of truth for what's done.

| # | Name | Suburb | State | URL | Vendor / note |
|---|------|--------|-------|-----|---------------|
| 570 | Tastish | Dandenong | VIC | http://menu.tastish.com.au/ | **DELETED from DB 2026-07-02** (not Nepali — labelled **INDIAN** in-app: samosa/pakora/paneer/chaat/kebab/naan, no momo/thakali). Menu was also a nextorder.co ordering storefront (assets.nextorder.co) on own subdomain. Row removed. |
| 301 | Laneway Dumplings and Momo | Sydney | NSW | https://lanewaydumplingsandmomosydney.com.au/ | 639 rev. Own domain, but the whole site is a **Foodhub** white-label online-ordering storefront (`foodhubforbusiness.com` / `foodhubaus.com/sydney/laneway-dumplings-and-momo/ordernow`, own iOS/Android app). Menu = online-order-only (dumplings/buns/momo/value deals with online-order pricing), no dine-in menu. Per the online-order skepticism rule → SKIP. Recheck if a dine-in menu/PDF turns up. |
| 506 | Mustang Palace Nepalese Restaurant | Coburg | VIC | https://mustangpalace.com.au/ | 629 rev. Own domain, but the whole site is a **Foodhub** white-label online-ordering storefront (`/order-now/...` with item IDs; JS/bundle hosts `assets.foodhub.com` + `foodhub.co.uk` + `public.touch2success.com`; Delivery/Pickup/Group Order + checkout.com/Apple/Google Pay). Menu = online-order-only pricing, no separate dine-in menu. Per the online-order skepticism rule → SKIP. Recheck if a dine-in menu/PDF/in-store photos turn up. |
| 90 | Mayalu Street Food | Hurstville | NSW | http://mayalu.com.au/ (order → https://mayalu.com.au/order/) | 616 rev. Own domain, but the only menu is a **JotForm** online-order form embedded at `/order/` (iframe `form.jotform.com/242341752782458`). Items are gated behind a required date/time + order-type + branch step (multi-step form, online-order pricing); no static published dine-in menu anywhere on the site. Two-brand setup (Toast n Grind breakfast + Mayalu Street Food dinner, Strathfield + Hurstville branches). Per the online-order skepticism rule → SKIP. Recheck if a static dine-in menu / PDF / in-store photos turn up. |
| 76 | Mayalu Streetfoods Strathfield | Strathfield | NSW | https://mayalu.com.au/ (order → /order/) | 444 rev. Same shared `mayalu.com.au` site as #90 (Strathfield branch of the same two-brand group). Only menu is the **JotForm + Stripe** online-order form at `/order/` (hosts `form.jotform.com`, `cdn.jotfor.ms`, `js.stripe.com`); 0 static prices, no published dine-in menu. Per the online-order skepticism rule → SKIP. |
| 240 | The Hangout Cafe and Restaurant | Moonah | TAS | https://thehangoutrestaurant.com.au/ | 521 rev. Own domain, but the whole site is a **Foodhub** white-label online-ordering storefront (`/order-now/...`; bundle hosts `assets.foodhub.com` + `foodhub.co.uk` + `public.touch2success.com` + checkout.com). Cafe/takeaway categories (breakfast, burgers, wraps, sandwiches, plates) at online-order pricing, no separate dine-in menu. Same template as #506 Mustang Palace. Per the online-order skepticism rule → SKIP. |
| 522 | Mad Momos | Glenroy | VIC | https://madmomos.com.au/store/mad-momos | 499 rev. Own domain but `/store/` is a white-label **online-ordering** app (cart, PickUp/Schedule, Stripe checkout; S3/CloudFront assets). Full momo/chowmein menu but online-order pricing only. Per the online-order skepticism rule → SKIP. |
| 641 | Momo Chaa | Craigieburn | VIC | https://momochaacraigieburn.com.au/ | 426 rev. **Foodhub** white-label ordering (`assets.foodhub.com` / `public.touch2success.com`); whole site is the online-order storefront, no static menu. → SKIP. |
| 481 | Mount View Nepalese Restaurant | (VIC) | VIC | https://mountviewnepaleserestaurant.com.au/ | 432 rev. **Foodhub** white-label ordering (`assets.foodhub.com` / `public.touch2success.com`); online-order-only, no static menu. → SKIP. |
| 180 | Muskan Bar and Kitchen | Morningside | QLD | https://muskanbarandkitchenonline.com.au/ | 448 rev. **Foodhub** white-label ordering (`assets.foodhub.com` / `public.touch2success.com`); online-order-only, no static menu. → SKIP. |
| 492 | Galli Kitchen | (—) | — | https://www.gallikitchen.com.au/s/order | 501 rev. Menu is a **Square** online-ordering storefront (`/s/order`). Per the square skepticism rule (same as square.site) → SKIP. |
| 172 | Rashmin Indian Nepalese Restaurant | Roseville | NSW | https://rashminrosevillerestaurant.com.au/ | 555 rev. Indian/Nepalese **takeaway**; own domain but "MENU & Order" opens a **Foodbooking / GloriaFood** online-ordering widget (`foodbooking.com` / `fbgcdn.com`), no static published menu. Online-order-only. Per the online-order skepticism rule → SKIP. Recheck if a static dine-in menu / PDF turns up. |
| 66 | The Himalaya Bites | Sydney | NSW | https://thehimalayabites.com.au/ | 414 rev. **Foodhub** white-label ordering (`assets.foodhub.com` / `public.touch2success.com` / checkout.com); online-order-only, no static menu. → SKIP. **Tell:** the `<title>` "… Takeaway in <street> | Order Food Online" + a JS-rendered empty shell is the Foodhub "native site" template — same as #506 Mustang Palace, #240 The Hangout, #481 Mount View, #641 Momo Chaa, #180 Muskan; can be skipped on the title alone. |

---

### How this list was built (repeat any time)

Scan `restaurants WHERE menu_item_count IS NULL` and flag rows whose `menu_url`/`website`
host matches a platform: `ubereats`, `doordash`, `menulog`, `deliveroo`, `hungrypanda`,
`order.store`, `order.online`, `my-order.online`, `yumbojumbo`, `tuckerfox`, `tapnorder`,
`grubbio`, `ordereats`, `bopple`, `mryum`, `wowapps`, `hungryhungry`, `gloriafood`, `oddle`,
`square.site`, `spotapps`, `hungrytiger`, `nextorder` (`assets.nextorder.co`).

Note: white-label ordering apps (e.g. `nextorder.co`) are often hosted on the restaurant's
OWN subdomain (e.g. `menu.<restaurant>.com.au`), so check the JS bundle host, not just the
page domain — an own-domain URL can still be an online-ordering storefront.

Rule of thumb: **if the URL is an online-order storefront (online-order-specific menu +
prices), be skeptical and skip** — this includes `square.site` (own Square account, but
still an ordering menu) and own-subdomain white-label ordering apps. Only a true dine-in
source (own-domain `/menu` page, PDF, or in-store menu image) counts as seedable.

## H. `website` is an AI-generated review MICROSITE (brila.ai etc.), no menu/prices — SKIP

The stored `website` is a `*.brila.ai` (or similar) auto-generated marketing microsite
built from the restaurant's Google reviews: a single SEO landing page that lists dish
NAMES pulled from review quotes but has NO menu structure and NO prices. "Order Online"
just links to Google Maps / Google search, not an own-site menu. Nothing priced to
transcribe. Recheck if the restaurant later publishes a real menu (PDF / own `/menu`).

| # | Name | Suburb | State | Microsite | Note |
|---|------|--------|-------|-----------|------|
| 266 | Canberra Momo House | Gungahlin | ACT | https://canberra-momo-house.brila.ai/ | 1148 rev (high value). Page lists dishes (momos steamed/fried/jhol, khana sets, goat taas, sekuwa, dhido, laphing, syaphalek, chatpate, pani puri, thukpa) from review quotes but zero prices; "Order Online" → Google Maps only. Recheck for a real menu later. |

## I. Own-domain website is an UNCONFIGURED SERVER PLACEHOLDER (no site built) — SKIP

The `website` is the restaurant's own domain, but nothing is deployed: it serves a default
web-server landing page ("Caddy works!" / nginx / Apache default), not a real site. No menu,
no content, `/menu` 404s too. Nothing to transcribe until they actually build the site.

| # | Name | Suburb | State | Own domain | Note |
|---|------|--------|-------|-----------|------|
| 5 | Yummy Laphing | Granville | NSW | http://www.yummylaphing.au/ | Default **Caddy** placeholder ("Caddy works! Congratulations!"); http+https root and `/menu` all zero menu content. 1782 reviews — high value, recheck if they launch a real site. |

## J. Only online source is a CATERING-PACKAGES site (no dine-in priced menu) — SKIP (set `catering=true`)

The restaurant's own web presence publishes only event/catering **packages** (choose-a-package,
per-head or per-event), not an à-la-carte dine-in menu with per-item prices. Per the "skip
catering flyers/packages" rule, don't seed these as a priced menu; set `catering=true` instead
and recheck if a real dine-in menu (own `/menu` page, PDF, or in-store photos) turns up.

| # | Name | Suburb | State | Source | Note |
|---|------|--------|-------|--------|------|
| 32 | Mul Chowk Kitchen Sydney | Campsie | NSW | https://mccatering.com.au/menu | 995 reviews. Own site `mulchowkkitchen.com.au` links ONLY to `mccatering.com.au/menu` ("MC Catering Services … A Joint Venture of Mul Chowk Kitchen"), a JS-rendered **catering menu-packages** site (Sydney + Canberra branches), no à-la-carte dine-in prices. `catering=true` set. Recheck for a dine-in menu later. |
| 51 | Namaste Restaurant Sydney | Sydney | NSW | https://namasterestro.com.au/ | 974 rev. Shared site for Namaste Strathfield/Ashfield/Sydney/Hurstville, but it's a broken "Wayback Machine Downloader free demo" page (incomplete site); only menu link is "View Home Catering Menu". No à-la-carte dine-in menu/prices. Same domain backs the Strathfield/Ashfield rows. Recheck if they restore a real site. |
| 44 | Namaste Strathfield (Nepali Indian Restaurant) | Strathfield | NSW | https://namasterestro.com.au/catering/ | 786 rev. Same shared `namasterestro.com.au` site as id 51. Homepage's only menu link is "View Home Catering Menu" → `/catering/` = catering **packages** (Package A $29 / B $31 / C $36 per person, min 20 people, pickup only), no à-la-carte dine-in prices. Per-branch page `/namaste-strathfield/` returns Cloudflare 522 (origin down). `catering=true` set 2026-07-02. Sibling **namaste-restaurant-ashfield-ashfield** (731 rev) is the same site → also catering-only. |
| 62 | Khaja | Villawood | NSW | https://khaja.com.au/menu/ | 122 rev. Own domain, but the business is a **Nepali catering service** ("launched in 2021 … to fulfill the needs of the Nepali Catering Service in Australia"); the `/menu` page renders no à-la-carte items (About + Contact + "Get a Quote" + empty WooCommerce cart only) even after full Playwright render. No dine-in priced menu published. `catering=true` set 2026-07-02. Recheck if they publish a real menu. |
| 72 | Everest Function Centre | Rockdale | NSW | http://www.everesttandoori.com.au/ (local `media/menus/72.pdf` = same file as `menu_url` PDF, md5-identical) | 329 rev. The last §A "PDF" row, checked 2026-07-05: the 13-page PDF is a **price-less function-package selection menu** (bubble-chart dish clouds per category: VEGETARIANS / CHICKEN / RED MEAT / CHUTNI & ACHAR / SWEETS; notes about Catering, "DJ \| Decoration \| Mandap \| Fireworks"; zero prices on any page, verified by rasterizing all 13). `menu.html` on the site only adds Silver/Gold-style veg + non-veg **package course lists** (`svm1/snvm1/gvm/...jpg`, "chose one" per course, no prices) and a "Make your own party menu" button. No à-la-carte dine-in priced menu anywhere. **`catering=true` PENDING** (UPDATE blocked awaiting Abhishesh's go, 2026-07-05). Recheck if they publish a priced menu. |

## K. Own domain has EXPIRED / is PARKED (registrar landing page) — SKIP

The stored `website`/`menu_url` is the restaurant's own domain, but the domain has
lapsed and now serves a registrar parking page (GoDaddy "expired and is parked free" /
domain-for-sale). No site, no menu, `/menus` too. Nothing to transcribe until (if) they
renew and rebuild. Distinct from section I (server-default placeholder on a live domain).

| # | Name | Suburb | State | Own domain | Note |
|---|------|--------|-------|-----------|------|
| 183 | Indus Curry Express - Authentic Indian & Nepalese Restaurant | Geebung | QLD | https://induscurryexpress.com/menus | 735 reviews. Domain **expired, parked on GoDaddy** ("has expired and is parked free"); both `website` (`induscurryexpress.com`) and `menu_url` (`/menus`) serve the parking page. High value — recheck if they renew the domain and republish. |
| 238 | Mirmire Nepali Taste (Nepali and Indian cuisine) | Hobart | TAS | http://www.mirmire-nepalitaste.com.au/ | 665 reviews. Domain is **DEAD — DNS SERVFAIL** on apex + www from both Google (8.8.8.8) and Cloudflare (1.1.1.1); does not resolve at all (no parking page even). `menu_url` NULL. No site to fetch. High value — needs a live source (new domain / socials / in-store photos) discovered before it can be seeded. |
| 23 | Majheri Restaurant | Strathfield | NSW | https://majheri.com.au/ | 593 reviews. Domain is **DEAD — NXDOMAIN** (apex + www don't exist per Google 8.8.8.8); domain lapsed/unregistered, no site at all. `menu_url` NULL. High value — needs a live source (new domain / socials / in-store photos) discovered before it can be seeded. |
| 39 | Bota Corner | Parramatta | NSW | https://botacorner.com.au/ | 511 reviews. Domain is **DEAD — no DNS A record** (`dig` returns empty on both Google 8.8.8.8 and Cloudflare 1.1.1.1; Playwright `ERR_NAME_NOT_RESOLVED`), 2026-07-02. `menu_url` NULL. High value — needs a live source (new domain / socials / in-store photos) before it can be seeded. |
| 212 | Royal Bhatti MoMo | Parramatta | NSW | http://royalbhatti.com/ | 528 reviews. Domain is a **"Domain for Sale" parking page** (lapsed, listed for sale — "Contact us for more information"); no site, no menu. `menu_url` NULL. High value — recheck if they register a real domain / publish a menu elsewhere. |
| 120 | Tapari Tucker | Auburn | NSW | http://taparitucker.com.au/ | 487 reviews. Domain **parked on GoDaddy** ("is parked free, courtesy of GoDaddy.com" / "Get This Domain"); serves a domain-parking lander (only a Trustpilot widget iframe), no site/menu. `menu_url` NULL. High value — recheck if they rebuild the domain / publish a menu elsewhere. |

## L. Not Nepali — MIS-FLAGGED cuisine — DELETED from DB

Own-domain site confirms a DIFFERENT cuisine; the row was wrongly `cuisine='Nepalese'`.
Deleted like sections E/F/G (Lankan Railway / Yuvi / Tastish) after Abhishesh's explicit go.

| # | Name | Suburb | State | Own site | Evidence | Disposition |
|---|------|--------|-------|----------|----------|-------------|
| 150 | The Savoury Dining & Bar North Strathfield | North Strathfield | NSW | https://www.thesavourydiningns.com/ | **Vietnamese** restaurant ("the taste of Vietnam comes alive", pho, "authentic Vietnamese dishes", à-la-carte/tapas/set Vietnamese menus). Not Nepali. | **DELETED from DB 2026-07-02** (Abhishesh approved). Row + 2 photos removed; `media/photos/150/` deleted. |
| 841 | Ribs Lane Subiaco | Subiaco | WA | https://www.ribslane.com.au/ | **American BBQ / burgers** ("Best Ribs in Perth"): pork/lamb/beef ribs, smash burgers, seafood grill, pizza classes. No momo/thakali/Nepali dish anywhere. Not Nepali (chain: Subiaco/Mount Lawley/Forrestfield). | **DELETED from DB 2026-07-02** (Abhishesh approved). Row removed (0 photos). |
| 182 | The Bhakti Tree | Mayfield | NSW | https://www.thebhaktitree.com.au/ | **South Indian vegetarian** cafe (Krishna/bhakti): own-site PDF menu is entirely dosa, uttapam, idli, sambar, vada, dahi vada, South Indian thali - no momo/Nepali dish anywhere. Not Nepali. | **DELETED from DB 2026-07-02** (Abhishesh approved). Row + 1 photo removed; `media/photos/447/` deleted. |
| 682 | Lemon Tree Cafe | Shepparton | VIC | — | Not Nepali (Abhishesh confirmed 2026-07-02). 994 rev. | **HIDDEN 2026-07-02**: `is_nepali=false`, `relevance=manual_excluded` (reversible; removed from directory + queue, not hard-deleted). Say the word to delete fully. |
| 308 | Peggy's | Fremantle | WA | — | Not Nepali (Abhishesh confirmed 2026-07-02). 308 rev. | **HIDDEN 2026-07-02**: `is_nepali=false`, `relevance=manual_excluded` (reversible). Say the word to delete fully. |
| — | Momo Chicken | Kotara | NSW | https://momochicken.com.au/ | **Korean fried chicken** QSR (despite the name): own-site menu is entirely boneless/whole fried chicken sets, "snowing" seasonings, candy/honey chicken, burgers, meals - no momo or Nepali dish anywhere. Not Nepali. | **DELETED from DB 2026-07-02** (Abhishesh approved). Row removed (0 photos). |

## M. Current own-site menu is a PRICE-LESS DISPLAY menu (full dishes, no per-item prices) — SKIP (whole chain)

The restaurant's own domain publishes a beautifully designed FULL menu PDF (all dishes +
descriptions + prep/protein options) but with **no per-item prices** — only a few add-on
prices ("Add Bacon +$2.00", "Add On +$2.95") and one or two priced platters. The only
fully-priced source is either a **superseded older PDF** (stale prices, missing current
items) or a **banned ordering platform** (bopple). Seeding the price-less menu would set
`menu_item_count` and falsely mark the row "done" while every variant is price-null. SKIP
until a fully-priced own-site menu (or in-store priced photos) turns up.

| # | Name | Suburb | State | Source | Note |
|---|------|--------|-------|--------|------|
| 856+ | **8848 Momo House (whole chain, ~15 branches)** | Forest Lake QLD (+ Fortitude Valley, Gold Coast, Maroochydore, Mount Gravatt, Melbourne, Parramatta, Nundah, Mango Hill, Springfield, Rockhampton, Warner, Cairns, Town Hall Sydney, Victoria Park WA…) | multi | https://www.8848momos.com.au/wp-content/uploads/Our-Menu-1.pdf | Current own-site "Download The Menu" PDF (Jan 2026, 8pp, image-only) is a **price-less display menu**: all dishes shown (Steamed/Jhol/Kothey/Crispy/Chilli momos w/ Veg/Chicken/Pork/Buffalo/Lamb/Cheese&Spinach; Green Curry/Tandoori/Butter Chicken/Golden Carbonara fusion momos; sekuwa, K'man Doo wings, salads, loaded fries, hot&smoky/chilli-rush chicken, chowmein, fried rice, rice&curry bowls, kids menu, desserts) but **no per-item prices** (only Khaja Platter $21.95/$21.95/$25.95 + add-ons). Older `8848-Momo-House-Menu-MAR-110323-100dpi.pdf` (Mar 2023, text-layer, 84 price tokens) IS priced but stale + lacks the new 2026 fusion items. Prices otherwise only on `bopple.app` (banned platform). Shared menu across ALL branches. Recheck if they publish a priced menu. |
| 642 | Newa Bhoye | Craigieburn | VIC | https://newabhoye.com/ | 91 rev. A Newari/Nepali **catering provider** ("we are catering service providers … for your events"). Only priced offering is the **Fixed Menu = AUD 28 per person** set bhoj (not à-la-carte). The `/nepali-food/` and `/newari-food/` pages list full dish names + descriptions but **zero prices**. Nothing à-la-carte priced to seed. `catering=true` set. Recheck if they publish a priced à-la-carte menu. |

## N. Session 2026-07-02 (worker): dead / non-Nepali / stub own-site sources — SKIP

Checked these unseeded rows (abandoned stale claims + high-review own-domain candidates);
none is a usable priced Nepali own-site menu. Claim locks kept so they aren't re-attempted.

| # / slug | Name | Suburb | Reason |
|----------|------|--------|--------|
| indus-curry-express-authentic-indian-nepalese-restaurant-geebung | Indus Curry Express | Geebung QLD | 735 rev. Own domain `induscurryexpress.com` has **expired** (GoDaddy parked page). No live site. |
| de-bhatti-mount-lawley | De Bhatti | Mount Lawley WA | 409 rev. Own domain `bhatti.com.au` (+ `/menus/`) returns a persistent **Cloudflare 522 (origin down)** on both curl and full Playwright render — DNS resolves to Cloudflare but the origin server is unreachable. No site/menu to fetch. High value — recheck if the origin comes back online. |
| crimson-and-blue-millswood | Crimson and Blue | Millswood SA | 351 rev. Own domain `crimsonandblue.com.au/our-menu/` renders **no menu at all** even after full Playwright JS render (0 items, 0 prices) — the page is just marketing prose that funnels to "Order Ahead" / "Online Ordering by **Order Eats**" (`ordereats.com.au`, a banned ordering platform). No priced own-site menu published. Recheck if they publish a real menu / PDF / in-store photos. |
| the-hungry-hiker-indian-nepali-restaurant | The Hungry Hiker | Tecoma VIC | 194 rev. Own-site "View Menu" PDF (`/menus/2026 website menu.pdf`, 2pp) is a **price-less "representative" sample menu** — only price is a "$75 per guest" set menu ("A Taste Of The Hiker", min 2 guests); all à-la-carte dishes are name + description with **no per-item prices** (intro: "Our full menu includes additional specialties … available in restaurant"). Only priced source is `order.tryhubster.com` (a **Hubster** white-label online-ordering storefront → online-order pricing, banned per the skepticism rule). No full priced dine-in menu published. Recheck if they publish one / in-store photos. |
| himalayan-hub-launceston | Himalayan Hub | Launceston TAS | 90 rev. Stored `website`/`menu_url` domain `tresrestaurant.com.au` now hosts **"TRES." — a Latin-inspired Tasmanian restaurant** (not Nepali; "bold Latin-inspired flavours, a touch of Tasmanian magic"). Likely Himalayan Hub closed / domain repurposed. Even TRES.'s own menus are unpublished "sample" placeholders ("*** watch this space - we are currently updating our menus ***"). No Nepali menu to seed. Possible closed/non-Nepali row — recheck / consider relevance review. |
| amala-kitchen-taste-of-himalayan-and-beyond | Amala Kitchen (Taste of Himalayan and beyond) | Subiaco WA | 95 rev. Own Squarespace site `amalakitchen.com.au` publishes **no à-la-carte dine-in menu** — homepage has 0 prices, and the only menu pages are a **`/function-menu`** (events/functions, ~2 price tokens = package snippet) and a **`/kids-menu`** (the stored `menu_url`). No full priced dine-in menu online. Recheck if they publish one / in-store photos. |
| the-savoury-dining-bar-north-strathfield-north-strathfield | The Savoury Dining & Bar | North Strathfield NSW | 728 rev. Own site `thesavourydiningns.com` is a **Vietnamese** restaurant & bar (pho, tapas), not Nepali. Non-Nepali cuisine; menu won't map to the taxonomy. Likely a relevance/`is_nepali` leak. |
| ribs-lane-subiaco | Ribs Lane | Subiaco WA | 655 rev. Own site `ribslane.com.au` is an **American BBQ/ribs & burgers** venue (pork/beef/lamb ribs, brisket burgers, pizza). Non-Nepali cuisine; no taxonomy-mappable dishes. |
| momo-central-brunswick | Momo Central Brunswick | Brunswick VIC | 787 rev. Own domain `momocentralbrunswick.shop/menu` renders only a **3-item stub** ("Vegan Snacks": Fried Bhatmas, Waiwai Sadheko, Piro Aalu). No full menu on the site (no category tabs, no more price nodes). Too incomplete to seed. Recheck if they publish a full menu. |
| cafe-talk-kogarah-kogarah | Cafe Talk Kogarah | Kogarah NSW | 888 rev. Own `/menu` page (`cafetalk.com.au/menu/`) is **empty** — logos only, no items, no menu image/PDF/iframe. Sister of the seeded Cafe Talk Hornsby but its own menu isn't published on-site. |
| cafe-himalayan-brew-phillip | Cafe Himalayan Brew Phillip | Phillip ACT | 65 rev. Own site menu (`cafehimalayanbrew.com.au/menu`, has a Tuggeranong/Phillip branch toggle) is a **Western brunch café** menu (toast, eggs benedict, burgers, sandwiches, gourmet pies, coffee). No taxonomy-mappable Nepali dishes (only branding like "Himalayan Big Breakfast"). Same class as the Ribs Lane / Savoury non-Nepali skips. |
| silver-salver-restaurant-and-function-center-best-restaurant-in-wollongong | Silver Salver | North Wollongong NSW | 39 rev. Own site `silversalver.com.au/dine-menu.html`: the whole menu section (Veg / Bread-Rice-Biryani / Non-Veg / Mains / Kids — ~106 priced items, real Indian/Nepali dishes) is **entirely HTML-commented-out** in the source, and the live JS container ("Menu will come through Javascript") renders **empty**. Nothing is published to visitors — seeding the disabled block would republish prices the owner took offline. SKIP until the live menu is restored. |

## P. Own-site menu markup is COMMENTED OUT / not published — SKIP (unverifiable, not shown to diners)

The `menu_url` is the restaurant's own domain and the page SOURCE contains a full menu
(dish names, descriptions, ~100 price tokens), but the entire menu block is wrapped in HTML
comments (`<!-- ... -->`) so nothing renders for a diner (page note: "Menu will come through
Javascript" — a dynamic menu that was never wired up). Because it's not visible/published, the
prices can't be verified as current; seeding hidden markup risks showing stale prices. Left
unseeded until they publish a live menu (or supply a PDF / in-store photos).

| # | Name | Suburb | State | Own-site menu page | Note |
|---|------|--------|-------|--------------------|------|
| 452 | Silver Salver Restaurant and function Center | North Wollongong | NSW | https://www.silversalver.com.au/dine-menu.html | 39 rev. Full menu markup (Breakfast/Lunch/Dinner/Desserts, dishes like "Aloo Gobhi Masala $19.90" with descriptions, ~106 price tokens) exists but is entirely **commented out** in the HTML; live page renders only nav/footer (0 visible prices after full Playwright render). Recheck if they un-comment / publish it. |

## O. Session 2026-07-02 (deep-render pass): non-Nepali + ordering-widget-with-no-published-prices — SKIP

Final pass after the own-site menus were exhausted. Two classes:

**O1. Not Nepali (cuisine leak — should reclassify/hide, `is_nepali`):**

| # / slug | Name | Suburb | Evidence |
|----------|------|--------|----------|
| slice-station | Slice Station | — | Pizza shop (Garlic/Margarita/Pepperoni pizzas). Not Nepali. |
| light-of-asia-bundaberg | Light of Asia | Bundaberg QLD | Thai restaurant (roast duck curry, satay, curry puff, coconut cream). Not Nepali. |
| munchy-monk | Munchy Monk | Northbridge NSW | Predominantly Chinese dumpling house (xiao long bao, dan dan noodles); one "beef momo". Menu is its online-ordering system. |

**O2. Ordering-widget menu with NO published prices (prices load only after selecting a location/pickup-time in the cart app) — not machine-extractable.** These are the restaurant's own domain but the menu sits behind a white-label ordering widget that reveals prices only after interaction. Deep Playwright render (click Order/Menu/Pickup + try /menu /order paths) returned <20 price tokens. Recheck manually or seed from in-store photos/PDF if supplied.

Examples (review_count): taste-of-the-himalayas-brighton (401), the-everest-spice-curryhouse (309), durbar-cafe-restaurant-kearneys-spring (304), thamel-chowk-restaurant-and-bar (329), aaku-momo-moments (258), kantipur-indian-nepalese-restaurant-bar (218), sarangi-kitchen-and-bar-granville (196), nepal-ghar-hurstville (194), sekuwa-house-cooks-hill (193), laphing-central-broadmeadows (291), taste-of-himalaya-ashfield (266), friends-momos-woden (285), momo-cha-harris-park (294), the-mango-tree (365), jans (344), peggys (308), plus ~25 more from the same low/no-price bucket.

**O3. WooCommerce/own-site menu page rendered zero prices:** danphe-nepalese-and-indian-food-claremont-claremont (72) — `/category/starters` etc. rendered no priced products.

**O4. Dead / cert-broken / DNS-fail own domains (final pass):** the-darbar-south-fremantle (SSL cert expired), the-bhatti-lounge-fortitude-valley, sherpa-nepalese-restaurant-launceston, fresh-chulo-glandore, capital-laphing-canberra-weston, 9-meal-cafe-and-nepalese-restaurant (all errored on load — timeout/cert/DNS).
