import { query } from "../db";
import { getCardBySlug } from "../queries";
import type { Restaurant } from "../types";
import type { PlaceCardData } from "@/components/PlaceCard";

// Admin-only DB layer (data entry). Kept separate from the public queries.ts so
// the editable surface + whitelists are obvious in one place.

// ---- Coverage list (the data-entry worklist) -------------------------------

export interface AdminRow {
  id: number;
  slug: string;
  name: string;
  suburb: string | null;
  state: string | null;
  reviewCount: number | null;
  featuredRank: number | null;
  markedReady: boolean;
  hasPhoto: boolean;
  hasHours: boolean;
  hasPrice: boolean;
  hasMenu: boolean;
  contactable: boolean;
}

export type MissingFilter = "photo" | "hours" | "price" | "menu" | "contact";

const COVERAGE = {
  photo: "EXISTS (SELECT 1 FROM restaurant_photos p WHERE p.restaurant_id = r.id AND NOT p.removed)",
  hours: "(r.opening_hours IS NOT NULL AND r.opening_hours::text <> '{}')",
  price: "(r.price_level IS NOT NULL OR r.price_range IS NOT NULL)",
  menu: "(r.menu_url IS NOT NULL)",
  // contactable = at least one phone / email / social handle (non-empty)
  contact:
    "(COALESCE(NULLIF(r.phone,''), NULLIF(r.email,''), NULLIF(r.facebook,''), " +
    "NULLIF(r.instagram,''), NULLIF(r.tiktok,''), NULLIF(r.whatsapp,'')) IS NOT NULL)",
} as const;

export interface AdminListOpts {
  state?: string;
  q?: string;
  missing?: MissingFilter;
}

// Shared WHERE for the admin worklist (table + grid views).
function adminWhere(opts: AdminListOpts): { where: string; params: unknown[] } {
  const cond: string[] = [];
  const params: unknown[] = [];
  const p = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };
  if (opts.state) cond.push(`r.state = ${p(opts.state)}`);
  if (opts.q) cond.push(`r.name ILIKE ${p("%" + opts.q + "%")}`);
  if (opts.missing) cond.push(`NOT ${COVERAGE[opts.missing]}`);
  return { where: cond.length ? "WHERE " + cond.join(" AND ") : "", params };
}

export async function adminList(
  opts: AdminListOpts,
  limit = 1000,
  offset = 0
): Promise<AdminRow[]> {
  const { where, params } = adminWhere(opts);

  const rows = await query<Record<string, unknown>>(
    `SELECT r.id, r.slug, r.name, r.suburb, r.state, r.review_count, r.featured_rank,
            r.marked_ready,
            ${COVERAGE.photo} AS has_photo,
            ${COVERAGE.hours} AS has_hours,
            ${COVERAGE.price} AS has_price,
            ${COVERAGE.menu} AS has_menu,
            ${COVERAGE.contact} AS contactable
       FROM restaurants r ${where}
      ORDER BY r.marked_ready ASC, r.state ASC, r.review_count DESC NULLS LAST
      LIMIT ${Math.trunc(limit)} OFFSET ${Math.trunc(offset)}`,
    params
  );
  return rows.map((row) => ({
    id: Number(row.id),
    slug: String(row.slug),
    name: String(row.name),
    suburb: (row.suburb as string) ?? null,
    state: (row.state as string) ?? null,
    reviewCount: row.review_count != null ? Number(row.review_count) : null,
    featuredRank: row.featured_rank != null ? Number(row.featured_rank) : null,
    markedReady: !!row.marked_ready,
    hasPhoto: !!row.has_photo,
    hasHours: !!row.has_hours,
    hasPrice: !!row.has_price,
    hasMenu: !!row.has_menu,
    contactable: !!row.contactable,
  }));
}

