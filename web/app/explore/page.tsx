import type { Metadata } from "next";
import { headers } from "next/headers";
import { ExploreClient } from "@/components/explore/ExploreClient";
import { extentOf, getCardBySlug, type ListOpts } from "@/lib/queries";
import type { Bbox } from "@/lib/types";
import { STATE_CENTRE, capitalLatLng } from "@/lib/format";
import { reverseGeocodeSuburb } from "@/lib/geocode";

export const metadata: Metadata = {
  title: "Explore Nepali food near you",
  description:
    "Search the map for momo, dal bhat, sel roti and more across Australia. Filter by open now, price and rating.",
  alternates: { canonical: "/explore" },
};

const SYDNEY = STATE_CENTRE.NSW;
const SYDNEY_BBOX: Bbox = { w: 150.55, s: -34.15, e: 151.35, n: -33.55 };

// Map camera per state, keyed by ISO region code (Vercel x-vercel-ip-country-region).
// Centre = metro midpoint (STATE_CENTRE), separate from the distance default.
const CITY: Record<
  string,
  { center: [number, number]; zoom: number; bbox: Bbox }
> = {
  NSW: { center: STATE_CENTRE.NSW, zoom: 11, bbox: SYDNEY_BBOX },
  VIC: { center: STATE_CENTRE.VIC, zoom: 11, bbox: { w: 144.5, s: -38.1, e: 145.4, n: -37.5 } },
  QLD: { center: STATE_CENTRE.QLD, zoom: 11, bbox: { w: 152.7, s: -27.8, e: 153.35, n: -27.1 } },
  WA: { center: STATE_CENTRE.WA, zoom: 11, bbox: { w: 115.6, s: -32.15, e: 116.1, n: -31.7 } },
  SA: { center: STATE_CENTRE.SA, zoom: 11, bbox: { w: 138.4, s: -35.1, e: 138.85, n: -34.7 } },
  ACT: { center: STATE_CENTRE.ACT, zoom: 11, bbox: { w: 148.9, s: -35.5, e: 149.3, n: -35.1 } },
  TAS: { center: STATE_CENTRE.TAS, zoom: 11, bbox: { w: 147.0, s: -43.1, e: 147.6, n: -42.7 } },
  NT: { center: STATE_CENTRE.NT, zoom: 11, bbox: { w: 130.7, s: -12.6, e: 131.05, n: -12.3 } },
};

type SP = Promise<{
  tag?: string;
  state?: string;
  suburb?: string;
  venue?: string;
  lat?: string;
  lng?: string;
  focus?: string;
}>;

function zoomForSpan(span: number) {
  if (span < 0.15) return 14;
  if (span < 0.5) return 12;
  if (span < 2) return 10;
  if (span < 6) return 8;
  return 6;
}

export default async function ExplorePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const fixed = { tag: sp.tag, state: sp.state, suburb: sp.suburb, venue: sp.venue };
  const filters: ListOpts = {
    tag: sp.tag,
    state: sp.state,
    suburb: sp.suburb,
    venueType: sp.venue,
  };

  // Detected AU state (IP). Drives the default "you are here" distance origin
  // (capital CBD), regardless of which view the map opens in.
  const h = await headers();
  const country = h.get("x-vercel-ip-country") || "";
  const region = (h.get("x-vercel-ip-country-region") || "").toUpperCase();
  const ipState = country === "AU" && region in STATE_CENTRE ? region : "NSW";
  const defaultUserLoc = capitalLatLng(ipState);

  let center = SYDNEY;
  let zoom = 11;
  let areaLabel = "in this area";
  let focusId: number | undefined;
  let userLoc: [number, number] | undefined;
  let nearLabel: string | undefined; // reverse-geocoded suburb for ?lat&lng landings
  let autoLocate = false; // default view: try the visitor's real location client-side

  // searching a restaurant centres the map on it and pins it to the top of the list
  const focused = sp.focus ? await getCardBySlug(sp.focus) : null;

  if (focused && focused.lat != null && focused.lng != null) {
    const { lat, lng } = focused;
    center = [lat, lng];
    // past clusterMaxZoom (14) so the searched spot shows as its own pin,
    // centred, instead of being swallowed into a cluster in dense areas.
    zoom = 16;
    areaLabel = `Search result for "${focused.name}"`;
    focusId = focused.id;
  } else if (sp.lat && sp.lng) {
    const lat = parseFloat(sp.lat);
    const lng = parseFloat(sp.lng);
    center = [lat, lng];
    userLoc = [lat, lng];
    zoom = 13;
    areaLabel = "near you";
    nearLabel = (await reverseGeocodeSuburb(lat, lng)) ?? "Near you";
  } else if (sp.tag || sp.state || sp.suburb || sp.venue) {
    const ext = await extentOf(filters);
    if (ext) {
      center = [ext.avgLat, ext.avgLng];
      const span = Math.max(ext.maxLat - ext.minLat, ext.maxLng - ext.minLng);
      zoom = zoomForSpan(span);
    }
    areaLabel = sp.suburb
      ? `in ${sp.suburb}`
      : sp.state
        ? `in ${sp.state}`
        : sp.tag
          ? `for ${sp.tag}`
          : "in this area";
  } else {
    // no explicit location: open the map on the visitor's AU state metro centre
    // (IP geo), falling back to Sydney for non-AU visitors or when geo is off.
    const city = country === "AU" ? CITY[region] : undefined;
    const c = city ?? CITY.NSW;
    center = c.center;
    zoom = c.zoom;
    // the IP-geo view is just a starting camera; the client lists whatever the
    // visitor's viewport actually shows, so label it generically.
    areaLabel = "in the map area";
    autoLocate = true;
  }

  // Identifies the server-resolved view (which branch above set the camera). The
  // Explore route is the same on every search, so a suburb/restaurant pick is a
  // SOFT navigation that re-renders the server props but does NOT remount the
  // client. ExploreClient watches this key to re-apply the new camera/scope when
  // it changes; same key = same view = leave the live map/filters untouched.
  const viewKey = sp.focus
    ? `focus:${sp.focus}`
    : sp.lat && sp.lng
      ? `ll:${sp.lat},${sp.lng}`
      : sp.suburb || sp.state || sp.tag || sp.venue
        ? `area:${sp.suburb ?? ""}|${sp.state ?? ""}|${sp.tag ?? ""}|${sp.venue ?? ""}`
        : "default";

  // The list/pins/count are CLIENT-OWNED: the server can't know the visitor's
  // viewport pixel size, so any SSR list would be scoped to a guessed bbox and get
  // corrected on first paint (count flip + reorder + set change = the flicker).
  // The server only sets the camera (above). The one exception is the focused
  // restaurant — it isn't viewport-dependent, so we render it instantly as the
  // result; "you may also like" then fills in from the real viewport client-side.
  const items = focused ? [focused] : [];

  return (
    <ExploreClient
      fixed={fixed}
      initialItems={items}
      initialPins={[]}
      initialTotal={focused ? 1 : 0}
      initialCenter={center}
      initialZoom={zoom}
      areaLabel={areaLabel}
      focusId={focusId}
      initialUserLoc={userLoc}
      defaultUserLoc={defaultUserLoc}
      autoLocate={autoLocate}
      viewKey={viewKey}
      initialQuery={
        focused?.name ??
        (sp.suburb ? (sp.state ? `${sp.suburb}, ${sp.state}` : sp.suburb) : undefined) ??
        nearLabel ??
        ""
      }
    />
  );
}
