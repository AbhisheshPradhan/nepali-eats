import type { Metadata } from "next";
import { ListingGrid } from "@/components/ListingGrid";
import { listRestaurants } from "@/lib/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Best momo in Australia",
  description:
    "Find the best momo across Australia: steamed, fried, jhol and C-momo from restaurants, trucks and weekend stalls.",
  alternates: { canonical: "/momo" },
};

export default async function MomoPage() {
  const list = await listRestaurants({ tag: "momo", limit: 500 });
  return (
    <ListingGrid
      eyebrow="Find your momo people"
      title="Best momo in Australia"
      intro="Steamed, fried, jhol or C-momo. These are the kitchens, cafes and trucks fogging up windows with great momo across the country. Follow the queues and never skip the achaar."
      restaurants={list}
      exploreHref="/explore?tag=momo"
    />
  );
}
