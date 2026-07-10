import { NextResponse } from "next/server";
import { searchSuggest } from "@/lib/queries";
import { rateLimit, clientIp } from "@/lib/ratelimit";

// Deterministic per query and near-static data: cache at the CDN so repeat
// queries don't re-hit the DB. SearchBox normalizes q client-side so
// "Auburn"/"auburn " share one cache entry.
const HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

export async function GET(request: Request) {
  // The FULL Suggestion shape: SearchBox pipes the parsed body straight into
  // state and reads .dishes unguarded, so a missing key crashes its render.
  const EMPTY = { dishes: [], restaurants: [], locations: [] };

  const q = (new URL(request.url).searchParams.get("q") || "").trim();
  if (q.length < 3)
    return NextResponse.json(EMPTY, { headers: HEADERS });
  // Metered AFTER the short-q return: only queries that would hit the DB
  // spend budget. Repeat queries are CDN-cached and never reach here, so 60
  // NOVEL queries/min per IP is far above any real typing and far below a
  // scrape. 429s return the empty shape so the SearchBox degrades quietly.
  const rl = await rateLimit(`search:${clientIp(request)}`, 60, 60);
  if (!rl.ok)
    return NextResponse.json(EMPTY, {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfterSecs) },
    });
  const data = await searchSuggest(q);
  return NextResponse.json(data, { headers: HEADERS });
}
