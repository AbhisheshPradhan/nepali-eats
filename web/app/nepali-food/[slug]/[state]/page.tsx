import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";
import { DishStateFilter } from "@/components/DishStateFilter";
import { dishLanding, dishMeta, isStateTopic } from "@/lib/landing";
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

// Any dish/preparation renders a state page; cuisines (kind "style") only
// when they are an enabled state topic (see STATE_TOPIC_NAME in lib/landing).
function hasStatePage(cat: { slug: string; kind: string } | null) {
  if (!cat) return false;
  if (cat.kind === "dish" || cat.kind === "preparation") return true;
  return cat.kind === "style" && isStateTopic(cat.slug);
}

export async function generateStaticParams() {
  const counts = await dishGeoCounts(["dish", "preparation", "style"]);
  return counts
    .filter((c) => isStateTopic(c.slug) && c.n >= MIN_INDEX)
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
  if (!STATE || !hasStatePage(cat)) return { title: "Not found" };
  const result = await loadDish(slug, STATE);
  return {
    ...dishMeta(cat!, result?.restaurants.length ?? 0, metroFromState(STATE)),
    alternates: { canonical: `/nepali-food/${slug}/${state.toLowerCase()}` },
    // Only dishes with bespoke copy and the enabled food groups/cuisines are
    // index-ready; everything else renders for users but stays out.
    ...(isStateTopic(slug) ? {} : { robots: { index: false, follow: true } }),
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
