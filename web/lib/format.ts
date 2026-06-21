import type { OpeningHours, Restaurant } from "./types";

// Canonical day keys / labels indexed by JS getDay() (0 = Sunday).
const CANON = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DAY_FULL = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];
const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// "Open now" depends on the restaurant's local clock, not the visitor's. Map the
// AU state to its IANA zone and read the current weekday + minutes there.
const STATE_TZ: Record<string, string> = {
	NSW: "Australia/Sydney",
	VIC: "Australia/Melbourne",
	QLD: "Australia/Brisbane",
	WA: "Australia/Perth",
	SA: "Australia/Adelaide",
	ACT: "Australia/Sydney",
	TAS: "Australia/Hobart",
	NT: "Australia/Darwin",
};

function zonedNow(
	state: string | null,
	now: Date,
): { day: number; min: number } {
	const tz = STATE_TZ[state ?? ""] ?? "Australia/Sydney";
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: tz,
		weekday: "short",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).formatToParts(now);
	const wd = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
	let hr = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
	const mn = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
	if (hr === 24) hr = 0; // some runtimes emit "24" at midnight
	const day = DAY_ABBR.indexOf(wd);
	return { day: day < 0 ? 0 : day, min: hr * 60 + mn };
}

export function priceString(
	r: Pick<Restaurant, "priceLevel" | "priceRange">,
): string {
	if (r.priceRange) return r.priceRange;
	if (r.priceLevel) return "$".repeat(Math.max(1, Math.min(4, r.priceLevel)));
	return "";
}

// Warm gradient hue for placeholder cards, stable per id.
export function hueFromId(id: number): number {
	// bias toward warm marigold/chili range with some variety
	const warm = [18, 35, 28, 12, 4, 30, 45, 350, 6];
	return warm[id % warm.length];
}

// Minutes-from-midnight -> "10pm" / "10:30pm" / "9am". Wraps past 1440 (e.g. a
// 1am close stored as 1500) back into a 12h clock.
function fmtTime(min: number): string {
	const m = ((min % 1440) + 1440) % 1440;
	const hr = Math.floor(m / 60);
	const mm = m % 60;
	const ap = hr < 12 ? "am" : "pm";
	const h12 = hr % 12 || 12;
	return mm ? `${h12}:${String(mm).padStart(2, "0")}${ap}` : `${h12}${ap}`;
}

const fmtSlots = (slots: [number, number][]) =>
	slots.map(([o, c]) => `${fmtTime(o)} - ${fmtTime(c)}`).join(", ");

/** true = open, false = closed, null = unknown (no hours data for today). */
export function isOpenNow(
	openingHours: OpeningHours | null,
	state: string | null,
	now = new Date(),
): boolean | null {
	if (!openingHours) return null;
	const { day, min } = zonedNow(state, now);
	// a slot from yesterday that runs past midnight (close > 1440) covers now.
	for (const [, c] of openingHours[CANON[(day + 6) % 7]] ?? [])
		if (c > 1440 && min < c - 1440) return true;
	const today = openingHours[CANON[day]];
	if (today === undefined) return null; // unknown (vs [] which is "closed")
	for (const [o, c] of today)
		if (min >= o && min < Math.min(c, 1440)) return true;
	return false;
}

export function todayHoursLine(
	openingHours: OpeningHours | null,
	state: string | null,
	now = new Date(),
): string | null {
	if (!openingHours) return null;
	const slots = openingHours[CANON[zonedNow(state, now).day]];
	if (slots === undefined) return null;
	return slots.length ? fmtSlots(slots) : "Closed";
}

// Open/closed status with the next transition. Examples:
//   { open: true,  label: "Open now · closes at 10pm" }
//   { open: false, label: "Opens 3pm tomorrow" }   (or "Opens 9am Mon" / "Opens 3pm")
// Returns null when there's no hours data so the card can hide the line.
export function openStatus(
	openingHours: OpeningHours | null,
	state: string | null,
	now = new Date(),
): { open: boolean; label: string } | null {
	if (!openingHours) return null;
	const { day, min } = zonedNow(state, now);

	// Open right now? -> show this slot's closing time (yesterday's spillover first).
	for (const [, c] of openingHours[CANON[(day + 6) % 7]] ?? [])
		if (c > 1440 && min < c - 1440)
			return { open: true, label: `Open now · closes at ${fmtTime(c)}` };
	for (const [o, c] of openingHours[CANON[day]] ?? [])
		if (min >= o && min < Math.min(c, 1440))
			return { open: true, label: `Open now · closes at ${fmtTime(c)}` };

	// Otherwise find the next opening within the coming week.
	for (let i = 0; i < 8; i++) {
		const d = (day + i) % 7;
		for (const [open] of openingHours[CANON[d]] ?? []) {
			if (i === 0 && min >= open) continue; // already past this opening today
			const when = i === 0 ? "" : i === 1 ? " tomorrow" : ` ${DAY_ABBR[d]}`;
			return { open: false, label: `Opens ${fmtTime(open)}${when}` };
		}
	}
	return { open: false, label: "Closed" };
}

