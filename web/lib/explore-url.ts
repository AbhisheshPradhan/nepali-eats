// Explore URL is two independent dimensions living in one query string:
//   LOCATION (what the map shows) + DISH (what the filters show). Every filter
// control must MERGE its change onto the current params so the two never clobber
// each other: picking a dish keeps your location, picking a location keeps your
// dish. Before this, each control wrote a fresh query with only its own keys, so
// a dish pick teleported the map home and a location search wiped the dish.
//
// `withLocation` replaces the location keys wholesale (a new suburb drops the old
// focus/lat-lng) but preserves the dish; `withDish` replaces the dish keys but
// preserves the location; `withoutDish` clears the dish and keeps the location.
//
// `tag` (restaurant-level "known for", from /tag and state landing pages) is in
// NEITHER list on purpose: it's the coarse tier of the same what-food axis as
// `dish`, so the two are mutually exclusive (page.tsx ignores tag when dish is
// set). Entry-only scope: it seeds the landing view, and the first filter
// change of either dimension sheds it.

export const LOCATION_KEYS = [
	"suburb",
	"state",
	"lat",
	"lng",
	"focus",
	"venue",
] as const;
// `dish` carries the most specific dish/preparation slug the user picked (a
// leaf like steamed-momo or choila; the server normalizes it into the cuisine
// bucket + a pre-selected facet). protein/diet are the cross-cutting facets.
export const DISH_KEYS = ["dish", "protein", "diet"] as const;

export type ExploreParams = Record<string, string | undefined>;

function toUrl(p: ExploreParams): string {
	const sp = new URLSearchParams();
	for (const [k, v] of Object.entries(p)) {
		if (v != null && v !== "") sp.set(k, v);
	}
	const s = sp.toString();
	return s ? `/explore?${s}` : "/explore";
}

// carry only the DISH keys from the current params (used by location changes)
function keepDish(current: ExploreParams): ExploreParams {
	const next: ExploreParams = {};
	for (const k of DISH_KEYS) if (current[k]) next[k] = current[k];
	return next;
}

// carry only the LOCATION keys from the current params (used by dish changes)
function keepLocation(current: ExploreParams): ExploreParams {
	const next: ExploreParams = {};
	for (const k of LOCATION_KEYS) if (current[k]) next[k] = current[k];
	return next;
}

// A location change: keep the dish, replace the location with `loc`.
export function withLocation(
	current: ExploreParams,
	loc: ExploreParams,
): string {
	return toUrl({ ...keepDish(current), ...loc });
}

// A dish change: keep the location, replace the dish with `dish` (pass an
// undefined protein to drop a previously-set one).
export function withDish(current: ExploreParams, dish: ExploreParams): string {
	return toUrl({ ...keepLocation(current), ...dish });
}

// Clear the dish, keep the location.
export function withoutDish(current: ExploreParams): string {
	return toUrl(keepLocation(current));
}
