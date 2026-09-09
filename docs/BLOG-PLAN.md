# Blog Plan — NepaliEats

Goal: own organic search for Nepali/Nepalese food across Australia. Blogs target
informational + editorial keywords; the programmatic directory/tag pages own the
commercial "best X in [place]" queries (except metro roundups, which have no
directory page and so the blog ranks for them).

All posts live at `/stories/[slug]` (Article + FAQ JSON-LD already in place).
Apply the human-copy standard to every post (no em/en dashes, no AI-tell words,
read it aloud). Run the `copywriting` skill + the AI-writing-detection checklist
before any post ships.

---

## Build TODO (do before drafting image-rich posts)

Current image support: **hero images work** (`Story.heroImage?` → `StoryImage`, none
populated yet). **In-body images do NOT work** — `StoryBody` only renders `h2|p|list|faq`.

- [ ] Add image block to `StoryBlock` union in `web/lib/stories.ts`:
      `| { type: "image"; src: string; alt: string; caption?: string; credit?: string }`
- [ ] Render the image block in `web/components/StoryBody.tsx` (reuse `StoryImage`,
      add `<figcaption>` for caption/credit, `loading="lazy"`, explicit width/height).
- [ ] Populate `heroImage` on the 3 existing posts.
- [ ] Decide dish-blog photo sourcing/rights (see Imagery section).
- [ ] Other template upgrades: Person author + bio, BreadcrumbList schema, real
      `dateModified`, vary the closing line (see "Template upgrades needed" below).

---

## Strategy in one line

Blogs = informational ("what is momo", "newari food") + editorial city/neighbourhood
roundups. Directory pages (`/momo`, `/tag/*`, `/nepali-restaurants/*`) = commercial
intent. Never let a blog fight a directory page for the same keyword.

### Cannibalisation fix (do before launch)

- Re-angle the existing momo post away from "best momo in Australia" (that's `/momo`'s
  keyword) toward informational "what is momo / the styles explained / how to order".
- Every city/neighbourhood blog links DOWN to the relevant
  `/nepali-restaurants/[state|suburb]` and `/tag` pages so authority flows to the directory.

### Verify every hub claim against the DB

Never assert a "Nepali hub" from memory. Query the DB first. Lessons already learned:

- Harris Park is **Little India**, not "Little Kathmandu" (7 spots, but Indian-branded).
- Footscray is NOT a Melbourne Nepali hub (only 2 spots).

---

## Four content pillars

1. **Dishes** (awareness / informational). Owns "what is **_" and "how to eat _**".
   Hub = the existing Nepali food guide. Spokes link up to it and out to the matching `/tag` page.
2. **Cities & neighbourhoods** (commercial / local). The traffic engine. Metro roundups
    - neighbourhood deep-dives, each linking down to state/suburb directory pages.
3. **How-to & dietary** (awareness, high conversion). Halal, vegetarian, how to order momo.
4. **Culture & seasonal** (shareable, link-earning). Dashain/Tihar food, community stories.

---

## Verified suburb clusters (from the DB, `is_nepali IS NOT FALSE`)

### Sydney / NSW

- **Auburn — 28 spots** (densest, west, avg 3.99): volume hub.
- **St George cluster — Rockdale 18 + Hurstville 11 + Kogarah 7 = 36** across adjacent
  southern suburbs, ratings ~4.2-4.3: strongest contiguous + best-rated zone. **Flagship neighbourhood story.**
- Granville 10, Strathfield 9, Harris Park 7 (4.51, highest avg but Little India), Parramatta 7.

### Melbourne / VIC

- **Melbourne CBD — 14** (4.31).
- **Northern corridor — Glenroy 10 + Coburg 6 + Brunswick 3 + Broadmeadows 2 + Craigieburn 4 = 25**
  across adjacent northern suburbs (Glenroy 4.48, Coburg 4.55, Broadmeadows 4.90): **the heartland.**
- Werribee 6 (west, secondary cluster).
- **Shepparton 7 (4.54)**: regional Victorian city, well-known Bhutanese-Nepali community.
  Its own standalone story, NOT part of the Melbourne metro post.

> Re-run the same query for QLD, WA, SA, ACT before drafting those city posts.

