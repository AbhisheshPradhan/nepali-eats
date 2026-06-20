import type { Metadata } from "next";
import { headers } from "next/headers";
import { ExploreClient } from "@/components/explore/ExploreClient";
import {
  listRestaurants,
  countRestaurants,
  pinsInBounds,
  extentOf,
  getCardBySlug,
  type ListOpts,
} from "@/lib/queries";
import type { Bbox } from "@/lib/types";

export const metadata: Metadata = {
  title: "Explore Nepali food near you",
  description:
    "Search the map for momo, dal bhat, sel roti and more across Australia. Filter by open now, price and rating.",
  alternates: { canonical: "/explore" },
};

const SYDNEY: [number, number] = [-33.815, 150.985];
const SYDNEY_BBOX: Bbox = { w: 150.55, s: -34.15, e: 151.35, n: -33.55 };

// State capital fallbacks, keyed by ISO region code (Vercel x-vercel-ip-country-region).
const CITY: Record<
  string,
  { center: [number, number]; zoom: number; bbox: Bbox; label: string }
> = {
  NSW: { center: SYDNEY, zoom: 11, bbox: SYDNEY_BBOX, label: "in Sydney" },
  VIC: { center: [-37.81, 144.96], zoom: 11, bbox: { w: 144.5, s: -38.1, e: 145.4, n: -37.5 }, label: "in Melbourne" },
  QLD: { center: [-27.47, 153.02], zoom: 11, bbox: { w: 152.7, s: -27.8, e: 153.35, n: -27.1 }, label: "in Brisbane" },
  WA: { center: [-31.95, 115.86], zoom: 11, bbox: { w: 115.6, s: -32.15, e: 116.1, n: -31.7 }, label: "in Perth" },
  SA: { center: [-34.93, 138.6], zoom: 11, bbox: { w: 138.4, s: -35.1, e: 138.85, n: -34.7 }, label: "in Adelaide" },
  ACT: { center: [-35.28, 149.13], zoom: 11, bbox: { w: 148.9, s: -35.5, e: 149.3, n: -35.1 }, label: "in Canberra" },
  TAS: { center: [-42.88, 147.33], zoom: 11, bbox: { w: 147.0, s: -43.1, e: 147.6, n: -42.7 }, label: "in Hobart" },
  NT: { center: [-12.46, 130.84], zoom: 11, bbox: { w: 130.7, s: -12.6, e: 131.05, n: -12.3 }, label: "in Darwin" },
};

type SP = Promise<{
  q?: string;
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
    q: sp.q,
  };

  let center = SYDNEY;
  let zoom = 11;
  let bbox = SYDNEY_BBOX;
  let areaLabel = "in this area";
  let focusId: number | undefined;
  let userLoc: [number, number] | undefined;

  // searching a restaurant centres the map on it and pins it to the top of the list
  const focused = sp.focus ? await getCardBySlug(sp.focus) : null;

  if (focused && focused.lat != null && focused.lng != null) {
    const { lat, lng } = focused;
    center = [lat, lng];
    zoom = 14;
    bbox = { w: lng - 0.07, s: lat - 0.055, e: lng + 0.07, n: lat + 0.055 };
    areaLabel = `near ${focused.name}`;
    focusId = focused.id;
  } else if (sp.lat && sp.lng) {
    const lat = parseFloat(sp.lat);
    const lng = parseFloat(sp.lng);
    center = [lat, lng];
    userLoc = [lat, lng];
    zoom = 13;
    bbox = { w: lng - 0.08, s: lat - 0.06, e: lng + 0.08, n: lat + 0.06 };
    areaLabel = "near you";
  } else if (sp.tag || sp.state || sp.suburb || sp.venue) {
    const ext = await extentOf(filters);
    if (ext) {
      center = [ext.avgLat, ext.avgLng];
      const span = Math.max(ext.maxLat - ext.minLat, ext.maxLng - ext.minLng);
      zoom = zoomForSpan(span);
      const padLat = (ext.maxLat - ext.minLat) * 0.15 + 0.02;
      const padLng = (ext.maxLng - ext.minLng) * 0.15 + 0.02;
      bbox = {
        w: ext.minLng - padLng,
        s: ext.minLat - padLat,
        e: ext.maxLng + padLng,
        n: ext.maxLat + padLat,
      };
    }
    areaLabel = sp.suburb
      ? `in ${sp.suburb}`
      : sp.state
        ? `in ${sp.state}`
        : sp.tag
          ? `for ${sp.tag}`
          : "in this area";
  } else {
    // no explicit location: default to the visitor's AU state capital (IP geo),
    // falling back to Sydney for non-AU visitors or when geo is unavailable.
    const h = await headers();
    const country = h.get("x-vercel-ip-country") || "";
    const region = h.get("x-vercel-ip-country-region") || "";
    const city = country === "AU" ? CITY[region] : undefined;
    const c = city ?? CITY.NSW;
    center = c.center;
    zoom = c.zoom;
    bbox = c.bbox;
    areaLabel = c.label;
  }

  const optsWithBbox: ListOpts = { ...filters, bbox };
  const [listed, total, pins] = await Promise.all([
    listRestaurants({ ...optsWithBbox, limit: 30, orderBy: "popular" }),
    countRestaurants(optsWithBbox),
    pinsInBounds(optsWithBbox),
  ]);

  // pin the focused restaurant to the top of the list
  const items = focused
    ? [focused, ...listed.filter((r) => r.id !== focused.id)]
    : listed;

  return (
    <ExploreClient
      fixed={fixed}
      initialItems={items}
      initialPins={pins}
      initialTotal={total}
      initialCenter={center}
      initialZoom={zoom}
      areaLabel={areaLabel}
      focusId={focusId}
      initialUserLoc={userLoc}
    />
  );
}
