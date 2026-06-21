# NepaliEats — Homepage & Core Chrome Copy

Proposed copy in the project voice (see [VOICE_AND_TONE.md](VOICE_AND_TONE.md)).
Drop-in, no code changes here. Every line is dash-free and AU-spelled.

Legend: **KEEP** = already on-voice, leave it. **CHANGE** = swap to the proposed
line. **NOTE** = a linked SEO or UX point worth doing when you touch this.

---

## Home meta (this is sales copy in the search result)
- **Title (CHANGE):** `NepaliEats: Nepali restaurants & food across Australia`
  - Current default has an em dash and leads with a slogan, not the search term.
- **Description (CHANGE):** `Find Nepali food anywhere in Australia. Momo, Thakali dal bhat, sel roti and Newari feasts, from restaurants and cafes to food trucks and market stalls.`
  - Drops "happy place", leads with the term, names the dishes people search.

---

## Hero (locked, Option A)
- **Eyebrow (KEEP):** `All across Australia`
- **H1 (CHANGE):** `Every Nepali restaurant in Australia, mapped.`
- **Sub (CHANGE):** `Momo, Thakali dal bhat, sel roti and Newari feasts, from hole-in-the-wall steamers to Sunday market stalls. Find your momo people.`
- **Near-me button (CHANGE):** `Find the closest momo to me`
  - Current line ("Share your location and we'll find the closest momo") is long
    and wraps into an oval pill on mobile (UX_AUDIT B3). Shorter fixes both.
  - **Loading state (KEEP):** `Finding the closest momo...`

## Featured section
- **Eyebrow (KEEP):** `Local favourites`
- **H2 (CHANGE):** `Where we're eating this week`
  - "This week's hidden gems" leans on "hidden gem", which we are retiring from
    repeat use. The new line is warmer and sounds like a real person.
- **Button (CHANGE):** `Browse all {total} spots`
  - "Browse" tells them what happens. "See all" is vaguer.
- **NOTE (SEO):** these cards link to `/explore?focus=`. Point them at
  `/restaurant/[slug]` so detail pages get internal links (SEO_AUDIT §2).

## Craving carousel
- **Eyebrow (KEEP):** `Eat by craving`
- **H2 (KEEP):** `What are you hungry for?`  (good rhetorical question, on-voice)
- **NOTE (SEO):** cards link to `/explore?tag=`. Point the non-momo ones at the
  indexable `/tag/[tag]` pages (momo already goes to `/momo`).

## Story strip
- **Badge (KEEP):** `Our story`
- **Heading (KEEP):** `Nepali food is having a moment. We didn't want to miss a single plate.`
- **Body (CHANGE):** `NepaliEats started as a group chat of friends swapping momo tips. Now it's a map of every Nepali kitchen, cafe and truck in Australia, added by people who actually eat there.`
- **Button (KEEP):** `Read the story`
- This whole block is already in voice. Leave it.

---

## Header / nav
- **Nav (KEEP):** `Explore`, `Stories`
- **Primary CTA (KEEP):** `Add a spot`
- **"Log in" (CHANGE):** remove it until auth exists. It currently routes to the
  "coming soon" add-a-spot page, so tapping "Log in" and landing there breaks
  trust (UX_AUDIT B5). Bring it back as `Save your spots` when login is real.

## Footer
- **Blurb (CHANGE):** `Every plate of Nepali food in Australia, from steamy momo windows to Sunday market stalls.`
- **Add the tagline (CHANGE):** show `Find your momo people.` near the logo. This
  is its home as a recurring brand signature.
- **Column: Explore (CHANGE labels + links).** Real destinations, anchor text that
  matches the target page (SEO_AUDIT §2):
  - `Momo` to `/momo`
  - `Thakali` to `/tag/thakali`
  - `Food trucks` to `/explore?venue=Food+Truck`
  - `By city` to a browse hub or the top city page
- **Column: Community (KEEP):** `Add a spot`, `Our story`, `For owners`
  - **NOTE:** "For owners" currently points at add-a-spot. Fine as a placeholder,
    relabel honestly if it stays a dead end.
- **Column: Hungry? (CHANGE links).** Today all three point at `/stories`. Point
  each at its real guide once written: `Momo guide`, `What to order`, `Festival eats`.
- **Bottom line (KEEP):** `Made with love for Nepali food in Australia · © 2026 NepaliEats`

---

## Cross-cutting CTAs (apply site-wide)
- **CHANGE** `View on map` to `See it on the map`
- **KEEP** `Get directions`
- **KEEP** `Call the kitchen`  (great, plain and warm)
- **KEEP** `Visit website`
- **KEEP** `See the full menu`
- **Listing pages** ("View on map" button on city/tag pages): `See these on the map`

## Explore microcopy & empty states
- **Search placeholder (KEEP):** `Search a restaurant, suburb or postcode`
- **Near me (KEEP):** `Near me`
- **Count (KEEP):** `{total} spots {areaLabel}`
- **Empty state (CHANGE):** `No spots in view yet. Try zooming out or panning the map.`
- **Secondary list heading (KEEP):** `You may also like`
- **Load more (KEEP):** `Load more ({n} left)`
- **Map loading (CHANGE):** `Warming up the map...`  (small bit of warmth over "Loading map...")

## 404 (already on-voice)
- **H1 (KEEP):** `This plate is empty.`
- **Body (KEEP):** `We could not find that page. Let us point you back to the good stuff.`
- **Buttons (KEEP):** `Back home`, `Explore the map`

## Add a spot (placeholder page)
- **H1 (KEEP):** `Know a spot we have missed?`
- **Body (KEEP):** current copy is fine and in voice.
- **Button (KEEP):** `Explore the map`

---

## Summary of actual changes (everything else is KEEP)
1. Home title + meta description.
2. Hero H1 + sub + near-me button.
3. Featured H2 + button.
4. Footer blurb, add tagline, fix column labels/links.
5. Remove "Log in" until auth.
6. "View on map" to "See it on the map".
7. Explore empty state + map loading line.

The restraint is deliberate. The story block, carousel headings, and 404 are
already strong, so changing them would be churn, not improvement.
