# NepaliEats — Directory Page Copy System

Copy for the SEO money pages: city, suburb, tag, the momo flagship, and the
restaurant detail page. Written in the project voice (see
[VOICE_AND_TONE.md](VOICE_AND_TONE.md)). Drop-in, no code changes here. Dash-free,
AU-spelled.

These pages currently run a single intro sentence over a card grid (SEO_AUDIT
§4). To rank they need real content. This doc gives you the copy; the template
needs new slots for it (intro paragraphs, a "what to order" block, an FAQ, and
cross-links). Variables in `{braces}` come from the DB or the page query.

---

## A. Reusable dish lines (write once, use everywhere)
Keep these consistent across the whole site. Specific, short, appetite-first.

- **Momo:** Nepal's famous dumplings, steamed or fried, served with fiery achaar.
- **Jhol momo:** momo swimming in a warm, nutty, spiced soup.
- **C-momo:** chilli momo, pan-tossed in a sticky, hot sauce.
- **Thakali dal bhat:** the Thakali thali. Black dal, rice, gundruk and a spread
  of sides, with refills until you tap out.
- **Sel roti:** a sweet, ring-shaped rice bread, crisp outside and soft within.
- **Newari (choila, bara, samay baji):** the Newari table, smoky choila, lentil
  bara and the samay baji spread.
- **Tibetan (thukpa, laphing):** Tibetan-Nepali warmers, thukpa noodle soup and
  cold, springy laphing.
- **Sikarni / juju dhau:** Nepali sweet yoghurt, the way to finish a meal.

---

## B. City / state pages (`/nepali-restaurants/[state]`)
Two short intro paragraphs, then the grid, then a "what to order" line and an FAQ.

- **H1 (KEEP):** `Nepali restaurants in {State Name}`
- **Eyebrow (KEEP):** `All across {STATE}`
- **Intro paragraph 1 (CHANGE, count + geography):**
  `{State Name} has {N} Nepali spots on the map, from {metro} out to the regions. Most cluster around {top suburb}, {second suburb} and {third suburb}, where momo turns up on nearly every menu.`
- **Intro paragraph 2 (what to expect):**
  `Expect everything from quick momo windows to full Thakali dal bhat sets and weekend market stalls. Here is every Nepali kitchen, cafe and food truck we have found in {State Name}.`
- **What to order block (heading + line):**
  - Heading: `What to order in {metro}`
  - Body: `Start with momo. Order a Thakali dal bhat set for the full spread, add gundruk if you want something sour and fermented, and finish with sel roti or sikarni.`
- **Cross-links (NOTE, SEO_AUDIT §2/§6):** below the grid, link to the suburbs in
  this state and to the cuisine pages (`Momo`, `Thakali`, `Newari`, `Veg`).

## C. Suburb pages (`/nepali-restaurants/[suburb]`)
- **H1 (KEEP):** `Nepali restaurants in {Suburb}`
- **Eyebrow (KEEP):** `{Suburb}, {STATE}`
- **Intro (CHANGE):**
  `{N} Nepali spots in {Suburb}, {State}, from sit-down kitchens to takeaway momo. {one line naming the standout cuisine if a tag dominates, else:} Momo, thali sets and more, all close to home.`
- **What to order (reuse the block from B).**
- **Cross-links (NOTE):** "More Nepali food near {Suburb}" linking to the parent
  city page and 2-3 neighbouring suburbs.

## D. Tag pages (`/tag/[tag]`)
Each tag gets its own intro (2-3 sentences) plus the dish line from section A.
Replace the current one-liners.

- **Momo** (flagship, lives at `/momo`, see section E).
- **Thakali** (`/tag/thakali`):
  - H1: `Thakali restaurants across Australia`
  - Intro: `The Thakali thali is Nepal's comfort food. Black dal, rice, gundruk and a spread of sides, with refills until you tap out. These are the kitchens serving it across Australia, set by set.`
- **Newari** (`/tag/newari`):
  - H1: `Newari food across Australia`
  - Intro: `Choila, bara and the samay baji spread. The Newari table is smoky, sour and built for sharing. Here is where to find it around the country.`
- **Tibetan** (`/tag/tibetan`):
  - H1: `Tibetan and Nepali spots across Australia`
  - Intro: `Thukpa to warm you up, laphing to cool you down. The Tibetan-Nepali kitchens worth seeking out, all in one place.`
- **Vegetarian** (`/tag/vegetarian`):
  - H1: `Vegetarian Nepali food across Australia`
  - Intro: `Generous veg thali, meat-free momo and plenty of gundruk. The Nepali kitchens that do vegetarian properly, gathered here.`
- **Nepali-Indian** (`/tag/indian-nepali`):
  - H1: `Nepali-Indian restaurants across Australia`
  - Intro: `Curries, tandoor and momo under one roof. The Nepali-Indian kitchens across Australia, side by side.`

## E. Momo page (`/momo`, flagship landing)
This is your highest-volume term. Give it the most content.

