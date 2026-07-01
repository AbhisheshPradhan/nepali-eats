# New taxonomy tags needed (worker queue)

Workers append here when a dish/protein has no existing slug in `web/lib/menu/taxonomy.ts`.
The main window batches these into taxonomy.ts + re-runs seed-taxonomy, then reseeds.

- salad (dish) — Baar Pipaal (Nepali Salad, House Salad) — currently tagged []
- fried-chicken (dish) — Baar Pipaal (Fried Chicken; also common at momo/bar spots) — currently tagged []
- tacos (dish) — Baar Pipaal (Cross Continentals novelty) — currently tagged []
- nachos (dish) — Baar Pipaal (Cross Continentals novelty) — currently tagged []
- calamari (dish) — Baar Pipaal (Salt & Pepper Calamari) — currently tagged []
- makai / grilled corn (dish) — Laltin (Poleko Makai; also "Corn Lollipop") — currently tagged []
- fried-fish (dish) — Laltin (Tareko Machha; protein `fish` exists but no fry-dish slug) — currently tagged []
- chips / aloo chips (dish) — Laltin (Aalu Chips, Hot Chips) — currently tagged []
- salad — also seen at Laltin (Green Salad, Chicken Corn Salad) & Himalayan Tandoor (Garden Salad)
- pulao (dish) — Himalayan Tandoor (Kashmiri/Pea/Vegetable Pulao; distinct from biryani) — currently tagged []
- fried-fish / fish & chips (dish) — also Himalayan Tandoor (beer-battered Flake/Flathead) — currently tagged []
- kati-roll / roll (dish) — Lahana (Katti Roll) — currently tagged []
- fokso (dish, buff lungs/offal) — Lahana (Fokso Fry) — currently tagged []
- chopsuey (dish) — Lahana (Chopsuey, veg/egg/chi/goat/lamb/buff/mixed) — currently tagged []
- poleko-momo (momo prep, grilled) — Lahana (Poleko Momo) & Laltin (poleko) — tagged [momo] fallback
- choila-momo (momo prep) — Lahana (Choila Momo) — tagged [momo] fallback
- aloo / potato dish (Mustang Aalu, Fried Aalu, Halwa Puri, Chole Bhature) — Lahana — currently tagged []
- fried-fish — also Lahana (Machha / Fried Fish; protein fish set, dish []) [dup of Laltin need]
- kachila (dish, newari raw-marinated meat; distinct from choila) — Tusa (Beef Kachila) — currently tagged []
- saag (dish, greens/spinach) — Tusa (Chicken Saag) — currently tagged []
- chokha (dish, mashed potato/tomato) — Tusa (Potato Chokha) — currently tagged []
- thenthuk / thenduk (dish, Tibetan pulled-noodle soup; thukpa family) — Tusa (Goat Thenduk; tagged [soup] fallback)
- batuk (dish, newari fried lentil patty; near bara) — Tusa (Batuk Chukhauni) — currently tagged []
- dosa (dish, South Indian rice pancake) — Lababdar (Plain/Masala/Keema/Paneer/Rawa/Chicken & Cheese Dosa) — currently tagged []
- crab (protein) — Lababdar (Crab Pitta, Khelala Crab Curry) — protein left unset
- scallop (protein) — Lababdar (Chilli Prawns Scallops & Calamari, Malabari Mix Seafood) — protein left unset
- calamari (protein) — Lababdar (Chilli Prawns Scallops & Calamari, Malabari Mix Seafood) [dish-slug already noted above for Baar Pipaal] — protein left unset
- souvlaki (dish, Greek skewer) — JHEER HOUSE (Souvlaki Packs, Souvlaki Box, Souvlaki per Stick, Souvlaki Wraps) — currently tagged []
- gyros (dish, Greek) — JHEER HOUSE (Lamb/Chicken Gyros, Gyros Wrap Pack) — currently tagged []
- wrap / kebab-wrap (dish) — JHEER HOUSE (Jheer Wraps, Souvlaki Wraps, Falafel Wrap) — currently tagged []
- burger (dish) — JHEER HOUSE (Grilled Chicken/Haloumi/Cheese/Kids Burger, Aussie Juicy Giant) — currently tagged []
- shaved-meat / doner (dish, kebab-style shaved meat) — JHEER HOUSE (Shaved Meat, Shaved Snack Box, Loaded Box) — currently tagged []
- chips / hot chips (dish) — also JHEER HOUSE (Chips S/M/L, Haloumi Chips) [dup of Laltin need] — currently tagged []
- salad — also JHEER HOUSE (Greek/Tabouli/Coleslaw) [dup of earlier need]
- chicken-65 (dish) — Indus Surfers Paradise (South Indian deep-fried spicy chicken appetiser; appears on many Indian/Nepali menus)
- manchurian (dish) — Indus Surfers Paradise (Indo-Chinese Gobi/Veg/Chicken Manchurian)
- dal / lentils (dish) — Indus Surfers Paradise (Tadka Dahl, Dahl Makhni, black lentil — no plain-dal tag; only dal-bhat set exists)
- gundruk (dish, fermented leafy greens; Gundruk Bhatmas) — Momos Hub — tagged [curry] fallback
- bao / bao-buns (dish) — Street Eats (Pork Belly Bao Buns) — currently tagged []
- pizza (dish) — Street Eats (Kids Ham/Cheese/Pineapple Pizza; likely recurs at fusion spots) — currently tagged []
- poke-bowl (dish) — Street Eats (Japanese Poke Bowl) — currently tagged []
- quesadilla / enchilada (dish, Mexican) — Street Eats (Beef Brisket Quesadillas, Enchiladas Verdes) — currently tagged []
  (Street Eats is a fusion bar: chau-chau→[chowmein], nasi goreng→[fried-rice], chicken 65 biryani→[biryani] mapped OK; gyros/burger/tacos already logged above)
