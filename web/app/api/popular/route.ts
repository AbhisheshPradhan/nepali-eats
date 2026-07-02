import { NextResponse } from "next/server";
import { popularByState } from "@/lib/queries";
import { metroFromState } from "@/lib/format";
import { stateFromSearchParams } from "@/lib/geo";

// Homepage Popular row, re-scoped to the visitor's actual state. Twin of
// /api/featured (same shape, different query) — both consumed by <StateRow>.
// `items` can be empty for a state (no flagged spots): the section then hides.
export async function GET(request: Request) {
  const state = await stateFromSearchParams(new URL(request.url).searchParams);
  const items = await popularByState(state, 5);
  return NextResponse.json(
    { state, metro: metroFromState(state), items },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
