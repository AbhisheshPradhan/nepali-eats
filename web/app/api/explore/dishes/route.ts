import { NextResponse } from "next/server";
import { dishRestaurants } from "@/lib/queries";
import { rateLimit, clientIp } from "@/lib/ratelimit";

// Dish search matches for Explore: ?tag=<dish/style/preparation/diet slug>
// returns every restaurant with menu items carrying that tag, each item with
// its facet slugs (momo preparations + proteins + diet tags) so the client
// filters by chip in memory.
// Viewport-independent and near-static: one CDN-cached payload per dish.
export async function GET(request: Request) {
  const tag = (new URL(request.url).searchParams.get("tag") || "").trim();
  if (!tag) return NextResponse.json({ error: "tag required" }, { status: 400 });

  // Metered after the cheap 400 but before the DB join (unknown tags still
  // query). One CDN-cached payload per dish, so 60 NOVEL dishes/min per IP is
  // scraper territory; ExploreClient falls back to an empty result on non-OK.
  const rl = await rateLimit(`dishes:${clientIp(request)}`, 60, 60);
  if (!rl.ok)
    return NextResponse.json(
      { error: "rate limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSecs) } },
    );

  const result = await dishRestaurants(tag);
  if (!result) return NextResponse.json({ error: "Unknown dish" }, { status: 404 });

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
