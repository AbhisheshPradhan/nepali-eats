import { NextResponse } from "next/server";
import { dishRestaurants } from "@/lib/queries";

// Dish search matches for Explore: ?tag=<dish/style/preparation slug> returns
// every restaurant with menu items carrying that tag, each item with its facet
// slugs (momo preparations + proteins) so the client filters by chip in memory.
// Viewport-independent and near-static: one CDN-cached payload per dish.
export async function GET(request: Request) {
  const tag = (new URL(request.url).searchParams.get("tag") || "").trim();
  if (!tag) return NextResponse.json({ error: "tag required" }, { status: 400 });

  const result = await dishRestaurants(tag);
  if (!result) return NextResponse.json({ error: "Unknown dish" }, { status: 404 });

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
