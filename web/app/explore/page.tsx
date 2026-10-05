import type { Metadata } from "next";
import { ExploreClient } from "@/components/explore/ExploreClient";

export const metadata: Metadata = {
  title: "Explore Nepali food near you",
  description:
    "Search the map for momo, dal bhat, sel roti and more across Australia. Filter by open now, price and rating.",
  alternates: { canonical: "/explore" },
};

// Fully static shell (no searchParams, no DB, no IP-geo): every piece of the
// view — camera, focus restaurant, filtered extent, the dataset itself — is
// resolved client-side in ExploreClient from the /api/explore/spots payload
// it already holds, plus the URL params it reads itself. See ExploreClient
// for the resolvedView logic this replaces (previously extentOf()/
// getCardBySlug()/resolveState() here).
export default function ExplorePage() {
  return <ExploreClient />;
}