---

## Copywriting direction (house style)

- First-person, food-obsessed, never encyclopaedic. Write like a Nepali-Australian
  taking a friend out for the first time.
- Specific over generic, always. Name dishes, suburbs, the achaar, the buff filling.
- One keyword per post, front-loaded into H1, first 100 words, URL slug, one H2. No stuffing.
- City roundups follow a fixed skeleton: local story (which suburb is the hub) → 8-15
  named spots each with a one-line "what to order" → "how to choose" → links down to
  directory pages → FAQ.
- Every post: hero image + 1-2 inline dish photos (from `media/`), real human author
  byline, FAQ block, internal links up to the hub and out to directory pages.
- **Gloss every event at first mention, in ANY post type** (Abhishesh +
  Aasha, 2026-07-10, after the kwati post named Janai Purnima without saying
  when it is). The trigger is the mention, not the post type: a dish post,
  city guide or how-to that names a festival gives it a newspaper-style first-
  reference gloss covering what it is, when it is this year with the year
  spelled out ("in 2026 it falls on Friday 28 August", never a bare "this
  year"), and what that means for the reader in Australia. Repeat the date
  wherever the reader acts (the ring-ahead line) and in the FAQ ("when is X"
  is the search query). Verify dates against a reliable source, never from
  memory; lunar dates shift yearly and tourism blogs disagree.
- **Cap: one sentence of event context in a non-festival post.** If the event
  needs more than a sentence, that's a separate festival post the dish post
  links to (dish post owns "what is kwati"; festival post owns "when is Janai
  Purnima"); keeps the cannibalisation rule intact.
- **Yearly date refresh (every July):** re-check and update the year-stamped
  festival dates in `web/lib/stories.ts`. Currently dated: kwati post = Janai
  Purnima, Friday 28 Aug 2026 (verified 2026-07-10; 2027 lands mid-August);
  Dashain post = Ghatasthapana Sun 11 Oct + tika Wed 21 Oct 2026, Tihar post =
  Kaag Tihar Sat 7 Nov + Mha Puja Tue 10 Nov + Bhai Tika Wed 11 Nov 2026 (both
  verified 2026-09-03), plus every spoke in the Dashain & Tihar cluster below.

## Imagery (food blog = image-rich, not text-heavy)

Cadence: **image per H2 section, not per paragraph.** Hero (required) + one image per
section + extra inline images inside long sections (e.g. one per restaurant on city
pages). Targets ~1 image per 150-200 words: rich and editorial, not a slideshow,
without tanking page load.

### Block model change
Add an image block to `StoryBlock` in `web/lib/stories.ts`:
```ts
| { type: "image"; src: string; alt: string; caption?: string; credit?: string }
```
- `alt` mandatory (accessibility + image-search SEO). Descriptive + keyworded,
  e.g. "Steamed buff momo with tomato achaar at a Rockdale restaurant". Never "momo.jpg".
- `caption`/`credit` doubles as the restaurant attribution line.

### Photo sourcing & rights — OPEN DECISION
The 1,125 library photos are scraped from restaurant sites/Google. CLAUDE.md flags:
"confirm usage rights before storing." Editorial blog reuse is a higher bar than
listing-card use.
- **Metro/city directory pages:** restaurant's own photo next to its listing = normal
  directory use. Credit the restaurant in the caption.
- **Dish-explainer blogs:** need clean dish hero shots. Options, by risk:
  1. Hand-pick from library where the dish is unambiguous + credit the source restaurant.
  2. **Properly licensed / own shots for the ~12 core dishes (recommended for evergreen posts).**
  3. Free-license stock (Unsplash/Pexels) — thin Nepali coverage.
  - Avoid AI-generated food images (read as fake, cut against the real/human positioning).

### Image SEO (bake into the template)
- WebP, explicit width/height (no CLS), `loading="lazy"` below the fold, descriptive filenames.
- Alt text on every image → Google Images traffic (substantial for food).

### Template upgrades needed (one-time dev)

In `web/lib/stories.ts` (Story type) and `web/app/stories/[slug]/page.tsx`:

- Person author + one-line bio (E-E-A-T), add to schema.
- BreadcrumbList schema.
- Real `dateModified` (currently hardcoded to `datePublished`).
- Required hero image.
- Vary the closing line (currently identical across all three posts).
- Backdate launch posts across the prior 6-8 weeks so the blog reads as established.

---

## Launch set — 8 posts (3 existing upgraded + 5 new)

Eight is the sweet spot: covers all four pillars and the two flagship cities, every post good.

1. A Guide to Nepali Food in Australia _(existing — add author, hero)_
2. Momo, Explained: Steamed, Fried, Jhol and C-Momo _(existing — re-angle off `/momo`)_
3. What Is Thakali Dal Bhat? _(existing — upgrade)_
4. The Best Nepali Restaurants in **Sydney** _(new, flagship)_
5. The Best Nepali Restaurants in **Melbourne** _(new, flagship)_
6. Newari Food: Choila, Bara and Samay Baji, Explained _(new)_
7. Halal Nepali Food in Australia: What to Order _(new, high commercial intent)_
8. Vegetarian Nepali Food: A Full Plate Without the Meat _(new, high commercial intent)_

---

## Publishing calendar — 1-2 posts/week, 12 weeks

| Week | Post 1 (Cities — traffic driver)                              | Post 2 (Dishes / How-to)                                 |
| ---- | ------------------------------------------------------------- | -------------------------------------------------------- |
| 1    | The Best Nepali Food in Sydney's St George (Rockdale/Hurstville/Kogarah) | Sel Roti & Gundruk sides                       |
| 2    | Nepali Food in **Brisbane**                                   | What to Order at a Nepalese Restaurant                   |
| 3    | Nepali Food in **Perth**                                      | Thukpa & Laphing                                         |
| 4    | Nepali Food in **Adelaide**                                   | Buff vs Chicken vs Veg momo                              |
| 5    | Nepali Food in **Canberra**                                   | Sekuwa & Sukuti (Nepali BBQ/jerky)                       |
| 6    | Glenroy & Melbourne's Northern Nepali Corridor                | Juju Dhau and Nepali sweets                              |
| 7    | Nepali Food in **Gold Coast / Hobart / Darwin**               | Shepparton: regional Victoria's Nepali town              |
| 8    | Best Momo in **Sydney** (metro, not national)                 | Dal bhat vs thali                                        |
| 9    | Best Momo in **Melbourne**                                    | Nepali breakfast in Australia                            |
| 10   | Cheap eats: Nepali under $20                                  | **Nepali Food Tier List** _(shareable / social push)_    |
| 11   | **Auburn**: Sydney's momo heartland                           | Nepali food for a group / sharing                        |
| 12   | New restaurant spotlights                                     | **Dashain & Tihar food** _(seasonal — time to Sept-Nov)_ |

Cadence rule: lead each week with a Cities post (the traffic driver), pair with a
cheaper Dishes/How-to post (topical authority). Time Culture/seasonal posts to the
real festivals (Dashain/Tihar land Sept-Nov) for a traffic + social spike.

---

## Dashain & Tihar cluster 2026 (Aasha, planned 2026-09-03)

Six posts, mid-September to late October, covering the two festivals that carry
Nepali food more than any others. Two evergreen **anchors** (Dashain, Tihar) that
get re-dated every July, plus four **spokes**. Every post owns exactly one query
so they never compete with each other or with a directory page.

### Verified 2026 dates (checked against two sources each, 2026-09-03)

**Dashain** (15 days): Ghatasthapana Sunday 11 October, Phulpati Saturday 17,
Maha Ashtami Sunday 18, **Bijaya Dashami (tika) Wednesday 21 October**,
Kojagrat Purnima Sunday 25.

**Tihar** (5 days): Kaag Tihar Saturday 7 November, Kukur Tihar + Laxmi Puja
Sunday 8, Gai Tihar Monday 9, **Mha Puja / Nepal Sambat 1147 Tuesday 10**,
**Bhai Tika Wednesday 11 November**.

> Sources: nepalhikingteam.com and magicalnepal.com (cross-checked; timeanddate
> blocks fetching). Re-verify in July 2027, lunar dates shift.

**The editorial spine of the whole cluster:** both tika days fall midweek, so
families in Australia do the real feast on the weekend either side. Nobody
writing from Kathmandu says this, and it is the single most useful line we have
for a reader here. Say it in every post.

### The six posts

| # | Post | Slug | Owns | Publish |
| - | ---- | ---- | ---- | ------- |
| 1 | Dashain in Australia (ANCHOR) | `dashain-in-australia` | "dashain 2026", "when is dashain" | wk 8 Sep |
| 2 | Khasi ko masu | `khasi-ko-masu` | "khasi ko masu", "nepali goat curry" | wk 15 Sep |
| 3 | Feeding twenty for Dashain (catering) | `nepali-catering-australia` | "nepali catering [city]" | wk 22 Sep |
| 4 | Where to get sel roti in Australia | `sel-roti-australia` | "sel roti near me" | wk 6 Oct |
| 5 | Tihar in Australia (ANCHOR) | `tihar-in-australia` | "tihar 2026", "bhai tika" | wk 13 Oct |
| 6 | Mha Puja and Nepal Sambat | `mha-puja-nepal-sambat` | "mha puja", "nepal sambat" | wk 27 Oct |

Ordering logic: anchors publish 3 to 5 weeks ahead of the festival so they are
indexed before search ramps. The catering post must be live before 11 October
(people book a feast 2 to 4 weeks out). Sel roti sits between the two festivals
because it belongs to both. **If the cluster has to shrink to four, drop 2 and 6:**
khasi ko masu folds into post 1 as a section, and Mha Puja is day four of Tihar
so the anchor covers it honestly.

**Not doing this year:** a "Dashain events near you" roundup. The ROADMAP wants a
What's On layer, but we have no event data and will not publish dates we cannot
verify.

### What the DB supports (queried 2026-09-03, seeded menus only)

- **Goat: 36+ venues** with goat curry / khasi ko masu, in every state and
  territory. Post 1 and 2 are safe.
- **Sel roti: 11 venues**, six of them in **Perth** (Little Magic Momo x3, Tasty
  Momo Cloverdale, MoMo Planet, Funky Momo), the rest NSW/ACT (Heshela x2, Mul
  Chowk x2, Jerysolti x2). **Zero in VIC or QLD.** That absence is the story:
  sel roti here is takeaway-counter food, not restaurant food.
- **Samay baji / yomari:** Heshela (Hurstville + Rockdale), Jhigu Bhoye Chhen
  (Coorparoo), Bhoye Chhen (Edwardstown), Falcha x3, Newari Kitchen (Seven
  Hills), Rolling Flavors (Subiaco), Lahana (Hurstville), Momonbitez (Oakleigh).
  Enough for post 6.
- **`catering = true` on 28 venues** (Prisha Catering, Everest Function Centre,
  Anu Kitchen and others). Null on the other 408, so post 3 says "these ones we
  know cater, ring the rest", never "only these cater".

**Standing caveat for every post:** only ~144 of 437 menus are transcribed. A
dish missing from our data does not mean the kitchen does not cook it. Write
coverage claims as "on the menus we have", never as a complete census.
`halal_status` is still unknown on every row: never assert halal, tell the
reader to ring and ask.

### Distinctions to get right (they are different dishes)

- **Khasi ko masu** = goat curry, the Dashain centrepiece.
- **Khasi ko bhutan** = boiled then pan-fried goat offal (stomach, intestine,
  liver). Common on menus here and NOT the same dish. Do not conflate them.
- Several kitchens sell **"khasi" that is actually lamb** (Namaste Parkside's
  "Khasiko Masu (Goat or Lamb Curry)", Himalayan Perth's khasi sekuwa is lamb
  cutlets). If we name a venue for goat, check the menu description first.

### Build dependencies (Albert, small)

- `dateModified` is hardcoded to `datePublished` in
  `web/app/stories/[slug]/page.tsx`. These posts get re-dated every July, so the
  refresh is invisible to Google until this is real.
- Author is emitted as `Organization`, should be a `Person` with a bio. Festival
  content lives or dies on lived experience (E-E-A-T).
- **Hero images:** we have none for Dashain or Tihar. Posts fall back to the
  gradient. Sourcing decision still open (see Imagery above).

### Stale link targets (fixed in this cluster, fix elsewhere too)

Dish pages moved from `/tag/[tag]` to **`/nepali-food/[slug]`** (commit 06fa684).
Valid slugs: `momo`, `newari`, `choila`, `thakali`, `dal-bhat`, `tibetan`,
`thukpa`, `grill`, `sekuwa`, `nepali-indian`, `vegetarian`, plus the momo
subtypes. The briefs earlier in this doc still say `/tag/*` and are wrong.

---

## Per-post briefs — the 8 launch posts

Each brief is the spec to write from. Pull restaurant names/ratings live from the DB
at draft time so they stay accurate. Word counts are floors, not ceilings.

### 1. A Guide to Nepali Food in Australia _(existing — upgrade)_

- **Slug:** `nepali-food-australia-guide` (keep) · **Target kw:** "nepali food" / "nepalese food"
- **Intent:** Awareness · **Role:** Dishes-pillar hub · **Length:** 1,200-1,500 words
- **H2s:** Momo · Thakali dal bhat · Newari food · Tibetan-Nepali warmers · Sides & sweets · Where to eat it in Australia
- **Internal links:** `/momo`, `/tag/thakali`, `/tag/newari`, `/tag/tibetan`, `/tag/vegetarian`, `/nepali-restaurants/nsw`, `/nepali-restaurants/vic`, every dish spoke post
- **FAQ:** What to order first · Is Nepali food spicy · Vegetarian options
- **Upgrade actions:** add Person author + hero image; link out to all new spoke posts

### 2. Momo, Explained: Steamed, Fried, Jhol and C-Momo _(existing — re-angle)_

- **Slug:** `best-momo-australia` → consider `momo-explained` (informational, avoids `/momo` clash) · **Target kw:** "what is momo" / "momo types"
- **Intent:** Awareness · **Length:** 900-1,200 words
- **H2s:** What is momo · The styles explained (steamed/fried/jhol/C-momo) · The fillings (buff/chicken/veg/paneer) · How to eat momo like a regular · Where to find it (→ `/momo`)
- **Internal links:** `/momo`, `/tag/vegetarian`, guide hub · **FAQ:** taste · steamed vs fried · halal
- **Re-angle action:** drop "best in Australia" framing from H1/intro; point that intent at `/momo`

### 3. What Is Thakali Dal Bhat? _(existing — upgrade)_

- **Slug:** `what-is-thakali-dal-bhat` (keep) · **Target kw:** "thakali dal bhat" / "dal bhat"
- **Intent:** Awareness · **Length:** 900-1,100 words
- **H2s:** What is dal bhat · What makes it Thakali · The refills · How to eat it · Where to try it
- **Internal links:** `/tag/thakali`, `/momo`, guide hub · **FAQ:** vegetarian · spice · why refills
- **Upgrade actions:** author + hero

### 4. The Best Nepali Restaurants in Sydney _(new — flagship)_

- **Slug:** `best-nepali-restaurants-sydney` · **Target kw:** "nepali food sydney" / "nepalese restaurant sydney"
- **Intent:** Commercial · **Length:** 1,500-2,000 words · **Hero:** a Sydney spot's photo
- **DB pull:** top-rated spots in St George (Rockdale/Hurstville/Kogarah), Auburn, Granville, Harris Park, CBD
- **H2s:** Where Sydney eats Nepali (the clusters) · St George (Rockdale/Hurstville/Kogarah) · Auburn · Granville/Parramatta · Harris Park (Little India, great momo) · CBD · How to choose · FAQ
- **Format:** 10-15 named spots, each one line "what to order"
- **Internal links:** `/nepali-restaurants/nsw` + each suburb page, `/momo`, `/explore?state=NSW`
- **FAQ:** best momo in Sydney · cheap Nepali eats · halal options

### 5. The Best Nepali Restaurants in Melbourne _(new — flagship)_

- **Slug:** `best-nepali-restaurants-melbourne` · **Target kw:** "nepali food melbourne"
- **Intent:** Commercial · **Length:** 1,500-2,000 words
- **DB pull:** Northern corridor (Glenroy/Coburg/Brunswick/Broadmeadows/Craigieburn), CBD, Werribee
- **H2s:** Where Melbourne eats Nepali · The northern corridor (heartland) · CBD · Werribee (west) · How to choose · FAQ
- **Internal links:** `/nepali-restaurants/vic` + suburb pages, `/momo`, `/explore?state=VIC`
- **Note:** Shepparton gets its own post (Week 7), NOT this one

### 6. Newari Food: Choila, Bara and Samay Baji, Explained _(new)_

- **Slug:** `newari-food-explained` · **Target kw:** "newari food"
- **Intent:** Awareness · **Length:** 1,000-1,300 words
- **H2s:** Who are the Newar · Choila · Bara · Samay baji (the spread) · Chatamari & sides · Where to find it
- **Internal links:** `/tag/newari`, guide hub, `/momo` · **FAQ:** what is samay baji · spicy? · where in Australia

### 7. Halal Nepali Food in Australia: What to Order _(new)_

- **Slug:** `halal-nepali-food-australia` · **Target kw:** "halal nepali food"
- **Intent:** Commercial · **Length:** 900-1,200 words
- **H2s:** Is Nepali food halal · What to order (halal momo, dal bhat, sekuwa) · How to check with a kitchen · Where to find halal Nepali spots
- **Internal links:** `/momo`, state pages, `/explore` · **FAQ:** is buff halal · halal momo · ask the kitchen
- **Caveat:** all rows are `halal_status = unknown` in DB — write honestly ("call ahead"), don't claim certification

### 8. Vegetarian Nepali Food: A Full Plate Without the Meat _(new)_

- **Slug:** `vegetarian-nepali-food` · **Target kw:** "vegetarian nepali food"
- **Intent:** Commercial · **Length:** 900-1,200 words
- **H2s:** Is Nepali food veg-friendly · Veg momo · Veg dal bhat & thali · Gundruk and the sides · Where to eat it
- **Internal links:** `/tag/vegetarian`, `/momo`, `/tag/thakali`, guide hub · **FAQ:** vegan options · veg momo fillings · paneer

## Per-post briefs — added later

### What to Order at a Nepalese Restaurant *(Week 2 — replaces "How to Order Momo Like a Local")*
- **Slug:** `what-to-order-nepalese-restaurant` · **Target kw:** "what to order at a nepalese restaurant" / "what to eat nepali food"
- **Intent:** Awareness / decision-help · **Length:** 1,000-1,300 words
- **Angle:** the at-the-table decision post (not dish encyclopaedia). "Order this, here's a first-timer combo, skip this until visit two."
- **H2s:** Your first order (the safe combo) · How to order momo (styles, what to ask) · The full meal: a Thakali set · One thing off the beaten path (choila/newari) · What to drink · What to skip on visit one · How to ask about spice & halal
- **Internal links:** guide hub, `/momo`, `/tag/thakali`, `/tag/newari`, `/tag/vegetarian`, `/explore`
- **FAQ:** what should a first-timer order · how much food per person · is it spicy · vegetarian combo

### Nepali Food Tier List *(Week 10 — shareable, social-first)*
- **Slug:** `nepali-food-tier-list` · **Target kw:** none meaningful — this is a SHARE play, not a search play
- **Intent:** Shareable (Reddit/TikTok/Instagram), brand personality, backlinks · **Length:** 800-1,200 words + a tier graphic
- **Rules:** rank **dishes, not restaurants** (never make enemies of listed venues) · frame as one honest opinion · explicitly invite disagreement
- **Format:** S/A/B/C/D tiers across momo, Thakali dal bhat, choila, sel roti, jhol momo, thukpa, laphing, gundruk, samay baji, sikarni/juju dhau, sukuti, chatamari · one funny/honest line per dish
- **Assets:** a shareable tier-list image (S-tier momo, etc.) for socials · pin a "fight me in the comments" CTA
- **Internal links:** every dish links to its spoke post or `/tag` page; CTA to the map

---

## Next step

Draft post #4, **The Best Nepali Restaurants in Sydney**: pull the actual top-rated
spots per cluster from the DB, write to the city-roundup skeleton above, run the
copywriting + human-copy checklist before it ships.