// Same worklist, but as full card data so the admin grid view can render the
// real public PlaceCard (to eyeball how cards look). Honours the same filters.
export async function adminCards(
  opts: AdminListOpts,
  limit = 1000,
  offset = 0
): Promise<PlaceCardData[]> {
  const { where, params } = adminWhere(opts);
  const rows = await query<Record<string, unknown>>(
    `SELECT r.id, r.slug, r.name, r.venue_type, r.rating, r.review_count, r.lat, r.lng,
            r.price_level, r.price_range,
            r.suburb, r.state, r.opening_hours, r.featured_rank, r.popular, r.logo_key,
            (SELECT p.storage_key FROM restaurant_photos p
               WHERE p.restaurant_id = r.id AND NOT p.removed
               ORDER BY p.is_primary DESC, p.position ASC LIMIT 1) AS primary_photo
       FROM restaurants r ${where}
      ORDER BY r.marked_ready ASC, r.state ASC, r.review_count DESC NULLS LAST
      LIMIT ${Math.trunc(limit)} OFFSET ${Math.trunc(offset)}`,
    params
  );
  return rows.map((row) => ({
    id: Number(row.id),
    slug: String(row.slug),
    name: String(row.name),
    venueType: (row.venue_type as PlaceCardData["venueType"]) ?? null,
    rating: row.rating != null ? Number(row.rating) : null,
    reviewCount: row.review_count != null ? Number(row.review_count) : null,
    priceLevel: row.price_level != null ? Number(row.price_level) : null,
    priceRange: (row.price_range as string) ?? null,
    suburb: (row.suburb as string) ?? null,
    state: (row.state as string) ?? null,
    lat: row.lat != null ? Number(row.lat) : null,
    lng: row.lng != null ? Number(row.lng) : null,
    primaryPhoto: (row.primary_photo as string) ?? null,
    openingHours: (row.opening_hours as PlaceCardData["openingHours"]) ?? null,
    isFeatured: row.featured_rank != null,
    popular: !!row.popular,
    logoKey: (row.logo_key as string) ?? null,
  }));
}

export interface AdminCoverage {
  total: number;
  photo: number;
  hours: number;
  price: number;
  menu: number;
  contactable: number;
}

// Total + coverage counts over the FULL filtered set (not just the current
// page), so the summary line and pagination stay accurate when paginated.
export async function adminCoverage(opts: AdminListOpts): Promise<AdminCoverage> {
  const { where, params } = adminWhere(opts);
  const rows = await query<Record<string, string>>(
    `SELECT count(*)::text AS total,
            count(*) FILTER (WHERE ${COVERAGE.photo})::text AS photo,
            count(*) FILTER (WHERE ${COVERAGE.hours})::text AS hours,
            count(*) FILTER (WHERE ${COVERAGE.price})::text AS price,
            count(*) FILTER (WHERE ${COVERAGE.menu})::text AS menu,
            count(*) FILTER (WHERE ${COVERAGE.contact})::text AS contactable
       FROM restaurants r ${where}`,
    params
  );
  const x = rows[0];
  return {
    total: Number(x.total),
    photo: Number(x.photo),
    hours: Number(x.hours),
    price: Number(x.price),
    menu: Number(x.menu),
    contactable: Number(x.contactable),
  };
}

// ---- Review queue (false-positive cleanup + visual photo QA) ----------------
// A visual worklist that complements the coverage table: each item carries its
// active photos so the reviewer can spot wrong/missing images and confirm a spot
// is genuinely Nepali, then keep/exclude/delete without leaving the grid.

export type ReviewMode = "review_needed" | "no_photo" | "has_photo" | "all";

export interface ReviewPhoto {
  id: number;
  key: string;
  source: string | null;
}
export interface ReviewItem {
  id: number;
  slug: string;
  name: string;
  suburb: string | null;
  state: string | null;
  fullAddress: string | null;
  website: string | null;
  googleMapsUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  venueType: string | null;
  tags: string[];
  relevance: string | null;
  isNepali: boolean | null;
  photos: ReviewPhoto[];
}

function reviewWhere(mode: ReviewMode): string {
  switch (mode) {
    case "review_needed":
      return "WHERE r.is_nepali IS NULL";
    case "no_photo":
      return `WHERE NOT ${COVERAGE.photo}`;
    case "has_photo":
      return `WHERE ${COVERAGE.photo}`;
    default:
      return "";
  }
}

