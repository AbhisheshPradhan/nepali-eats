# NepaliEats — Build Prompt for Claude Code

You are building **NepaliEats**, a web app for discovering every place to eat Nepali food in Australia (restaurants, cafes, food trucks, market stalls). This repo contains a complete design system and an interactive HTML/React mockup of the product. Your job is to turn it into a real, production-grade web app **and convert all styling to Tailwind CSS**.

## 1. Read first
- `readme.md` — the full design guide (brand voice, visual foundations, iconography, file index). Read it completely before writing code.
- `SKILL.md` — quick brand summary.
- `styles.css` + `tokens/*.css` — the design tokens (colors, typography, spacing, radius, shadow, motion). **These are the source of truth for the Tailwind theme.**
- `components/core/*` and `components/listings/*` — the reusable React primitives (Button, Badge, Tag, Rating, Avatar, Input, PlaceCard) with `.d.ts` prop contracts and `.prompt.md` usage notes.
- `ui_kits/web/*` — the interactive mockup: `Header`, `Home`, `MapExplore`, `Stories`, `VenueDetail`, `App`, plus `data.js` (sample data) and `index.html`. This is the screen-level spec — match it closely.

## 2. Tech stack
- **React + TypeScript + Vite** (or Next.js if SSR/SEO is wanted — this is a discovery/directory site so SEO matters; lean Next.js App Router).
- **Tailwind CSS** for ALL styling (see §3).
- **Leaflet** (`react-leaflet`) for the map, Carto light tiles to start.
- **Phosphor Icons** (`@phosphor-icons/react`) — the mockup uses Phosphor; keep it.
- Fonts: **Baloo 2** (display) + **Mukta** (body) from Google Fonts.

## 3. Convert ALL styling to Tailwind CSS  ← important
The mockup uses inline `style={{}}` objects and CSS custom properties. Replace them with Tailwind utility classes.

1. **Generate the Tailwind theme from the tokens.** Read `tokens/colors.css`, `typography.css`, `spacing.css` and map every custom property into `tailwind.config.ts` `theme.extend`:
   - Colors: `chili` (50–700), `marigold`, `himalaya`, `coriander`, `paper`, `ink`, and the `flag-*` set. Preserve the exact hex values.
   - Semantic aliases (`brand-primary`, `surface-card`, `text-body`, `border-soft`, etc.) → either Tailwind color keys or `@layer` CSS variables consumed by utilities.
   - Font families: `font-display` (Baloo 2), `font-body` (Mukta).
   - Radius: `sm 8 / md 14 / lg 22 / xl 32 / pill 999px`.
   - Shadows: `sm / md / lg / pop` (the chili-glow) — warm-tinted, keep the rgba values.
   - Spacing scale (4px base) and the motion easings/durations.
2. **Rewrite every component and screen** to use Tailwind classes instead of inline styles. Keep the same visual result — this is a mechanical-but-careful conversion, not a redesign. Pixel fidelity to the mockup is the bar.
3. For dynamic/computed values that don't map to a utility (e.g. per-venue gradient hues, live progress widths), use inline `style` only where genuinely necessary, or Tailwind arbitrary values (`bg-[hsl(...)]`).
4. Hover/press/focus states → Tailwind `hover:` / `active:` / `focus-visible:` variants. The brand uses: primary button darkens + chili-glow shadow on hover, scale-95 on press, marigold focus ring.
5. Keep the components as a real component library (`/components`), typed with the existing `.d.ts` interfaces as a guide.

## 4. Match the mockup's screens & behavior
- **Header** — logo + Explore/Stories/Add-a-spot (left), Log in (right); collapses to a right-aligned hamburger ≤880px.
- **Home** — hero with single search pill (icon + input + Search button) and a "Share your location" prompt; **featured "hidden gems" grid first, then the dish carousel** (horizontal snap scroll, hidden scrollbar), then the story strip.
- **Explore** — desktop split view (single-column list left ~540px + Leaflet map right); mobile = full-screen map with a floating centered **List/Map** toggle pill near the bottom. Search pill with grouped Locations/Restaurants suggestions. Filter row: **Open now (on by default, first)**, Sort, Price, Rating. Brand teardrop pins showing rating; hovering a list card highlights its pin and vice-versa. Defaults to **western Sydney**; cuisine searches fit all of Australia.
- **Venue detail** — gradient/photo hero, rating/price/location, cuisine tags, blurb, popular dishes, weekly hours (today highlighted), reviews with avatars, sticky action sidebar (directions/call/save).
- **Stories** — blog hub (featured + grid) and readable article pages.

## 5. What's real vs mocked (build these for real)
The mockup fakes the backend. Implement properly:
1. **Data + API** — `ui_kits/web/data.js` is the schema reference (venues, cuisines, locations, hours, stories). Build a real DB + API.
2. **Real photos** — replace all gradient placeholders with real image fields + an upload/CDN pipeline. Add the dish photos for the carousel.
3. **Geocoding** — venues need address→lat/lng; the mockup hardcodes coords.
4. **Auth** — "Log in" is a stub; implement real accounts (needed for save/review/claim).
5. **Core flows not yet designed/built** — Add a spot, write a review, save to list, claim a listing. Flag these; build after MVP.
6. **Search** — currently client-side over 12 venues; implement server-side search.

## 6. Suggested MVP scope (ship first)
Read-only directory: **browse (home) + Explore map/list + search + venue detail + stories.** Add-a-spot, reviews, login, and saved lists as phase 2.

## 7. Brand rules (don't drift)
- Voice: warm, hungry, celebratory; speak to "you," celebrate hidden gems; never call it a "directory." **No em dashes in copy.**
- Warm palette only — chili red + marigold gold on cream paper, warm-tinted shadows (never cold grey). Chunky rounded Baloo 2 headlines.
- No emoji in UI; the marigold ★ rating and prayer-flag motif carry the festive feel.

Start by scaffolding the project, generating `tailwind.config.ts` from the tokens, then porting the component library, then the screens. Keep commits scoped per component/screen.
