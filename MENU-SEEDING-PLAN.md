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
- **Aggregator prices are marked up** — prefer a restaurant's own/print menu where both exist.
- **Branches share menus** (Falcha ×3, Aagaman ×3, Momo Central ×3, Little Magic Momo ×2,
  Khukuri ×2, both Heshela done) — transcribe once, seed to each branch slug.
- **Catering flag** — set `catering = true` when a menu/site advertises catering.
- **SKIPPED (catering-only, no prices):** `everest-function-centre-rockdale` — its
  `menu_url` PDF is a function-centre catering menu (ENTREE/MAIN/DESSERT bubble
  diagrams, no prices, DJ/Mandap/Fireworks). Per the "skip catering flyers" rule it
  was not seeded; `catering=true` set instead. Don't re-attempt as a priced menu.
- **`source = "admin"`**, `price_source` = `print`/`website` per where it came from.

---

## Checklist

Source of truth = DB (`menu_item_count`); regenerate with `node scraper/menu-progress.js --write`. `📁local` = file under `media/menus/`.

**Progress: 18 / 146 seeded (12%)** · refreshed 2026-07-01

### A. PDF menus — start here — 15/25 done
- [x] **Falcha Town Hall** (Sydney, NSW) · 2853 rev · ✓ 53 items
    https://falcha.com.au/wp-content/uploads/2026/04/Falcha_Townhall_Menu_Nov2025.pdf
- [x] **Funky Momo** (Victoria Park, WA) · 1406 rev · ✓ 89 items
    http://funkymomo.com.au/wp-content/uploads/2023/03/Food-Menu-funky-final.pdf
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
- [ ] **Indus Indian &Nepalese Restaurant Gold** (Surfers Paradise, QLD) · 522 rev · 📁local
    https://indusrestaurant.com.au/storage/app/public/branch_images/1765795615-5289.pdf
- [x] **Little Magic Momo** (Osborne Park, WA) · 521 rev · ✓ 51 items
    https://littlemagicmomo.com.au/wp-content/uploads/2026/03/little-magic-momo-menu-V.4.pdf
- [x] **Spring Hill Kitchen** (Spring Hill, QLD) · 516 rev · ✓ 43 items
    http://springhillkitchen.com.au/wp-content/uploads/2023/12/spring-hill-Menu.pdf
- [x] **Baar Pipaal - Restaurant & Bar** (Glenroy, VIC) · 493 rev · ✓ 46 items
    https://baarpipaal.com.au/wp-content/uploads/2024/07/menu-07-2024-updated.pdf
- [x] **Little Magic Momo wembley** (Wembley, WA) · 404 rev · ✓ 51 items
    https://littlemagicmomo.com.au/wp-content/uploads/2026/03/little-magic-momo-menu-V.4.pdf
- [x] **Namaste Nepalese Restaurant** (Parkside, SA) · 384 rev · ✓ 51 items
    https://namasterestaurant.com.au/wp-content/uploads/2022/09/Namaste-Food-Menu-August-2022.
- [x] **Laltin Nepalese Cuisine** (Rockdale, NSW) · 367 rev · ✓ 54 items
    https://www.laltin.com.au/_files/ugd/fe3d47_3538932b699e42aba270a3e4ec8deebe.pdf
- [ ] **Everest Function Centre** (Rockdale, NSW) · 329 rev · 📁local
    http://www.everesttandoori.com.au/images/menu/everest-tandoori-menu.pdf
- [ ] **Lahana Restaurant and Bar** (Hurstville, NSW) · 317 rev · 📁local
    http://lahanahurstville.com.au/wp-content/uploads/2024/03/Lahana_menu.pdf
- [ ] **Lababdar** (Ryde, NSW) · 282 rev · 📁local
    http://lababdar.com.au/wp-content/uploads/2025/11/Lababdar-New-Menu-Nov-2025_Compressed.pd
- [ ] **Himalayan Tandoor & Curry House** (Bellerive, TAS) · 266 rev · 📁local
    https://www.himalayantandoorandcurryhouse.com.au/images/dineinmenu.pdf
- [ ] **Kathmandu Cuisine** (Hobart, TAS) · 265 rev · 📁local
    http://kathmanducuisine.com.au/ktm-cusine-menu-01-converted.pdf