- dhido (dish/thali, buckwheat pudding meal) — Momos Hub (Dhido ko Thali) — tagged [dal-bhat, thali] fallback
- rajma (dish, kidney-bean curry) — Momos Hub — tagged [curry] fallback
- manchurian / manchuria (dish, Indo-Chinese) — Chilli Everest (Mix Veg Manchuria, Momo Manchuria) — currently tagged []/[momo]
- tapari-momo (momo prep, served in leaf plate) — Chilli Everest (Tapari Momo) — tagged [momo] fallback
- aloo-nimki / nimki (dish, fried snack) — Chilli Everest (Dharane Aloo Nimki; Chat "Nimki") — currently tagged []
- puri / puri-tarkari (dish, fried bread w/ curry) — Chilli Everest (Puri Tarkari) — currently tagged []
- NOTE: Chilli Everest "Papad Masala" and "Pav Vaji" omitted (no price printed on menu)
- gravy-momo / dressing-momo / crunchy-momo (momo preps) — Magic Momo Kafe — tagged [momo] fallback (sekuwa/grilled momo → dup of poleko-momo need)
- schezwan (style/prep, Indo-Chinese chilli sauce; applies to chowmein & fried rice) —
  Momo Ghar (Schezwan Chowmein, Schezwan Rice) — tagged [chowmein]/[fried-rice] fallback
- bhutuwa (dish, Nepali garlic-ginger pan-fried/stir-fried meat; distinct from curry) —
  Himali Gurkha (Chara Ko Bhutuwa, Sabjee Ra Chara, Stir fried Beef & Vegetables) — tagged [] fallback
- soya-chaap / chaap (dish, mock-meat) — Spice Mix (Malai/Vegan Soya Chaap, Soya Chaap Masala) — currently tagged [tandoori]/[curry] fallback
- kofta (dish, veg/meat balls) — Spice Mix (Malai Kofta) — tagged [curry] fallback
- pulao / pilaf (dish, flavoured rice) — Spice Mix (Peas/Kashmiri/Lemon/Coconut Pulao) [dup of Himalayan Tandoor pulao need] — currently tagged []
  (Spice Mix "Munchurian", "Sixty Five 65" → manchurian/chicken-65 already logged; raita/papadum/green-salad sides tagged [])
