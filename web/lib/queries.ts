import { cache } from "react";
import { query } from "./db";
import { DISH_CATEGORIES } from "./menu/taxonomy";
import type {
	Restaurant,
	RestaurantDetail,
	Facet,
	Photo,
	ExploreSpot,
	MenuCategory,
	MenuItem,
	DishSuggestion,
	DishSearchResult,
	DishFacet,
	DishItem,
	DishPill,
} from "./types";

// Base column list + the hero photo via a correlated subquery.
const COLS = `
  r.id, r.slug, r.name, r.venue_type, r.cuisine, r.tags, r.halal_status,
  r.rating, r.review_count, r.price_level, r.price_range,
  r.street, r.suburb, r.state, r.postcode, r.full_address, r.lat, r.lng,
  r.phone, r.email, r.website, r.facebook, r.instagram, r.tiktok, r.whatsapp,
  r.menu_url, r.menu_source, r.logo_key, r.google_maps_url, r.opening_hours, r.featured_rank,
  r.popular, r.description, r.business_status,
  r.live_music, r.kid_friendly, r.serves_vegetarian, r.parking,
  r.serves_alcohol, r.wheelchair_accessible,
  r.cover_key, r.cover_source, r.cover_attribution,
  r.brand_id,
  (SELECT b.name FROM brands b WHERE b.id = r.brand_id) AS brand_name,
  (SELECT b.slug FROM brands b WHERE b.id = r.brand_id) AS brand_slug,
  (r.featured_rank IS NOT NULL) AS is_featured,
  -- Lead photo = the standalone cover, falling back to the first gallery photo
  -- for any restaurant that has photos but no cover set yet.
  COALESCE(
    r.cover_key,
    (SELECT p.storage_key FROM restaurant_photos p
       WHERE p.restaurant_id = r.id AND NOT p.removed
       ORDER BY p.is_primary DESC, p.position ASC LIMIT 1)
  ) AS primary_photo
`;

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapRow(row: any): Restaurant {
	return {
		id: row.id,
		slug: row.slug,
		name: row.name,
		venueType: row.venue_type,
		cuisine: row.cuisine,
		tags: row.tags || [],
		halalStatus: row.halal_status,
		rating: row.rating != null ? Number(row.rating) : null,
		reviewCount: row.review_count != null ? Number(row.review_count) : null,
		priceLevel: row.price_level != null ? Number(row.price_level) : null,
		priceRange: row.price_range,
		street: row.street,
		suburb: row.suburb,
		state: row.state,
		postcode: row.postcode,
		fullAddress: row.full_address,
		lat: row.lat != null ? Number(row.lat) : null,
		lng: row.lng != null ? Number(row.lng) : null,
		phone: row.phone,
		email: row.email,
		website: row.website,
		facebook: row.facebook,
		instagram: row.instagram,
		tiktok: row.tiktok,
		whatsapp: row.whatsapp,
		menuUrl: row.menu_url,
		menuSource: row.menu_source,
		logoKey: row.logo_key,
		coverKey: row.cover_key,
		coverSource: row.cover_source,
		coverAttribution: row.cover_attribution,
		googleMapsUrl: row.google_maps_url,
		openingHours: row.opening_hours,
		businessStatus: row.business_status,
		primaryPhoto: row.primary_photo,
		isFeatured: !!row.is_featured,
		featuredRank:
			row.featured_rank != null ? Number(row.featured_rank) : null,
		popular: !!row.popular,
		description: row.description,
		liveMusic: row.live_music ?? null,
		kidFriendly: row.kid_friendly ?? null,
		servesVegetarian: row.serves_vegetarian ?? null,
		servesAlcohol: row.serves_alcohol ?? null,
		wheelchairAccessible: row.wheelchair_accessible ?? null,
		parking: row.parking ?? null,
		brandId: row.brand_id ?? null,
		brandName: row.brand_name ?? null,
		brandSlug: row.brand_slug ?? null,
	};
}

export interface ListOpts {
	state?: string;
	suburb?: string;
	tag?: string;
	// serves_vegetarian flag (Places attribute); the vegetarian landing page
	// filters on this, since no restaurant carries a "vegetarian" tag.
	veg?: boolean;
	venueType?: string;
	priceLevel?: number;
	minRating?: number;
	hasPhoto?: boolean;
	featured?: boolean;
	notFeatured?: boolean;
	popular?: boolean;
	limit?: number;
	offset?: number;
	orderBy?: "popular" | "rating" | "name" | "newest" | "featured";
}

// Attribute-flag token -> boolean column. exploreSpots() emits the tokens whose
// column is true, and the Explore filter chips match on them client-side.
const FLAG_COLS: Record<string, string> = {
	kid: "kid_friendly",
	music: "live_music",
	veg: "serves_vegetarian",
	alcohol: "serves_alcohol",
	cocktails: "serves_cocktails",
	takeout: "takeout",
	delivery: "delivery",
	dinein: "dine_in",
	outdoor: "outdoor_seating",
	reservable: "reservable",
	groups: "good_for_groups",
	dogs: "allows_dogs",
	wheelchair: "wheelchair_accessible",
};

