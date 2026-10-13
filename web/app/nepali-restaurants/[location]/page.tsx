import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";
import {
  stateLanding,
  suburbLanding,
  locationMeta,
  locationTitle,
  suburbTitle,
  NEARBY_KM,
  STATE_NAME,
} from "@/lib/landing";
import { listRestaurants, suburbFacets, suburbNearby } from "@/lib/queries";
import { suburbSlug } from "@/lib/format";

// Every state + suburb page is built on deploy; anything else is a 404 with no
// DB hit. No `revalidate`: cached until the next deploy.
export const dynamicParams = false;
const CAP = 30;

const STATE_CODE: Record<string, string> = {
  nsw: "NSW", vic: "VIC", qld: "QLD", wa: "WA",
  sa: "SA", act: "ACT", tas: "TAS", nt: "NT",
};

type Resolved =
  | { type: "state"; state: string }
  | { type: "suburb"; suburb: string; state: string }
  | null;

async function resolve(location: string): Promise<Resolved> {
  const code = location.toLowerCase();
  if (STATE_CODE[code]) return { type: "state", state: STATE_CODE[code] };
  const subs = await suburbFacets();
  const match = subs.find((s) => suburbSlug(s.value, s.state) === location);
  return match ? { type: "suburb", suburb: match.value, state: match.state } : null;
}

// One list per request, shared by generateMetadata and the page, so the count
// in the title, H1 and map button always agree.
const load = cache(async (location: string) => {
  const r = await resolve(location);
  if (!r) return null;
  if (r.type === "state") {
    const list = await listRestaurants({ state: r.state, limit: 500 });
    return { r, list, near: undefined, subs: undefined };
  }
  const [list, near, subs] = await Promise.all([
    listRestaurants({ suburb: r.suburb, state: r.state, limit: 200 }),
    suburbNearby(r.suburb, r.state, NEARBY_KM),
    suburbFacets(),
  ]);
  return { r, list, near, subs };
});

export async function generateStaticParams() {
  const states = Object.keys(STATE_CODE).map((location) => ({ location }));
  // Every suburb with a spot, 1-spot ones included (the title drops the count
  // below COUNT_MIN, and they catch "nepali restaurant <suburb>" searches).
  const subs = await suburbFacets();
  const suburbs = subs.map((s) => ({ location: suburbSlug(s.value, s.state) }));
  return [...states, ...suburbs];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ location: string }>;
}): Promise<Metadata> {
  const { location } = await params;
  const loaded = await load(location);
  if (!loaded) return { title: "Not found" };
  const { r, list, near } = loaded;
  const meta = locationMeta(
    r.type === "state"
      ? locationTitle(list.length, STATE_NAME[r.state] ?? r.state)
      : suburbTitle(list.length, near?.restaurants.length ?? 0, `${r.suburb}, ${r.state}`)
  );
  return {
    ...meta,
    alternates: { canonical: `/nepali-restaurants/${location}` },
  };
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ location: string }>;
}) {
  const { location } = await params;
  const loaded = await load(location);
  if (!loaded) notFound();
  const { r, list, near, subs } = loaded;

  if (r.type === "state") {
    return (
      <LandingPage
        content={stateLanding(r.state, list)}
        restaurants={list.slice(0, CAP)}
        total={list.length}
      />
    );
  }

  return (
    <LandingPage
      content={suburbLanding(r.suburb, r.state, list, near, subs)}
      restaurants={list.slice(0, CAP)}
      total={list.length}
    />
  );
}
