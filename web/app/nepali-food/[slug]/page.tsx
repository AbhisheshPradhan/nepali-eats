import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingGrid } from "@/components/ListingGrid";
import { listRestaurants, tagFacets } from "@/lib/queries";
import { tagLabel } from "@/lib/format";

export const revalidate = 3600;

const INTRO: Record<string, string> = {
  momo: "Steamed, fried, jhol or C-momo: every kitchen and truck in Australia turning out great momo.",
  tibetan: "Thukpa, laphing and Tibetan-Nepali plates worth seeking out.",
  newari: "Choila, bara and samay baji: the Newari table, spread across Australia.",
  vegetarian: "Generous veg thali and meat-free Nepali cooking.",
  thakali: "The classic Thakali dal bhat set: black dal, gundruk and endless refills.",
  "nepali-indian": "Nepali-Indian kitchens doing curries, tandoor and momo under one roof.",
};

export async function generateStaticParams() {
  const tags = await tagFacets();
  return tags.filter((t) => t.value !== "momo").map((t) => ({ tag: t.value }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const label = tagLabel(tag);
  return {
    title: `${label} spots across Australia`,
    description: INTRO[tag] || `Nepali ${label} food across Australia.`,
    alternates: { canonical: `/tag/${tag}` },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const list = await listRestaurants({ tag, limit: 500 });
  if (list.length === 0) notFound();
  const label = tagLabel(tag);
  return (
    <ListingGrid
      eyebrow="Eat by craving"
      title={`${label} across Australia`}
      intro={INTRO[tag] || `Every spot serving ${label} Nepali food, gathered in one place.`}
      restaurants={list}
      exploreHref={`/explore?tag=${encodeURIComponent(tag)}`}
    />
  );
}
