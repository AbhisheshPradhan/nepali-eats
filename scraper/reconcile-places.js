import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

// Phase 2 of the Places API backfill: map places_api_raw -> canonical columns.
// DEFAULT is a dry run (reads only, prints a diff summary). Pass --commit to
// actually write. Re-derivable any time from the stored raw, no API re-call.
//
//   node scraper/reconcile-places.js            # dry run, shows what would change
//   node scraper/reconcile-places.js --commit   # writes to canonical columns

const COMMIT = process.argv.includes("--commit");

const DAY = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]; // Google: 0=Sun..6=Sat
const PRICE_LEVEL = {
  PRICE_LEVEL_INEXPENSIVE: 1, PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3, PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

// regularOpeningHours.periods -> canonical { mon:[[600,1230]], tue:[], ... }
// minutes-from-midnight, []=closed, close>1440 = past midnight, absent = unknown.
function buildHours(raw) {
  const roh = raw?.regularOpeningHours;
  if (!roh?.periods?.length) return null;
  // full week is known when regularOpeningHours exists -> days with no period are closed.
  const out = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
  for (const p of roh.periods) {
    if (!p.open) continue;
    const openMin = (p.open.hour || 0) * 60 + (p.open.minute || 0);
    const key = DAY[p.open.day];
    if (!p.close) { out[key].push([openMin, 1440]); continue; } // open-ended / 24h
    let closeMin = (p.close.hour || 0) * 60 + (p.close.minute || 0);
    const dayDiff = ((p.close.day - p.open.day) + 7) % 7;
    if (dayDiff >= 1) closeMin += 1440 * dayDiff; // past midnight
    out[key].push([openMin, closeMin]);
  }
  for (const k of Object.keys(out)) out[k].sort((a, b) => a[0] - b[0]);
  return out;
}

const priceRangeText = (raw) => {
  const pr = raw?.priceRange;
  if (!pr?.startPrice?.units) return null;
  const s = pr.startPrice.units, e = pr.endPrice?.units;
  return e ? `$${s}-${e}` : `$${s}+`;
};

// boolean helper: undefined stays null (unknown), true/false pass through.
const b = (v) => (v === undefined ? null : !!v);

// alcohol = any of beer/wine/cocktails. null only when none of the keys present.
function servesAlcohol(raw) {
  const keys = ["servesBeer", "servesWine", "servesCocktails"];
  if (!keys.some((k) => k in raw)) return null;
  return keys.some((k) => raw[k] === true);
}

function wheelchair(raw) {
  const a = raw?.accessibilityOptions;
  if (!a) return null;
  return !!(a.wheelchairAccessibleSeating || a.wheelchairAccessibleEntrance);
}

// Parking -> specific friendly label. Free beats paid, and a lot/garage (more
// reliable for a diner) beats street; valet last. null when no parking options
// are present at all (unknown).
function parkingLabel(raw) {
  const p = raw?.parkingOptions;
  if (!p) return null;
  if (p.freeParkingLot || p.freeGarageParking) return "Free parking lot";
  if (p.freeStreetParking) return "Free street parking";
  if (p.paidParkingLot || p.paidGarageParking) return "Paid parking lot";
  if (p.paidStreetParking) return "Paid street parking";
  if (p.valetParking) return "Valet parking";
  return null;
}

// Map one raw response to the canonical column values.
function mapRow(raw) {
  return {
    opening_hours: buildHours(raw),
    rating: raw.rating ?? null,
    review_count: raw.userRatingCount ?? null,
    price_level: PRICE_LEVEL[raw.priceLevel] ?? null,
    price_range: priceRangeText(raw),
    kid_friendly: b(raw.goodForChildren),
    live_music: b(raw.liveMusic),
    business_status: raw.businessStatus ?? null,
    serves_vegetarian: b(raw.servesVegetarianFood),
    takeout: b(raw.takeout),
    delivery: b(raw.delivery),
    dine_in: b(raw.dineIn),
    outdoor_seating: b(raw.outdoorSeating),
    reservable: b(raw.reservable),
    good_for_groups: b(raw.goodForGroups),
    serves_alcohol: servesAlcohol(raw),
    serves_cocktails: b(raw.servesCocktails),
    allows_dogs: b(raw.allowsDogs),
    wheelchair_accessible: wheelchair(raw),
    editorial_summary: raw.editorialSummary?.text ?? null,
    parking: parkingLabel(raw),
  };
}

// Columns that already held scraped data -> we OVERWRITE with the API value when
// present (API is fresher/authoritative), but keep existing when API is null.
const OVERWRITE_EXISTING = ["opening_hours", "rating", "review_count", "price_level", "price_range"];

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const { rows } = await pool.query(
    `SELECT id, name, opening_hours, rating, review_count, price_level, price_range
       FROM restaurants WHERE places_api_raw IS NOT NULL`);
  const { rows: raws } = await pool.query(
    `SELECT id, places_api_raw FROM restaurants WHERE places_api_raw IS NOT NULL`);
  const rawById = new Map(raws.map((r) => [r.id, r.places_api_raw]));

  console.log(`${COMMIT ? "COMMIT" : "DRY RUN"} — ${rows.length} rows with raw data.\n`);

  // dry-run accounting
  const fills = {}; // column -> count it would set/change
  let hoursSet = 0, ratingChanged = 0, closedPerm = 0, closedTemp = 0;
  const closedList = [];

  for (const r of rows) {
    const raw = rawById.get(r.id);
    const m = mapRow(raw);

    for (const [col, val] of Object.entries(m)) {
      if (val === null || (Array.isArray(val) === false && typeof val === "object" && val === null)) continue;
      fills[col] = (fills[col] || 0) + 1;
    }
    if (m.opening_hours) hoursSet++;
    if (m.rating != null && r.rating != null && Number(m.rating) !== Number(r.rating)) ratingChanged++;
    if (m.business_status === "CLOSED_PERMANENTLY") { closedPerm++; closedList.push(`  PERM  #${r.id} ${r.name}`); }
    if (m.business_status === "CLOSED_TEMPORARILY") closedTemp++;

    if (COMMIT) {
      // For OVERWRITE_EXISTING cols use the API value when non-null else keep existing (COALESCE in SQL).
      await pool.query(
        `UPDATE restaurants SET
           opening_hours = COALESCE($2, opening_hours),
           rating        = COALESCE($3, rating),
           review_count  = COALESCE($4, review_count),
           price_level   = COALESCE($5, price_level),
           price_range   = COALESCE($6, price_range),
           kid_friendly = $7, live_music = $8, business_status = $9,
           serves_vegetarian = $10, takeout = $11, delivery = $12, dine_in = $13,
           outdoor_seating = $14, reservable = $15, good_for_groups = $16,
           serves_alcohol = $17, serves_cocktails = $18, allows_dogs = $19,
           wheelchair_accessible = $20, editorial_summary = COALESCE($21, editorial_summary),
           parking = $22,
           hours_scraped_at = CASE WHEN $2 IS NOT NULL THEN now() ELSE hours_scraped_at END,
           updated_at = now()
         WHERE id = $1`,
        [r.id, m.opening_hours ? JSON.stringify(m.opening_hours) : null, m.rating, m.review_count,
         m.price_level, m.price_range, m.kid_friendly, m.live_music, m.business_status,
         m.serves_vegetarian, m.takeout, m.delivery, m.dine_in, m.outdoor_seating, m.reservable,
         m.good_for_groups, m.serves_alcohol, m.serves_cocktails, m.allows_dogs,
         m.wheelchair_accessible, m.editorial_summary, m.parking]);
    }
  }

  console.log("Would set / changed (non-null values per column):");
  console.table(fills);
  console.log(`\nopening_hours filled: ${hoursSet}`);
  console.log(`rating values that DIFFER from current: ${ratingChanged}`);
  console.log(`business_status CLOSED_PERMANENTLY: ${closedPerm}  |  CLOSED_TEMPORARILY: ${closedTemp}`);
  if (closedList.length) { console.log("\nPermanently closed (review for removal/hide):"); console.log(closedList.join("\n")); }

  if (!COMMIT) console.log("\nDry run only — nothing written. Re-run with --commit to apply.");
  else console.log("\nCommitted to canonical columns.");
  await pool.end();
}
main();