// Permanently-closed spots (Google business_status) are hidden from every public
// discovery surface. IS DISTINCT FROM keeps NULL/unknown statuses and temporarily-
// closed; only CLOSED_PERMANENTLY is excluded. Detail pages still resolve so
// existing inbound links don't 404.
const NOT_CLOSED = "business_status IS DISTINCT FROM 'CLOSED_PERMANENTLY'";

function buildWhere(o: ListOpts): { where: string; params: unknown[] } {
	const cond: string[] = [`r.${NOT_CLOSED}`];
	const params: unknown[] = [];
	const p = (val: unknown) => {
		params.push(val);
		return `$${params.length}`;
	};
	if (o.state) cond.push(`r.state = ${p(o.state)}`);
	if (o.suburb) cond.push(`lower(r.suburb) = lower(${p(o.suburb)})`);
	if (o.venueType) cond.push(`r.venue_type = ${p(o.venueType)}`);
	if (o.tag) cond.push(`${p(o.tag)} = ANY(r.tags)`);
	if (o.veg) cond.push(`r.serves_vegetarian`);
	if (o.priceLevel) cond.push(`r.price_level = ${p(o.priceLevel)}`);
	if (o.minRating) cond.push(`r.rating >= ${p(o.minRating)}`);
	if (o.hasPhoto)
		cond.push(
			"EXISTS (SELECT 1 FROM restaurant_photos p WHERE p.restaurant_id = r.id AND NOT p.removed)",
		);
	if (o.featured) cond.push("r.featured_rank IS NOT NULL");
	if (o.notFeatured) cond.push("r.featured_rank IS NULL");
	if (o.popular) cond.push("r.popular");
	return { where: cond.length ? "WHERE " + cond.join(" AND ") : "", params };
}

const ORDER: Record<string, string> = {
	popular: "r.review_count DESC NULLS LAST, r.rating DESC NULLS LAST",
	rating: "r.rating DESC NULLS LAST, r.review_count DESC NULLS LAST",
	name: "r.name ASC",
	newest: "r.id DESC",
	featured:
		"r.featured_rank ASC NULLS LAST, r.review_count DESC NULLS LAST, r.rating DESC NULLS LAST",
};

export async function listRestaurants(o: ListOpts = {}): Promise<Restaurant[]> {
	const { where, params } = buildWhere(o);
	const order = ORDER[o.orderBy || "popular"];
	// limit/offset are interpolated (not bound), so coerce to integers to keep
	// them un-injectable even if a caller ever passes a non-numeric value.
	const limit = Math.trunc(o.limit ?? 60);
	const offset = Math.trunc(o.offset ?? 0);
	const rows = await query(
		`SELECT ${COLS} FROM restaurants r ${where} ORDER BY ${order} LIMIT ${limit} OFFSET ${offset}`,
		params,
	);
	return rows.map(mapRow);
}

// Restaurants a user has saved, newest-saved first.
export async function listSavedRestaurants(
	userId: string,
): Promise<Restaurant[]> {
	const rows = await query(
		`SELECT ${COLS} FROM restaurants r
       JOIN saved_restaurants s ON s.restaurant_id = r.id
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC`,
		[userId],
	);
	return rows.map(mapRow);
}

// The ENTIRE visible directory as thin Explore rows (pin + card + filter
// fields). ~450 rows, one query, served CDN-cached by /api/explore/spots; the
// client filters/sorts/paginates in memory, so map pans never hit the DB.
export async function exploreSpots(): Promise<ExploreSpot[]> {
	const flagCols = Object.values(FLAG_COLS)
		.map((c) => `r.${c}`)
		.join(", ");
	const rows = await query(
		`SELECT r.id, r.slug, r.name, r.lat, r.lng, r.rating, r.review_count,
            r.venue_type, r.price_level, r.price_range, r.suburb, r.state,
            r.logo_key, r.phone, r.opening_hours, r.business_status, r.tags,
            r.featured_rank, r.popular, ${flagCols},
            r.menu_item_count > 0 AS has_menu,
            COALESCE(
              r.cover_key,
              (SELECT p.storage_key FROM restaurant_photos p
                 WHERE p.restaurant_id = r.id AND NOT p.removed
                 ORDER BY p.is_primary DESC, p.position ASC LIMIT 1)
            ) AS primary_photo
       FROM restaurants r
      WHERE r.${NOT_CLOSED} AND r.lat IS NOT NULL AND r.lng IS NOT NULL`,
	);
	return rows.map((row: any) => ({
		id: row.id,
		slug: row.slug,
		name: row.name,
		lat: Number(row.lat),
		lng: Number(row.lng),
		rating: row.rating != null ? Number(row.rating) : null,
		reviewCount: row.review_count != null ? Number(row.review_count) : null,
		venueType: row.venue_type,
		priceLevel: row.price_level != null ? Number(row.price_level) : null,
		priceRange: row.price_range,
		suburb: row.suburb,
		state: row.state,
		primaryPhoto: row.primary_photo,
		logoKey: row.logo_key,
		phone: row.phone,
		openingHours: row.opening_hours,
		businessStatus: row.business_status,
		isFeatured: row.featured_rank != null,
		featuredRank:
			row.featured_rank != null ? Number(row.featured_rank) : null,
		popular: !!row.popular,
		tags: row.tags || [],
		hasMenu: !!row.has_menu,
		// "menu" is a synthetic flag token (no FLAG_COLS column) so the
		// "Menu on here" chip filters through the same flags mechanism.
		flags: [
			...(row.has_menu ? ["menu"] : []),
			...Object.entries(FLAG_COLS)
				.filter(([, col]) => row[col] === true)
				.map(([token]) => token),
		],
	}));
}

