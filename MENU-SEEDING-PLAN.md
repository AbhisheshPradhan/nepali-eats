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

**Progress: 98 / 153 seeded (64%)** · refreshed 2026-07-02

### A. PDF menus — start here — 29/30 done
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

### B. Own-site pages — 69/97 done
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
- [ ] **Mul Chowk Kitchen Sydney** (Campsie, NSW) · 995 rev
    https://mccatering.com.au/menu
- [x] **MoMo Planet** (Victoria Park, WA) · 968 rev · ✓ 121 items
    http://www.momoplanetperth.com/menu.html
- [x] **Khukuri Restaurant Adelaide** (Adelaide, SA) · 929 rev · ✓ 87 items
    https://khukurirestaurant.com.au/menu/khukuri-adelaide
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
- [ ] **Momo Central Brunswick** (Brunswick, VIC) · 787 rev
    https://momocentralbrunswick.shop/menu
- [x] **Aagaman Indian Nepalese Restaurant: Po** (Port Melbourne, VIC) · 756 rev · ✓ 74 items
    https://aagamanrestaurant.com.au/menu.html
- [x] **Chulho Town Hall** (Sydney, NSW) · 743 rev · ✓ 132 items
    https://www.chulho.com.au/menu
- [ ] **Indus Curry Express - Authentic Indian** (Geebung, QLD) · 735 rev
    https://induscurryexpress.com/menus
- [x] **Aagaman Indian Nepalese Restaurant: Me** (Melbourne, VIC) · 723 rev · ✓ 76 items
    https://aagamanrestaurant.com.au/menu.html
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
- [x] **HAMRO NEPALI KITCHEN** (Karawara, WA) · 507 rev · ✓ 59 items
    http://hamronepalikitchen.com/menu
- [x] **Galli Kitchen** (Coburg, VIC) · 501 rev · ✓ 79 items
    https://www.gallikitchen.com.au/s/order
- [x] **Mad Momos** (Glenroy, VIC) · 499 rev · ✓ 48 items
    https://madmomos.com.au/store/mad-momos
- [ ] **Everest BBQ** (Rockdale, NSW) · 497 rev
    https://everestbbq.yumbojumbo.com.au/menu
- [x] **Falcha Penshurst** (Penshurst, NSW) · 462 rev · ✓ 139 items
    https://falcha.com.au/menu-penshurst/
- [ ] **Kalapani Nepalese Restaurant Town hall** (Sydney, NSW) · 438 rev
    https://kalapaninepalesecbd.yumbojumbo.com.au/menu
- [x] **Sukuti Ghar** (Granville, NSW) · 418 rev · ✓ 26 items
    https://sukutighar.com.au/menu/
- [ ] **PANS ON FIRE** (Werribee, VIC) · 415 rev
    https://pansonfire.yumbojumbo.com.au/menu
- [x] **Momo Ghar Oii Oii Oii** (Hoppers Crossing, VIC) · 413 rev · ✓ 53 items
    https://www.momoghar.com.au/home#menu
- [ ] **De Bhatti** (Mount Lawley, WA) · 409 rev
    https://bhatti.com.au/menus/
- [x] **Old Durbar Nepalese & Indian Restauran** (Nunawading, VIC) · 406 rev · ✓ 116 items
    https://old-durbar.com.au/our-cuisines/
- [x] **Himali Gurkha Nepalese Restaurant** (Ardross, WA) · 404 rev · ✓ 59 items
    https://himaligurkha.com/menu/
- [x] **MoMoCha Nepalese & Indian Restaurant** (Strathfield, NSW) · 404 rev · ✓ 91 items
    https://momocha.com.au/menu/
- [x] **Rolling Flavors** (Subiaco, WA) · 370 rev · ✓ 81 items
    https://www.rollingflavors.com.au/menu
- [x] **Namaste Kitchen** (South Perth, WA) · 365 rev · ✓ 138 items
    https://namastekitchen.com.au/our-menus/
- [x] **Lah Bros Windsor | Modern Nepalese Res** (Windsor, VIC) · 352 rev · ✓ 44 items
    https://www.lahbros.com.au/eat
- [ ] **Crimson and Blue** (Millswood, SA) · 351 rev
    https://crimsonandblue.com.au/our-menu/
- [x] **Nepal Dining Room** (Malvern East, VIC) · 348 rev · ✓ 49 items
    https://nepaldiningroom.com.au/dine-in-menu/
- [x] **Everest Eatery - Indian & Nepalese Cui** (Hobart, TAS) · 346 rev · ✓ 55 items
    http://everesteatery.com.au/our-menu/
