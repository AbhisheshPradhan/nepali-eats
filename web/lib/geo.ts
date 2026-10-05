import { STATE_CAPITAL } from "@/lib/format";
import { reverseGeocodeState } from "@/lib/geocode";

// Resolve the AU state from API query params: ?state=VIC wins, else reverse-
// geocode ?lat&lng, else NSW. Shared by the /api/featured + /api/popular
// homepage-row routes (StateRow's client-side upgrade once the visitor's
// shared location resolves to a different state than the static NSW default).
export async function stateFromSearchParams(
	sp: URLSearchParams,
): Promise<string> {
	let state = (sp.get("state") || "").toUpperCase();
	if (!(state in STATE_CAPITAL)) {
		const lat = Number(sp.get("lat"));
		const lng = Number(sp.get("lng"));
		if (Number.isFinite(lat) && Number.isFinite(lng)) {
			const s = await reverseGeocodeState(lat, lng);
			if (s && s in STATE_CAPITAL) state = s;
		}
	}
	return state in STATE_CAPITAL ? state : "NSW";
}