- spring-roll (dish) — Kathmandu Newa Chhe'n (Spring Roll) — currently tagged []
- tibetan-bread (dish, fried Tibetan flatbread / balep) — Kathmandu Newa Chhe'n (Tibetan Bread) — currently tagged []
  (Kathmandu Newa: used now-live saag on Churpi Saag & fried-fish on Tareko Macha; kofta (Kofta Balls/Aloo Kofta) already logged)

## RESOLVED 2026-07-01 (batched by coordinator)
ADDED to vocab (usable now): dosa, pulao, saag, chopsuey, kati-roll, thenthuk,
kachila, batuk, chokha, makai, fried-fish, fokso, poleko-momo, choila-momo,
+ proteins crab, scallop, calamari.
SKIPPED (non Nepali/Indian/Tibetan, left []): souvlaki, gyros, doner, burger,
wrap, tacos, nachos, salad, chips.
BACKFILL (retag+reseed at end): Laltin(makai,fried-fish), Himalayan Tandoor(pulao,
fried-fish), Lahana(kati-roll,fokso,chopsuey,poleko/choila-momo), Tusa(kachila,saag,
chokha,thenthuk,batuk), Lababdar(dosa,crab,scallop,calamari).

## RESOLVED round 2 (2026-07-01)
ADDED: chicken-65, manchurian, dal, gundruk, dhido, rajma, nimki, puri, chaap,
kofta, spring-roll, tibetan-bread, tapari-momo. SKIPPED (not Nep/Ind/Tib): bao,
pizza, poke-bowl, quesadilla, enchilada, gravy/dressing/crunchy-momo (→ map to
jhol/fried at reseed). Backfill queue extends: +Indus GC(chicken-65,manchurian,dal),
Momos Hub(gundruk,dhido,rajma), Chilli Everest(manchurian,tapari-momo,nimki,puri),
Spice Mix(chaap,kofta,pulao,manchurian,chicken-65), Kathmandu Newa(spring-roll,tibetan-bread,kofta), Street Eats(fusion, skip Western).

## SKIPPED — no real own-site menu (2026-07-01)
- momo-central-brunswick (Momo Central Brunswick, VIC) — menu_url/website
  momocentralbrunswick.shop is a thin auto-generated SEO microsite: /menu shows
  only 3 promo "Vegan Snacks" items + marketing blurb, no full menu, no PDF/images,
  no own ordering. Not seeded (claim lock kept). Revisit if a real menu appears.

## SKIPPED restaurants (no own-site priced menu) — 2026-07-01
- crimson-and-blue-millswood (Millswood, SA, 351 rev): own site
  crimsonandblue.com.au/our-menu/ has NO menu content (no prices/PDF/images) — it's a
  marketing page that delegates ordering to ordereats.com.au (blocklisted platform). No
  own-site menu to seed. Not seeded (claim lock kept). Revisit if they publish a real menu.
- de-bhatti-mount-lawley (Mount Lawley, WA, 409 rev): NOT skipped — origin was down
  (HTTP 522 on bhatti.com.au) at seeding time; claim released for a later retry when up.
- indus-curry-express-authentic-indian-nepalese-restaurant-geebung (Geebung, QLD,
  735 rev): own domain induscurryexpress.com is DEAD/parked — homepage + /menus
  both return a 114-byte JS redirect to /lander, which fails to resolve (HTTP 000).
  No own-site menu, no PDF, no images. Not seeded (claim lock kept). Likely the
  restaurant/domain lapsed; revisit if a live own site reappears.
- mul-chowk-kitchen-sydney-campsie (Campsie, NSW, 995 rev): own website
  (mulchowkkitchen.com.au) has only SEO/marketing pages + JSON-LD dish lists with
  NO prices. Its "Menu" button links to mccatering.com.au = a catering-packages
  site (no per-item dine-in prices). No aggregator seeding per rules. Set
  catering=true; menu_url left as-is. Not seeded.
