import type { Metadata } from "next";
import { LandingPage } from "@/components/LandingPage";
import { tagLanding, groupByState } from "@/lib/landing";
import { listRestaurants } from "@/lib/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Best momo in Australia",
  description:
    "Find the best momo across Australia: steamed, fried, jhol and C-momo from restaurants, trucks and weekend stalls.",
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
    />
  );
}
