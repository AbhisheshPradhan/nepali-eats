import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

// Phase 1 of the Google Places API (New) backfill: fetch one Place Details
// response per restaurant and dump the RAW JSON into `places_api_raw` (+ stamp
// `places_api_at`). It does NOT touch any existing scraped column — mapping into
// canonical columns is a separate, reviewable step (reconcile-places.js).
//
// Why store raw: the API call is the rate-limited/billed resource; the mapping
// is free. Keeping the full response means we can re-map fields later (new
// filters, format tweaks) without spending another call.
//
// Safety: hard MAX_CALLS guard in code (default 600) + stops on 429
// RESOURCE_EXHAUSTED. Resumable: targets places_api_at IS NULL, best rows first.

const KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!KEY) { console.error("Missing GOOGLE_PLACES_API_KEY in .env"); process.exit(1); }

const CONCURRENCY = Number(process.env.CONCURRENCY || 5);
const MAX_CALLS = Number(process.env.MAX_CALLS || 600);

// Generous field mask: every field here bills at one SKU (Enterprise+Atmosphere),
// so capture everything potentially useful now — re-mapping later is free, a
// second API pass is not.
const FIELD_MASK = [
  "id", "displayName", "businessStatus", "editorialSummary",
  "regularOpeningHours", "currentOpeningHours",
  "priceLevel", "priceRange", "rating", "userRatingCount",
  "goodForChildren", "menuForChildren", "goodForGroups", "goodForWatchingSports",
  "liveMusic", "servesVegetarianFood", "servesBreakfast", "servesLunch",
  "servesDinner", "servesBrunch", "servesBeer", "servesWine", "servesCocktails",
  "servesCoffee", "servesDessert", "outdoorSeating", "reservable",
  "takeout", "delivery", "dineIn", "curbsidePickup", "restroom", "allowsDogs",
  "paymentOptions", "accessibilityOptions", "parkingOptions",
].join(",");

async function fetchPlace(placeId) {
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`;
  const res = await fetch(url, {
    headers: { "X-Goog-Api-Key": KEY, "X-Goog-FieldMask": FIELD_MASK },
  });
  if (res.status === 429) return { quota: true };
  if (res.status === 404) return { notFound: true };
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { error: `${res.status} ${body.slice(0, 200)}` };
  }
  return { data: await res.json() };
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const { rows: todo } = await pool.query(
    `SELECT id, name, google_place_id FROM restaurants
      WHERE google_place_id IS NOT NULL AND is_nepali IS NOT FALSE
        AND places_api_at IS NULL
      ORDER BY (featured_rank IS NOT NULL) DESC, rating DESC NULLS LAST, review_count DESC NULLS LAST
      ${process.env.LIMIT ? `LIMIT ${Number(process.env.LIMIT)}` : ""}`);

  console.log(`${todo.length} to fetch. MAX_CALLS=${MAX_CALLS}, concurrency=${CONCURRENCY}`);

  let i = 0, calls = 0, ok = 0, notFound = 0, errors = 0;
  let stop = false;

  async function worker() {
    while (i < todo.length && !stop) {
      if (calls >= MAX_CALLS) { stop = true; console.log(`Hit MAX_CALLS=${MAX_CALLS}, stopping.`); break; }
      const rec = todo[i++];
      calls++;
      let r;
      try { r = await fetchPlace(rec.google_place_id); }
      catch (e) { r = { error: String(e).slice(0, 200) }; }

      if (r.quota) { stop = true; console.log("429 RESOURCE_EXHAUSTED — daily quota hit, stopping."); break; }

      if (r.data) {
        await pool.query(
          `UPDATE restaurants SET places_api_raw = $2, places_api_at = now(), updated_at = now() WHERE id = $1`,
          [rec.id, JSON.stringify(r.data)]);
        ok++;
      } else {
        // stamp so we don't re-hit 404s; errors left unstamped to retry next run
        if (r.notFound) { notFound++; await pool.query(`UPDATE restaurants SET places_api_at = now() WHERE id = $1`, [rec.id]); }
        else { errors++; if (errors <= 5) console.log(`  err #${rec.id} ${rec.name}: ${r.error}`); }
      }
      if (calls % 25 === 0 || i >= todo.length)
        console.log(`  ${i}/${todo.length} | ${calls} calls | ${ok} stored | ${notFound} 404 | ${errors} err`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const { rows } = await pool.query(
    `SELECT count(places_api_raw) stored, count(*) FILTER (WHERE places_api_at IS NULL AND google_place_id IS NOT NULL) remaining
       FROM restaurants WHERE is_nepali IS NOT FALSE`);
  console.log("\nDone.", `calls this run: ${calls}.`); console.table(rows[0]);
  await pool.end();
}
main();
