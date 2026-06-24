import { headers, cookies } from "next/headers";
import { isAdminUser } from "@/lib/admin/guard";
import { STATE_CAPITAL } from "@/lib/format";
import { STATE_OVERRIDE_COOKIE } from "@/lib/stateOverride";

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