export async function countRestaurants(o: ListOpts = {}): Promise<number> {
	const { where, params } = buildWhere(o);
	const rows = await query<{ n: string }>(
		`SELECT count(*) n FROM restaurants r ${where}`,
		params,
	);
	return Number(rows[0].n);
}

// Geographic extent of a filtered set (for centring the map on SSR).
export async function extentOf(o: ListOpts) {
	const { where, params } = buildWhere(o);
	const rows = await query<Record<string, string | null>>(
		`SELECT min(lat) minlat, max(lat) maxlat, min(lng) minlng, max(lng) maxlng,
            avg(lat) avglat, avg(lng) avglng
       FROM restaurants r ${where}`,
		params,
	);
	const x = rows[0];
	if (!x || x.minlat == null) return null;
	return {
		minLat: Number(x.minlat),
		maxLat: Number(x.maxlat),
		minLng: Number(x.minlng),
		maxLng: Number(x.maxlng),
		avgLat: Number(x.avglat),
		avgLng: Number(x.avglng),
	};
}

// React.cache: generateMetadata and the page body both call this per render;
// memoizing per-request halves the query volume on every ISR render/build.
export const getRestaurantBySlug = cache(async function getRestaurantBySlug(
	slug: string,
): Promise<RestaurantDetail | null> {
	const rows = await query(
		`SELECT ${COLS} FROM restaurants r WHERE r.slug = $1`,
		[slug],
	);
	if (!rows.length) return null;
	const base = mapRow(rows[0]);
	const photos = await query(
		`SELECT storage_key, source, attribution, width, height, is_primary
       FROM restaurant_photos WHERE restaurant_id = $1 AND NOT removed
       ORDER BY position ASC, id ASC`,
		[(rows[0] as { id: number }).id],
	);
	const mapped: Photo[] = photos.map((p: any) => ({
		storageKey: p.storage_key,
		source: p.source,
		attribution: p.attribution,
		width: p.width,
		height: p.height,
		isPrimary: p.is_primary,
	}));
	return { ...base, photos: mapped };
});

// Ordered gallery photo keys for ONE restaurant (cover first, then gallery by
// position). Lean on purpose: the Explore popup carousel lazy-loads this per open
// spot, so the map's `pins` payload doesn't have to carry a photo array per pin.
export async function restaurantGallery(
	slug: string,
): Promise<{ logo: string | null; photos: string[] }> {
	const rows = await query<{
		logo_key: string | null;
		cover_key: string | null;
		gallery: string[];
	}>(
		`SELECT r.logo_key, r.cover_key,
		        COALESCE(
		          array_agg(p.storage_key ORDER BY p.is_primary DESC, p.position ASC, p.id ASC)
		            FILTER (WHERE p.storage_key IS NOT NULL),
		          '{}'
		        ) AS gallery
		   FROM restaurants r
		   LEFT JOIN restaurant_photos p
		     ON p.restaurant_id = r.id AND NOT p.removed
		  WHERE r.slug = $1
		  GROUP BY r.id, r.logo_key, r.cover_key`,
		[slug],
	);
	if (!rows.length) return { logo: null, photos: [] };
	const { logo_key, cover_key, gallery } = rows[0];
	// cover first (it may be a standalone cover not present in the gallery rows),
	// then the rest, de-duped, capped so a huge gallery can't bloat the popup. The
	// logo is returned separately so the carousel can render it contained (a brand
	// mark), not cropped like a photo.
	const ordered = [cover_key, ...gallery].filter((k): k is string => !!k);
	const photos = Array.from(new Set(ordered))
		.filter((k) => k !== logo_key)
		.slice(0, 10);
	return { logo: logo_key, photos };
}

