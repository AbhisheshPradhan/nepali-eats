import type { MetadataRoute } from "next";

import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // /explore stays indexable; its filter/camera query params (?tag=,
    // ?state=, ?clat=, ...) don't — they're the same page (canonical already
    // points back to the bare /explore in app/explore/page.tsx), so crawling
    // every combination would just burn crawl budget and trigger needless
    // renders for content that's already indexed properly via the dedicated
    // /nepali-restaurants/[location] and /nepali-food/[slug] SEO pages.
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/explore?"] },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
