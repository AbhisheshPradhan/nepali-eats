import { NextResponse } from "next/server";
import { facetCatalog } from "@/lib/queries";

// The Explore filter catalog: every Category cuisine → its served dish-type /
// protein facets. Location-independent and near-static, so one hard-cached
// payload powers the filter chips for every visitor with no per-category fetch
// (kills the dish-type flicker). Only refreshes when a menu is seeded.
export async function GET() {
  const catalog = await facetCatalog();
  return NextResponse.json(
    { catalog },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
