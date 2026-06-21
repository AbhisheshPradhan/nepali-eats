import { query } from "./db";
import type {
  Restaurant,
  RestaurantDetail,
  Facet,
  Photo,
  RestaurantPin,
  Bbox,
} from "./types";

// Base column list + the hero photo via a correlated subquery.
const COLS = `
  r.id, r.slug, r.name, r.venue_type, r.cuisine, r.tags, r.halal_status,
  r.rating, r.review_count, r.price_level, r.price_range,
  r.street, r.suburb, r.state, r.postcode, r.full_address, r.lat, r.lng,
  r.phone, r.email, r.website, r.facebook, r.instagram, r.tiktok, r.whatsapp,
  r.menu_url, r.menu_source, r.google_maps_url, r.opening_hours,
  (r.featured_rank IS NOT NULL) AS is_featured,
  (SELECT p.storage_key FROM restaurant_photos p
     WHERE p.restaurant_id = r.id AND NOT p.removed
     ORDER BY p.is_primary DESC, p.position ASC LIMIT 1) AS primary_photo
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
    googleMapsUrl: row.google_maps_url,
    openingHours: row.opening_hours,
    primaryPhoto: row.primary_photo,
    isFeatured: !!row.is_featured,
  };
}

export interface ListOpts {
  state?: string;
  suburb?: string;
  tag?: string;
  venueType?: string;
  bbox?: Bbox;
  priceLevel?: number;
  minRating?: number;
  hasPhoto?: boolean;
  featured?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: "popular" | "rating" | "name" | "newest" | "featured";
}

function buildWhere(o: ListOpts): { where: string; params: unknown[] } {
  const cond: string[] = [];
  const params: unknown[] = [];
  const p = (val: unknown) => {
    params.push(val);
    return `$${params.length}`;
  };
  if (o.state) cond.push(`r.state = ${p(o.state)}`);
  if (o.suburb) cond.push(`lower(r.suburb) = lower(${p(o.suburb)})`);
  if (o.venueType) cond.push(`r.venue_type = ${p(o.venueType)}`);
  if (o.tag) cond.push(`${p(o.tag)} = ANY(r.tags)`);
  if (o.priceLevel) cond.push(`r.price_level = ${p(o.priceLevel)}`);
  if (o.minRating) cond.push(`r.rating >= ${p(o.minRating)}`);
  if (o.bbox)
    cond.push(
      `r.geom && ST_MakeEnvelope(${p(o.bbox.w)}, ${p(o.bbox.s)}, ${p(o.bbox.e)}, ${p(o.bbox.n)}, 4326)`
    );
  if (o.hasPhoto)
    cond.push(
      "EXISTS (SELECT 1 FROM restaurant_photos p WHERE p.restaurant_id = r.id AND NOT p.removed)"
    );
  if (o.featured) cond.push("r.featured_rank IS NOT NULL");
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
  const limit = o.limit ?? 60;
  const offset = o.offset ?? 0;
  const rows = await query(
    `SELECT ${COLS} FROM restaurants r ${where} ORDER BY ${order} LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  return rows.map(mapRow);
}

// All venues whose geom falls in the current map bounds (for plotting every
// visible pin). Lighter projection than the list; capped for safety.
export async function pinsInBounds(o: ListOpts): Promise<RestaurantPin[]> {
  const { where, params } = buildWhere(o);
  const rows = await query(
    `SELECT r.id, r.slug, r.name, r.lat, r.lng, r.rating, r.review_count,
            r.venue_type, r.price_range, r.suburb, r.state,
            (SELECT p.storage_key FROM restaurant_photos p
               WHERE p.restaurant_id = r.id AND NOT p.removed
               ORDER BY p.is_primary DESC, p.position ASC LIMIT 1) AS primary_photo
       FROM restaurants r ${where} ORDER BY r.review_count DESC NULLS LAST LIMIT 3000`,
    params
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
    priceRange: row.price_range,
    suburb: row.suburb,
    state: row.state,
    primaryPhoto: row.primary_photo,
  }));
}