// Full menu (categories -> items -> variants) for ONE restaurant. Detail-page only —
// deliberately NOT joined into card/pin/explore queries (those stay lean). Returns
// categories ordered by position, each with its visible items + priced variants;
// empty categories are dropped.
export async function getRestaurantMenu(
	restaurantId: number,
): Promise<MenuCategory[]> {
	const rows = await query(
		`SELECT mc.id, mc.name, mc.description,
       coalesce((
         SELECT json_agg(json_build_object(
           'id', mi.id, 'name', mi.name, 'description', mi.description,
           'isVegetarian', mi.is_vegetarian, 'spiceLevel', mi.spice_level,
           'variants', coalesce((
             SELECT json_agg(json_build_object(
               'label', v.label, 'price', v.price, 'currency', v.currency,
               'isVegetarian', v.is_vegetarian
             ) ORDER BY v.position, v.id)
             FROM menu_item_variants v WHERE v.item_id = mi.id
           ), '[]'::json)
         ) ORDER BY mi.position, mi.id)
         FROM menu_items mi WHERE mi.category_id = mc.id AND NOT mi.is_hidden
       ), '[]'::json) AS items
     FROM menu_categories mc
     WHERE mc.restaurant_id = $1
     ORDER BY mc.position, mc.id`,
		[restaurantId],
	);
	return rows
		.map((r: any) => ({
			id: r.id as number,
			name: r.name as string,
			description: r.description as string | null,
			items: (r.items as MenuItem[]).map((it) => ({
				...it,
				variants: it.variants.map((v) => ({
					...v,
					price: v.price == null ? null : Number(v.price),
				})),
			})),
		}))
		.filter((c: MenuCategory) => c.items.length > 0);
}

export async function getCardBySlug(slug: string): Promise<Restaurant | null> {
	const rows = await query(
		`SELECT ${COLS} FROM restaurants r WHERE r.slug = $1`,
		[slug],
	);
	return rows.length ? mapRow(rows[0]) : null;
}

// ADMIN (temporary) — hard-deletes a restaurant. restaurant_photos rows cascade
// via FK (ON DELETE CASCADE); on-disk media files under media/ are NOT removed.
// Returns the deleted restaurant's name, or null if no row matched.
// Returns the deleted row's id + name (id lets the caller purge on-disk media),
// or null if no row matched. restaurant_photos rows cascade via FK.
export async function deleteRestaurantBySlug(
	slug: string,
): Promise<{ id: number; name: string } | null> {
	const rows = await query<{ id: number; name: string }>(
		`DELETE FROM restaurants WHERE slug = $1 RETURNING id, name`,
		[slug],
	);
	return rows.length ? rows[0] : null;
}

// Homepage featured row, scoped to the visitor's state. Editorial picks only
// (restaurants with a non-null featured_rank). Returns [] when the state has no
// featured picks, so the Featured section self-hides rather than showing
// look-alike filler.
export async function featuredByState(
	state: string | null | undefined,
	limit = 5,
): Promise<Restaurant[]> {
	return listRestaurants({
		state: state || undefined,
		featured: true,
		orderBy: "featured",
		limit,
	});
}

// Homepage "Popular" row, scoped to the visitor's state. Strict + editorial:
// only spots hand-flagged `popular` (the free crowd-favourite tag), and never
// the paid Featured picks (those own the Featured row above), most-reviewed
// first. Returns [] when the state has no flagged spots, so the section hides.
export async function popularByState(
	state: string | null | undefined,
	limit = 5,
): Promise<Restaurant[]> {
	return listRestaurants({
		state: state || undefined,
		popular: true,
		notFeatured: true,
		orderBy: "popular",
		limit,
	});
}

// Other live locations in the same brand (e.g. the other 8848 branches), nearest
// first when we have coordinates, else most-reviewed. Powers the "More {brand}
// locations" internal-linking block on the detail page. Excludes self + closed.
export async function brandSiblings(
	restaurantId: number,
	brandId: number,
	lat: number | null,
	lng: number | null,
	limit = 8,
): Promise<Restaurant[]> {
	const order =
		lat != null && lng != null
			? "r.geom <-> ST_SetSRID(ST_MakePoint($3, $2), 4326)"
			: "r.review_count DESC NULLS LAST, r.rating DESC NULLS LAST";
	const rows = await query(
		`SELECT ${COLS} FROM restaurants r
      WHERE r.brand_id = $1 AND r.id <> $4 AND r.${NOT_CLOSED}
      ORDER BY ${order}
      LIMIT ${Math.trunc(limit)}`,
		[brandId, lat, lng, restaurantId],
	);
	return rows.map(mapRow);
}

