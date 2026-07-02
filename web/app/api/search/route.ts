import { NextResponse } from "next/server";
import { searchSuggest } from "@/lib/queries";

// Deterministic per query and near-static data: cache at the CDN so repeat
// queries don't re-hit the DB. SearchBox normalizes q client-side so
// "Auburn"/"auburn " share one cache entry.
const HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") || "").trim();
  if (q.length < 3)
    return NextResponse.json({ restaurants: [], locations: [] }, { headers: HEADERS });
  const data = await searchSuggest(q);
  return NextResponse.json(data, { headers: HEADERS });
}