export async function countRestaurants(o: ListOpts = {}): Promise<number> {
  const { where, params } = buildWhere(o);
  const rows = await query<{ n: string }>(
    `SELECT count(*) n FROM restaurants r ${where}`,
    params
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
    params
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

export async function getRestaurantBySlug(slug: string): Promise<RestaurantDetail | null> {
  const rows = await query(`SELECT ${COLS} FROM restaurants r WHERE r.slug = $1`, [slug]);
  if (!rows.length) return null;
  const base = mapRow(rows[0]);
  const photos = await query(
    `SELECT storage_key, source, attribution, width, height, is_primary
       FROM restaurant_photos WHERE restaurant_id = $1 AND NOT removed
       ORDER BY is_primary DESC, position ASC`,
    [(rows[0] as { id: number }).id]
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
}

export async function getCardBySlug(slug: string): Promise<Restaurant | null> {
  const rows = await query(`SELECT ${COLS} FROM restaurants r WHERE r.slug = $1`, [slug]);
  return rows.length ? mapRow(rows[0]) : null;
}

// ADMIN (temporary) — hard-deletes a restaurant. restaurant_photos rows cascade
// via FK (ON DELETE CASCADE); on-disk media files under media/ are NOT removed.
// Returns the deleted restaurant's name, or null if no row matched.
export async function deleteRestaurantBySlug(slug: string): Promise<string | null> {
  const rows = await query<{ name: string }>(
    `DELETE FROM restaurants WHERE slug = $1 RETURNING name`,
    [slug]
  );
  return rows.length ? rows[0].name : null;
}

export async function featured(limit = 8): Promise<Restaurant[]> {
  return listRestaurants({
    hasPhoto: true,
    orderBy: "popular",
    limit,
  });
}

// Homepage featured row, scoped to the visitor's state. Prefers editorial
// picks (any restaurant with a non-null featured_rank); if the state has none,
// falls back to that state's most popular spots so the row stays state-scoped
// (never nationwide).
export async function featuredByState(
  state: string | null | undefined,
  limit = 5,
): Promise<Restaurant[]> {
  const st = state || undefined;
  const flagged = await listRestaurants({
    state: st,
    featured: true,
    orderBy: "featured",
    limit,
  });
  if (flagged.length) return flagged;
  return listRestaurants({
    state: st,
    hasPhoto: true,
    orderBy: "popular",
    limit,
  });
}

export async function allSlugs(): Promise<string[]> {
  const rows = await query<{ slug: string }>(`SELECT slug FROM restaurants`);
  return rows.map((r) => r.slug);
}

export async function stateFacets(): Promise<Facet[]> {
  const rows = await query<{ value: string; count: string }>(
    `SELECT state AS value, count(*)::text AS count FROM restaurants
      WHERE state IS NOT NULL GROUP BY state ORDER BY count(*) DESC`
  );
  return rows.map((r) => ({ value: r.value, count: Number(r.count) }));
}

export async function suburbFacets(state?: string): Promise<(Facet & { state: string })[]> {
  const rows = await query<{ value: string; state: string; count: string }>(
    `SELECT suburb AS value, state, count(*)::text AS count FROM restaurants
      WHERE suburb IS NOT NULL AND state IS NOT NULL
      ${state ? "AND state = $1" : ""}
      GROUP BY suburb, state ORDER BY count(*) DESC`,
    state ? [state] : []
  );
  return rows.map((r) => ({ value: r.value, state: r.state, count: Number(r.count) }));
}

export async function tagFacets(): Promise<Facet[]> {
  const rows = await query<{ value: string; count: string }>(
    `SELECT t AS value, count(*)::text AS count
       FROM restaurants, unnest(tags) AS t
      GROUP BY t ORDER BY count(*) DESC`
  );
  return rows.map((r) => ({ value: r.value, count: Number(r.count) }));
}

export async function totalCount(): Promise<number> {
  return countRestaurants();
}

export interface Suggestion {
  restaurants: { slug: string; name: string; suburb: string | null; state: string | null }[];
  locations: { suburb: string; state: string; postcode: string | null; count: number }[];
}

// Autocomplete: match restaurant names + suburb/postcode locations.
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
  const restaurants = await query<{ slug: string; name: string; suburb: string; state: string }>(
    `SELECT slug, name, suburb, state FROM restaurants
      WHERE name ILIKE $1 AND ($3::text IS NULL OR state ILIKE $3)
      ORDER BY (name ILIKE $2) DESC, review_count DESC NULLS LAST
      LIMIT 6`,
    [like, pre, stateLike]
  );
  const locations = await query<{ suburb: string; state: string; postcode: string; n: string }>(
    `SELECT suburb, state, min(postcode) postcode, count(*)::text n FROM restaurants
      WHERE (suburb ILIKE $1 OR postcode ILIKE $1) AND ($3::text IS NULL OR state ILIKE $3)
        AND suburb IS NOT NULL AND state IS NOT NULL
      GROUP BY suburb, state
      ORDER BY (suburb ILIKE $2) DESC, count(*) DESC
      LIMIT 5`,
    [like, pre, stateLike]
  );
  return {
    restaurants,
    locations: locations.map((l) => ({
      suburb: l.suburb,
      state: l.state,
      postcode: l.postcode,
      count: Number(l.n),
    })),
  };
}
