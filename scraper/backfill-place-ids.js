import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

// One-off: resolve google_place_id for the few rows that have none, via Places
// API (New) Text Search (places:searchText) by name + suburb + state. Verifies
// the top candidate's address contains the stored suburb before saving; anything
// unverified is printed for manual review rather than blindly stored (generic
// names like "momo & chillies" can mismatch). 6 calls, well within free tier.

const KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!KEY) { console.error("Missing GOOGLE_PLACES_API_KEY in .env"); process.exit(1); }

async function searchText(query) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
    },
    body: JSON.stringify({ textQuery: query, regionCode: "AU" }),
  });
  if (!res.ok) return { error: `${res.status} ${(await res.text()).slice(0, 200)}` };
  return { places: (await res.json()).places || [] };
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const { rows } = await pool.query(
    `SELECT id, name, suburb, state FROM restaurants
      WHERE google_place_id IS NULL AND is_nepali IS NOT FALSE
      ORDER BY id`);
  console.log(`${rows.length} to resolve.\n`);

  let saved = 0, manual = 0;
  for (const r of rows) {
    const query = [r.name, r.suburb, r.state].filter(Boolean).join(", ");
    const out = await searchText(query);
    if (out.error) { console.log(`#${r.id} ${r.name}: ERROR ${out.error}\n`); continue; }

    const top = out.places[0];
    if (!top) { console.log(`#${r.id} ${r.name}: no results\n`); manual++; continue; }

    const addr = top.formattedAddress || "";
    const suburbOk = r.suburb && addr.toLowerCase().includes(r.suburb.toLowerCase());

    console.log(`#${r.id} ${r.name} (${r.suburb}, ${r.state})`);
    console.log(`   -> ${top.displayName?.text} | ${addr}`);
    console.log(`   -> ${top.id}  [suburb match: ${suburbOk ? "YES" : "NO"}]`);

    if (suburbOk) {
      await pool.query(
        `UPDATE restaurants SET google_place_id = $2, updated_at = now() WHERE id = $1`,
        [r.id, top.id]);
      console.log(`   -> SAVED\n`);
      saved++;
    } else {
      console.log(`   -> NOT saved (verify manually)\n`);
      manual++;
    }
  }
  console.log(`Done. saved=${saved}, needs manual review=${manual}`);
  await pool.end();
}
main();