export async function reviewQueue(
  mode: ReviewMode,
  limit = 60,
  offset = 0
): Promise<ReviewItem[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT r.id, r.slug, r.name, r.suburb, r.state, r.full_address, r.website,
            r.google_maps_url, r.rating, r.review_count, r.venue_type, r.tags,
            r.relevance, r.is_nepali,
            COALESCE(
              json_agg(
                json_build_object('id', p.id, 'key', p.storage_key, 'source', p.source)
                ORDER BY p.is_primary DESC, p.position ASC
              ) FILTER (WHERE p.id IS NOT NULL),
              '[]'
            ) AS photos
       FROM restaurants r
       LEFT JOIN restaurant_photos p
         ON p.restaurant_id = r.id AND NOT p.removed
       ${reviewWhere(mode)}
       GROUP BY r.id
       ORDER BY r.state ASC NULLS LAST, r.suburb ASC NULLS LAST, r.name ASC
       LIMIT ${Math.trunc(limit)} OFFSET ${Math.trunc(offset)}`
  );
  return rows.map((row) => ({
    id: Number(row.id),
    slug: String(row.slug),
    name: String(row.name),
    suburb: (row.suburb as string) ?? null,
    state: (row.state as string) ?? null,
    fullAddress: (row.full_address as string) ?? null,
    website: (row.website as string) ?? null,
    googleMapsUrl: (row.google_maps_url as string) ?? null,
    rating: row.rating != null ? Number(row.rating) : null,
    reviewCount: row.review_count != null ? Number(row.review_count) : null,
    venueType: (row.venue_type as string) ?? null,
    tags: (row.tags as string[]) ?? [],
    relevance: (row.relevance as string) ?? null,
    isNepali: row.is_nepali as boolean | null,
    photos: row.photos as ReviewPhoto[],
  }));
}

export async function reviewCounts(): Promise<Record<ReviewMode, number>> {
  const rows = await query<Record<string, string>>(
    `SELECT
       count(*) FILTER (WHERE r.is_nepali IS NULL)::text AS review_needed,
       count(*) FILTER (WHERE NOT ${COVERAGE.photo})::text AS no_photo,
       count(*) FILTER (WHERE ${COVERAGE.photo})::text AS has_photo,
       count(*)::text AS all
     FROM restaurants r`
  );
  const x = rows[0];
  return {
    review_needed: Number(x.review_needed),
    no_photo: Number(x.no_photo),
    has_photo: Number(x.has_photo),
    all: Number(x.all),
  };
}

// Curation: is_nepali = true (keep) / false (exclude from the directory, which
// filters WHERE is_nepali IS NOT FALSE). Row is kept so it's reversible; the
// relevance bucket is synced for consistency. Returns the name, or null.
export async function setNepaliStatus(
  slug: string,
  isNepali: boolean
): Promise<string | null> {
  const rows = await query<{ name: string }>(
    `UPDATE restaurants
        SET is_nepali = $2,
            relevance = CASE WHEN $2 THEN 'nepali' ELSE 'manual_excluded' END,
            updated_at = now()
      WHERE slug = $1
      RETURNING name`,
    [slug, isNepali]
  );
  return rows[0]?.name ?? null;
}

// ---- Field updates (whitelisted) -------------------------------------------

type FieldMeta = { col: string; kind?: "int" | "float" | "json" | "array" | "bool" };
const EDITABLE: Record<string, FieldMeta> = {
  markedReady: { col: "marked_ready", kind: "bool" },
  name: { col: "name" },
  description: { col: "description" },
  fullAddress: { col: "full_address" },
  street: { col: "street" },
  suburb: { col: "suburb" },
  state: { col: "state" },
  postcode: { col: "postcode" },
  rating: { col: "rating", kind: "float" },
  reviewCount: { col: "review_count", kind: "int" },
  priceLevel: { col: "price_level", kind: "int" },
  priceRange: { col: "price_range" },
  tags: { col: "tags", kind: "array" },
  venueType: { col: "venue_type" },
  halalStatus: { col: "halal_status" },
  featuredRank: { col: "featured_rank", kind: "int" },
  popular: { col: "popular", kind: "bool" },
  openingHours: { col: "opening_hours", kind: "json" },
  menuUrl: { col: "menu_url" },
  menuSource: { col: "menu_source" },
  logoKey: { col: "logo_key" },
  coverKey: { col: "cover_key" },
  coverSource: { col: "cover_source" },
  coverAttribution: { col: "cover_attribution" },
  phone: { col: "phone" },
  email: { col: "email" },
  website: { col: "website" },
  facebook: { col: "facebook" },
  instagram: { col: "instagram" },
  tiktok: { col: "tiktok" },
  whatsapp: { col: "whatsapp" },
};

// Updates only keys present in `patch` and on the whitelist. Empty strings map to
// NULL; ints coerce (bad ints -> NULL); jsonb/array casts handled per column.
export async function updateRestaurantFields(
  slug: string,
  patch: Record<string, unknown>
): Promise<Restaurant | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [key, meta] of Object.entries(EDITABLE)) {
    if (!(key in patch)) continue;
    let val = patch[key];
    if (val === "") val = null;
    if (meta.kind === "bool") {
      params.push(val === true || val === "true" || val === "on" || val === 1);
      sets.push(`${meta.col} = $${params.length}`);
      continue;
    }
    if (meta.kind === "int" || meta.kind === "float") {
      const n = val == null ? null : Number(val);
      const ok = n != null && Number.isFinite(n);
      val = ok ? (meta.kind === "int" ? Math.trunc(n) : n) : null;
    }
    if (meta.kind === "json") {
      params.push(val == null ? null : JSON.stringify(val));
      sets.push(`${meta.col} = $${params.length}::jsonb`);
      continue;
    }
    // text[] columns accept a JS array directly via node-postgres.
    params.push(val);
    sets.push(`${meta.col} = $${params.length}`);
  }
  if (!sets.length) return null;
  params.push(slug);
  const res = await query<{ id: number }>(
    `UPDATE restaurants SET ${sets.join(", ")}, updated_at = now()
      WHERE slug = $${params.length} RETURNING id`,
    params
  );
  if (!res.length) return null;
  return getCardBySlug(slug);
}

// ---- Photos -----------------------------------------------------------------

export interface AdminPhoto {
  id: number;
  storageKey: string;
  isPrimary: boolean;
  position: number | null;
}

export async function getPhotosForAdmin(restaurantId: number): Promise<AdminPhoto[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT id, storage_key, is_primary, position
       FROM restaurant_photos
      WHERE restaurant_id = $1 AND NOT removed
      ORDER BY position ASC, id ASC`,
    [restaurantId]
  );
  return rows.map((r) => ({
    id: Number(r.id),
    storageKey: String(r.storage_key),
    isPrimary: !!r.is_primary,
    position: r.position != null ? Number(r.position) : null,
  }));
}