- the-savoury-dining-bar-north-strathfield-north-strathfield (North Strathfield, NSW)
  — NOT NEPALI. Its own site (thesavourydiningns.com) is a VIETNAMESE restaurant
  & bar ("the taste of Vietnam", pho, Vietnamese tapas/cocktails). Mis-flagged as
  is_nepali. Not seeded (claim lock kept). Coordinator: consider is_nepali=false /
  relevance review to hide it from the directory.
- ribs-lane-subiaco (Subiaco, WA) — NOT NEPALI. ribslane.com.au is an American
  BBQ/ribs joint (pork/lamb/beef ribs, burgers, lobster/seafood boil, steaks,
  wings). Mis-flagged as is_nepali. Not seeded (claim lock kept). Coordinator:
  is_nepali=false / relevance review.
- pangra / gizzard (dish, offal) — Falcha Penshurst (Pangra Fry) — currently tagged []
- hyakula (dish, mutton rib) — Falcha Penshurst (Dhameko Hyakula) — currently tagged []
- badel (protein, wild boar) — Falcha Penshurst (Jhaneko Sekuwa/Set "Badel") — variant protein left unset
- crispy-corn — Falcha Penshurst (Crispy Corn); relates to makai already logged — tagged []

## Aagaman (Port Melbourne) — seeded 2026-07-01 (74 items, NO prices)
Own-site menu.html; page declares "One menu across Port Melbourne, Flinders Lane
and Rosanna" so the SAME JSON applies to the other 2 branches
(aagaman-...-melbourne-cbd-flinders-lane id 498, aagaman-...-rosanna id 527) —
main window can copy the JSON to those slugs + seed if desired (not an assumption:
restaurant states one shared menu). No prices published on any branch.
New tag gaps (tagged [] for now):
- salad (already queued) — Garden Salad
- raita (side/condiment) — Raita
- papadum (side) — Papadums
- plain/flavoured rice (dish) — Saffron Rice, Coconut Rice, Jeera Pyaza Rice (only
  `pulao`/`biryani`/`fried-rice` exist; used [] for these, `pulao` for Kashmiri Pulao)
- lamb-chop → mapped to `tandoori`; paratha (Aloo Paratha) → mapped to `roti`

## Ayla Bar & Restaurant — seeded 2026-07-02 (45 items, dinner menu + drinks)
New tag gap (tagged [] for now):
- chatpate / chatpatay (dish) — Ayla "Chatpatay (Noodle Snack)" (Nepali puffed-noodle
  street snack; distinct from `chaat`). Also common elsewhere. currently []
- loaded-fries / burger / parma / schnitzel / mozzarella-sticks / tacos — Western
  fusion items, left [] (tacos already queued as skip).
Note: Ayla's express-lunch menu is the same dishes at lower lunch prices — seeded the
dinner menu only (canonical) + drinks (dinner menu has none, bar menu separate).
- fried-chicken (dish) — also Chulho (Nepali Style Chicken Fried, fried chicken with bone) [dup of Baar Pipaal need] — currently tagged []

- de-bhatti-mount-lawley — SKIPPED 2026-07-02: own site bhatti.com.au down (Cloudflare 522 origin timeout across whole domain). Retry when origin is back. Claim kept.

## Rolling Flavors (Subiaco, WA) — seeded 2026-07-02 (81 items, own-site menu w/ prices)
Nepali/Newari/Tibetan + Middle-Eastern fusion (kebab wraps, hummus, falafel, kenafeh).
New tag gaps (tagged [] for now):
- chatpate (dish) — "Chatpate" (already queued from Ayla) — []
- salad / green-salad (dish) — "Green Salad" (already queued from Aagaman) — []
- raita (side/condiment) — "Raita" (already queued from Aagaman) — []
- french-fries / chips (side) — "French Fries" — []
- hummus (dish, Middle-Eastern) — "Hummus and Bread", "Hummus meat/chicken and bread" — []
- falafel (dish, Middle-Eastern) — "Falafel Wrap"/"Falafel wrap meal" — []
- kebab-wrap / doner (dish) — the "Kebab Wrap"/"Kebab meal" family (chicken & "meat") — []
- kenafeh (dessert, Middle-Eastern) — "Kenafeh served with ice cream" (has dessert tag) — []
- fried-cauliflower (dish) — "Fried Cauliflower" — []
- kids-meal (dish) — "Kids meal" — []
- box-plate / meal-box (format) — the "Box Plate" combos — mostly [] (chilli where applicable)
Mapping notes:
- "Flavor's rice" (aromatic spiced house rice) → pulao. Plain rice → [].
- "Boudhali Keema Noodles" category: Chicken Keema Noodles + Vegetarian Noodles → keema-noodle.
- Momo grid = 5 preps (steamed/kothey/fried/chilli/jhol) × proteins chicken/veg/potato
  (potato = protein "veg", is_vegetarian, label "Potato").
