import { describe, it, expect } from "vitest";
import {
	isOpenNow,
	openStatus,
	todayHoursLine,
	weekSchedule,
	tagLabel,
	initials,
	dishPrice,
	formatDistance,
	suburbSlug,
} from "./format";
import type { OpeningHours } from "./types";

// The open-status logic is the one piece of the site that does timezone math
// (8 AU zones, DST, past-midnight closes, week wraparound) and a wrong
// "Open now" badge is a silent trust-killer — so it gets the tests.
//
// All instants are FIXED UTC dates; Intl.DateTimeFormat with an explicit
// timeZone is host-independent, so these pass on any machine/CI.

// 2026-07-08 is a Wednesday. 02:00 UTC = Wed 12:00 in Sydney (AEST, UTC+10),
// Wed 10:00 in Perth (UTC+8) — winter, no DST anywhere in AU.
const JUL_WED_NOON_SYD = new Date("2026-07-08T02:00:00Z");
// 2026-07-07 14:30 UTC = Wed 00:30 in Sydney (past midnight).
const JUL_WED_0030_SYD = new Date("2026-07-07T14:30:00Z");
// 2026-01-14 is a Wednesday. 01:00 UTC = Wed 12:00 in Sydney (AEDT, UTC+11)
// but Wed 11:00 in Brisbane (QLD has no DST).
const JAN_WED_NOON_SYD = new Date("2026-01-14T01:00:00Z");

const wed9to5: OpeningHours = { wed: [[540, 1020]] }; // 9am-5pm

describe("isOpenNow", () => {
	it("open during today's slot", () => {
		expect(isOpenNow(wed9to5, "NSW", JUL_WED_NOON_SYD)).toBe(true);
	});
	it("closed before the slot opens", () => {
		expect(
			isOpenNow({ wed: [[780, 1020]] }, "NSW", JUL_WED_NOON_SYD), // 1pm-5pm
		).toBe(false);
	});
	it("boundaries: open at the open minute, closed at the close minute", () => {
		// Sydney noon = min 720
		expect(isOpenNow({ wed: [[720, 900]] }, "NSW", JUL_WED_NOON_SYD)).toBe(true);
		expect(isOpenNow({ wed: [[540, 720]] }, "NSW", JUL_WED_NOON_SYD)).toBe(false);
	});
	it("same instant, different state clock: closed in Sydney, open in Perth", () => {
		const hours: OpeningHours = { wed: [[600, 720]] }; // 10am-12pm local
		expect(isOpenNow(hours, "NSW", JUL_WED_NOON_SYD)).toBe(false); // Syd 12:00, just closed
		expect(isOpenNow(hours, "WA", JUL_WED_NOON_SYD)).toBe(true); // Perth 10:00
	});
	it("DST: January noon in Sydney is 11am in Brisbane", () => {
		const hours: OpeningHours = { wed: [[660, 700]] }; // 11:00-11:40 local
		expect(isOpenNow(hours, "QLD", JAN_WED_NOON_SYD)).toBe(true); // Bris 11:00
		expect(isOpenNow(hours, "NSW", JAN_WED_NOON_SYD)).toBe(false); // Syd 12:00
	});
	it("past-midnight close: yesterday's 6pm-1am slot covers 00:30", () => {
		const late: OpeningHours = { tue: [[1080, 1500]] }; // Tue 6pm - 1am
		expect(isOpenNow(late, "NSW", JUL_WED_0030_SYD)).toBe(true);
	});
	it("past-midnight close: no longer covers 00:30 after the wrapped close", () => {
		// wed: [] because real rows carry all 7 days; without today's key the
		// honest answer after the spillover window is "unknown" (null), not false
		const late: OpeningHours = { tue: [[1080, 1465]], wed: [] }; // Tue 6pm - 12:25am
		expect(isOpenNow(late, "NSW", JUL_WED_0030_SYD)).toBe(false);
	});
	it("spillover expired + no data for today = unknown, not closed", () => {
		expect(isOpenNow({ tue: [[1080, 1465]] }, "NSW", JUL_WED_0030_SYD)).toBe(null);
	});
	it("a same-day close past midnight is capped at 1440 for the today branch", () => {
		// Wed 11pm-2am: at Wed 23:30 (min 1410) the today branch must match.
		const hours: OpeningHours = { wed: [[1380, 1560]] };
		const wed2330 = new Date("2026-07-08T13:30:00Z"); // Syd Wed 23:30
		expect(isOpenNow(hours, "NSW", wed2330)).toBe(true);
	});
	it("[] means closed; a missing day means unknown; null hours mean unknown", () => {
		expect(isOpenNow({ wed: [] }, "NSW", JUL_WED_NOON_SYD)).toBe(false);
		expect(isOpenNow({ mon: [[540, 1020]] }, "NSW", JUL_WED_NOON_SYD)).toBe(null);
		expect(isOpenNow(null, "NSW", JUL_WED_NOON_SYD)).toBe(null);
	});
});