// Nearest OTHER Nepali spots to a restaurant, within maxKm, nearest first. Powers
// the "Other Nepali spots nearby" internal-linking block. Excludes self, closed,
// non-Nepali, and (when the current spot has a brand) its own brand siblings —
// those get the dedicated brand block. Radius is a geography ST_DWithin; ordering
// uses the planar KNN operator (fine at metro distances) off the GiST index.
export async function nearbyRestaurants(
	restaurantId: number,
	lat: number,
	lng: number,
	opts: { brandId?: number | null; maxKm?: number; limit?: number } = {},
): Promise<Restaurant[]> {
	const maxKm = opts.maxKm ?? 50;
	const limit = Math.trunc(opts.limit ?? 6);
	const point = "ST_SetSRID(ST_MakePoint($2, $1), 4326)";
	const cond: string[] = [
		"r.id <> $3",
		`r.${NOT_CLOSED}`,
		"r.is_nepali IS NOT FALSE",
		"r.geom IS NOT NULL",
		`ST_DWithin(r.geom::geography, ${point}::geography, $4)`,
	];
	const params: unknown[] = [lat, lng, restaurantId, maxKm * 1000];
	if (opts.brandId != null) {
		params.push(opts.brandId);
		cond.push(`(r.brand_id IS NULL OR r.brand_id <> $${params.length})`);
	}
	const rows = await query(
		`SELECT ${COLS} FROM restaurants r
      WHERE ${cond.join(" AND ")}
      ORDER BY r.geom <-> ${point}
      LIMIT ${limit}`,
		params,
	);
	return rows.map(mapRow);
}

export async function allSlugs(): Promise<string[]> {
	const rows = await query<{ slug: string }>(`SELECT slug FROM restaurants`);
	return rows.map((r) => r.slug);
}

// Indexable restaurant pages with a real last-modified date (newest of the
// row's update/enrichment timestamps) for the sitemap.
export async function restaurantSitemapEntries(): Promise<
	{ slug: string; lastmod: Date }[]
> {
	return query<{ slug: string; lastmod: Date }>(
		`SELECT slug, GREATEST(updated_at, enriched_at, created_at) AS lastmod
       FROM restaurants
      WHERE is_nepali IS NOT FALSE AND ${NOT_CLOSED}`,
	);
}

export async function stateFacets(): Promise<Facet[]> {
	const rows = await query<{ value: string; count: string }>(
		`SELECT state AS value, count(*)::text AS count FROM restaurants
      WHERE state IS NOT NULL AND ${NOT_CLOSED} GROUP BY state ORDER BY count(*) DESC`,
	);
	return rows.map((r) => ({ value: r.value, count: Number(r.count) }));
}

// React.cache: the [location] page's resolve() runs this in generateMetadata
// AND the page body; memoize per-request (it's a full GROUP BY scan).
export const suburbFacets = cache(async function suburbFacets(
	state?: string,
): Promise<(Facet & { state: string })[]> {
	const rows = await query<{ value: string; state: string; count: string }>(
		`SELECT suburb AS value, state, count(*)::text AS count FROM restaurants
      WHERE suburb IS NOT NULL AND state IS NOT NULL AND ${NOT_CLOSED}
      ${state ? "AND state = $1" : ""}
      GROUP BY suburb, state ORDER BY count(*) DESC`,
		state ? [state] : [],
	);
	return rows.map((r) => ({
		value: r.value,
		state: r.state,
		count: Number(r.count),
	}));
});

export async function tagFacets(): Promise<Facet[]> {
	const rows = await query<{ value: string; count: string }>(
		`SELECT t AS value, count(*)::text AS count
       FROM restaurants, unnest(tags) AS t
      WHERE ${NOT_CLOSED}
      GROUP BY t ORDER BY count(*) DESC`,
	);
	return rows.map((r) => ({ value: r.value, count: Number(r.count) }));
}

export async function totalCount(): Promise<number> {
	return countRestaurants();
}

export interface Suggestion {
	dishes: DishSuggestion[];
	restaurants: {
		slug: string;
		name: string;
		suburb: string | null;
		state: string | null;
	}[];
	locations: {
		suburb: string;
		state: string;
		postcode: string | null;
		count: number;
	}[];
}

// --- Dish autocomplete -------------------------------------------------------
// Matches the query against the controlled dish vocabulary (names + the seeded
// search_aliases, so "dumpling" finds Momo and "c momo" finds Chilli Momo).
// Rules:
//  - Show the LEAST specific tag the query distinguishes: "momo" matches Momo
//    AND all nine "* Momo" preparations, so descendants of a matched tag are
//    hidden (no flooding); "steamed" only matches Steamed Momo, so it shows.
//  - Bare proteins never suggest (searching "chicken" means chicken dishes, not
//    a tag), but a protein word COMBINED with a dish ("paneer momo", "chicken
//    steamed momo") emits a compound suggestion = the dish tag + that protein
//    pre-applied as an Explore filter.
type DishRow = {
	id: number;
	slug: string;
	name: string;
	kind: string;
	parent_id: number | null;
	search_aliases: string[] | null;
};