export async function addPhoto(
  restaurantId: number,
  storageKey: string,
  meta: { width?: number | null; height?: number | null; source?: string } = {}
): Promise<number | null> {
  const rows = await query<{ id: number }>(
    `INSERT INTO restaurant_photos (restaurant_id, storage_key, source, width, height, position)
     VALUES ($1, $2, $3, $4, $5,
             COALESCE((SELECT max(position) + 1 FROM restaurant_photos WHERE restaurant_id = $1), 0))
     ON CONFLICT (restaurant_id, storage_key) DO NOTHING
     RETURNING id`,
    [restaurantId, storageKey, meta.source ?? "upload", meta.width ?? null, meta.height ?? null]
  );
  return rows[0]?.id ?? null;
}

// Persist a new photo order: position = index in the given id list (scoped to
// the restaurant so a stray id can't reorder another's photos).
export async function reorderPhotos(
  restaurantId: number,
  orderedIds: number[]
): Promise<void> {
  if (!orderedIds.length) return;
  const positions = orderedIds.map((_, i) => i);
  await query(
    `UPDATE restaurant_photos AS rp
        SET position = data.pos
       FROM (SELECT * FROM unnest($1::bigint[], $2::int[]) AS t(id, pos)) AS data
      WHERE rp.id = data.id AND rp.restaurant_id = $3`,
    [orderedIds, positions, restaurantId]
  );
}

