import fs from "fs";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "ACT", "TAS", "NT"];

function parseAddress(full) {
  const out = { street: "", suburb: "", state: "", postcode: "" };
  if (!full) return out;
  out.postcode = full.match(/\b(\d{4})\b\s*(?:,?\s*Australia)?\s*$/)?.[1] || "";
  out.state = full.match(new RegExp(`\\b(${STATES.join("|")})\\b`))?.[1] || "";
  const segs = full.split(",").map((s) => s.trim()).filter(Boolean);
  const last = segs[segs.length - 1] || "";
  let suburb = last.replace(new RegExp(`\\b(${STATES.join("|")})\\b.*$`), "").trim();
  if (!suburb && segs.length >= 2) suburb = segs[segs.length - 2];
  out.suburb = suburb;
  out.street = segs.slice(0, -1).join(", ") || (out.suburb ? "" : full);
  return out;
}

const slugify = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim()
    .replace(/\s+/g, "-").replace(/-+/g, "-");

const num = (v) => {
  const n = parseFloat(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

async function main() {
  const records = JSON.parse(
    fs.readFileSync("nepali-restaurants-au.json", "utf8")
  );
  const used = new Map();
  const uniqueSlug = (base) => {
    let s = base || "restaurant";
    const n = (used.get(s) || 0) + 1;
    used.set(s, n);
    return n === 1 ? s : `${s}-${n}`;
  };

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  let inserted = 0;
  for (const r of records) {
    const a = parseAddress(r.fullAddress || "");
    const placeId = (r.placeUrl || "").match(/!19s(ChIJ[\w-]+)/)?.[1] || null;
    const slug = uniqueSlug(
      slugify([r.name, a.suburb].filter(Boolean).join(" "))
    );
    await client.query(
      `INSERT INTO restaurants
        (google_feature_id, google_place_id, slug, name, category,
         rating, review_count, street, suburb, state, postcode, full_address,
         lat, lng, phone, website, google_maps_url, source_query, address_source,
         enriched_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       ON CONFLICT (google_feature_id) DO UPDATE SET
         google_place_id = COALESCE(EXCLUDED.google_place_id, restaurants.google_place_id),
         category     = EXCLUDED.category,
         rating       = EXCLUDED.rating,
         review_count = COALESCE(EXCLUDED.review_count, restaurants.review_count),
         full_address = COALESCE(NULLIF(EXCLUDED.full_address,''), restaurants.full_address),
         street       = COALESCE(NULLIF(EXCLUDED.street,''),   restaurants.street),
         suburb       = COALESCE(NULLIF(EXCLUDED.suburb,''),   restaurants.suburb),
         state        = COALESCE(NULLIF(EXCLUDED.state,''),    restaurants.state),
         postcode     = COALESCE(NULLIF(EXCLUDED.postcode,''), restaurants.postcode),
         phone        = COALESCE(NULLIF(EXCLUDED.phone,''),    restaurants.phone),
         website      = COALESCE(NULLIF(EXCLUDED.website,''),  restaurants.website),
         lat          = EXCLUDED.lat,
         lng          = EXCLUDED.lng,
         address_source = COALESCE(EXCLUDED.address_source, restaurants.address_source),
         updated_at   = now()`,
      [
        r.featureId, placeId, slug, r.name, r.category || null,
        num(r.rating), r.reviews ? num(r.reviews) : null,
        a.street || null, a.suburb || null, a.state || null, a.postcode || null,
        r.fullAddress || null, num(r.lat), num(r.lng), r.phone || null,
        r.website || null, r.placeUrl || null, r.foundVia || null,
        r.fullAddress ? "google" : null, r.fullAddress ? new Date() : null,
      ]
    );
    inserted++;
  }

  const { rows } = await client.query(
    `SELECT count(*) total,
            count(full_address) with_addr,
            count(phone) with_phone,
            count(*) FILTER (WHERE lat IS NOT NULL) with_geo
     FROM restaurants`
  );
  console.log(`upserted ${inserted} rows`);
  console.table(rows[0]);
  await client.end();
}

main();
