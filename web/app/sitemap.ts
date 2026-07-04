import type { MetadataRoute } from "next";
import {
  restaurantSitemapEntries,
  suburbFacets,
  stateFacets,
  tagFacets,
  dishGeoCounts,
} from "@/lib/queries";
import { STORIES } from "@/lib/stories";
import { DISH_COPY } from "@/lib/landing";
import { suburbSlug } from "@/lib/format";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://nepalieats.com.au";
const STATE_SLUG: Record<string, string> = {
  NSW: "nsw", VIC: "vic", QLD: "qld", WA: "wa",
  SA: "sa", ACT: "act", TAS: "tas", NT: "nt",
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [restaurants, suburbs, states, tags, dishCounts] = await Promise.all([
    restaurantSitemapEntries(),
    suburbFacets(),
    stateFacets(),
    tagFacets(),
    dishGeoCounts(),
  ]);

  // Index-ready dish pages: those with bespoke copy (national), and their state
  // variants that clear the venue-count gate.
  const dishSlugs = new Set(Object.keys(DISH_COPY));
  const dishStateUrls = dishCounts.filter(
    (c) => dishSlugs.has(c.slug) && c.n >= 8,
  );

  // The freshest restaurant change drives lastModified for the data-driven
  // landing pages (home, explore, state/suburb/tag), since their content is
  // generated from the restaurant data.
  const maxLastmod = restaurants.reduce<Date | undefined>(
    (max, r) => (!max || r.lastmod > max ? r.lastmod : max),
    undefined,
  );

  const url = (
    path: string,
    priority = 0.6,
    lastModified: Date | undefined = maxLastmod,
  ): MetadataRoute.Sitemap[number] => ({
    url: `${SITE}${path}`,
    ...(lastModified ? { lastModified } : {}),
    priority,
  });

  return [
    url("/", 1),
    url("/explore", 0.9),
    url("/nepali-food", 0.8),
    url("/momo", 0.8),
    url("/stories", 0.7),
    url("/about", 0.4, undefined),
    url("/add-a-spot", 0.3, undefined),
    ...states.map((s) => url(`/nepali-restaurants/${STATE_SLUG[s.value] || s.value.toLowerCase()}`, 0.8)),
    ...suburbs
      .filter((s) => s.count >= 2)
      .map((s) => url(`/nepali-restaurants/${suburbSlug(s.value, s.state)}`, 0.7)),
    // momo has its own canonical /momo page, so it's excluded here.
    ...tags.filter((t) => t.value !== "momo").map((t) => url(`/nepali-food/${t.value}`, 0.6)),
    // Dish hubs (national) + their qualifying state variants.
    ...Object.keys(DISH_COPY).map((slug) => url(`/nepali-food/${slug}`, 0.7)),
    ...dishStateUrls.map((c) => url(`/nepali-food/${c.slug}/${c.state.toLowerCase()}`, 0.6)),
    ...STORIES.map((s) => url(`/stories/${s.slug}`, 0.5, undefined)),
    ...restaurants.map((r) => url(`/restaurant/${r.slug}`, 0.6, r.lastmod)),
  ];
}