export function weekSchedule(
	openingHours: OpeningHours | null,
	state: string | null,
	now = new Date(),
): { day: string; range: string; today: boolean }[] | null {
	if (!openingHours) return null;
	const todayIdx = zonedNow(state, now).day;
	return [1, 2, 3, 4, 5, 6, 0].map((i) => {
		const slots = openingHours[CANON[i]];
		return {
			day: DAY_FULL[i],
			range: slots === undefined ? "—" : slots.length ? fmtSlots(slots) : "Closed",
			today: i === todayIdx,
		};
	});
}

export function haversineKm(
	a: [number, number],
	bLat: number,
	bLng: number,
): number {
	const R = 6371;
	const dLat = ((bLat - a[0]) * Math.PI) / 180;
	const dLng = ((bLng - a[1]) * Math.PI) / 180;
	const lat1 = (a[0] * Math.PI) / 180;
	const lat2 = (bLat * Math.PI) / 180;
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
	return R * 2 * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number): string {
	if (km < 1) return `${Math.round(km * 1000)} m`;
	if (km < 10) return `${km.toFixed(1)} km`;
	return `${Math.round(km)} km`;
}

export function metroFromState(state: string | null): string {
	switch (state) {
		case "NSW":
			return "Sydney";
		case "VIC":
			return "Melbourne";
		case "QLD":
			return "Brisbane";
		case "WA":
			return "Perth";
		case "SA":
			return "Adelaide";
		case "ACT":
			return "Canberra";
		case "TAS":
			return "Hobart";
		case "NT":
			return "Darwin";
		default:
			return "Australia";
	}
}

// Default "you are here" per state = the capital CBD (NSW = Sydney 2000). Used
// as the distance origin everywhere (homepage + Explore) when the visitor
// hasn't shared a location. State chosen by IP detection, NSW fallback.
export const STATE_CAPITAL: Record<string, [number, number]> = {
	NSW: [-33.8688, 151.2093], // Sydney 2000
	VIC: [-37.8136, 144.9631], // Melbourne
	QLD: [-27.4698, 153.0251], // Brisbane
	WA: [-31.9523, 115.8613], // Perth
	SA: [-34.9285, 138.6007], // Adelaide
	ACT: [-35.2809, 149.13], // Canberra
	TAS: [-42.8821, 147.3272], // Hobart
	NT: [-12.4634, 130.8456], // Darwin
};

// Explore map CAMERA centre per state = the metro midpoint, tuned to frame
// where the Nepali restaurants actually cluster (e.g. NSW = western Sydney /
// Parramatta), not the CBD. Separate from STATE_CAPITAL on purpose.
export const STATE_CENTRE: Record<string, [number, number]> = {
	NSW: [-33.815, 150.985], // Greater Sydney midpoint (Parramatta-ish)
	VIC: [-37.81, 144.96], // Melbourne
	QLD: [-27.47, 153.02], // Brisbane
	WA: [-31.95, 115.86], // Perth
	SA: [-34.93, 138.6], // Adelaide
	ACT: [-35.28, 149.13], // Canberra
	TAS: [-42.88, 147.33], // Hobart
	NT: [-12.46, 130.84], // Darwin
};

// Distance origin: the capital CBD of the visitor's state (NSW fallback).
export function capitalLatLng(
	state: string | null | undefined,
): [number, number] {
	return STATE_CAPITAL[(state || "NSW").toUpperCase()] || STATE_CAPITAL.NSW;
}

export function autoBlurb(r: {
	name: string;
	venueType: string | null;
	suburb: string | null;
	state: string | null;
	tags: string[];
}): string {
	const kind = (r.venueType || "spot").toLowerCase();
	const where = [r.suburb, r.state].filter(Boolean).join(", ");
	const foods =
		r.tags.length > 0
			? r.tags
					.map((t) => (t === "indian-nepali" ? "Nepali-Indian" : t))
					.slice(0, 3)
					.join(", ")
			: "momo and Nepali home cooking";
	const place = where ? `in ${where}` : "in Australia";
	return `${r.name} is a Nepali ${kind} ${place}, known for ${foods}.`;
}

export function directionsUrl(r: {
	fullAddress: string | null;
	name: string;
	lat: number | null;
	lng: number | null;
}): string {
	const dest = r.fullAddress || r.name;
	const base = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
	return r.lat != null && r.lng != null
		? `${base}&destination=${r.lat},${r.lng}`
		: base;
}

export function suburbSlug(suburb: string, state: string): string {
	return `${suburb}-${state}`
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[^\w\s-]/g, "")
		.trim()
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-");
}
