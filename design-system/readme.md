# NepaliEats — Design System

> All the Nepali food in Australia, worth the trip.

NepaliEats helps people find every place to eat Nepali food across Australia — restaurants, cafes, food trucks and weekend market stalls. It's built on a love of momo, dal bhat, sel roti and Newari feasts, and a belief that the best kitchens are often hidden gems. The brand is **warm, happy, celebratory and hungry** — like a friend who just got back from an incredible meal and can't wait to tell you where to go next.

This design system is built **from scratch** (no prior codebase or Figma was supplied). Every decision below is original to this project — see CAVEATS at the bottom.

---

## Sources
- **None provided.** No codebase, Figma, decks, or existing brand assets were attached. The brief was a written company description. All visuals, copy, tokens and components here are newly authored.

---

## CONTENT FUNDAMENTALS — how we write

**Voice:** warm, excited, a little hungry. We sound like a knowledgeable friend, never a listings database. We never call ourselves a "directory", "platform" or "listings site" — we're a place to *find* great food.

**Person:** speak to the reader as **you**; speak of ourselves sparingly as **we**. ("Find your momo people." / "We didn't want to miss a single plate.")

**Tone & themes:** celebrate *hidden gems*, *local favourites*, dishes *worth the trip*, food that *tastes like home*. Lean on specific, sensory, real Nepali food words — jhol momo, Thakali dal bhat set, sel roti, choila, sekuwa, samay baji, chiya — never generic "ethnic food".

**Casing:** Headlines and buttons in sentence case with personality ("Add a spot", "Start exploring", "Spots near me"). Eyebrows/labels in UPPERCASE with wide tracking ("LOCAL FAVOURITES", "ALL ACROSS AUSTRALIA"). Australian spelling (favourite, neighbourhood).

**Length:** short and punchy for headlines; one warm, concrete sentence for descriptions. No corporate filler.

**Emoji:** avoid in product UI. The expressive role is played by the prayer-flag motif, the momo mark and the marigold stars — not emoji.

**Example copy:**
- Hero: *"Find your momo people."* / *"From hole-in-the-wall steamers to Sunday market stalls — every hidden gem serving real Nepali food, gathered in one happy place."*
- Section eyebrow: *"LOCAL FAVOURITES"* → heading *"This week's hidden gems"*.
- CTA buttons: *"Start exploring"*, *"Add a spot"*, *"Get directions"*, *"Save to my list"*.
- Review voice (user): *"Tastes exactly like home."*

---

## VISUAL FOUNDATIONS

**Overall vibe:** a festive *thali* of warm colours on a cream-paper base. Appetising, joyful, generous. Think marigold garlands, steaming momo, prayer flags strung across a Himalayan street.

**Colour:**
- **Primary — Chili red** `#E5392B` (hover `#D72631`, press `#B01622`). The appetite-driving CTA colour.
- **Secondary — Marigold gold** `#F5A623`. Celebration, stars, highlights, ratings.
- **Accents** — Himalaya teal `#1B98A8` and Coriander green `#4A9D5B` as cool/fresh counterpoints (open-now state, info).
- **Prayer-flag set** — blue/white/red/green/yellow, used only for decorative bands and bunting.
- **Neutrals are warm, never grey** — Paper `#FFFBF4 → #FBEAD3` surfaces; Ink `#2B1A12` warm near-black text. Pure white is reserved for cards.
- Dominant warm reds/golds with sharp use; backgrounds stay calm cream so food colours pop.

**Type:**
- **Display — Baloo 2** (700/800): chunky, rounded, joyful; carries the brand voice in headlines, buttons and venue names. Tight tracking (−0.02em), line-height 1.05.
- **Body — Mukta** (400/500/700): humanist, friendly, very legible at reading sizes (17px base, 20px lead, line-height 1.55).
- Both fonts include Devanagari glyphs — intentional, given the Nepali audience.

**Spacing:** 4px base scale (4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96). Generous padding inside cards and sections; content max-width 1180px (760px for prose).

**Corner radii:** soft and dumpling-round — sm 8 / md 14 / lg 22 / xl 32 / pill. Buttons and chips are pills by default; cards use lg/xl.

**Backgrounds:** mostly flat warm cream. Atmosphere comes from (1) a soft radial marigold glow behind the hero, (2) gradient image placeholders on cards/venue heroes (warm hue → adjacent hue), (3) the prayer-flag bunting and footer band. No noise, no busy textures, no purple gradients.

