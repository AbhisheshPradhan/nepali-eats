// Opening-hours parser: messy Google strings -> canonical numeric shape.
//
//   parseHours({ Monday: "11 am to 10:30 pm", Tuesday: "Closed", ... })
//     -> { mon: [[660,1350]], tue: [], ... }
//
// Canonical: keys mon..sun, value = array of [openMin, closeMin] slots (minutes
// from midnight). [] = closed. Absent key = unknown. closeMin > 1440 means the
// slot runs past midnight (e.g. "9 am to 12 am" -> [[540,1440]]). The frontend
// consumes this directly; no string parsing at render time.

const DAY_KEY = {
  monday: "mon", tuesday: "tue", wednesday: "wed", thursday: "thu",
  friday: "fri", saturday: "sat", sunday: "sun",
};

// "11", "10:30", "6:30 am", "9 pm", "p.m" -> minutes, or null. Meridiem optional.
function timeToMin(h, mm, mer) {
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

// Parse one "A to B" range (meridiems optional / inferred). Returns [open,close].
function parseRange(seg) {
  const s = seg.trim();
  if (/24\s*hours|24\/7|open 24/i.test(s)) return [0, 1440];
  // split on "to" / en or em dash / hyphen between the two times
  const m = s.match(
    new RegExp(`^${TIME.source}\\s*(?:to|–|—|-)\\s*${TIME.source}$`, "i"),
  );
  if (!m) return null;
  const [, h1, m1, mer1, h2, m2, mer2] = m;
  // infer missing meridiems: a bare start usually shares the end's half of day.
  let merA = mer1, merB = mer2;
  if (!merA && merB) merA = merB;
  if (!merB && merA) merB = merA;
  let open = timeToMin(h1, m1, merA);
  let close = timeToMin(h2, m2, merB);
  if (open == null || close == null) return null;
  // "12 am" close = midnight = end of day, not start.
  if (close === 0) close = 1440;
  // crosses midnight (e.g. 6 pm to 2 am) -> push close into next day.
  if (close <= open) close += 1440;
  return [open, close];
}

// Parse a single day's raw string -> array of slots ([] = closed, null = unknown).
export function parseDayString(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/closed/i.test(s)) return [];
  if (/24\s*hours|24\/7|open 24/i.test(s)) return [[0, 1440]];
  const slots = [];
  for (const seg of s.split(",")) {
    if (!seg.trim()) continue;
    const r = parseRange(seg);
    if (r) slots.push(r);
  }
  return slots.length ? slots : null;
}

// Parse a full per-day raw object -> canonical { mon:[...], ... }. Days that fail
// to parse or are absent are omitted (unknown), not stored as closed.
export function parseHours(raw) {
  if (!raw || typeof raw !== "object") return null;
  const out = {};
  for (const [day, val] of Object.entries(raw)) {
    const key = DAY_KEY[day.toLowerCase()];
    if (!key) continue;
    const slots = parseDayString(val);
    if (slots !== null) out[key] = slots;
  }
  return Object.keys(out).length ? out : null;
}
