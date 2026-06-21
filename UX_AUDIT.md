# NepaliEats, UI/UX Audit (mobile-first, critical)

**Site:** `web/` (Next.js 16 App Router, Tailwind v4)
**Audited:** 2026-06-21 · Author: design/UX review (Claude)
**Brief:** Be critical. Priority is **looking good on mobile.**
**Method:** Code-level review of layout, components, and responsive classes. Not yet verified on real devices, items marked **(verify on device)** need a physical/emulator check (Lighthouse mobile + iOS Safari + Android Chrome).

> Status: **recommendations only, no code was changed.**

---

## Verdict

The visual design system is genuinely strong: a warm, cohesive thali palette, a distinctive prayer-flag/momo identity, rounded "dumpling" radii, tinted (never grey) shadows, real `prefers-reduced-motion` handling, and a visible focus ring. On desktop this looks like a real product, not a template.

**But the mobile experience has real problems**, and three of them are the kind that make the site feel broken on a phone:

1. **`100vh` on the Explore page** → content/controls clipped under mobile browser chrome.
2. **Filter bar doesn't collapse on mobile** → 3-4 wrapped rows eat the screen above the map.
3. **Touch targets on the filter controls are ~26-28px** → below the 44px minimum; fiddly to tap.

Since Explore is both the core interaction *and* (per the SEO audit) the most-linked page, its mobile weakness is the biggest issue here.

### Priority table
| # | Issue | Severity (mobile) | Effort |
|---|-------|-------------------|--------|
| 1 | `100vh` → use `100dvh` (Explore clips under browser bar) | High | Trivial |
| 2 | Filter bar doesn't collapse to a sheet on mobile | High | Med |
| 3 | Sub-44px tap targets (Seg, pills, select, sm buttons) | High | Low |
| 4 | Restaurant detail: primary CTAs buried below the fold on mobile | High | Low/Med |
| 5 | Hardcoded `57px` header height (3 places) is fragile | Med | Low |
| 6 | z-index: Explore bar (`z-1200`) covers mobile nav menu (`z-26`) | Med | Low |
| 7 | Fixed `text-[2.6rem]` H1s don't scale down on small phones | Med | Low |
| 8 | CompactRow opens in `_blank` (new tab), bad on mobile | Med | Trivial |
| 9 | Hero "Near me" long label in a pill wraps into an oval | Low/Med | Low |
| 10 | Map may render grey after toggling from hidden (invalidateSize) | Med | Low | 

---

## A. Mobile-critical issues

### A1. `100vh` clips the Explore UI under the browser bar, **High**
`components/explore/ExploreClient.tsx:201`, `h-[calc(100vh-57px)]`. On iOS Safari / Android Chrome, `100vh` includes the area behind the collapsing address bar, so the container is taller than the visible viewport. Result: the bottom **Map/List toggle FAB** (`:344`, `bottom-6`) and the end of the list/map sit *under* the browser chrome until the user scrolls the page chrome away.
**Fix:** use `100dvh` (dynamic viewport height): `h-[calc(100dvh-57px)]`. Consider `100svh`/`100dvh` for the FAB offset too.

### A2. Filter bar doesn't collapse on mobile, **High**
`ExploreClient.tsx:202-265`. On a 360-390px screen the top bar is: search + "Near me" (row 1, likely wraps the button), then "Open now" pill + Sort select + Price segmented + Rating segmented, which `flex-wrap` into **3-4 stacked rows**. That's a large chunk of vertical space before any map or list is visible. It looks cluttered and pushes the actual content down.
**Fix:** on mobile, collapse filters behind a single **"Filters" button** that opens a bottom sheet/drawer; keep only search + a filter-count chip in the persistent bar. This is the standard maps-directory mobile pattern (Google Maps, Yelp, Airbnb).

### A3. Touch targets below 44px, **High**
WCAG 2.5.5 / Apple HIG / Material all want ~44-48px minimum touch height. Current:
- `Seg` buttons (Price/Rating) `py-[5px]` + `text-[0.9rem]` ≈ **26-28px tall** (`ExploreClient.tsx:45`).
- "Open now" pill `py-[5px]` ≈ same (`:229`).
- Sort `<select>` `py-[5px]` (`:245`).
- `Button size="sm"` `py-2` ≈ **~36px** (`ui/Button.tsx:18`), borderline; it's used in the header ("Add a spot", "Log in") and "Near me".
These are the most-tapped controls on the page and they're the smallest. **Fix:** bump mobile control height to ≥44px (e.g. `py-2.5`/`py-3` on small screens), and give segmented options more padding on touch.

### A4. Restaurant detail, primary actions buried on mobile, **High**
`app/restaurant/[slug]/page.tsx:167` uses `md:grid-cols-[1fr_320px]`. On mobile it collapses to one column with **content first, sidebar last**, so "Get directions", "Call the kitchen", hours, and address land *below* the blurb + photo gallery + menu + reviews. The two highest-intent actions for a hungry mobile user are far down the page.
**Fix:** on mobile, hoist a compact action bar (Directions / Call) directly under the hero, or use a sticky bottom action bar. Reorder so key facts (address, hours, call) precede the photo gallery on small screens.

### A5. Hardcoded `57px` header height, **Med (fragile)**
The header height is assumed as a magic `57px` in at least three spots: `ExploreClient.tsx:201` (`calc(100vh-57px)`) and `Header.tsx:82` (`top-[57px]` for the mobile menu scrim). The header itself has no fixed height, it's padding-driven (`py-2`) and can grow if the wordmark/logo wraps or fonts shift. If real height ≠ 57px, the Explore view mis-sizes and the mobile menu scrim misaligns.
**Fix:** measure dynamically or set an explicit header height variable (`--header-h`) and reference it everywhere.