**Shadows:** warm-tinted, never cold grey — `rgba(43,26,18,…)`. sm/md/lg for elevation; a special **`--shadow-pop`** chili glow appears on primary-button hover.

**Borders:** soft cream borders (`--border-soft`) for dividers; stronger sand (`--border-strong`) for input/chip outlines. 1.5–2px weights, friendly not hairline.

**Animation:** quick and slightly bouncy. Buttons use a bounce easing (`cubic-bezier(0.34,1.56,0.64,1)`); cards lift (translateY −4px) and their photo zooms gently on hover. Durations 140/220/420ms. Respect reduced-motion in production.

**Hover states:** primary button darkens + chili glow; secondary darkens; outline/ghost fill with a soft tint; cards lift and raise shadow; tags adopt the chili outline+text.

**Press states:** buttons shrink to scale(0.95) — tactile, like pressing a soft dumpling.

**Transparency & blur:** sticky header uses `rgba(255,251,244,.92)` + `backdrop-filter: blur(10px)`. Image overlays use a dark ink gradient for legible text on photos.

**Cards:** white surface, lg/xl radius, warm md shadow that grows to lg on hover, photo (or gradient placeholder) at 4:3 top, content padded generously. This is the system's signature — see `PlaceCard`.

**Imagery vibe:** warm and appetising. Where real photos are absent, gradient placeholders run warm (marigold → chili → hue-shifted) with a translucent venue icon. Avoid cool/desaturated/B&W treatments.

---

## ICONOGRAPHY

- **Icon set: [Phosphor Icons](https://phosphoricons.com/) v2.1.1**, loaded from CDN (regular + fill weights). Rounded, friendly terminals that match Baloo 2's character. Used via classes: `<i className="ph ph-map-pin" />`, fill via `ph-fill`.
- **⚠️ Substitution flag:** no icon set was supplied with the brief, so Phosphor was chosen as the closest fit for a warm, rounded, playful brand. If you have a preferred set (or custom icons), swap the two `<link>` tags and the class names.
- **SVG brand mark:** `assets/logo-momo.svg` — a steamed momo (dumpling) with steam curls and pleats, in marigold. This is the one bespoke illustration; the wordmark is live Baloo 2 text, not an image.
- **Decorative motif (not an icon):** prayer-flag **bunting** — pure-CSS triangles in the flag-five palette, used as a divider and the footer band.
- **Emoji / unicode:** not used as iconography. The marigold **★** in `Rating` is the one unicode glyph in regular use.
- Common icons in use: `fork-knife`, `coffee`, `truck`, `storefront`, `map-pin`, `magnifying-glass`, `heart`, `navigation-arrow`, `phone`, `clock`, `leaf`, `arrow-right`.

---

## INDEX / manifest

**Root**
- `styles.css` — global entry point (consumers link this). `@import`s only.
- `readme.md` — this guide.
- `SKILL.md` — Agent-Skills-compatible entry point.

**Tokens** (`tokens/`, all `@import`ed by `styles.css`)
- `fonts.css` — Baloo 2 + Mukta (Google Fonts CDN).
- `colors.css` — palette + semantic aliases.
- `typography.css` — font families, weights, type scale, line-heights.
- `spacing.css` — spacing scale, radii, shadows, motion, layout.

**Foundation cards** (`guidelines/`) — specimen cards shown in the Design System tab: colours (primary, accents, prayer-flag, neutrals), type (display, body, scale, eyebrow), spacing (scale, radii, shadows), brand (logo, bunting, voice).

**Components** (`components/`)
- `core/` — `Button`, `Badge`, `Tag`, `Rating`, `Avatar`, `Input` (+ `core.card.html`).
- `listings/` — `PlaceCard`, the signature venue card (+ `listings.card.html`).
- Namespace: `window.DesignSystem_580998`.

**UI kits** (`ui_kits/`)
- `web/` — interactive NepaliEats website (Home → Explore → Venue detail). Entry: `ui_kits/web/index.html`.

**Assets** (`assets/`)
- `logo-momo.svg` — momo brand mark.

---

## CAVEATS
- **Built from scratch** — no source brand existed, so colours, type, logo and components are an original proposal, not a recreation. Treat as a v1 to react to.
- **Fonts load from Google Fonts CDN** (Baloo 2 + Mukta) rather than bundled binaries. If you want them self-hosted/offline, send the licensed font files and I'll add `@font-face` rules.
- **Icons are Phosphor (CDN), a substitution** — see ICONOGRAPHY. Swap if you have a preferred set.
- **Venue data is invented** for demo screens (`ui_kits/web/data.js`).
