import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";
import { DishStateFilter } from "@/components/DishStateFilter";
import { dishLanding, dishMeta, hasStatePage, STATE_PAGE_MIN } from "@/lib/landing";
import { dishCategory, dishInGeo, dishGeoCounts, dishStateCounts } from "@/lib/queries";
import { metroFromState } from "@/lib/format";
import { foodImage, foodGallery } from "@/lib/food";

const CAP = 30;

// Shared by generateMetadata and the page so the title count matches the list.
const loadDish = cache((slug: string, state: string) => dishInGeo(slug, state));
// Every state page is built on deploy; anything not in generateStaticParams
// is a 404 (no build-on-visit, no DB hit for junk URLs). No `revalidate`:
// cached until the next deploy.
export const dynamicParams = false;

const STATE_CODE: Record<string, string> = {
  nsw: "NSW", vic: "VIC", qld: "QLD", wa: "WA",
  sa: "SA", act: "ACT", tas: "TAS", nt: "NT",
};

export async function generateStaticParams() {
  const counts = await dishGeoCounts(["dish", "preparation", "style"]);
  return counts
    .filter((c) => hasStatePage(c) && c.n >= STATE_PAGE_MIN)
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
  if (!STATE || !cat || !hasStatePage(cat)) return { title: "Not found" };
  const result = await loadDish(slug, STATE);
  return {
    ...dishMeta(cat, result?.restaurants.length ?? 0, metroFromState(STATE)),
    alternates: { canonical: `/nepali-food/${slug}/${state.toLowerCase()}` },
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
  if (!cat || !hasStatePage(cat)) notFound();

  const [result, stateCounts] = await Promise.all([
    loadDish(slug, STATE),
    dishStateCounts(slug),
  ]);
  if (!result || result.restaurants.length < STATE_PAGE_MIN) notFound();

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
