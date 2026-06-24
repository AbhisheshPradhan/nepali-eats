import { STATE_CAPITAL } from "@/lib/format";

// Cookie behind the admin state-preview switcher. Isomorphic module: the name is
// shared with the server resolver (lib/geo); the read/write helpers are
// client-only (guarded on `document`) and used by the header switcher and the
// user-location provider. Carries no privilege, only a state code; the server
// honors it only for admins.
export const STATE_OVERRIDE_COOKIE = "ne_admin_state";

// The active override state code, or "" when none/invalid. Client-only.
export function readStateOverride(): string {
	if (typeof document === "undefined") return "";
	const m = document.cookie.match(
		new RegExp(`(?:^|; )${STATE_OVERRIDE_COOKIE}=([^;]*)`),
	);
	const v = m ? decodeURIComponent(m[1]).toUpperCase() : "";
	return v in STATE_CAPITAL ? v : "";
}

// Set (valid state) or clear (anything else) the override. Client-only.
export function writeStateOverride(state: string) {
	if (state && state in STATE_CAPITAL) {
		// 1 year; UI hint only.
		document.cookie = `${STATE_OVERRIDE_COOKIE}=${state}; path=/; max-age=31536000; samesite=lax`;
	} else {
		document.cookie = `${STATE_OVERRIDE_COOKIE}=; path=/; max-age=0; samesite=lax`;
	}
}
