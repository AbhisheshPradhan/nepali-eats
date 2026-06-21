import type { OpeningHours } from "@/lib/types";

// Parse pasted opening-hours text (e.g. copied from Google) into the canonical
// shape. Each line is "<Day><tab/space><range>", e.g.:
//   Monday    11 am–9 pm
//   Saturday  12–9 pm
//   Sunday    Closed
// Mirrors scraper/hours.js: minutes from midnight, [] = closed, close > 1440
// means past midnight. Bare meridiems are inferred from the line's other time.

const DAY_KEY: Record<string, string> = {
  monday: "mon", mon: "mon",
  tuesday: "tue", tue: "tue", tues: "tue",
  wednesday: "wed", wed: "wed", weds: "wed",
  thursday: "thu", thu: "thu", thur: "thu", thurs: "thu",
  friday: "fri", fri: "fri",
  saturday: "sat", sat: "sat",
  sunday: "sun", sun: "sun",
};

function timeToMin(h: string, mm: string | undefined, mer: string | undefined): number | null {
  let hr = parseInt(h, 10);
  if (Number.isNaN(hr) || hr > 24) return null;
  const min = mm ? parseInt(mm, 10) : 0;
  if (mer) {
    const pm = /p/i.test(mer);
    hr = hr % 12;
    if (pm) hr += 12;
  }
  return hr * 60 + min;
}

const TIME = /(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i;

function parseRange(seg: string): [number, number] | null {
  const s = seg.trim();
  if (/24\s*hours|24\/7|open 24/i.test(s)) return [0, 1440];
  const m = s.match(new RegExp(`^${TIME.source}\\s*(?:to|–|—|-)\\s*${TIME.source}$`, "i"));
  if (!m) return null;
  const [, h1, m1, mer1, h2, m2, mer2] = m;
  let merA = mer1;
  let merB = mer2;
  if (!merA && merB) merA = merB;
  if (!merB && merA) merB = merA;
  const open = timeToMin(h1, m1, merA);
  let close = timeToMin(h2, m2, merB);
  if (open == null || close == null) return null;
  if (close === 0) close = 1440; // "12 am" close = midnight = end of day
  if (close <= open) close += 1440; // crosses midnight
  return [open, close];
}

// One day's range text -> slots ([] = closed, null = unparseable/unknown).
function parseDayString(raw: string): [number, number][] | null {
  const s = raw.trim();
  if (!s) return null;
  if (/closed/i.test(s)) return [];
  if (/24\s*hours|24\/7|open 24/i.test(s)) return [[0, 1440]];
  const slots: [number, number][] = [];
  for (const seg of s.split(",")) {
    if (!seg.trim()) continue;
    const r = parseRange(seg);
    if (r) slots.push(r);
  }
  return slots.length ? slots : null;
}

// Parse pasted multi-line text. Returns the canonical hours for the days that
// parsed, plus how many days matched (so the UI can report partial parses).
export function parsePastedHours(text: string): { hours: OpeningHours; matched: number } {
  const out: OpeningHours = {};
  let matched = 0;
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    const dm = t.match(/^([a-z]+)/i);
    if (!dm) continue;
    const key = DAY_KEY[dm[1].toLowerCase()];
    if (!key) continue;
    // Strip the day word + any separator (tab, spaces, colon, dash) before times.
    const rest = t.slice(dm[0].length).replace(/^[\s:–—-]+/, "");
    const slots = parseDayString(rest);
    if (slots !== null) {
      out[key] = slots;
      matched += 1;
    }
  }
  return { hours: out, matched };
}
