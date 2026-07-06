// The Explore "Category" cuisines: the buckets the filter bar drills into,
// in editorial order (Nepali-first on purpose; Nepali-Indian sits last even
// though it's the second-biggest tag). SINGLE SOURCE for the category
// dropdown/sheet (ExploreClient), its icons, and the facet catalog
// (CATALOG_CATEGORIES in lib/queries.ts) — add a cuisine HERE and every
// surface picks it up. Slugs must exist in lib/menu/taxonomy.ts (dish or
// style kind; categoryFacets branches on the kind).
//
// Deliberately a tiny standalone module (not taxonomy.ts): ExploreClient is
// client-side and shouldn't pull the whole DISH_CATEGORIES table into the
// bundle for six labels.
import type { DishFacet } from "../types";
export const EXPLORE_CATEGORIES: [slug: string, label: string][] = [
	["momo", "Momo"],
	["newari", "Newari"],
	["sekuwa", "Sekuwa"],
	["tibetan", "Tibetan"],
	["thakali", "Thakali"],
	["nepali-indian", "Nepali-Indian"],
];

// Facet display order on a dish search: one dropdown per kind present, in
// this order (member dishes, preparations, proteins, dietary). THE single
// source: the SQL facet sort (lib/queries via taxonomy's re-export) and the
// Explore dropdowns both import it, so server and client order can't drift.
// dish and preparation never co-occur (a bucket has one or the other), so
// their relative order is cosmetic.
export const FACET_KIND_ORDER: DishFacet["kind"][] = [
	"dish",
	"preparation",
	"protein",
	"diet",
];
