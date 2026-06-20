import type { MetadataRoute } from "next";
import { allSlugs, suburbFacets, stateFacets, tagFacets } from "@/lib/queries";
import { STORIES } from "@/lib/stories";
import { suburbSlug } from "@/lib/format";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://nepalieats.com.au";
const STATE_SLUG: Record<string, string> = {
  NSW: "nsw", VIC: "vic", QLD: "qld", WA: "wa",
  SA: "sa", ACT: "act", TAS: "tas", NT: "nt",
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, suburbs, states, tags] = await Promise.all([
    allSlugs(),
    suburbFacets(),
    stateFacets(),
    tagFacets(),
  ]);

  const url = (path: string, priority = 0.6): MetadataRoute.Sitemap[number] => ({
    url: `${SITE}${path}`,
    lastModified: new Date(),
    priority,
  });

  return [
    url("/", 1),
    url("/explore", 0.9),
    url("/momo", 0.8),
    url("/stories", 0.7),
    url("/add-a-spot", 0.3),
    ...states.map((s) => url(`/nepali-restaurants/${STATE_SLUG[s.value] || s.value.toLowerCase()}`, 0.8)),
    ...suburbs
      .filter((s) => s.count >= 2)
      .map((s) => url(`/nepali-restaurants/${suburbSlug(s.value, s.state)}`, 0.7)),
    ...tags.map((t) => url(`/tag/${t.value}`, 0.6)),
    ...STORIES.map((s) => url(`/stories/${s.slug}`, 0.5)),
    ...slugs.map((slug) => url(`/restaurant/${slug}`, 0.6)),
  ];
}
