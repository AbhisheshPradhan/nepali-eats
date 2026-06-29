// Seed the controlled dish vocabulary (dish_categories) from the single source of
// truth, web/lib/menu/taxonomy.ts. Idempotent upsert by slug: re-run any time a new
// dish/prep is added to taxonomy.ts (the vocab grows as we seed restaurants).
//
//   node scraper/seed-taxonomy.ts            # apply
//   node scraper/seed-taxonomy.ts --dry-run  # preview, no writes
//
// Node 25 runs this .ts directly (type stripping); root is ESM.
import "dotenv/config";
import pg from "pg";
import { DISH_CATEGORIES } from "../web/lib/menu/taxonomy.ts";

const { Pool } = pg;
const dry = process.argv.includes("--dry-run");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  // Validate parents exist in the list before touching the DB.
  const slugs = new Set(DISH_CATEGORIES.map((c) => c.slug));
  for (const c of DISH_CATEGORIES) {
    if (c.parent && !slugs.has(c.parent)) {
      throw new Error(`Tag "${c.slug}" has unknown parent "${c.parent}"`);
    }
  }

  const byKind: Record<string, number> = {};
  for (const c of DISH_CATEGORIES) byKind[c.kind] = (byKind[c.kind] ?? 0) + 1;
  console.log(
    `taxonomy.ts: ${DISH_CATEGORIES.length} tags ` +
      Object.entries(byKind).map(([k, n]) => `${k}=${n}`).join(" "),
  );

  if (dry) {
    console.log("[dry-run] would upsert the rows above; no writes made.");
    await pool.end();
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Pass 1: upsert content (parent_id resolved in pass 2).
    for (let i = 0; i < DISH_CATEGORIES.length; i++) {
      const c = DISH_CATEGORIES[i];
      await client.query(
        `INSERT INTO dish_categories (slug, name, kind, search_aliases, is_featured, display_order)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (slug) DO UPDATE SET
           name = EXCLUDED.name, kind = EXCLUDED.kind,
           search_aliases = EXCLUDED.search_aliases,
           is_featured = EXCLUDED.is_featured,
           display_order = EXCLUDED.display_order,
           updated_at = now()`,
        [c.slug, c.name, c.kind, c.synonyms ?? null, c.featured ?? false, i],
      );
    }
    // Pass 2: resolve parent_id by slug (clear it when a tag has no parent).
    for (const c of DISH_CATEGORIES) {
      await client.query(
        `UPDATE dish_categories d SET parent_id = $2 WHERE d.slug = $1`,
        [
          c.slug,
          c.parent
            ? (await client.query(`SELECT id FROM dish_categories WHERE slug=$1`, [c.parent])).rows[0].id
            : null,
        ],
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  const { rows } = await pool.query(
    `SELECT kind, count(*)::int n FROM dish_categories GROUP BY kind ORDER BY kind`,
  );
  console.log("dish_categories now:", rows.map((r) => `${r.kind}=${r.n}`).join(" "));
  await pool.end();
}

main().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