- [ ] **Little Nepal Nepalese Restaurant** (Currambine, WA) · 227 rev · 📁local
    http://littlenepalrestaurant.com.au/wp-content/uploads/2017/12/Little_Nepal_Take_AWay.pdf
- [x] **Tasty momo Nepalese Restaurant** (Cloverdale, WA) · 140 rev · ✓ 66 items
    https://tastymomo.com.au/wp-content/uploads/2026/01/TASTY-MOMO-MENU-Cloverdale-V.6.pdf
- [ ] **Street Eats Mt Hawthorn** (Scarborough, WA) · 106 rev
    https://assets.cdn.filesafe.space/fBmNTES4lOqZJFIgBQJs/media/69fd9642a3dd25aa2a87ebde.pdf
- [ ] **Himalayan BBQ** (Greenway, ACT) · 103 rev · 📁local
    https://img1.wsimg.com/blobby/go/a4c3634e-3b7b-4194-9e8a-f28ec52cb11a/HIMALAYAN%20BBQ%20(A
- [x] **Indus Indian and Nepalese Restaurant- ** (Ipswich, QLD) · 80 rev · ✓ 85 items
    https://indusrestaurant.com.au/storage/app/public/branch_images/1766108179-8190.pdf
- [ ] **Tusa Canberra** (Barton, ACT) · 19 rev · 📁local
    https://tusanepal.com/wp-content/uploads/2026/06/Tusa-Canberra.pdf

### B. Own-site pages — 0/82 done
- [ ] **The Momos Hub Townhall** (Sydney, NSW) · 3689 rev · 📁local
    menus/17/menu-1782054769586-3g5g.webp
- [ ] **Chilli Everest** (Melbourne, VIC) · 2249 rev
    https://chillieverest.com.au/menu/
- [ ] **Momo Central Little Collins St** (Melbourne, VIC) · 1998 rev
    https://momocentral.com.au/menus/
- [ ] **Lakeside Gurkhas** (Kingston, ACT) · 1953 rev
    http://lakesidegurkhas.com.au/menu
- [ ] **Magic Momo Kafe West Footscray** (West Footscray, VIC) · 1299 rev
    https://magicmomokafe.com.au/menu/
- [ ] **SPICE MIX- Indian, Nepalese & Halal Re** (Brunswick East, VIC) · 1015 rev
    https://spicemixrestaurant.com/menu
- [ ] **Mul Chowk Kitchen Sydney** (Campsie, NSW) · 995 rev
    https://mccatering.com.au/menu
- [ ] **MoMo Planet** (Victoria Park, WA) · 968 rev
    http://www.momoplanetperth.com/menu.html
- [ ] **Khukuri Restaurant Adelaide** (Adelaide, SA) · 929 rev
    https://khukurirestaurant.com.au/menu/khukuri-adelaide
- [ ] **Tapari Momo** (Granville, NSW) · 869 rev
    https://taparimomo.com.au/menu
- [ ] **Falcha Rockdale** (Rockdale, NSW) · 867 rev
    https://falcha.com.au/menu-rockdale/
- [ ] **The Hungry Buddha | Nepalese & Indian ** (Belconnen, ACT) · 813 rev
    https://thehungrybuddha.com.au/menu-1
- [ ] **Momo Central Brunswick** (Brunswick, VIC) · 787 rev
    https://momocentralbrunswick.shop/menu
- [ ] **Aagaman Indian Nepalese Restaurant: Po** (Port Melbourne, VIC) · 756 rev
    https://aagamanrestaurant.com.au/menu.html
- [ ] **Indus Curry Express - Authentic Indian** (Geebung, QLD) · 735 rev
    https://induscurryexpress.com/menus
- [ ] **The Savoury Dining & Bar North Strathf** (North Strathfield, NSW) · 728 rev
    https://www.thesavourydiningns.com/#Menu
- [ ] **Aagaman Indian Nepalese Restaurant: Me** (Melbourne, VIC) · 723 rev
    https://aagamanrestaurant.com.au/menu.html
- [ ] **Timur Indian & Nepalese Restaurant** (Parramatta, NSW) · 709 rev
    https://timurindiannepalese.yumbojumbo.com.au/menu
- [ ] **Tinkune Momo & Sekuwa House** (Sunshine, VIC) · 698 rev
    http://tinkune.com.au/menu
- [ ] **Flavours of Nepal** (Granville, NSW) · 685 rev
    https://flavoursofnepal.yumbojumbo.com.au/menu