- [ ] **Downtown MoMo** (Parramatta, NSW) · 298 rev
    https://downtownmomo.yumbojumbo.com.au/menu
- [x] **A1 Tandoori n Momo Restro Bar** (Sunshine, VIC) · 297 rev · ✓ 73 items
    https://a1tandoorimomorestrobar.com.au/menu/
- [x] **Khukuri Restaurant Melbourne** (Melbourne, VIC) · 287 rev · ✓ 87 items
    https://khukurirestaurant.com.au/menu/khukuri-melbourne
- [x] **Real Mountain Nepalese and Indian Rest** (Glen Forrest, WA) · 276 rev · ✓ 96 items
    https://www.realmountainglenforrest.com.au/menu
- [x] **The Kathmandu Cottage** (West Melbourne, VIC) · 276 rev · ✓ 68 items
    https://www.kathmanducottage.com.au/menu
- [x] **Mt.Everest Indian And Nepalese Restaur** (Hunters Hill, NSW) · 275 rev · ✓ 92 items
    https://mounteverestrestaurant.com.au/menu.php
- [x] **Himalayan Nepalese Restaurant and Cafe** (Mosman Park, WA) · 272 rev · ✓ 64 items
    https://himalayanrestaurant.com.au/menu
- [x] **Base Camp** (Northcote, VIC) · 260 rev · ✓ 68 items
    http://www.basecamprestaurant.com.au/menu
- [x] **Cafe Talk Nepalese Restaurant - Hornsb** (Hornsby, NSW) · 247 rev · ✓ 59 items
    https://thecafetalk.com.au/our-menu/
- [x] **Deurali Restaurant** (Salisbury, SA) · 247 rev · ✓ 61 items
    https://deurali.com.au/our-menus/
- [ ] **The momos** (Hornsby, NSW) · 240 rev
    https://themomos-hornsby.yumbojumbo.com.au/menu
- [x] **Gurkha's Fusion** (Maroochydore, QLD) · 237 rev · ✓ 60 items
    https://gurkhasfusion.com.au/menu/
- [ ] **Kantipur Indian Nepalese Restaurant & ** (Caulfield North, VIC) · 218 rev
    https://tapnorder.online/
- [x] **JHEER HOUSE | Gyros/Souvlaki/Kebab/Bur** (Rockdale, NSW) · 204 rev · ✓ 49 items
    https://jheerhouse.com.au/order-now/
- [ ] **Nepal House Restaurant** (Greenacres, SA) · 196 rev
    https://ordereats.com.au/menu-nepal-house-restaurant#menu
- [x] **Food House Nepal** (Dee Why, NSW) · 195 rev · ✓ 26 items
    https://www.foodhousenepal.com.au/online-ordering
- [ ] **The Hungry Hiker Indian & Nepali Resta** (Tecoma, VIC) · 194 rev
    https://www.thehungryhiker.com.au/menu.html
- [x] **Shasa Momo** (Granville, NSW) · 190 rev · ✓ 34 items
    https://shasamomo.com.au/menu/
- [x] **Third Eye Windsor** (South Windsor, NSW) · 188 rev · ✓ 75 items
    https://thirdeyewindsor.com.au/restaurant-menu
- [ ] **Bhok Laagyo Franklin** (Franklin, ACT) · 178 rev
    https://bhoklaagyocanberra.com.au/menu/
- [x] **Nepali Food Mandala** (Dubbo, NSW) · 170 rev · ✓ 86 items
    http://www.nepalifoodmandala.com.au/menu
- [ ] **Gorkha Palace** (Kallaroo, WA) · 161 rev
    https://gorkha-palace.tuckerfox.com.au/menu
- [ ] **Royal Durbar Restro** (Kogarah, NSW) · 157 rev
    https://royaldurbarrestro.yumbojumbo.com.au/menu
- [ ] **TIBETAN PEACE RESTAURANT** (Dee Why, NSW) · 152 rev
    https://tibetan-peace-restaurant.grubbio.com/menu