function dishMatches(q: string, rows: DishRow[]): DishSuggestion[] {
	const norm = (s: string) => s.toLowerCase().trim();
	const text = norm(q);
	if (!text) return [];
	const byId = new Map(rows.map((r) => [r.id, r]));
	const hit = (r: DishRow, t: string) =>
		norm(r.name).includes(t) ||
		(r.search_aliases ?? []).some((a) => norm(a).includes(t));
	// exact/prefix name or alias matches rank above substring matches
	const rank = (r: DishRow, t: string) => {
		const names = [r.name, ...(r.search_aliases ?? [])].map(norm);
		if (names.some((n) => n === t)) return 0;
		if (names.some((n) => n.startsWith(t))) return 1;
		return 2;
	};

	const searchable = rows.filter((r) => r.kind !== "protein");
	let matched = searchable.filter((r) => hit(r, text));
	// hide descendants when an ancestor also matched (momo hides its preps)
	const matchedIds = new Set(matched.map((r) => r.id));
	matched = matched.filter(
		(r) => !(r.parent_id && matchedIds.has(r.parent_id)),
	);
	matched.sort((a, b) => rank(a, text) - rank(b, text));

	const out: DishSuggestion[] = matched.slice(0, 3).map((r) => ({
		slug: r.slug,
		name: r.name,
		kind: r.kind as DishSuggestion["kind"],
	}));

	// Compound: one token names a protein, the rest a dish/prep ("paneer momo",
	// "chicken steamed momo"). Emitted first — it's the most specific intent.
	// The protein token must EQUAL a protein name/alias: a substring/prefix match
	// would turn "c momo" (the Chilli Momo alias) into a bogus Chicken compound.
	const tokens = text.split(/\s+/);
	// A query that IS a dish name needs no compound: its protein word belongs
	// to the name, and re-tokenising invents dishes ("fried fish" → protein
	// Fish + rest "fried" → bogus "Fish Fried Rice").
	const exact = matched[0] && rank(matched[0], text) === 0;
	if (tokens.length >= 2 && !exact) {
		const proteins = rows.filter((r) => r.kind === "protein");
		for (let i = 0; i < tokens.length && out.length < 4; i++) {
			const p = proteins.find((r) => rank(r, tokens[i]) === 0);
			if (!p) continue;
			const rest = tokens.filter((_, j) => j !== i).join(" ");
			if (!rest) continue;
			let dishes = searchable.filter((r) => hit(r, rest));
			const ids = new Set(dishes.map((r) => r.id));
			dishes = dishes.filter(
				(r) => !(r.parent_id && ids.has(r.parent_id)),
			);
			dishes.sort((a, b) => rank(a, rest) - rank(b, rest));
			const d = dishes[0];
			if (!d) continue;
			// A protein word that's part of the dish's own name isn't a facet:
			// "butter chicken" tokenises to protein Chicken + dish Butter Chicken,
			// which would emit a bogus "Chicken Butter Chicken" (ditto Fried Fish,
			// Chicken 65). The plain suggestion already covers these.
			if (norm(d.name).split(/\s+/).includes(tokens[i])) continue;
			const compound: DishSuggestion = {
				slug: d.slug,
				name: `${p.name} ${d.name}`,
				kind: d.kind as DishSuggestion["kind"],
				protein: p.slug,
			};
			// compound leads; drop a duplicate plain suggestion for the same dish
			out.unshift(compound);
			break;
		}
	}
	return out.slice(0, 3);
}

// Autocomplete: dish tags + restaurant names + suburb/postcode locations.
export async function searchSuggest(q: string): Promise<Suggestion> {
	// "Auburn, NSW" → name part + an optional trailing state filter, so a
	// formatted location label (what the search box fills in on pick) round-trips
	// instead of dying on a literal substring match against a single column.
	const ci = q.lastIndexOf(",");
	const namePart = (ci >= 0 ? q.slice(0, ci) : q).trim();
	const statePart = ci >= 0 ? q.slice(ci + 1).trim() : "";
	const like = `%${namePart}%`;
	const pre = `${namePart}%`;
	const stateLike = statePart ? `${statePart}%` : null;
	const [dishRows, restaurants, locations] = await Promise.all([
		query<DishRow>(
			`SELECT id, slug, name, kind, parent_id, search_aliases FROM dish_categories`,
		),
		query<{
			slug: string;
			name: string;
			suburb: string;
			state: string;
		}>(
			`SELECT slug, name, suburb, state FROM restaurants
      WHERE name ILIKE $1 AND ($3::text IS NULL OR state ILIKE $3) AND ${NOT_CLOSED}
      ORDER BY (name ILIKE $2) DESC, review_count DESC NULLS LAST
      LIMIT 6`,
			[like, pre, stateLike],
		),
		query<{
			suburb: string;
			state: string;
			postcode: string;
			n: string;
		}>(
			`SELECT suburb, state, min(postcode) postcode, count(*)::text n FROM restaurants
      WHERE (suburb ILIKE $1 OR postcode ILIKE $1) AND ($3::text IS NULL OR state ILIKE $3)
        AND suburb IS NOT NULL AND state IS NOT NULL AND ${NOT_CLOSED}
      GROUP BY suburb, state
      ORDER BY (suburb ILIKE $2) DESC, count(*) DESC
      LIMIT 5`,
			[like, pre, stateLike],
		),
	]);
	return {
		// dishes match on the WHOLE query (not the split name part): a comma in
		// a dish query is unlikely, and the full text is what compounds need.
		dishes: dishMatches(q, dishRows),
		restaurants,
		locations: locations.map((l) => ({
			suburb: l.suburb,
			state: l.state,
			postcode: l.postcode,
			count: Number(l.n),
		})),
	};
}