- **H1 (KEEP):** `Best momo in Australia`
- **Eyebrow (KEEP):** `Find your momo people`
- **Intro paragraph 1 (KEEP, lightly trimmed):**
  `Steamed, fried, jhol or C-momo. These are the kitchens, cafes and trucks fogging up their windows with great momo across the country. Follow the queues and never skip the achaar.`
- **Intro paragraph 2 (CHANGE, add the styles, good for search + AI answers):**
  `New to momo? Steamed is the classic, fried gives you crisp edges, jhol comes in a warm spiced soup, and C-momo is tossed in a hot chilli sauce. Filling runs from buff and chicken to veg and paneer.`
- **What to order line:** `If it is your first time, get a plate of steamed buff momo and a side of jhol to dip into.`

## F. FAQ copy (add to city, suburb, and the momo page)
Three questions each, answered honestly and usefully. Supports FAQ schema and AI
answers (SEO_AUDIT §4/§5).

- **Q: Where is the best momo in {city}?**
  `{city} has {N} spots serving momo, from steamed and fried to jhol and C-momo. Sort by rating on the map to see local favourites, or browse the list below.`
- **Q: Are there halal Nepali restaurants in {city}?**
  `Many Nepali kitchens serve halal meat or offer halal options. We are adding halal details to each listing, so call ahead to confirm with the kitchen.`
  (Honest while `halal_status` is mostly unknown. Update when the data lands.)
- **Q: What should I order at a Nepali restaurant?**
  `Start with momo. Order a Thakali dal bhat set for the full spread, try gundruk if you like sour and fermented, and finish with sel roti or sikarni.`
- **Q: How much does Nepali food cost in {city}?** (where price data is good)
  `Most spots in {city} sit around {priceRange}. Momo plates are the cheap, filling option. Thali sets cost a little more and usually come with refills.`

---

## G. Restaurant detail page

### G1. Blurb generator rewrite (replaces `autoBlurb`, lib/format.ts)
The current blurb is one fixed sentence reused on every page, which reads as
templated thin content (SEO_AUDIT §3). Replace it with a small generator that
varies the sentence and only includes clauses when the data exists. This is a
spec plus copy, not code, since you asked me not to edit code.

**Rules**
- Pick the opener by `hash(id) % openers.length` so pages vary.
- Add each middle clause only when its data is present.
- Never default to "authentic" or "hidden gem". Name dishes instead.
- Keep it to 2-3 short sentences. Vary the closer.
- The meta description uses a compact one-sentence version, not the full blurb, so
  the snippet and the on-page text are not identical.

**Openers (choose one)**
1. `{name} is a Nepali {venueType} in {suburb}, {state}.`
2. `In {suburb}, {name} serves Nepali food to {state}.`
3. `{name} brings Nepali cooking to {suburb}, {state}.`
4. `{name} is one of {suburb}'s Nepali {venueType}s.`

**Middle clauses (include when data exists)**
- tags: `Known for {tag1}, {tag2} and {tag3}.` or `Come for the {tag1}.`
- no tags: `Expect momo and Nepali home cooking.`
- price: `Plates run {priceRange}.`
- rating + reviews: `Locals rate it {rating} on Google across {reviewCount} reviews.`

**Closers (vary)**
- `Open today {todayHours}.` (when hours known)
- `Call ahead for today's specials.`
- `Directions, hours and contact below.`

**Example outputs**
- `Himalayan Hut is a Nepali restaurant in Harris Park, NSW. Known for momo, Thakali and veg-friendly plates. Locals rate it 4.6 on Google across 312 reviews.`
- `In Footscray, Everest Kitchen serves Nepali food to Victoria. Come for the momo. Plates run $$. Call ahead for today's specials.`

### G2. Detail page microcopy
- **Back link (CHANGE):** `Back to the map` (currently "Back to spots"; it links to
  `/explore`, so "the map" is clearer).
- **Section: Photos (KEEP)**
- **Section: The menu (KEEP)**
- **Menu empty state (KEEP):** `The full menu is coming soon. Call ahead for today's specials.`
- **Section: What people say (KEEP)**
- **Reviews line (KEEP):** `{n} reviews on Google`
- **Read on Google (KEEP)**
- **Sidebar CTAs (KEEP):** `Get directions`, `Call the kitchen`, `Visit website`
- **More spots block (KEEP copy):** `More spots in {suburb}`
  - **NOTE (SEO_AUDIT §2):** point this at `/nepali-restaurants/[suburb]`, not
    `/explore?suburb=`. Add a sibling link to the state page.

---

## What needs a template change to hold this copy
The copy above assumes these new slots on the listing template (ListingGrid) and
detail page. Flagging so the build can make room:
1. Listing pages: second intro paragraph, a "what to order" block, an FAQ block,
   and a cross-links row.
2. Detail page: a "nearby spots" mini-list, and the richer blurb generator.
3. FAQ + ItemList JSON-LD to match the visible FAQ and list (SEO_AUDIT §5).
