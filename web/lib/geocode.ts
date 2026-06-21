// Reverse-geocode a coordinate to an AU suburb label ("Marsfield, NSW") via
// Mapbox. Used to fill the search box when the visitor shares their location.
// Token is NEXT_PUBLIC, so this runs both server-side (Explore SSR for ?lat&lng)
// and client-side (Explore "Near me"). Returns null on any failure/miss so the
// caller can fall back. Coordinates are used transiently, never stored.
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export async function reverseGeocodeSuburb(
  lat: number,
  lng: number,
): Promise<string | null> {
  if (!TOKEN) return null;
  try {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
      `?types=locality,neighborhood,place&country=AU&limit=1&access_token=${TOKEN}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const f = data.features?.[0];
    if (!f?.text) return null;
    const region = (f.context || []).find((c: { id?: string }) =>
      (c.id || "").startsWith("region"),
    );
    const state = (region?.short_code as string | undefined)?.split("-")[1];
    return state ? `${f.text}, ${state}` : f.text;
  } catch {
    return null;
  }
}

// Reverse-geocode a coordinate to an AU state code ("NSW", "VIC", …) via Mapbox.
// Used to re-scope the homepage featured row to the visitor's actual state once
// they've shared their location (IP geo is the server-side default). Returns null
// on any failure/miss so the caller can keep the IP/NSW fallback.
export async function reverseGeocodeState(
  lat: number,
  lng: number,
): Promise<string | null> {
  if (!TOKEN) return null;
  try {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
      `?types=region&country=AU&limit=1&access_token=${TOKEN}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    // For a `region` feature the short_code ("AU-NSW") is on the feature itself.
    const code = data.features?.[0]?.properties?.short_code as string | undefined;
    const state = code?.split("-")[1]?.toUpperCase();
    return state || null;
  } catch {
    return null;
  }
}