- [ ] **ChiyaHub** (Kogarah, NSW) · 148 rev
    https://www.chiyahub.com/menu
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
- [ ] **Amala Kitchen (Taste of Himalayan and ** (Subiaco, WA) · 95 rev
    https://www.amalakitchen.com.au/kids-menu
- [ ] **Newa Bhoye** (Craigieburn, VIC) · 91 rev
    https://newabhoye.com/fixed-menu/
- [ ] **Himalayan Hub** (Launceston, TAS) · 90 rev
    http://www.tresrestaurant.com.au/menu
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
- [ ] **Cafe Himalayan Brew Phillip** (Phillip, ACT) · 65 rev
    https://cafehimalayanbrew.com.au/menu
- [ ] **Silver Salver Restaurant and function ** (North Wollongong, NSW) · 39 rev
    https://www.silversalver.com.au/dine-menu.html
- [ ] **Rucira foods** (Burwood, NSW) · 31 rev
    https://rucira-foods.yumbojumbo.com.au/menu
- [ ] **Himalayan Nepalese Restaurant & Cafe** (Mosman Park, WA) · 0 rev
    https://www.himalayanrestaurant.com.au/menu

### C. Aggregators — last resort (bot-walled, marked-up prices) — 0/26 done
- [ ] **8848 Momo House Forest Lake** (Forest Lake, QLD) · 856 rev
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [ ] **8848 Momo House** (Fortitude Valley, QLD) · 777 rev
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [ ] **8848 Momo House Goldcoast** (Surfers Paradise, QLD) · 761 rev
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [ ] **8848 Momo House Maroochydore (Sunshine** (Maroochydore, QLD) · 682 rev
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [ ] **8848 Momo House Mount Gravatt** (Upper Mount Gravatt, QLD) · 638 rev
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [ ] **8848 Momo House Melbourne** (Melbourne, VIC) · 626 rev
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [ ] **8848 Momo House Parramatta** (Parramatta, NSW) · 551 rev
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [ ] **Spicy Momo & Bar** (Lutwyche, QLD) · 498 rev
    https://deliveroo.com.au/menu/brisbane/fortitude-valley/so-sushi-brisbane
- [ ] **8848 Momo House Nundah** (Nundah, QLD) · 406 rev
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [ ] **Anu Kitchen and Catering Services** (Campsie, NSW) · 324 rev
    https://www.ubereats.com/au/store/anu-kitchen-and-catering-services/Ba9mOu-rSZWD7TUXrHauVQ
- [ ] **The Everest spice & curryhouse** (Toowoomba City, QLD) · 309 rev
    https://www.ubereats.com/au/store/everest-spice-indian-restaurant/EbObJ7FmQL-9HOFSnN2_Dg
- [ ] **Durbar Cafe & Restaurant** (Kearneys Spring, QLD) · 304 rev
    https://www.doordash.com/store/durbar-cafe-kearneys-spring-23546564/?utm_campaign=gpa
- [ ] **Laphing Central Broadmeadows** (Broadmeadows, VIC) · 291 rev
    https://www.ubereats.com/au/store/laphing-central/Z4Y_SY65XP2KnqJH5gSAQQ
- [ ] **Ghumti Kitchen** (Allawah, NSW) · 271 rev
    https://www.ubereats.com/au/store/ghumti-kitchen/uBHaNRYGSIGHnA2JyZYgog
- [ ] **Aaku Momo Moments** (Harris Park, NSW) · 258 rev
    https://bopple.app/14880
- [ ] **8848 Momo House Rockhampton** (Rockhampton City, QLD) · 254 rev
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [ ] **8848 Momo House Mango hill** (Mango Hill, QLD) · 234 rev
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [ ] **8848 Momo House Springfield** (Springfield Lakes, QLD) · 228 rev
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [ ] **Kathmandu Kitchen** (Kingscliff, NSW) · 220 rev
    https://www.menulog.com.au/restaurants-kathmandu-kitchen/menu
- [ ] **8848 Momo House Warner** (Warner, QLD) · 201 rev
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [ ] **8848 Momo House Cairns** (Cairns City, QLD) · 184 rev
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [ ] **The Bhakti Tree** (Mayfield, NSW) · 182 rev
    https://www.order.store/store/the-bhakti-tree/ClKGNBPnXpC1AuHhckb5-w
- [ ] **8848 Momo House Town Hall (Sydney)** (Sydney, NSW) · 170 rev
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [ ] **Langhali Cafe & Restaurant** (Warrane, TAS) · 145 rev
    https://www.ubereats.com/au/store/langhali-cafe-%26-restaurant/HZet7ZjvSVSvtz7f1FqMfg?dini
- [ ] **8848 Momo House Victoria Park (Perth)** (Victoria Park, WA) · 131 rev
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [ ] **Tandoori Night Indian Nepalese Cuisine** (Crows Nest, NSW) · 0 rev
    https://tandoorinight.com.au/wp-content/uploads/2024/09/doordash-1.png
