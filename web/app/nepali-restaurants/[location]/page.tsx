import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";
import { stateLanding, suburbLanding } from "@/lib/landing";
import { listRestaurants, suburbFacets } from "@/lib/queries";
import { suburbSlug } from "@/lib/format";

export const revalidate = 3600;

const CAP = 30;

const STATE_CODE: Record<string, string> = {
  nsw: "NSW", vic: "VIC", qld: "QLD", wa: "WA",
  sa: "SA", act: "ACT", tas: "TAS", nt: "NT",
};
const STATE_NAME: Record<string, string> = {
  NSW: "New South Wales", VIC: "Victoria", QLD: "Queensland",
  WA: "Western Australia", SA: "South Australia",
  ACT: "the ACT", TAS: "Tasmania", NT: "the Northern Territory",
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

export async function generateStaticParams() {
  const states = Object.keys(STATE_CODE).map((location) => ({ location }));
  const subs = await suburbFacets();
  const suburbs = subs
    .filter((s) => s.count >= 2)
    .map((s) => ({ location: suburbSlug(s.value, s.state) }));
  return [...states, ...suburbs];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ location: string }>;
}): Promise<Metadata> {
  const { location } = await params;
  const r = await resolve(location);
  if (!r) return { title: "Not found" };
  const title =
    r.type === "state"
      ? `Nepali restaurants in ${STATE_NAME[r.state] || r.state}`
      : `Nepali restaurants in ${r.suburb}, ${r.state}`;
  return {
    title,
    description:
      r.type === "state"
        ? `Every Nepali restaurant, cafe, food truck and stall across ${STATE_NAME[r.state] || r.state}. Momo, dal bhat, sel roti and more.`
        : `The best Nepali food in ${r.suburb}, ${r.state}: momo, Thakali dal bhat and Newari feasts, gathered in one place.`,
    alternates: { canonical: `/nepali-restaurants/${location}` },
  };
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ location: string }>;
}) {
  const { location } = await params;
  const r = await resolve(location);
  if (!r) notFound();

  if (r.type === "state") {
    const list = await listRestaurants({ state: r.state, limit: 500 });
    return (
      <LandingPage
        content={stateLanding(r.state, list)}
        restaurants={list.slice(0, CAP)}
        total={list.length}
      />
    );
  }

  const list = await listRestaurants({ suburb: r.suburb, state: r.state, limit: 200 });
  return (
    <LandingPage
      content={suburbLanding(r.suburb, r.state, list)}
      restaurants={list.slice(0, CAP)}
      total={list.length}
    />
  );
}