describe("openStatus", () => {
	it("far-off close: 'Open · until 5pm' (more than 3h left)", () => {
		expect(openStatus(wed9to5, "NSW", JUL_WED_NOON_SYD)).toEqual({
			kind: "open",
			label: "Open · until 5pm",
		});
	});
	it("close within 3h: 'Open till 2pm'", () => {
		expect(
			openStatus({ wed: [[540, 840]] }, "NSW", JUL_WED_NOON_SYD),
		).toEqual({ kind: "open", label: "Open till 2pm" });
	});
	it("closing soon (<60 min): 'Closes 12:30pm'", () => {
		expect(
			openStatus({ wed: [[540, 750]] }, "NSW", JUL_WED_NOON_SYD),
		).toEqual({ kind: "closing", label: "Closes 12:30pm" });
	});
	it("open past midnight via yesterday's slot, closing soon: 'Closes 1am'", () => {
		expect(
			openStatus({ tue: [[1080, 1500]] }, "NSW", JUL_WED_0030_SYD),
		).toEqual({ kind: "closing", label: "Closes 1am" });
	});
	it("opens later today", () => {
		expect(
			openStatus({ wed: [[1080, 1320]] }, "NSW", JUL_WED_NOON_SYD),
		).toEqual({ kind: "opening", label: "Opens today at 6pm" });
	});
	it("opens tomorrow", () => {
		expect(
			openStatus({ thu: [[540, 1020]] }, "NSW", JUL_WED_NOON_SYD),
		).toEqual({ kind: "opening", label: "Opens tomorrow at 9am" });
	});
	it("opens later in the week, day-abbreviated", () => {
		expect(
			openStatus({ sat: [[600, 900]] }, "NSW", JUL_WED_NOON_SYD),
		).toEqual({ kind: "opening", label: "Opens Sat at 10am" });
	});
	it("today's only opening already passed: wraps to next week's same day", () => {
		expect(
			openStatus({ wed: [[300, 360]] }, "NSW", JUL_WED_NOON_SYD), // 5-6am
		).toEqual({ kind: "opening", label: "Opens Wed at 5am" });
	});
	it("no upcoming hours at all: closed", () => {
		const allClosed: OpeningHours = {
			mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [],
		};
		expect(openStatus(allClosed, "NSW", JUL_WED_NOON_SYD)).toEqual({
			kind: "closed",
			label: "Closed",
		});
	});
	it("null hours: null (badge hides)", () => {
		expect(openStatus(null, "NSW", JUL_WED_NOON_SYD)).toBe(null);
	});
});

describe("todayHoursLine / weekSchedule", () => {
	const split: OpeningHours = {
		wed: [
			[690, 870], // 11:30am - 2:30pm
			[1050, 1290], // 5:30pm - 9:30pm
		],
	};
	it("formats split slots", () => {
		expect(todayHoursLine(split, "NSW", JUL_WED_NOON_SYD)).toBe(
			"11:30am - 2:30pm, 5:30pm - 9:30pm",
		);
	});
	it("[] renders Closed; missing day renders null", () => {
		expect(todayHoursLine({ wed: [] }, "NSW", JUL_WED_NOON_SYD)).toBe("Closed");
		expect(todayHoursLine({ mon: [[540, 900]] }, "NSW", JUL_WED_NOON_SYD)).toBe(null);
	});
	it("weekSchedule starts Monday, flags today by the state clock, dashes unknown days", () => {
		const week = weekSchedule(split, "NSW", JUL_WED_NOON_SYD)!;
		expect(week[0].day).toBe("Monday");
		expect(week.find((d) => d.today)?.day).toBe("Wednesday");
		expect(week[2].range).toBe("11:30am - 2:30pm, 5:30pm - 9:30pm");
		expect(week[0].range).toBe("—"); // mon missing = unknown
	});
});

describe("small formatters", () => {
	it("tagLabel: kebab to Title Case, with overrides", () => {
		expect(tagLabel("dal-bhat")).toBe("Dal Bhat");
		expect(tagLabel("nepali-indian")).toBe("Nepali-Indian");
		expect(tagLabel("vegetarian")).toBe("Veg-friendly");
	});
	it("initials: drops filler words and apostrophes", () => {
		expect(initials("Maya's Momo")).toBe("MM");
		expect(initials("The Hungry Buddha")).toBe("HB");
	});
	it("dishPrice drops trailing .00 and keeps real cents", () => {
		expect(dishPrice(14)).toBe("$14");
		expect(dishPrice(12.5)).toBe("$12.50");
	});
	it("formatDistance switches units by magnitude", () => {
		expect(formatDistance(0.4)).toBe("400 m");
		expect(formatDistance(3.25)).toBe("3.3 km");
		expect(formatDistance(42.4)).toBe("42 km");
	});
	it("suburbSlug normalizes case, spaces, punctuation", () => {
		expect(suburbSlug("Surry Hills", "NSW")).toBe("surry-hills-nsw");
		expect(suburbSlug("O'Connor", "ACT")).toBe("oconnor-act");
	});
});
