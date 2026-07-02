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

## H. Own site's only menu is a CATERING-PACKAGES menu (no dine-in priced menu) — SKIP (set `catering=true`)

The restaurant's own site links its "Menu" only to a catering domain / catering-packages
page (event menu packages, per-head, no à la carte dine-in prices). Per the "skip catering
flyers" rule this is not seeded as a priced menu; set `catering=true` instead and leave
`menu_item_count` NULL until a real dine-in menu (own `/menu`, PDF, or in-store photos) turns up.

| # | Name | Suburb | State | Source | Note |
|---|------|--------|-------|--------|------|
| 32 | Mul Chowk Kitchen Sydney | Campsie | NSW | https://mccatering.com.au/menu (linked from own site mulchowkkitchen.com.au) | `mccatering.com.au` = "MC Catering, A Joint Venture of Mul Chowk Kitchen". Menu page is event catering PACKAGES for Sydney/Canberra only (no dine-in à la carte prices). Own restaurant site has no `/menu` (404). `catering=true` set 2026-07-02. |

## G. Self-hosted white-label ORDERING storefront (own domain/subdomain, but online-order menu/prices) — SKIP

Same rule as section C (`square.site`): the URL is on the restaurant's own domain, but the
page is a white-label **online-ordering** app (pre-order / pickup / delivery cart, vouchers,
loyalty) whose prices are online-order pricing, not the true dine-in menu. Skepticism rule
applies → SKIP. Vendor is identifiable from the JS bundle host.

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
| 240 | The Hangout Cafe and Restaurant | Moonah | TAS | https://thehangoutrestaurant.com.au/ | 521 rev. **Foodhub** white-label ordering (`assets.foodhub.com` / `assets.touch2success.com`); online-order-only, no static menu. → SKIP. |
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

## K. Own domain has EXPIRED / is PARKED (registrar landing page) — SKIP

The stored `website`/`menu_url` is the restaurant's own domain, but the domain has
lapsed and now serves a registrar parking page (GoDaddy "expired and is parked free" /
domain-for-sale). No site, no menu, `/menus` too. Nothing to transcribe until (if) they
renew and rebuild. Distinct from section I (server-default placeholder on a live domain).

| # | Name | Suburb | State | Own domain | Note |
|---|------|--------|-------|-----------|------|
| 183 | Indus Curry Express - Authentic Indian & Nepalese Restaurant | Geebung | QLD | https://induscurryexpress.com/menus | 735 reviews. Domain **expired, parked on GoDaddy** ("has expired and is parked free"); both `website` (`induscurryexpress.com`) and `menu_url` (`/menus`) serve the parking page. High value — recheck if they renew the domain and republish. |
| 238 | Mirmire Nepali Taste (Nepali and Indian cuisine) | Hobart | TAS | http://www.mirmire-nepalitaste.com.au/ | 665 reviews. Domain is **DEAD — DNS SERVFAIL** on apex + www from both Google (8.8.8.8) and Cloudflare (1.1.1.1); does not resolve at all (no parking page even). `menu_url` NULL. No site to fetch. High value — needs a live source (new domain / socials / in-store photos) discovered before it can be seeded. |
| 39 | Bota Corner | Parramatta | NSW | https://botacorner.com.au/ | 511 rev. Domain **does not resolve** (net::ERR_NAME_NOT_RESOLVED); no site to fetch. `menu_url` NULL. High value — needs a live source (new domain / socials / in-store photos). |
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

## N. Own-site menu markup is COMMENTED OUT / not published — SKIP (unverifiable, not shown to diners)

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
