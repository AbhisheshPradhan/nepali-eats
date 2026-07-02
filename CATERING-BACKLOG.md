# Catering backlog + design note (revisit AFTER launch)

Generated 2026-07-03 from the live DB. Lists every venue that caters (or is a
caterer) so we can come back and capture catering menus properly later.

## Decision (for now)
- **Do NOT build a separate catering data model yet.** Ignore catering menus for
  now. If a catering menu IS supplied, seed it the interim way we did for Prisha:
  as normal `menu_categories`/`menu_items` — **one priced item per set**, courses +
  choice-lists transcribed verbatim in the item `description`, dish tags stamped on
  the set item. (See `prisha-catering-and-events-yennora.json`.)
- **After launch**, revisit the dedicated model (see the design note at the bottom).

## Catering-only / pure caterers (no à la carte to seed — single digits)
`venue_type = 'Caterer'`, no real dine-in menu. Catering menu is all they'd have.

| Name | Suburb | State | Reviews | Notes |
|---|---|---|---|---|
| Prisha Catering and Events | Yennora | NSW | 925 | SEEDED (interim, as normal menu) |
| Everest Function Centre | Rockdale | NSW | 329 | function/banquet venue |
| Anu Kitchen and Catering Services | Campsie | NSW | 324 | |
| Khaja | Villawood | NSW | 122 | |
| Newa Bhoye | Craigieburn | VIC | 91 | Newari bhoj house — verify if it also does dine-in |
| Khwopa Food And Catering | Kearneys Spring | QLD | 14 | `catering` flag currently null |
| Spice Route | Lidcombe | NSW | 29 | `catering` flag currently null — verify it actually caters |

## `venue_type = 'Caterer'` but really a restaurant (mislabeled — fix venue_type)
Has a full à la carte menu; the Caterer tag is noise.

| Name | Suburb | State | Menu items | Catering | Notes |
|---|---|---|---|---|---|
| Third Eye Windsor | South Windsor | NSW | 75 | null | à la carte seeded; may not cater at all |
| Raato Ghar | Granville | NSW | 58 | true | dual (also in the list below) |

## Restaurants that provide catering (dual) — à la carte + a catering menu we SKIPPED
`catering = true`, normal restaurant/café. À la carte is seeded; the **catering
flyer was deliberately skipped** at seed time. These are the real backlog to
capture when the catering model exists.

**Seeded (à la carte done, catering menu still uncaptured):**

| Name | Suburb | State | À la carte items |
|---|---|---|---|
| Kathmandu Momo | Surfers Paradise | QLD | 170 |
| Lakeside Gurkhas | Kingston | ACT | 195 |
| Chulho - Harris Park | Harris Park | NSW | 132 |
| Chulho Town Hall | Sydney | NSW | 132 |
| MoMo Planet | Victoria Park | WA | 121 |
| BHOYE CHHEN | Edwardstown | SA | 120 |
| Heshela Newa Khaja Ghar Rockdale | Rockdale | NSW | 95 |
| Heshela Newa Khaja Ghar Hurstville | Hurstville | NSW | 95 |
| The Hungry Buddha | Belconnen | ACT | 93 |
| Jhigu Bhoye Chhen | Coorparoo | QLD | 93 |
| MoMoCha Nepalese & Indian | Strathfield | NSW | 91 |
| Nepali Food Mandala | Dubbo | NSW | 86 |
| Mul Chowk Kitchen Sydney | Campsie | NSW | 85 |
| Himalayan Tandoor & Curry House | Bellerive | TAS | 79 |
| Maicha - Nepalese Restaurant | Burwood | NSW | 74 |
| Raato Ghar | Granville | NSW | 58 |
| Cafe Talk Kogarah | Kogarah | NSW | 57 |
| Little magic Momo Wanneroo | Wanneroo | WA | 55 |
| KUTUMBA LOUNGE | Unley | SA | 51 |
| Food House Nepal | Dee Why | NSW | 26 |
| momo shop | Hughesdale | VIC | 24 |
| Newari kitchen | Seven Hills | NSW | 18 |

**Not yet seeded (à la carte pending; catering flagged):**

| Name | Suburb | State |
|---|---|---|
| Namaste Strathfield (Nepali Indian Restaurant) | Strathfield | NSW |

> `catering = true` today is a hand-set "advertises catering" flag, set
> inconsistently. When we capture catering menus, "has a captured catering menu"
> becomes derivable from data; keep the flag as the softer signal.

## After-launch design note (the model we discussed, deferred)
When we come back: build a **dedicated `catering_sets` table** rather than forcing
catering into the menu tables. Rationale (from the 2026-07-03 discussion):
- Catering is **not menu-shaped** (set/package = one per-person price, courses,
  choice-lists; no dish line-items, no protein/size variants).
- We do **NOT** want catering in global dish search or in à la carte price facets.
  A separate table excludes it from all that **by construction** (no `WHERE type !=
  'catering'` sprinkled through queries).
- The dominant case is **dual venues** (a normal restaurant that also caters — ~22
  seeded already), so catering must attach to a restaurant **without touching its
  à la carte `menu_items`**. A side table does this with zero risk / no reseed.

Sketch: `catering_sets(id, restaurant_id FK, slug, title, subtitle, price,
price_unit default 'per_person', currency, courses jsonb, notes, position,
is_hidden, timestamps)`. `courses` = `[{heading, choices[]}]` (JSONB is fine here
precisely because we never query into it — the anti-JSONB rule is about
queryable menu content). Detail page renders a "Catering & Events" section from it.
Migrate Prisha's 7 interim `menu_items` into `catering_sets` at that point.
