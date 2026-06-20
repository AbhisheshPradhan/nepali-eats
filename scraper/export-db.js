import fs from "fs";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

// Snapshot the restaurants table to CSV + JSON (for the app / sharing / backup).
const cell = (v) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

async function main() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const { rows, fields } = await client.query(
    `SELECT id, google_feature_id, google_place_id, slug, name, cuisine,
            venue_type, tags, halal_status,
            is_nepali, relevance, rating, review_count, street, suburb, state,
            postcode, full_address, lat, lng, phone, email, website,
            facebook, instagram, tiktok, whatsapp, google_maps_url,
            address_source, source_query
       FROM restaurants ORDER BY state, suburb, name`
  );
  fs.writeFileSync("main-table.json", JSON.stringify(rows, null, 2));
  const cols = fields.map((f) => f.name);
  fs.writeFileSync(
    "main-table.csv",
    [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n")
  );
  console.log(`exported ${rows.length} rows -> main-table.csv / main-table.json`);
  await client.end();
}

main();
