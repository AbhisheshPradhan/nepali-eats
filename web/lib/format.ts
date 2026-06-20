import type { Restaurant } from "./types";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function priceString(r: Pick<Restaurant, "priceLevel" | "priceRange">): string {
  if (r.priceRange) return r.priceRange;
  if (r.priceLevel) return "$".repeat(Math.max(1, Math.min(4, r.priceLevel)));
  return "";
}

// Warm gradient hue for placeholder cards, stable per id.
export function hueFromId(id: number): number {
  // bias toward warm marigold/chili range with some variety
  const warm = [18, 35, 28, 12, 4, 30, 45, 350, 6];
  return warm[id % warm.length];
}

// Parse "11 am to 10 pm" / "11:30 am to 12 am" -> [openMin, closeMin] (minutes from midnight).
function parseRange(text: string): [number, number] | null {
  const m = text.match(
    /(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*(?:to|–|-)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i
  );
  if (!m) return null;
  const toMin = (h: string, mm: string | undefined, ap: string) => {
    let hr = parseInt(h, 10) % 12;
    if (ap.toLowerCase() === "pm") hr += 12;
    return hr * 60 + (mm ? parseInt(mm, 10) : 0);
  };
  return [toMin(m[1], m[2], m[3]), toMin(m[4], m[5], m[6])];
}

/** true = open, false = closed, null = unknown (no hours data). */
export function isOpenNow(
  openingHours: Record<string, string> | null,
  now = new Date()
): boolean | null {
  if (!openingHours) return null;
  const today = DAYS[now.getDay()];
  const slot = openingHours[today];
  if (!slot) return null;
  if (/closed/i.test(slot)) return false;
  const r = parseRange(slot);
  if (!r) return null;
  const [open, close] = r;
  const cur = now.getHours() * 60 + now.getMinutes();
  if (close <= open) return cur >= open || cur < close; // crosses midnight
  return cur >= open && cur < close;
}

export function todayHoursLine(
  openingHours: Record<string, string> | null,
  now = new Date()
): string | null {
  if (!openingHours) return null;
  return openingHours[DAYS[now.getDay()]] || null;
}

export function weekSchedule(
  openingHours: Record<string, string> | null,
  now = new Date()
): { day: string; range: string; today: boolean }[] | null {
  if (!openingHours) return null;
  const order = [1, 2, 3, 4, 5, 6, 0];
  const todayIdx = now.getDay();
  return order.map((i) => ({
    day: DAYS[i],
    range: openingHours[DAYS[i]] || "Closed",
    today: i === todayIdx,
  }));
}

export function haversineKm(
  a: [number, number],
  bLat: number,
  bLng: number
): number {
  const R = 6371;
  const dLat = ((bLat - a[0]) * Math.PI) / 180;
  const dLng = ((bLng - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export function metroFromState(state: string | null): string {
  switch (state) {
    case "NSW": return "Sydney";
    case "VIC": return "Melbourne";
    case "QLD": return "Brisbane";
    case "WA": return "Perth";
    case "SA": return "Adelaide";
    case "ACT": return "Canberra";
    case "TAS": return "Hobart";
    case "NT": return "Darwin";
    default: return "Australia";
  }
}

export function autoBlurb(r: {
  name: string;
  venueType: string | null;
  suburb: string | null;
  state: string | null;
  tags: string[];
}): string {
  const kind = (r.venueType || "spot").toLowerCase();
  const where = [r.suburb, r.state].filter(Boolean).join(", ");
  const foods =
    r.tags.length > 0
      ? r.tags
          .map((t) => (t === "indian-nepali" ? "Nepali-Indian" : t))
          .slice(0, 3)
          .join(", ")
      : "momo and Nepali home cooking";
  const place = where ? `in ${where}` : "in Australia";
  return `${r.name} is a Nepali ${kind} ${place}, known for ${foods}. One for the list of hidden gems worth the trip.`;
}

export function directionsUrl(r: {
  fullAddress: string | null;
  name: string;
  lat: number | null;
  lng: number | null;
}): string {
  const dest = r.fullAddress || r.name;
  const base = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
  return r.lat != null && r.lng != null
    ? `${base}&destination=${r.lat},${r.lng}`
    : base;
}

export function suburbSlug(suburb: string, state: string): string {
  return `${suburb}-${state}`
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
