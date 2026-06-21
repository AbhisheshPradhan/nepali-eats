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
  googleMapsUrl: string | null;
  openingHours: OpeningHours | null;
  primaryPhoto: string | null; // storage_key of the hero
  isFeatured: boolean; // editorial pick — shows the Featured tab + border
  featuredRank: number | null; // raw editorial rank (asc); null = not featured
  markedReady: boolean; // internal: data reviewed + ready to go live / for next stage
  description: string | null; // editorial blurb; falls back to autoBlurb when empty
}

export interface RestaurantDetail extends Restaurant {
  photos: Photo[];
}

export interface Facet {
  value: string;
  count: number;
}

export interface RestaurantPin {
  id: number;
  slug: string;
  name: string;
  lat: number;
  lng: number;
  rating: number | null;
  reviewCount: number | null;
  venueType: VenueType | null;
  priceRange: string | null;
  suburb: string | null;
  state: string | null;
  primaryPhoto: string | null;
}

export interface Bbox {
  w: number;
  s: number;
  e: number;
  n: number;
}
