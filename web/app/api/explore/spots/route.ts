import { NextResponse } from "next/server";
import { exploreSpots } from "@/lib/queries";

// The whole visible directory as thin Explore rows (pin + card + filter fields,
// NO menu data), fetched once by ExploreClient. ~450 rows ≈ tens of KB gzipped;
// near-static, so the CDN serves repeats and map pans never touch the DB.
export async function GET() {
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
