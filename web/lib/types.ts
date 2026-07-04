// Canonical opening hours: keys mon..sun, value = array of [openMin, closeMin]
// slots in minutes-from-midnight. [] = closed, absent key = unknown, closeMin
// > 1440 means the slot runs past midnight. Parsed server-side from Google's raw
// strings (see scraper/hours.js); the frontend never parses time strings.
export type OpeningHours = Record<string, [number, number][]>;

export type VenueType =
  | "Restaurant"
  | "Café"
  | "Takeaway"
  | "Food Truck"
  | "Caterer"
  | "Dessert"
  | "Bar";

export interface Photo {
  storageKey: string;
  source: string | null;
  attribution: string | null;
  width: number | null;
  height: number | null;
  isPrimary: boolean;
}

export interface Restaurant {
  id: number;
  slug: string;
  name: string;
  venueType: VenueType | null;
  cuisine: string;
  tags: string[];
  halalStatus: string;
  rating: number | null;
  reviewCount: number | null;
  priceLevel: number | null;
  priceRange: string | null;
  street: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  fullAddress: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  whatsapp: string | null;
  menuUrl: string | null;
  menuSource: string | null;
  logoKey: string | null; // self-hosted brand logo (storage_key)
  coverKey: string | null; // standalone cover/hero photo (storage_key), like logoKey
  coverSource: string | null; // cover provenance: 'website' | 'google' | 'upload'
  coverAttribution: string | null; // cover display/licensing credit
  googleMapsUrl: string | null;
  openingHours: OpeningHours | null;
  businessStatus: string | null; // Google business_status: OPERATIONAL | CLOSED_TEMPORARILY | CLOSED_PERMANENTLY
  primaryPhoto: string | null; // resolved lead photo = coverKey ?? first gallery photo
  isFeatured: boolean; // editorial pick — shows the Featured tab + border
  featuredRank: number | null; // raw editorial rank (asc); null = not featured
  popular: boolean; // editorial flag — shows a "Popular" tag on the card
  description: string | null; // editorial blurb; falls back to autoBlurb when empty
  // Google Places reconciled attributes (NULL = unknown). See reconcile-places.js.
  liveMusic: boolean | null;
  kidFriendly: boolean | null;
  servesVegetarian: boolean | null;
  servesAlcohol: boolean | null;
  wheelchairAccessible: boolean | null;
  parking: string | null; // friendly label: 'Free parking' | 'Paid parking'
  // Brand (franchise/multi-location grouping) — PUBLIC/SEO only, no authz weight.
  brandId: number | null;
  brandName: string | null;
  brandSlug: string | null;
}

export interface RestaurantDetail extends Restaurant {
  photos: Photo[];
}

// Menu (detail page only — not fetched for cards / pins / explore).
export interface MenuVariant {
  label: string | null; // null = single price
  price: number | null; // null = market price / illegible
  currency: string;
  isVegetarian: boolean | null;
}
export interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  isVegetarian: boolean | null;
  spiceLevel: number | null;
  variants: MenuVariant[];
  // Optional, populated later (data not in the DB yet). The card already renders
  // them when present: a thumbnail (menu_item_photos) and a review summary.
  photoUrl?: string | null;
  ratingPct?: number | null; // e.g. 92 → "92%"
  reviewCount?: number | null;
}
export interface MenuCategory {
  id: number;
  name: string;
  description: string | null;
  items: MenuItem[];
}

export interface Facet {
  value: string;
  count: number;
}

// The Explore payload row: ONE thin shape serves the map pin, the list card,
// and every client-side filter, so the whole visible directory ships once
// (~450 rows, CDN-cached) and pans/filters never refetch. Deliberately carries
// NO menu data — dish search is a separate endpoint later.
export interface ExploreSpot {
  id: number;
  slug: string;
  name: string;
  lat: number;
  lng: number;
  rating: number | null;
  reviewCount: number | null;
  venueType: VenueType | null;
  priceLevel: number | null;
  priceRange: string | null;
  suburb: string | null;
  state: string | null;
  primaryPhoto: string | null;
  logoKey: string | null;
  phone: string | null; // powers the Call action on the mobile detail sheet
  openingHours: OpeningHours | null; // powers Open now + the card badge
  businessStatus: string | null; // so the popup card can show "Temporarily closed"
  isFeatured: boolean;
  featuredRank: number | null; // drives the Featured sort
  popular: boolean;
  tags: string[]; // coarse dish/style rollup — powers ?tag= scoping
  flags: string[]; // true-only attribute tokens (FLAG_COLS keys) — filter chips
}

export interface Bbox {
  w: number;
  s: number;
  e: number;
  n: number;
}

// --- Dish search ------------------------------------------------------------

// An autocomplete dish row. `protein` is set on compound suggestions ("Paneer
// Momo" = dish momo + protein paneer pre-applied as a filter on Explore).
export interface DishSuggestion {
  slug: string; // dish/style/preparation tag slug (the ?dish= value)
  name: string; // display label ("Momo", "Paneer Momo", "Newari")
  kind: "dish" | "style" | "preparation";
  protein?: string; // protein slug to pre-select (?protein=)
}

// One facet chip on a dish search. For a dish tag these are momo preparations or
// proteins present in the matched items; for a STYLE tag (Newari, Tibetan…) they
// are the style's member dishes (choila, yomari, sukuti…). For the refine bar.
export interface DishFacet {
  slug: string;
  name: string;
  kind: "preparation" | "protein" | "dish";
}

// A matched menu item on a dish search. `slugs` = the item's facet tags
// (preparations under the searched dish + proteins) so the client can filter
// pills/spots by chip without refetching. `price` = min priced variant (null
// when the item has no priced variant); `priceFrom` = it has >1 priced variant
// so the price is a "from" floor (mirrors the detail-page menu convention).
export interface DishItem {
  name: string;
  slugs: string[];
  price: number | null;
  priceFrom: boolean;
}

// A rendered dish-match pill (label + its price, deduped by label client-side).
export interface DishPill {
  label: string;
  price: number | null;
  priceFrom: boolean;
}

// /api/explore/dishes payload: every restaurant with items matching the tag,
// viewport-independent so it caches per dish at the CDN.
export interface DishSearchResult {
  slug: string;
  name: string;
  facets: DishFacet[];
  restaurants: { id: number; items: DishItem[] }[];
}