// Make one photo the primary for its restaurant (clears the others).
export async function setPrimaryPhoto(photoId: number): Promise<void> {
  await query(
    `UPDATE restaurant_photos SET is_primary = (id = $1)
      WHERE restaurant_id = (SELECT restaurant_id FROM restaurant_photos WHERE id = $1)`,
    [photoId]
  );
}

// Media of a single gallery photo, used to promote it to the standalone cover
// (copies storage_key/source/attribution into the restaurant's cover_* fields).
export async function getPhotoMedia(photoId: number): Promise<{
  storageKey: string;
  source: string | null;
  attribution: string | null;
  restaurantId: number;
} | null> {
  const rows = await query<{
    storage_key: string;
    source: string | null;
    attribution: string | null;
    restaurant_id: number;
  }>(
    `SELECT storage_key, source, attribution, restaurant_id
       FROM restaurant_photos WHERE id = $1`,
    [photoId]
  );
  const r = rows[0];
  return r
    ? {
        storageKey: r.storage_key,
        source: r.source,
        attribution: r.attribution,
        restaurantId: r.restaurant_id,
      }
    : null;
}

// Hard-deletes a photo row, returning its storage_key so the caller can remove
// the file. (Admin deletes are real removals, not the scraper's soft `removed`.)
export async function deletePhotoRow(photoId: number): Promise<string | null> {
  const rows = await query<{ storage_key: string }>(
    `DELETE FROM restaurant_photos WHERE id = $1 RETURNING storage_key`,
    [photoId]
  );
  return rows[0]?.storage_key ?? null;
}

// Current cover_key for a restaurant (by id). Used to guard photo deletes: a
// promoted cover points cover_key at a gallery photo's file, so deleting that
// photo's file would orphan the cover.
export async function getCoverKeyById(restaurantId: number): Promise<string | null> {
  const rows = await query<{ cover_key: string | null }>(
    `SELECT cover_key FROM restaurants WHERE id = $1`,
    [restaurantId]
  );
  return rows[0]?.cover_key ?? null;
}

export async function getRestaurantIdBySlug(slug: string): Promise<number | null> {
  const rows = await query<{ id: number }>(`SELECT id FROM restaurants WHERE slug = $1`, [slug]);
  return rows[0]?.id ?? null;
}

// ---- Media triage (batch photo + menu cleanup) -----------------------------
// Powers /admin/triage: a prioritised, keyboard-driven feed for ripping through
// photo QA (flag junk, set primary, add) and menu uploads across many spots.

export type TriageMode = "photo" | "menu";

export interface TriagePhoto {
  id: number;
  key: string;
  source: string | null;
  isPrimary: boolean;
}
export interface TriageItem {
  id: number;
  slug: string;
  name: string;
  suburb: string | null;
  state: string | null;
  venueType: string | null;
  rating: number | null;
  reviewCount: number | null;
  featuredRank: number | null;
  website: string | null;
  googleMapsUrl: string | null;
  menuUrl: string | null;
  coverKey: string | null;
  coverSource: string | null;
  logoKey: string | null;
  photosReviewedAt: string | null;
  photos: TriagePhoto[];
  menuFiles: string[];
}

// Reviewed filter (photo mode): pending = not-yet-reviewed only (default),
// all = both, only = reviewed only.
export type ReviewedFilter = "pending" | "all" | "only";

export interface TriageOpts {
  mode: TriageMode;
  state?: string;
  reviewed?: ReviewedFilter;
  // Hide spots that have no media at all (no cover, no logo, no gallery photos).
  hideNoMedia?: boolean;
}

// Best/most-visible spots first (mirrors scraper/enrich-places.js):
// featured first, then rating, then review count.
const TRIAGE_ORDER =
  "(r.featured_rank IS NOT NULL) DESC, r.rating DESC NULLS LAST, r.review_count DESC NULLS LAST";

