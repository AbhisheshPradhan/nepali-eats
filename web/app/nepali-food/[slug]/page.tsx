import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";
import { tagLanding, dishLanding, DISH_COPY } from "@/lib/landing";
import { listRestaurants, tagFacets, dishCategory, dishInGeo } from "@/lib/queries";
import { tagLabel } from "@/lib/format";
import { foodImage, foodGallery } from "@/lib/food";

const CAP = 30;

export const revalidate = 86400;

// Short meta descriptions for the cuisine/tag pages (distinct from the on-page body).
const INTRO: Record<string, string> = {
  tibetan: "Thukpa, laphing and Tibetan-Nepali plates worth seeking out.",
  newari: "Choila, bara and samay baji: the Newari table, spread across Australia.",
  vegetarian: "Generous veg thali and meat-free Nepali cooking.",
  thakali: "The classic Thakali dal bhat set: black dal, gundruk and endless refills.",
  "nepali-indian": "Nepali-Indian kitchens doing curries, tandoor and momo under one roof.",
};

// A slug is a "dish page" when it's a dish/preparation in the taxonomy AND has
// bespoke copy. Dishes without copy resolve but are held out of the index (thin).
function isDishSlug(kind: string | undefined) {
  return kind === "dish" || kind === "preparation";
}

export async function generateStaticParams() {
  const tags = await tagFacets();
  const tagParams = tags
    .filter((t) => t.value !== "momo")
    .map((t) => ({ slug: t.value }));
  // Index-ready dishes = those with bespoke copy.
  const dishParams = Object.keys(DISH_COPY).map((slug) => ({ slug }));
  return [...tagParams, ...dishParams];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "momo") return { alternates: { canonical: "/momo" } };
  const cat = await dishCategory(slug);
  const canonical = `/nepali-food/${slug}`;

  if (cat && isDishSlug(cat.kind)) {
    const copy = DISH_COPY[slug];
    const title = copy?.title ?? `${cat.name} in Australia`;
    return {
      title,
      description:
        copy?.lead[0]?.slice(0, 155) ??
        `Where to eat ${cat.name.toLowerCase()} across Australia.`,
      alternates: { canonical },
      // Dishes without bespoke copy are too thin to index yet.
      ...(copy ? {} : { robots: { index: false, follow: true } }),
    };
  }

  const label = tagLabel(slug);
  return {
    title: `${label} spots across Australia`,
    description: INTRO[slug] || `Nepali ${label} food across Australia.`,
    alternates: { canonical },
  };
}

export default async function NepaliFoodPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // momo has its own canonical hub at /momo; keep this path from duplicating it.
  if (slug === "momo") redirect("/momo");

  const cat = await dishCategory(slug);

  // Dish page (menu-derived, popularity-sorted, with matched-item pills).
  if (cat && isDishSlug(cat.kind)) {
    const result = await dishInGeo(slug);
    if (!result || result.restaurants.length === 0) notFound();
    return (
      <LandingPage
        content={dishLanding(result.dish, result.restaurants)}
        restaurants={result.restaurants.slice(0, CAP)}
        total={result.restaurants.length}
        heroImage={foodImage(slug)}
        gallery={foodGallery(slug)}
      />
    );
  }

  // Cuisine / dietary / tag page (broad, tag-derived).
  const list = await listRestaurants({ tag: slug, limit: 500 });
  if (list.length === 0) notFound();
  return (
    <LandingPage
      content={tagLanding(slug, list)}
      restaurants={list.slice(0, CAP)}
      total={list.length}
      heroImage={foodImage(slug)}
      gallery={foodGallery(slug)}
    />
  );
}
