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

## G. Self-hosted white-label ORDERING storefront (own domain/subdomain, but online-order menu/prices) — SKIP

Same rule as section C (`square.site`): the URL is on the restaurant's own domain, but the
page is a white-label **online-ordering** app (pre-order / pickup / delivery cart, vouchers,
loyalty) whose prices are online-order pricing, not the true dine-in menu. Skepticism rule
applies → SKIP. Vendor is identifiable from the JS bundle host.

| # | Name | Suburb | State | URL | Vendor / note |
|---|------|--------|-------|-----|---------------|
| 570 | Tastish | Dandenong | VIC | http://menu.tastish.com.au/ | **DELETED from DB 2026-07-02** (not Nepali — labelled **INDIAN** in-app: samosa/pakora/paneer/chaat/kebab/naan, no momo/thakali). Menu was also a nextorder.co ordering storefront (assets.nextorder.co) on own subdomain. Row removed. |

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

## I. Own-domain website is an UNCONFIGURED SERVER PLACEHOLDER (no site built) — SKIP

The `website` is the restaurant's own domain, but nothing is deployed: it serves a default
web-server landing page ("Caddy works!" / nginx / Apache default), not a real site. No menu,
no content, `/menu` 404s too. Nothing to transcribe until they actually build the site.

| # | Name | Suburb | State | Own domain | Note |
|---|------|--------|-------|-----------|------|
| 5 | Yummy Laphing | Granville | NSW | http://www.yummylaphing.au/ | Default **Caddy** placeholder ("Caddy works! Congratulations!"); http+https root and `/menu` all zero menu content. 1782 reviews — high value, recheck if they launch a real site. |
