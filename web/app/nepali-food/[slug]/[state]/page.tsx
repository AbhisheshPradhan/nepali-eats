import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";
import { dishLanding, DISH_COPY } from "@/lib/landing";
import { dishCategory, dishInGeo, dishGeoCounts } from "@/lib/queries";
import { metroFromState } from "@/lib/format";
import { foodImage, foodGallery } from "@/lib/food";

const CAP = 30;
// Render on-demand down to this many venues; below it a state page is too thin.
const MIN_RENDER = 5;
// Prerender + index the combos that clear this.
const MIN_INDEX = 8;

export const revalidate = 86400;

const STATE_CODE: Record<string, string> = {
  nsw: "NSW", vic: "VIC", qld: "QLD", wa: "WA",
  sa: "SA", act: "ACT", tas: "TAS", nt: "NT",
};

function isDishSlug(kind: string | undefined) {
  return kind === "dish" || kind === "preparation";
}

export async function generateStaticParams() {
  const [counts] = await Promise.all([dishGeoCounts()]);
  const copySlugs = new Set(Object.keys(DISH_COPY));
  return counts
    .filter((c) => copySlugs.has(c.slug) && c.n >= MIN_INDEX)
    .map((c) => ({ slug: c.slug, state: c.state.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; state: string }>;
}): Promise<Metadata> {
  const { slug, state } = await params;
  const STATE = STATE_CODE[state.toLowerCase()];
  const cat = STATE ? await dishCategory(slug) : null;
  if (!STATE || !cat || !isDishSlug(cat.kind)) return { title: "Not found" };
  const metro = metroFromState(STATE);
  const copy = DISH_COPY[slug];
  return {
    title: `${cat.name} in ${metro}`,
    description:
      copy?.lead[0]?.slice(0, 150) ??
      `Where to eat ${cat.name.toLowerCase()} in ${metro}.`,
    alternates: { canonical: `/nepali-food/${slug}/${state.toLowerCase()}` },
    // Dishes without bespoke copy stay out of the index.
    ...(copy ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function DishStatePage({
  params,
}: {
  params: Promise<{ slug: string; state: string }>;
}) {
  const { slug, state } = await params;
  const STATE = STATE_CODE[state.toLowerCase()];
  if (!STATE) notFound();
  const cat = await dishCategory(slug);
  if (!cat || !isDishSlug(cat.kind)) notFound();

  const result = await dishInGeo(slug, STATE);
  if (!result || result.restaurants.length < MIN_RENDER) notFound();

  return (
    <LandingPage
      content={dishLanding(result.dish, result.restaurants, STATE)}
      restaurants={result.restaurants.slice(0, CAP)}
      total={result.restaurants.length}
      heroImage={foodImage(slug)}
      gallery={foodGallery(slug)}
    />
  );
}
