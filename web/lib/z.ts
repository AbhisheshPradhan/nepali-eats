/**
 * Single source of truth for the Explore/map overlay stacking order.
 *
 * These layers all live in the same root stacking context on the Explore page,
 * so the raw numbers only have to be consistent *relative to each other*:
 *
 *   mapOverlay (1100) — floating List/Map toggle button, sits ABOVE the map
 *     but BELOW the top bar so the bar never gets covered.
 *   topBar     (1200) — the search + filter/sort band pinned above the map;
 *     sits ABOVE the map overlay controls.
 *   popover    (1300) — dropdowns/poppers (e.g. a Radix Select menu) that must
 *     sit ABOVE the top bar and every map overlay when open.
 *
 * NOTE: apply these via inline `style={{ zIndex: Z.topBar }}`, NOT a Tailwind
 * arbitrary class. Tailwind v4 extracts classes by scanning raw source text,
 * so an interpolated `z-[${Z.topBar}]` is never emitted and the rule would be
 * missing. Inline style keeps this file the real source of truth.
 */
export const Z = {
	mapOverlay: 1100,
	topBar: 1200,
	popover: 1300,
} as const;
