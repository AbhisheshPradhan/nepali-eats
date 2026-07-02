import { headers, cookies } from "next/headers";
import { isAdminUser } from "@/lib/admin/guard";
import { STATE_CAPITAL } from "@/lib/format";
import { STATE_OVERRIDE_COOKIE } from "@/lib/stateOverride";
import { reverseGeocodeState } from "@/lib/geocode";

// Resolve the AU state for this request: admin override cookie (honored ONLY for
// admins) -> IP geo (Vercel x-vercel-ip-country-region) -> NSW fallback.
// isAdminUser() (a Clerk auth() call) runs only when the override cookie is
// present, so anonymous/normal traffic pays no extra cost.
export async function resolveState(): Promise<string> {
	const c = await cookies();
	const override = (c.get(STATE_OVERRIDE_COOKIE)?.value || "").toUpperCase();
	if (override in STATE_CAPITAL && (await isAdminUser())) return override;

	const h = await headers();
	const detected =
		h.get("x-vercel-ip-country") === "AU"
			? (h.get("x-vercel-ip-country-region") || "").toUpperCase()
			: "";
	return detected in STATE_CAPITAL ? detected : "NSW";
}

// Resolve the AU state from API query params: ?state=VIC wins, else reverse-
// geocode ?lat&lng, else NSW. Shared by the /api/featured + /api/popular
// homepage-row routes.
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