- [ ] **Momo Central Bourke street** (Melbourne, VIC) · 671 rev
    https://momocentral.com.au/menus/
- [ ] **Ribs Lane Subiaco** (Subiaco, WA) · 655 rev
    https://www.ribslane.com.au/menu
- [ ] **Kathmandu Newa Chhe'n** (Paddington, QLD) · 612 rev
    http://www.kathmandunewa.com.au/menu
- [ ] **Momo Station** (Melbourne, VIC) · 586 rev
    https://momostation.com.au/menu-2/
- [ ] **Spice Town** (Inglewood, WA) · 537 rev
    https://spicetown.tuckerfox.com.au/menu
- [ ] **Ayla Bar & Restaurant** (Melbourne, VIC) · 531 rev
    https://aylamelbourne.com/menu/
- [ ] **HAMRO NEPALI KITCHEN** (Karawara, WA) · 507 rev
    http://hamronepalikitchen.com/menu
- [ ] **Everest BBQ** (Rockdale, NSW) · 497 rev
    https://everestbbq.yumbojumbo.com.au/menu
- [ ] **Falcha Penshurst** (Penshurst, NSW) · 462 rev
    https://falcha.com.au/menu-penshurst/
- [ ] **Kalapani Nepalese Restaurant Town hall** (Sydney, NSW) · 438 rev
    https://kalapaninepalesecbd.yumbojumbo.com.au/menu
- [ ] **PANS ON FIRE** (Werribee, VIC) · 415 rev
    https://pansonfire.yumbojumbo.com.au/menu
- [ ] **Momo Ghar Oii Oii Oii** (Hoppers Crossing, VIC) · 413 rev
    https://www.momoghar.com.au/home#menu
- [ ] **De Bhatti** (Mount Lawley, WA) · 409 rev
    https://bhatti.com.au/menus/
- [ ] **Himali Gurkha Nepalese Restaurant** (Ardross, WA) · 404 rev
    https://himaligurkha.com/menu/
- [ ] **Lankan Railway Cafe** (Mortdale, NSW) · 375 rev
    https://lankanrailwaycafemortdale.com.au/menu.html
- [ ] **Rolling Flavors** (Subiaco, WA) · 370 rev
    https://www.rollingflavors.com.au/menu
- [ ] **Namaste Kitchen** (South Perth, WA) · 365 rev
    https://namastekitchen.com.au/our-menus/
- [ ] **Lah Bros Windsor | Modern Nepalese Res** (Windsor, VIC) · 352 rev
    http://lahbros.com.au/menu
- [ ] **Crimson and Blue** (Millswood, SA) · 351 rev
    https://crimsonandblue.com.au/our-menu/
- [ ] **Nepal Dining Room** (Malvern East, VIC) · 348 rev
    https://tapnorder.online/
- [ ] **Everest Eatery - Indian & Nepalese Cui** (Hobart, TAS) · 346 rev
    http://everesteatery.com.au/our-menu/
- [ ] **YUVI KITCHEN** (Burnie, TAS) · 320 rev
    https://www.yuvikitchen.com/#menu
- [ ] **Tastish** (Dandenong, VIC) · 299 rev
    http://menu.tastish.com.au/
- [ ] **Downtown MoMo** (Parramatta, NSW) · 298 rev
    https://downtownmomo.yumbojumbo.com.au/menu
- [ ] **Khukuri Restaurant Melbourne** (Melbourne, VIC) · 287 rev
    https://khukurirestaurant.com.au/menu/khukuri-adelaide
- [ ] **Real Mountain Nepalese and Indian Rest** (Glen Forrest, WA) · 276 rev
    https://www.realmountainglenforrest.com.au/menu
- [ ] **Mt.Everest Indian And Nepalese Restaur** (Hunters Hill, NSW) · 275 rev
    https://mounteverestrestaurant.com.au/menu.php
- [ ] **Himalayan Nepalese Restaurant and Cafe** (Mosman Park, WA) · 272 rev
    https://himalayanrestaurant.com.au/menu
- [ ] **Base Camp** (Northcote, VIC) · 260 rev
    http://www.basecamprestaurant.com.au/menu
- [ ] **Cafe Talk Nepalese Restaurant - Hornsb** (Hornsby, NSW) · 247 rev
    https://thecafetalk.com.au/our-menu/
- [ ] **Deurali Restaurant** (Salisbury, SA) · 247 rev
    https://deurali.com.au/our-menus/
