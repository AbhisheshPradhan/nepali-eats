import fs from "fs";

// Build the directory's main database table from the scraped + enriched data.
// Pure post-processing: parses structured location fields, Google IDs, and a
// unique slug. No network calls.

const records = JSON.parse(
  fs.readFileSync("nepali-restaurants-au.json", "utf8")
);

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "ACT", "TAS", "NT"];

function parseAddress(full) {
  const out = { street: "", suburb: "", state: "", postcode: "" };
  if (!full) return out;
  const pc = full.match(/\b(\d{4})\b\s*(?:,?\s*Australia)?\s*$/);
  if (pc) out.postcode = pc[1];
  const st = full.match(new RegExp(`\\b(${STATES.join("|")})\\b`));
  if (st) out.state = st[1];
  // "street parts..., Suburb STATE POSTCODE"
  const segs = full.split(",").map((s) => s.trim()).filter(Boolean);
  const last = segs[segs.length - 1] || "";
  // last segment usually "Suburb STATE POSTCODE" (or "Suburb STATE")
  let suburb = last
    .replace(new RegExp(`\\b(${STATES.join("|")})\\b.*$`), "")
    .trim();
  if (!suburb && segs.length >= 2) suburb = segs[segs.length - 2];
  out.suburb = suburb;
  out.street = segs.slice(0, -1).join(", ") || (out.suburb ? "" : full);
  return out;
}

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const num = (v) => {
  const n = parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

const usedSlugs = new Map();
function uniqueSlug(base) {
  let s = base || "restaurant";
  const n = (usedSlugs.get(s) || 0) + 1;
  usedSlugs.set(s, n);
  return n === 1 ? s : `${s}-${n}`;
}

const table = records.map((r) => {
  const a = parseAddress(r.fullAddress || "");
  const placeId = (r.placeUrl || "").match(/!19s(ChIJ[\w-]+)/)?.[1] || "";
  const slug = uniqueSlug(
    slugify([r.name, a.suburb].filter(Boolean).join(" "))
  );
  return {
    slug,
    name: r.name,
    cuisine: "Nepalese",
    category: r.category || "",
    rating: num(r.rating),
    review_count: r.reviews ? num(r.reviews) : null,
    street: a.street,
    suburb: a.suburb,
    state: a.state,
    postcode: a.postcode,
    full_address: r.fullAddress || "",
    lat: num(r.lat),
    lng: num(r.lng),
    phone: r.phone || "",
    website: r.website || "",
    google_place_id: placeId,
    google_maps_url: r.placeUrl || "",
    source_query: r.foundVia || "",
  };
});

fs.writeFileSync("main-table.json", JSON.stringify(table, null, 2));

const cols = Object.keys(table[0]);
const cell = (v) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
fs.writeFileSync(
  "main-table.csv",
  [cols.join(","), ...table.map((r) => cols.map((c) => cell(r[c])).join(","))].join(
    "\n"
  )
);

// coverage report
const filled = (k) => table.filter((r) => r[k] !== "" && r[k] != null).length;
const pct = (k) => `${Math.round((100 * filled(k)) / table.length)}%`;
console.log(`main table: ${table.length} rows`);
for (const k of [
  "full_address", "suburb", "state", "postcode", "lat", "lng",
  "phone", "website", "rating", "review_count", "google_place_id",
])
  console.log(`  ${k}: ${pct(k)}`);
console.log("  -> main-table.json\n  -> main-table.csv");