function triageWhere(opts: TriageOpts): { where: string; params: unknown[] } {
  const cond: string[] = [];
  const params: unknown[] = [];
  const p = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };
  if (opts.state) cond.push(`r.state = ${p(opts.state)}`);
  if (opts.mode === "menu") {
    cond.push(`NOT ${COVERAGE.menu}`);
  } else if (opts.reviewed === "only") {
    cond.push(`r.photos_reviewed_at IS NOT NULL`);
  } else if (opts.reviewed !== "all") {
    // default "pending": not yet reviewed
    cond.push(`r.photos_reviewed_at IS NULL`);
  }
  if (opts.hideNoMedia) {
    cond.push(
      `(r.cover_key IS NOT NULL OR r.logo_key IS NOT NULL
        OR EXISTS (SELECT 1 FROM restaurant_photos p2
                   WHERE p2.restaurant_id = r.id AND NOT p2.removed))`
    );
  }
  return { where: cond.length ? "WHERE " + cond.join(" AND ") : "", params };
}

export async function triageQueue(
  opts: TriageOpts,
  limit = 24,
  offset = 0
): Promise<TriageItem[]> {
  const { where, params } = triageWhere(opts);
  const rows = await query<Record<string, unknown>>(
    `SELECT r.id, r.slug, r.name, r.suburb, r.state, r.venue_type,
            r.rating, r.review_count,
            r.featured_rank, r.website, r.google_maps_url, r.menu_url,
            r.cover_key, r.cover_source, r.logo_key,
            r.photos_reviewed_at,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', p.id, 'key', p.storage_key,
                  'source', p.source, 'isPrimary', p.is_primary
                )
                ORDER BY p.is_primary DESC, p.position ASC
              ) FILTER (WHERE p.id IS NOT NULL),
              '[]'
            ) AS photos
       FROM restaurants r
       LEFT JOIN restaurant_photos p
         ON p.restaurant_id = r.id AND NOT p.removed
       ${where}
       GROUP BY r.id
       ORDER BY ${TRIAGE_ORDER}, r.id ASC
       LIMIT ${Math.trunc(limit)} OFFSET ${Math.trunc(offset)}`,
    params
  );

  const items: TriageItem[] = rows.map((row) => ({
    id: Number(row.id),
    slug: String(row.slug),
    name: String(row.name),
    suburb: (row.suburb as string) ?? null,
    state: (row.state as string) ?? null,
    venueType: (row.venue_type as string) ?? null,
    rating: row.rating != null ? Number(row.rating) : null,
    reviewCount: row.review_count != null ? Number(row.review_count) : null,
    featuredRank: row.featured_rank != null ? Number(row.featured_rank) : null,
    website: (row.website as string) ?? null,
    googleMapsUrl: (row.google_maps_url as string) ?? null,
    menuUrl: (row.menu_url as string) ?? null,
    coverKey: (row.cover_key as string) ?? null,
    coverSource: (row.cover_source as string) ?? null,
    logoKey: (row.logo_key as string) ?? null,
    photosReviewedAt:
      row.photos_reviewed_at != null ? String(row.photos_reviewed_at) : null,
    photos: row.photos as TriagePhoto[],
    menuFiles: [],
  }));

  // Menu mode shows already-uploaded files; only the page's ~24 rows hit disk.
  if (opts.mode === "menu") {
    const { listMenuFiles } = await import("./storage");
    await Promise.all(
      items.map(async (it) => {
        it.menuFiles = await listMenuFiles(it.id);
      })
    );
  }
  return items;
}

export async function triageCounts(
  state?: string
): Promise<{ photo: number; menu: number }> {
  const cond = state ? `WHERE r.state = $1` : "";
  const params = state ? [state] : [];
  const rows = await query<{ photo: string; menu: string }>(
    `SELECT
       count(*) FILTER (WHERE r.photos_reviewed_at IS NULL)::text AS photo,
       count(*) FILTER (WHERE NOT ${COVERAGE.menu})::text AS menu
     FROM restaurants r ${cond}`,
    params
  );
  return { photo: Number(rows[0].photo), menu: Number(rows[0].menu) };
}

export async function markPhotosReviewed(slug: string): Promise<void> {
  await query(
    `UPDATE restaurants SET photos_reviewed_at = now(), updated_at = now() WHERE slug = $1`,
    [slug]
  );
}

export async function unmarkPhotosReviewed(slug: string): Promise<void> {
  await query(
    `UPDATE restaurants SET photos_reviewed_at = NULL, updated_at = now() WHERE slug = $1`,
    [slug]
  );
}