- [ ] **The momos** (Hornsby, NSW) · 240 rev
    https://themomos-hornsby.yumbojumbo.com.au/menu
- [ ] **Gurkha's Fusion** (Maroochydore, QLD) · 237 rev
    https://gurkhasfusion.com.au/menu/
- [ ] **Kantipur Indian Nepalese Restaurant & ** (Caulfield North, VIC) · 218 rev
    https://tapnorder.online/
- [ ] **Nepal House Restaurant** (Greenacres, SA) · 196 rev
    https://ordereats.com.au/menu-nepal-house-restaurant#menu
- [ ] **Food House Nepal** (Dee Why, NSW) · 195 rev
    https://siteassets.parastorage.com/pages/pages/thunderbolt?appDefinitionIdToSiteRevision=%
- [ ] **The Hungry Hiker Indian & Nepali Resta** (Tecoma, VIC) · 194 rev
    https://www.thehungryhiker.com.au/menu.html
- [ ] **Shasa Momo** (Granville, NSW) · 190 rev
    https://shasamomo.com.au/menu/
- [ ] **Third Eye Windsor** (South Windsor, NSW) · 188 rev
    https://thirdeyewindsor.com.au/home-catering-menu
- [ ] **Bhok Laagyo Franklin** (Franklin, ACT) · 178 rev
    https://bhoklaagyocanberra.com.au/menu/
- [ ] **Nepali Food Mandala** (Dubbo, NSW) · 170 rev
    http://www.nepalifoodmandala.com.au/menu
- [ ] **Gorkha Palace** (Kallaroo, WA) · 161 rev
    https://gorkha-palace.tuckerfox.com.au/menu
- [ ] **Royal Durbar Restro** (Kogarah, NSW) · 157 rev
    https://royaldurbarrestro.yumbojumbo.com.au/menu
- [ ] **TIBETAN PEACE RESTAURANT** (Dee Why, NSW) · 152 rev
    https://tibetan-peace-restaurant.grubbio.com/menu
- [ ] **ChiyaHub** (Kogarah, NSW) · 148 rev
    https://www.chiyahub.com/menu
- [ ] **Falcha Wollongong** (Wollongong, NSW) · 132 rev
    https://falcha.com.au/menu-wollogong/
- [ ] **Khaja** (Villawood, NSW) · 122 rev
    https://khaja.com.au/menu/
- [ ] **FEWA KITCHEN** (Chippendale, NSW) · 112 rev
    https://fewakitchen.wordpress.com/home/menu/
- [ ] **Aagaman Indian Nepalese Restaurant: Ro** (Rosanna, VIC) · 109 rev
    https://aagamanrestaurant.com.au/menu.html
- [ ] **FÜDA : GLOBAL STREET BITES** (Darwin City, NT) · 106 rev
    https://www.fuda.com.au/menu