### A6. z-index conflict: Explore bar covers the mobile nav menu, **Med (verify on device)**
Mobile nav dropdown/scrim are `z-[25]`/`z-[26]` (`Header.tsx:82-84`), but the Explore top filter bar is `z-[1200]` (`ExploreClient.tsx:203`) and the FAB `z-[1100]`. The sticky `<header>` is `z-30`. On the Explore page, opening the hamburger menu likely renders the menu **behind** the Explore filter bar / FAB, making nav items untappable.
**Fix:** establish one z-index scale (e.g. header & its menu above everything: `z-[2000]`), and bring the Explore controls below the global nav.

### A7. Map may show grey tiles after toggling from hidden, **Med (verify on device)**
In list mode on mobile the map container is `hidden` (`ExploreClient.tsx:329`). Leaflet computes size on mount; if it mounts at 0×0 (display:none) it renders blank/grey until an `invalidateSize()` after the container becomes visible. Toggling List→Map may need a manual `invalidateSize()` (check `MapView`).
**Fix:** call `map.invalidateSize()` on view-mode change / when the map becomes visible.

---

## B. Cross-cutting visual / responsive issues

### B1. Fixed large H1s don't scale on small phones, **Med**
`text-[2.6rem]` (~41.6px) is hardcoded on: restaurant detail H1 (`restaurant/[slug]/page.tsx:160`), `ListingGrid` H1 (`ListingGrid.tsx:24`), and `add-a-spot` H1 (`add-a-spot/page.tsx:18`). Long restaurant names at 41.6px over a 280px hero wrap to 3+ lines and crowd the badges. The homepage H1 *does* use `clamp()` (`page.tsx:28`), good; apply the same `clamp()` approach to the others.

### B2. CompactRow forces new tabs, **Med**
`CompactRow.tsx:36-38` opens every list result with `target="_blank"`. On mobile this spawns stacked tabs and breaks the back button (the natural "back to results" gesture). It's disorienting on desktop too. **Fix:** default to same-tab navigation (let users long-press/cmd-click for new tab).

### B3. Hero "Near me" pill wraps into an oval, **Low/Med**
`HeroSearch.tsx:33-44` puts a long sentence ("Share your location and we'll find the closest momo") inside `rounded-full`. When it wraps on mobile, a multi-line `rounded-full` renders as an awkward stadium/oval. **Fix:** shorten to "📍 Find momo near me" on mobile (or use `rounded-2xl` for multi-line).

### B4. Color contrast on tinted surfaces, **Med (verify)**
`--color-ink-500` (#7a6453) passes AA on the lightest paper, but it's used for small secondary text (location, hours, "reviews on Google") and sits on tinted backgrounds too (`bg-paper-100/200`, selected rows). On those darker tints and at `0.9rem`/`0.78rem` it likely drops below 4.5:1. **Fix:** verify ink-500 against every background it's used on; bump to ink-700 for small text on tinted surfaces. Also check chili-500/marigold on their `-100` tints for buttons/badges.

### B5. "Log in" links to a placeholder, **Low (trust)**
Header "Log in" and "For owners" both route to `/add-a-spot` (`Header.tsx:60`, `Footer.tsx:71`), which is a "coming soon" page. Tapping "Log in" and landing on "Add a spot, coming soon" is confusing. Either hide "Log in" until auth exists or label it honestly.

### B6. Footer duplicate/placeholder links, **Low** (also in SEO audit §2)
"By cuisine" and "By city" both go to `/explore`; three "Hungry?" links all go to `/stories`. On mobile the footer is long and these dead-end links waste it. Point them at real city/cuisine pages.

---

## C. Things done well (keep)

- Cohesive, characterful design system (palette, prayer-flag motif, dumpling radii, warm shadows), `globals.css`.
- `prefers-reduced-motion` fully handled (`globals.css:116`).
- Visible focus ring via `:focus-visible` (`globals.css:94`), keep it; don't let any `outline:none` ship without it.
- Base body `17px` / line-height `1.55`, good mobile readability.
- `next/image` with `sizes` and LCP `priority` on the detail hero.
- Map is `dynamic(..., { ssr:false })` with a loading state, correct for Leaflet.
- Homepage H1 uses `clamp()`, the right pattern (just apply it everywhere).
- `active:scale-95` button feedback + `disabled` states are thoughtful touches.

---

## D. Suggested device test pass (do this before/after fixes)
1. iOS Safari + Android Chrome on a real phone (or BrowserStack): Home, Explore (list+map+toggle), a restaurant detail, a city page.
2. Lighthouse **mobile** (perf + a11y) on each template, watch CLS from the two heavy webfonts (see SEO audit §7) and LCP on the detail hero.
3. Tap-target audit (Lighthouse flags <48px), should catch A3 automatically.
4. Rotate to landscape + test the 320px width (smallest common) for the Explore filter wrap (A2) and H1 overflow (B1).
5. With the address bar visible *and* hidden, confirm the Explore FAB and list bottom aren't clipped (A1).

---

## Suggested sequencing
1. **Trivial, high impact:** A1 (`dvh`), A8/B2 (`_blank`), A5 (header var), A6 (z-index). A day's work, removes the "feels broken on mobile" problems.
2. **Next:** A3 (tap targets), A4 (detail CTAs), B1 (responsive H1s), A2 (filter sheet, the bigger build).
3. **Polish:** B3, B4 (contrast verify), B5, B6.
