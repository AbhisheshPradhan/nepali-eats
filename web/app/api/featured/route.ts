import { NextResponse } from "next/server";
import { featuredByState } from "@/lib/queries";
import { reverseGeocodeState } from "@/lib/geocode";
import { metroFromState, STATE_CAPITAL } from "@/lib/format";

// Homepage featured row, re-scoped to the visitor's actual state. The page SSRs
// an IP-based default; once the client has the visitor's shared location it hits
// this with ?lat&lng (or a known ?state) to swap in that state's featured picks
// and heading. Reverse-geocodes server-side, NSW fallback on any miss.
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  let state = (sp.get("state") || "").toUpperCase();
  if (!(state in STATE_CAPITAL)) {
    const lat = Number(sp.get("lat"));
    const lng = Number(sp.get("lng"));
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const s = await reverseGeocodeState(lat, lng);
      if (s && s in STATE_CAPITAL) state = s;
    }
  }
  if (!(state in STATE_CAPITAL)) state = "NSW";

  const gems = await featuredByState(state, 5);
  return NextResponse.json({ state, metro: metroFromState(state), gems });
}
