import type { MetadataRoute } from "next";
import {
  restaurantSitemapEntries,
  suburbFacets,
  stateFacets,
  tagFacets,
  dishGeoCounts,
} from "@/lib/queries";
import { STORIES } from "@/lib/stories";
import { dishPageSlugs, hasStatePage, STATE_PAGE_MIN } from "@/lib/landing";
import { suburbSlug } from "@/lib/format";

import { SITE } from "@/lib/site";
const STATE_SLUG: Record<string, string> = {
  NSW: "nsw", VIC: "vic", QLD: "qld", WA: "wa",
  SA: "sa", ACT: "act", TAS: "tas", NT: "nt",
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [restaurants, suburbs, states, tags, dishCounts, topicCounts] = await Promise.all([
    restaurantSitemapEntries(),
    suburbFacets(),
    stateFacets(),
    tagFacets(),
    dishGeoCounts(),
    dishGeoCounts(["dish", "preparation", "style"]),
  ]);

  // Same rules as the routes' generateStaticParams (lib/landing), so the
  // sitemap lists exactly the pages that are built.
  const dishSlugs = dishPageSlugs(dishCounts);
  const isDish = new Set(dishSlugs);
  const dishStateUrls = topicCounts.filter(
    (c) => hasStatePage(c) && c.n >= STATE_PAGE_MIN,
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
    ...suburbs.map((s) => url(`/nepali-restaurants/${suburbSlug(s.value, s.state)}`, 0.7)),
    // momo has its own canonical /momo page, so it's excluded here.
    ...tags
      .filter((t) => t.value !== "momo" && !isDish.has(t.value))
      .map((t) => url(`/nepali-food/${t.value}`, 0.6)),
    // Flag-derived (serves_vegetarian), so it never appears in tagFacets.
    url("/nepali-food/vegetarian", 0.6),
    // Dish hubs (national) + their state pages.
    ...dishSlugs.map((slug) => url(`/nepali-food/${slug}`, 0.7)),
    ...dishStateUrls.map((c) => url(`/nepali-food/${c.slug}/${c.state.toLowerCase()}`, 0.6)),
    ...STORIES.map((s) => url(`/stories/${s.slug}`, 0.5, undefined)),
    ...restaurants.map((r) => url(`/restaurant/${r.slug}`, 0.6, r.lastmod)),
  ];
}
