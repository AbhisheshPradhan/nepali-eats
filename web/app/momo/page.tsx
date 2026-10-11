import type { Metadata } from "next";
import { LandingPage } from "@/components/LandingPage";
import { tagLanding, groupByState } from "@/lib/landing";
import { listRestaurants } from "@/lib/queries";
import { foodImage } from "@/lib/food";

// No `revalidate` export: cached indefinitely (Next's default) until a
// redeploy. See the same note on app/restaurant/[slug]/page.tsx.

export const metadata: Metadata = {
  title: "Best momo restaurants in Australia",
  description:
    "The best momo restaurants in Australia, state by state. Steamed, fried, jhol and C-momo, with ratings, hours and maps to your nearest plate.",
  alternates: { canonical: "/momo" },
};

export default async function MomoPage() {
  // Ordered best-first (listRestaurants default), so each state block takes the
  // top spots. The full list still drives the intro count + JSON-LD.
  const list = await listRestaurants({ tag: "momo", limit: 1000 });
  const groups = groupByState(list, "momo", 6);
  return (
    <LandingPage
      content={tagLanding("momo", list)}
      restaurants={list}
      groups={groups}
      groupLabel="momo"
      heroImage={foodImage("momo")}
    />
  );
}
