import { NextResponse } from "next/server";
import { exploreSpots } from "@/lib/queries";
import { rateLimit, clientIp } from "@/lib/ratelimit";

// The whole visible directory as thin Explore rows (pin + card + filter fields,
// NO menu data), fetched once by ExploreClient. ~450 rows ≈ tens of KB gzipped;
// near-static, so the CDN serves repeats and map pans never touch the DB.
export async function GET(request: Request) {
  // A real session fetches this ONCE (repeats come from the CDN), so 60/min
  // per IP only bites bulk harvesters hammering the origin. ExploreClient
  // treats any non-OK as its retryable error state.
  const rl = await rateLimit(`spots:${clientIp(request)}`, 60, 60);
  if (!rl.ok)
    return NextResponse.json(
      { error: "rate limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSecs) } },
    );
  const spots = await exploreSpots();
  return NextResponse.json(
    { spots },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
