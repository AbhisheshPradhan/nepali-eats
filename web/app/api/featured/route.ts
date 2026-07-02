import { NextResponse } from "next/server";
import { featuredByState } from "@/lib/queries";
import { metroFromState } from "@/lib/format";
import { stateFromSearchParams } from "@/lib/geo";

// Homepage Featured row, re-scoped to the visitor's actual state. The page SSRs
// an IP-based default; once the client has a shared location it hits this with
// ?lat&lng (or ?state) to swap in that state's picks + heading. Twin of
// /api/popular (same shape, different query) — both consumed by <StateRow>.
export async function GET(request: Request) {
  const state = await stateFromSearchParams(new URL(request.url).searchParams);
  const items = await featuredByState(state, 5);
  return NextResponse.json(
    { state, metro: metroFromState(state), items },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