⚠️ PRICE TYPO CORRECTED: site lists "Black Tea $35.00" — clearly a typo for $3.50
  (Masala Tea is $5.00). Seeded as 3.50. Confirm with owner if a claim lands.
- lankan-railway-cafe — SKIPPED 2026-07-02: NON-NEPALI leak, actually Sri Lankan ("authentic taste of Sri Lankan railway"). DB cuisine=Nepalese is wrong; candidate for is_nepali=false. Claim kept.

## SKIPPED — yuvi-kitchen (Burnie, TAS, id 973, 320 rev) — 2026-07-02
Own site yuvikitchen.com is a thin auto-generated marketing microsite (by "DigiSpace
Solutions"): "Popular Menu" shows only 4 sample items (Aussie Burger, Chicken Biriyani,
Chicken Momos, Vanilla & Orange Cheesecake) with NO prices + a "Request Full Menu"
button. No full menu, no PDF/images, no priced items. /menu 404s; menu_url is a
"#menu" anchor on the same microsite. Also branded "Fast Food Restaurant" (burgers/
wraps/fries) with only momos+biryani as Nepali signal. Not seeded (claim lock kept).
Same pattern as momo-central-brunswick. Revisit only if a real priced menu appears.
- yuvi-kitchen — SKIPPED 2026-07-02: own site (Wix) shows only a 4-item teaser "POPULAR MENU" with NO prices ("Request Full Menu"). Generic fast-food (burgers/fries), only "Chicken Momos" is Nepali-adjacent. No priced own-site menu to seed. Claim kept.

