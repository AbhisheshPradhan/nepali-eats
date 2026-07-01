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
