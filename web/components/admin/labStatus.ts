import type { OpeningHours } from "@/lib/types";

// Shared helpers for previewing the live OpenStatusBadge in the UI Playground.
// The badge computes its label from openingHours + the current time (in the
// restaurant's tz), so to force a given state we hand it hours guaranteed to land
// on that state right now. Samples here are NSW, so we anchor to Sydney's clock.
const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CANON = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function sydneyNow(): { day: number; min: number } {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: "Australia/Sydney",
		weekday: "short",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).formatToParts(new Date());
	const wd = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
	let hr = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
	const mn = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
	if (hr === 24) hr = 0;
	const day = DAY_ABBR.indexOf(wd);
	return { day: day < 0 ? 0 : day, min: hr * 60 + mn };
}

export type StatusOpt =
	| "open"
	| "closing"
	| "opening"
	| "closed"
	| "temp"
	| "perm";

export const STATUS_OPTS: { value: StatusOpt; label: string }[] = [
	{ value: "open", label: "Open" },
	{ value: "closing", label: "Closing" },
	{ value: "opening", label: "Opens later" },
	{ value: "closed", label: "Closed" },
	{ value: "temp", label: "Temp" },
	{ value: "perm", label: "Perm" },
];

export function statusOverride(opt: StatusOpt): {
	openingHours: OpeningHours | null;
	businessStatus: string | null;
} {
	if (opt === "temp")
		return { openingHours: {}, businessStatus: "CLOSED_TEMPORARILY" };
	if (opt === "perm")
		return { openingHours: {}, businessStatus: "CLOSED_PERMANENTLY" };

	const { day, min } = sydneyNow();
	const wk: OpeningHours = {
		sun: [],
		mon: [],
		tue: [],
		wed: [],
		thu: [],
		fri: [],
		sat: [],
	};
	const k = CANON[day];
	const clamp = (n: number) => Math.max(0, Math.min(1439, n));
	if (opt === "open") wk[k] = [[clamp(min - 120), clamp(min + 120)]];
	else if (opt === "closing") wk[k] = [[clamp(min - 120), clamp(min + 30)]];
	else if (opt === "opening") wk[k] = [[clamp(min + 120), clamp(min + 300)]];
	// "closed": leave every day empty so there's no upcoming opening all week.
	return { openingHours: wk, businessStatus: "OPERATIONAL" };
}