## Old Durbar - Flinders (Melbourne CBD, VIC, id 494) — seeded 2026-07-02 (42 items, own-site menu w/ prices)
Source: own domain old-durbar.com.au/our-cuisines/ (had junk menu_url "http://menu/";
updated menu_url to the real page). Site stacks 3 branch menus in Bootstrap tab-panes
(#brunswick / #flinders / #nunawading) — they DIFFER, so I extracted the #flinders pane
only. Brunswick/Nunawading are separate rows still unseeded (each has its own pane on
this same page: Brunswick has extra Drinks + Tandoori Breads + more curries; Nunawading
separate). Ordering links go to POSApt (orderonline.posapt.au) = platform, ignored.
New/again tag gaps (tagged [] for now):
- chatpate/chatpatt (dish) — "Chatpatt" (already queued from Ayla/Rolling Flavors) — []
- buffet (format) — "Buffet (All you can eat)" — []
- chiura / beaten-rice (side) — "Chiura (Beaten Rice)" — []
- kids-meal — "Chips and Nuggets" — []
Mapping notes:
- "Khasi ko Bhutan" (goat/lamb offal fry) → bhutan, protein goat.
- Combined-price lines ("Chicken $x / Goat $y / Buff $z") consolidated to variants
  (Choyla, Sekuwa, Sekuwa Set, Choyla Set, Momos, Chowmein, Fried Rice, Thali).

## Himalayan Nepalese Restaurant and Cafe (Mosman Park, WA) — seeded 2026-07-02 (64 items, own-site menu)
Own-domain WordPress menu (https://himalayanrestaurant.com.au/menu), real dine-in prices.
No NEW tag gaps needed a new slug — everything mapped to existing vocab.
Items left tagged [] (no suitable slug; already-queued sides): Papadam + Kakro ra Dahi
(cucumber-yoghurt raita) → papadum / raita already queued above. Also plain steamed
rice ("Bhuja"), stir-fries ("Mismas", "Chicken with Vegetable", "Aloo Bhuteko"), and
Family Value Pack combos left [] (no dish slug; fine).
Judgment calls:
- "C Momo" and "Chilli Momo" both mapped to chilli-momo (menu lists both, same price).
- "Khasiko Sekuwa" ($34, chef special): name = khasi (goat) but description reads
  "French lamb cutlets" (their menu copy-pastes the same desc onto Lamb Daal Curry too).
  Set protein=goat by the dish NAME; description transcribed verbatim despite the conflict.
- "Chilli Paneer" / "Saag Ra Paneer" / "Paneer ko Tarkari" → paneer kept as variant
  protein (not a tag), dish tag = chilli / saag / curry.
⚠️ DUPLICATE ROW: id 857 `himalayan-nepalese-restaurant-cafe` (0 reviews, same suburb
Mosman Park, same website himalayanrestaurant.com.au) is a dup of the seeded id 795.
Coordinator: merge, or copy this JSON to 857 and seed it too (same menu).

## Old Durbar - Brunswick (VIC, id 515) — seeded 2026-07-02 (97 items, own-site menu w/ prices)
Source: #brunswick tab-pane of old-durbar.com.au/our-cuisines/ (menu_url updated from
"http://menu/"). Distinct menu from Flinders (bigger: full Indian curry range, biryani,
tandoori breads, drinks). Tag gaps (tagged [] for now):
- alu-tama (dish, Nepali bamboo-shoot/black-eyed-bean curry) — "Alu Tama" — []
- alu-jeera (dish) — "Alu Jeera" — []
- papadum (side) — "Papadum" (already queued from Aagaman) — []
- chiura / beaten-rice (side) — "Chiura (Roasted Beaten Rice)" — []
- raita (side) — already queued — []
- butter-momo (momo prep) — "Butter Momo (8pcs)" tagged just [momo] — []
- soup-momo (momo prep) — "Soup Momo" tagged [momo, soup] — approximated
- momo-chutney (side) — "Momo Chutney" — []
Mapping notes:
- "Khasi Ko Bhutan" (offal fry) → bhutan, goat. Onion Bhaji → pakora.
- Nepali Khaja Set: consolidated per-protein "Set" and "Only" listings into variant
  labels ("Goat Set"/"Goat Only"/...) on two items (Sekuwa Set/Only, Choyla Set/Only).
⚠️ PRICE TYPO CORRECTED: site listed "Chicken Choyla Set $8.95" — clearly a dropped-"1"
  typo (its "Only" is $16.95; sibling sets are $18.95-$21.95). Seeded as 18.95 (matches
  Chicken Sekuwa Set). Confirm with owner if a claim lands.
NOTE: 3rd branch old-durbar-...-nunawading is the #nunawading pane on the same page,
also unseeded — being handled next this session.
- sanyakuna (dish, Newari jellied goat-meat soup) — Maicha — tagged [newari] fallback
- jibro / goat tongue fry (dish, offal) — Maicha (Jibro Fry) — tagged [] (protein goat)
- badel / wild boar (dish or protein) — Maicha (Badel Tareko, fried wild boar) — tagged [] (protein pork used as nearest)
- the-hungry-hiker-indian-nepali-restaurant (Tecoma, VIC) — own site publishes only
  a SAMPLE menu PDF (thehungryhiker.com.au/menus/2026 website menu.pdf): one priced
  "A Taste Of The Hiker" set ($75/guest, min 2) + ~5 price-less "Selected Specialties"
  descriptions (Grand Goat Curry, Everest Pepper Lamb, Nepali Fish Curry, Butter
  Chicken, Coriander Pepper Prawns). No per-item prices. NOT seeded (would set a
  misleading $75 price floor). Claim lock kept. Revisit if a full priced menu appears.

## Raato Ghar (Granville, NSW) — seeded 2026-07-02 (58 items, own-site menu, catering=true)
Own-domain WordPress menu (https://raatoghar.com/menus/), real dine-in prices. Advertises
catering ("Book Catering" + packages) → catering=true set.
NEW tag gaps (tagged [] for now, no existing slug):
- bhutuwa (dish, Nepali spicy stir-fry) — "Kukhurako Bhutuwa" (chicken bhutuwa). Common
  Nepali dish (kukhura/khasi ko bhutuwa). Worth a real slug — currently [].
- raj-khani (dish?) — "Raj Khani" ($16.99 "spicy Nepali-style meat dish"). Unclear/regional;
  left [] pending identification.
- pangra / gizzard (offal) — "Pangra Fry" — already queued (Falcha Penshurst) — []
- salad — "Nepali Salad" — already queued — []
Judgment calls:
- Momo is a prep×protein matrix; split to 4 prep items (Steamed/Fried/Jhol/Chilli), each
  with Veg/Chicken/Buff variants. Chowmein/Fried Rice/Thukpa consolidated to one item w/
  protein variants.
- "Chhoila Khaja Set" showed two prices "$21.99 / $22.99" with no labels — inferred
  Chicken/Buff from their à-la-carte Chhoila (Chicken/Buff) convention. Verify if wrong.
- "Keema Noodle" ($15.99) appears in BOTH Specials and Noodles sections on the menu —
  transcribed in both (faithful to the page); shows as 2 items.
- Tibetan-origin snacks (laphing) + pani-puri roll up nepali-indian/tibetan styles via
  existing slugs — expected.

## Old Durbar - Nunawading (VIC, id 509) — seeded 2026-07-02 (116 items, own-site menu w/ prices)
Source: #nunawading tab-pane of old-durbar.com.au/our-cuisines/ (menu_url updated).
Largest of the 3 Old Durbar branches; distinct prices/items (higher prices, extra
seafood/lamb-goat specialties, vegan butter chicken). All 3 Old Durbar branches now
seeded (Flinders 42, Brunswick 97, Nunawading 116) from their own #tab panes.
Tag gaps here (tagged [] for now, add to the batch):
- aloo-tikki / aloo-mattar-tikki (dish) — "Aloo Mattar Tikki" — []
- alu-jeera (dish) — already queued (Brunswick) — []
- alu-tama (dish) — already queued (Brunswick) — []
- kulcha (bread) — "Masala Kulcha" tagged [naan] (approx) 
- lamb-cutlet (dish) — "Lamb Cutlets" — []
- saffron-rice / pea-rice / coconut-rice (rice sides) — tagged [] (only pulao/biryani/
  fried-rice exist; Kashmiri Pulao -> pulao)
- kachumber (salad) — "Kachumber" — [] (salad gap already queued)
- papadum / chiura / raita — already queued — []
Mapping notes: "Butter Momo" (butter-chicken-sauce momo) -> [momo]; "Soup Momo" ->
[momo, soup]; "Vegan Butter Chicken" (soy) -> [butter-chicken, curry] is_vegetarian.

## Fuda Global Street Bites (Darwin City, NT, id 983) — seeded 2026-07-02 (44 items, own-site menu w/ prices)
Source: fuda.com.au/menu (server-rendered, pulled via menu-fetch.js — no image tokens).
Momo/kebab/bubble-tea fusion; the momo half is genuinely Nepali. Modelled the momo
grid as prep=item, protein=variant, size(6pc/10pc)=two categories (Entrées/Mains).
DECISION: marked venue-level **`fusion=true`** (new editorial boolean column, like
`catering`). The Turkish kebab/doner/shish/kofta + dip items stay tagged `[]` BY DESIGN
(non-Nepali cuisine on a fusion spot, no Nepali dish slug) — these are NOT pending
taxonomy adds; do NOT add kebab/doner/shish/dip slugs for them. Bubble tea = `[drinks]`.
Notes: kebab section is "100% Halal Certified" (supplier) — consider restaurant-level
halal_status='options' (kebabs halal, momo unstated). Not set during seed.