- [ ] **Amala Kitchen (Taste of Himalayan and ** (Subiaco, WA) · 95 rev
    https://www.amalakitchen.com.au/kids-menu
- [ ] **Newa Bhoye** (Craigieburn, VIC) · 91 rev
    https://newabhoye.com/fixed-menu/
- [ ] **Himalayan Hub** (Launceston, TAS) · 90 rev
    http://www.tresrestaurant.com.au/menu
- [ ] **The Nepalese Corner ( Restaurant & Caf** (Coburg, VIC) · 82 rev
    https://thenepalesecorner.com.au/our-menu
- [ ] **Raato Ghar** (Granville, NSW) · 79 rev
    https://raatoghar.com/menus/
- [ ] **Newari kitchen** (Seven Hills, NSW) · 72 rev
    https://newarikitchen.com.au/menus/
- [ ] **Avatar Indian & Nepalese Restaurant - ** (Bundoora, VIC) · 68 rev
    https://tapnorder.online
- [ ] **KUTUMBA LOUNGE** (Unley, SA) · 66 rev
    http://kutumbalounge.com.au/menu
- [ ] **Cafe Himalayan Brew Phillip** (Phillip, ACT) · 65 rev
    https://cafehimalayanbrew.com.au/menu
- [ ] **Silver Salver Restaurant and function ** (North Wollongong, NSW) · 39 rev
    https://www.silversalver.com.au/dine-menu.html
- [ ] **Rucira foods** (Burwood, NSW) · 31 rev
    https://rucira-foods.yumbojumbo.com.au/menu
- [ ] **Himalayan Nepalese Restaurant & Cafe** (Mosman Park, WA) · 0 rev
    https://www.himalayanrestaurant.com.au/menu

### C. Aggregators — last resort (bot-walled, marked-up prices) — 3/39 done
- [x] **Kathmandu Momo** (Surfers Paradise, QLD) · 3795 rev · ✓ 168 items
    https://www.ubereats.com/au/store/kathmandu-mo%3Amo%3A-house-%26-bar/fFtHeF8aRFyJQJOIREb52
- [ ] **Chulho - Harris Park** (Harris Park, NSW) · 2448 rev
    https://www.ubereats.com/au/store/chulho-%40-town/6YPCVe8UQXucuDZKNS76QQ?diningMode=DELIVE
- [x] **Heshela Newa Khaja Ghar Rockdale** (Rockdale, NSW) · 2357 rev · ✓ 91 items
    https://www.ubereats.com/au/store/heshela-newa-khaja-ghar-rockdale/LCK3YaR_SWKUB4-ro8av1w?
- [ ] **Galli Galli Nepalese Indian** (Sydney, NSW) · 1166 rev
    https://www.ubereats.com/au/store/galligalli
- [ ] **Maicha - Nepalese Restaurant** (Burwood, NSW) · 905 rev
    https://www.doordash.com/store/maicha-nepalese-restaurant-burwood-36077847/83682877/?event
- [ ] **8848 Momo House Forest Lake** (Forest Lake, QLD) · 856 rev
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [ ] **8848 Momo House** (Fortitude Valley, QLD) · 777 rev
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [ ] **8848 Momo House Goldcoast** (Surfers Paradise, QLD) · 761 rev
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [ ] **Chulho Town Hall** (Sydney, NSW) · 743 rev
    https://www.ubereats.com/au/store/chulho-%40-town/6YPCVe8UQXucuDZKNS76QQ?diningMode=DELIVE
- [ ] **Jery Solti rockdale** (Rockdale, NSW) · 703 rev
    https://www.ubereats.com/au/store/jerysolti-rockdale/9TirmmRsRAyIqMClBxO66Q?srsltid=AfmBOo
- [ ] **8848 Momo House Maroochydore (Sunshine** (Maroochydore, QLD) · 682 rev
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [x] **Heshela Newa Khaja Ghar Hurstville** (Hurstville, NSW) · 655 rev · ✓ 91 items
    https://www.ubereats.com/au/store/heshela-newa-khaja-ghar-rockdale/LCK3YaR_SWKUB4-ro8av1w?
- [ ] **8848 Momo House Mount Gravatt** (Upper Mount Gravatt, QLD) · 638 rev
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [ ] **8848 Momo House Melbourne** (Melbourne, VIC) · 626 rev
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [ ] **8848 Momo House Parramatta** (Parramatta, NSW) · 551 rev
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [ ] **Jhigu Bhoye Chhen Nepalese Restaurant** (Coorparoo, QLD) · 503 rev
    https://www.menulog.com.au/restaurants-jhigu-bhoye-chhen-coorparoo/menu
- [ ] **Spicy Momo & Bar** (Lutwyche, QLD) · 498 rev
    https://deliveroo.com.au/menu/brisbane/fortitude-valley/so-sushi-brisbane
- [ ] **Sukuti Ghar** (Granville, NSW) · 418 rev
    https://www.ubereats.com/store/sukuti-ghar/rGGeKJGCQDK1pDiFKSm6Rg?diningMode=DELIVERY%5B…%
- [ ] **8848 Momo House Nundah** (Nundah, QLD) · 406 rev
    https://www.ubereats.com/au/store/8848-momo-house/rliCQvp6TzCIIayqWvWblw
- [ ] **MoMoCha Nepalese & Indian Restaurant** (Strathfield, NSW) · 404 rev
    https://www.ubereats.com/au/store/momocha-authentic-nepalese-restaurant/2x6R3HEpXWC14jFg2a
- [ ] **Chillies Indian and Nepalese Restauran** (Sandy Bay, TAS) · 361 rev
    https://www.doordash.com/en-AU/store/chillies-indian-restaurant-sandy-bay-26206641/
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
- [ ] **Momoland - Newcastle, Australia** (Jesmond, NSW) · 257 rev
    https://www.menulog.com.au/restaurants-momoland-jesmond/menu
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