// --- Dish search matches ------------------------------------------------------
// Every restaurant with menu items tagged <slug> (ancestors are materialised at
// seed time, so "momo" flat-matches every preparation), each item carrying its
// facet slugs (preparations under the searched tag + proteins) so Explore can
// filter by chip client-side. Viewport-independent: caches per dish at the CDN.
export async function dishRestaurants(
	slug: string,
): Promise<DishSearchResult | null> {
	const tagRows = await query<{
		id: number;
		slug: string;
		name: string;
		kind: string;
	}>(`SELECT id, slug, name, kind FROM dish_categories WHERE slug = $1`, [slug]);
	const tag = tagRows[0];
	if (!tag) return null;

	// Facet axis depends on the searched tag's kind. A DISH refines by its momo
	// preparation subtree + cross-cutting proteins; a STYLE (Newari, Tibetan…)
	// refines by its MEMBER DISHES (choila, yomari, sukuti…) — protein is a
	// meaningless axis for a cuisine, so we swap it out. Member slugs come from
	// the taxonomy `style` field (the seeder tags each dish's style alongside it).
	const isStyle = tag.kind === "style";
	const memberDishes = isStyle
		? DISH_CATEGORIES.filter((c) => c.kind === "dish" && c.style === slug).map(
				(c) => c.slug,
			)
		: [];
	// Per-item facet slugs: for a style, the item's member-dish tags; for a dish,
	// its proteins + preparations under the searched dish. $2 carries whichever.
	const facetClause = isStyle
		? `d2.slug = ANY($2)`
		: // exclude the searched tag itself: searching gluten-free (kind diet)
			// would otherwise echo itself back as a facet chip on every item
			`(d2.kind IN ('protein','diet') OR d2.parent_id = $2) AND d2.id <> $2`;
	const facetParam = isStyle ? memberDishes : tag.id;

	const rows = await query<{
		restaurant_id: number;
		name: string;
		slugs: string[] | null;
		price: string | number | null;
		priced_count: string | number;
	}>(
		`SELECT mi.restaurant_id, mi.name,
            ARRAY(
              SELECT d2.slug FROM menu_item_tags t2
                JOIN dish_categories d2 ON d2.id = t2.dish_category_id
               WHERE t2.menu_item_id = mi.id
                 AND ${facetClause}
            ) AS slugs,
            (SELECT min(v.price) FROM menu_item_variants v
              WHERE v.item_id = mi.id) AS price,
            (SELECT count(v.price) FROM menu_item_variants v
              WHERE v.item_id = mi.id) AS priced_count
       FROM menu_items mi
       JOIN restaurants r ON r.id = mi.restaurant_id
      WHERE NOT mi.is_hidden
        AND r.${NOT_CLOSED}
        AND EXISTS (
              SELECT 1 FROM menu_item_tags t
               WHERE t.menu_item_id = mi.id AND t.dish_category_id = $1
            )
      ORDER BY mi.restaurant_id, mi.position, mi.id`,
		[tag.id, facetParam],
	);

	const byRestaurant = new Map<number, DishItem[]>();
	const facetSlugs = new Set<string>();
	for (const row of rows) {
		const items = byRestaurant.get(row.restaurant_id) ?? [];
		items.push({
			name: row.name,
			slugs: row.slugs ?? [],
			price: row.price == null ? null : Number(row.price),
			priceFrom: Number(row.priced_count) > 1,
		});
		byRestaurant.set(row.restaurant_id, items);
		for (const s of row.slugs ?? []) facetSlugs.add(s);
	}

	// Resolve facet names/kinds. Styles surface member dishes; dishes surface
	// preparations then proteins. Either way keep taxonomy order (display_order/id)
	// so chips render stably.
	const facetKindClause = isStyle
		? `kind = 'dish'`
		: `kind IN ('preparation','protein','diet')`;
	const facetOrder = isStyle
		? `display_order, id`
		: `kind = 'diet', kind = 'protein', display_order, id`;
	const facets: DishFacet[] = facetSlugs.size
		? (
				await query<{ slug: string; name: string; kind: string }>(
					`SELECT slug, name, kind FROM dish_categories
            WHERE slug = ANY($1) AND ${facetKindClause}
            ORDER BY ${facetOrder}`,
					[[...facetSlugs]],
				)
			).map((f) => ({
				slug: f.slug,
				name: f.name,
				kind: f.kind as DishFacet["kind"],
			}))
		: [];

	return {
		slug: tag.slug,
		name: tag.name,
		facets,
		restaurants: [...byRestaurant.entries()].map(([id, items]) => ({
			id,
			items,
		})),
	};
}

