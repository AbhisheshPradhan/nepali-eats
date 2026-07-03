import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";
import { tagLanding } from "@/lib/landing";
import { listRestaurants, tagFacets } from "@/lib/queries";
import { tagLabel } from "@/lib/format";

const CAP = 30;

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
  return tags.filter((t) => t.value !== "momo").map((t) => ({ slug: t.value }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const label = tagLabel(slug);
  return {
    title: `${label} spots across Australia`,
    description: INTRO[slug] || `Nepali ${label} food across Australia.`,
    alternates: { canonical: `/nepali-food/${slug}` },
  };
}

export default async function NepaliFoodPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const list = await listRestaurants({ tag: slug, limit: 500 });
  if (list.length === 0) notFound();
  return (
    <LandingPage
      content={tagLanding(slug, list)}
      restaurants={list.slice(0, CAP)}
      total={list.length}
    />
  );
}
