import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";
import { DishStateFilter } from "@/components/DishStateFilter";
import { dishLanding, dishMeta, DISH_COPY } from "@/lib/landing";
import { dishCategory, dishInGeo, dishGeoCounts, dishStateCounts } from "@/lib/queries";
import { metroFromState } from "@/lib/format";
import { foodImage, foodGallery } from "@/lib/food";

const CAP = 30;

// Shared by generateMetadata and the page so the title count matches the list.
const loadDish = cache((slug: string, state: string) => dishInGeo(slug, state));
// Render on-demand down to this many venues; below it a state page is too thin.
const MIN_RENDER = 5;
// Prerender + index the combos that clear this.
const MIN_INDEX = 8;

// No `revalidate` export: cached indefinitely (Next's default) until a
// redeploy. See the same note on app/restaurant/[slug]/page.tsx.

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
  const copy = DISH_COPY[slug];
  const result = await loadDish(slug, STATE);
  return {
    ...dishMeta(cat, result?.restaurants.length ?? 0, metroFromState(STATE)),
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

  const [result, stateCounts] = await Promise.all([
    loadDish(slug, STATE),
    dishStateCounts(slug),
  ]);
  if (!result || result.restaurants.length < MIN_RENDER) notFound();

  return (
    <LandingPage
      content={dishLanding(result.dish, result.restaurants, STATE)}
      restaurants={result.restaurants.slice(0, CAP)}
      total={result.restaurants.length}
      heroImage={foodImage(slug)}
      gallery={foodGallery(slug)}
      stateFilter={
        <DishStateFilter slug={slug} counts={stateCounts} active={STATE} />
      }
    />
  );
}