// --- Dish / cuisine landing pages (menu-derived, server-rendered) -------------

export type GeoCard = Restaurant & { matches: DishPill[]; itemCount?: number };
export interface GeoResult {
	dish: { slug: string; name: string; kind: string };
	restaurants: GeoCard[];
}

// React.cache: generateMetadata and the page body both resolve the slug.
export const dishCategory = cache(async function dishCategory(
	slug: string,
): Promise<{ id: number; slug: string; name: string; kind: string } | null> {
	const rows = await query<{
		id: number;
		slug: string;
		name: string;
		kind: string;
	}>(`SELECT id, slug, name, kind FROM dish_categories WHERE slug = $1`, [slug]);
	return rows[0] ?? null;
});

// Restaurants serving <slug>, optionally scoped to a state, sorted by popularity
// (most-reviewed, then rating). Each row carries up to 6 matched menu-item names
// for the card pills. Ancestors are materialised at seed time, so 'momo' matches
// every preparation. Powers the dish landing pages.
export async function dishInGeo(
	slug: string,
	state?: string,
): Promise<GeoResult | null> {
	const tag = await dishCategory(slug);
	if (!tag) return null;
	const params: unknown[] = [tag.id];
	let stateCond = "";
	if (state) {
		params.push(state);
		stateCond = `AND r.state = $${params.length}`;
	}
	const rows = await query(
		`SELECT ${COLS},
		   COALESCE((
		     SELECT json_agg(m) FROM (
		       SELECT mi.name AS label,
		         (SELECT min(v.price) FROM menu_item_variants v
		           WHERE v.item_id = mi.id) AS price,
		         (SELECT count(v.price) FROM menu_item_variants v
		           WHERE v.item_id = mi.id) AS priced_count
		       FROM menu_items mi
		        WHERE mi.restaurant_id = r.id AND NOT mi.is_hidden
		          AND EXISTS (SELECT 1 FROM menu_item_tags t
		                       WHERE t.menu_item_id = mi.id AND t.dish_category_id = $1)
		        ORDER BY mi.position, mi.id LIMIT 6
		     ) m
		   ), '[]'::json) AS matches
		 FROM restaurants r
		 WHERE r.${NOT_CLOSED} ${stateCond}
		   AND EXISTS (
		     SELECT 1 FROM menu_items mi
		      JOIN menu_item_tags t ON t.menu_item_id = mi.id
		     WHERE mi.restaurant_id = r.id AND NOT mi.is_hidden
		       AND t.dish_category_id = $1
		   )
		 ORDER BY r.review_count DESC NULLS LAST, r.rating DESC NULLS LAST`,
		params,
	);
	return {
		dish: { slug: tag.slug, name: tag.name, kind: tag.kind },
		restaurants: rows.map((r: any) => ({
			...mapRow(r),
			matches: ((r.matches || []) as {
				label: string;
				price: string | number | null;
				priced_count: string | number;
			}[]).map((m) => ({
				label: m.label,
				price: m.price == null ? null : Number(m.price),
				priceFrom: Number(m.priced_count) > 1,
			})),
		})),
	};
}

// Per-state venue counts for ONE dish, popular states first. Powers the state
// filter chips on the dish landing pages (each chip links to the matching
// /nepali-food/<slug>/<state> page); callers apply the MIN_RENDER threshold.
export async function dishStateCounts(
	slug: string,
): Promise<{ state: string; n: number }[]> {
	const tag = await dishCategory(slug);
	if (!tag) return [];
	return query<{ state: string; n: number }>(
		`SELECT r.state, count(DISTINCT mi.restaurant_id)::int n
		   FROM menu_item_tags t
		   JOIN menu_items mi ON mi.id = t.menu_item_id AND NOT mi.is_hidden
		   JOIN restaurants r ON r.id = mi.restaurant_id AND r.${NOT_CLOSED}
		  WHERE t.dish_category_id = $1 AND r.state IS NOT NULL
		  GROUP BY r.state
		  ORDER BY n DESC`,
		[tag.id],
	);
}

// (slug, state) -> venue count, for gating which dish x state pages are
// index-ready. One scan; callers filter to their threshold.
export async function dishGeoCounts(): Promise<
	{ slug: string; state: string; n: number }[]
> {
	return query<{ slug: string; state: string; n: number }>(
		`SELECT dc.slug, r.state, count(DISTINCT mi.restaurant_id)::int n
		   FROM dish_categories dc
		   JOIN menu_item_tags t ON t.dish_category_id = dc.id
		   JOIN menu_items mi ON mi.id = t.menu_item_id AND NOT mi.is_hidden
		   JOIN restaurants r ON r.id = mi.restaurant_id AND r.${NOT_CLOSED}
		  WHERE dc.kind IN ('dish','preparation') AND r.state IS NOT NULL
		  GROUP BY dc.slug, r.state`,
	);
}
