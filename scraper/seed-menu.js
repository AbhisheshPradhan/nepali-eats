// Seed one restaurant's menu from scraper/menu-data/<slug>.json into the menu
// tables. Dry-run by default (validates + previews); pass --commit to write.
//
//   node scraper/seed-menu.js <slug>            # dry-run: validate tags + preview
//   node scraper/seed-menu.js <slug> --commit   # apply in one transaction
//
// Behaviour:
//  - HARD-ERRORS on any tag/protein slug not in dish_categories (the controlled-vocab
//    gate): add it to web/lib/menu/taxonomy.ts, re-run seed-taxonomy.ts, then retry.
//  - Materialises tag ancestors (steamed-momo -> +momo) and unions each item's variant
//    proteins onto the item, so dish + protein search both work.
//  - Idempotent: replaces that restaurant's whole menu (delete + reinsert).
//  - Rebuilds restaurants.tags (coarse dish+style rollup, UNIONED onto the existing
//    name-derived baseline) + price_min/max + menu_item_count + menu_parsed_at.
import fs from "fs";
import pg from "pg";
import dotenv from "dotenv";
import { DISH_CATEGORIES } from "../web/lib/menu/taxonomy.ts";
dotenv.config();

const { Pool } = pg;
const slug = process.argv[2];
const commit = process.argv.includes("--commit");
if (!slug) {
  console.error("usage: node scraper/seed-menu.js <slug> [--commit]");
  process.exit(1);
}
const file = `scraper/menu-data/${slug}.json`;
const menu = JSON.parse(fs.readFileSync(file, "utf8"));
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const tax = await pool.query("select id, slug, kind, parent_id, is_featured from dish_categories");
  const bySlug = new Map(tax.rows.map((r) => [r.slug, r]));
  const byId = new Map(tax.rows.map((r) => [r.id, r]));
  // dish slug -> cuisine style slug (taxonomy.ts is the source). A styled dish adds its
  // cuisine tag wherever it appears (thukpa -> tibetan), so it rolls up to the cuisine.
  const styleOf = new Map(
    DISH_CATEGORIES.filter((c) => c.style).map((c) => [c.slug, c.style]),
  );

  // leaf tag(s) -> {leaf + all ancestors + cuisine style}
  const withAncestors = (slugs) => {
    const out = new Set();
    for (const s of slugs) {
      let n = bySlug.get(s);
      while (n) {
        out.add(n.slug);
        n = n.parent_id ? byId.get(n.parent_id) : null;
      }
    }
    for (const s of [...out]) {
      const st = styleOf.get(s);
      if (st) out.add(st);
    }
    return out;
  };

  // ---- validate every tag + variant.protein against the controlled vocab ----
  const unknown = new Set();
  for (const cat of menu.categories)
    for (const it of cat.items) {
      for (const t of it.tags || []) if (!bySlug.has(t)) unknown.add(t);
      for (const v of it.variants || []) if (v.protein && !bySlug.has(v.protein)) unknown.add(v.protein);
    }
  if (unknown.size) {
    console.error(`HARD ERROR: ${unknown.size} tag/protein slug(s) not in dish_categories:`);
    console.error("  " + [...unknown].sort().join(", "));
    console.error("Add them to web/lib/menu/taxonomy.ts, run `node scraper/seed-taxonomy.ts`, then retry.");
    process.exit(1);
  }

  // ---- compute preview (item tags, coarse rollup, price range, counts) ----
  const coarse = new Set();
  const prices = [];
  let itemCount = 0;
  let tagLinks = 0;
  const previewRows = [];
  for (const cat of menu.categories)
    for (const it of cat.items) {
      itemCount++;
      const variants = it.variants?.length ? it.variants : [{ label: null, price: it.price ?? null }];
      const tagset = withAncestors(it.tags || []);
      for (const v of variants) {
        if (v.protein) tagset.add(v.protein);
        if (v.price != null) prices.push(Number(v.price));
      }
      tagLinks += tagset.size;
      for (const s of tagset) {
        const node = bySlug.get(s);
        // Coarse restaurant rollup = ALL styles + only HEADLINE dishes (is_featured).
        // The long tail of dishes stays at item level (menu_item_tags) for search; it
        // would over-stuff restaurants.tags / the displayed chips.
        if (node.kind === "style" || node.is_featured) coarse.add(s);
      }
      previewRows.push(`  ${it.name}  [${[...tagset].join(", ")}]  (${variants.length} variant${variants.length > 1 ? "s" : ""})`);
    }
  const priceMin = prices.length ? Math.min(...prices) : null;
  const priceMax = prices.length ? Math.max(...prices) : null;

  console.log(`menu "${slug}": ${menu.categories.length} categories, ${itemCount} items, ${tagLinks} tag links`);
  console.log(`price range: $${priceMin} - $${priceMax}`);
  console.log(`restaurants.tags rollup (dish+style): ${[...coarse].sort().join(", ")}`);
  console.log("items:\n" + previewRows.join("\n"));

  const r = await pool.query("select id, name from restaurants where slug=$1", [slug]);
  if (!r.rows.length) {
    console.log(`\nrestaurant slug "${slug}" not found in DB${commit ? " — cannot commit." : " (needed only for --commit)."}`);
    if (commit) process.exit(1);
  } else {
    console.log(`\nrestaurant: ${r.rows[0].name} (id ${r.rows[0].id})`);
  }

  if (!commit) {
    console.log("\n[dry-run] no writes. Re-run with --commit to apply.");
    await pool.end();
    return;
  }

  // ---- commit: replace this restaurant's menu in one transaction ----
  const rid = r.rows[0].id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("delete from menu_categories where restaurant_id=$1", [rid]);
    for (let ci = 0; ci < menu.categories.length; ci++) {
      const cat = menu.categories[ci];
      const { rows: cr } = await client.query(
        "insert into menu_categories (restaurant_id, name, description, position) values ($1,$2,$3,$4) returning id",
        [rid, cat.name, cat.description ?? null, ci],
      );
      const catId = cr[0].id;
      for (let ii = 0; ii < cat.items.length; ii++) {
        const it = cat.items[ii];
        const { rows: ir } = await client.query(
          `insert into menu_items (category_id, restaurant_id, name, description, is_vegetarian, spice_level, source, position)
           values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
          [catId, rid, it.name, it.description ?? null, it.is_vegetarian ?? null, it.spice_level ?? null, menu.source ?? "admin", ii],
        );
        const itemId = ir[0].id;
        const variants = it.variants?.length ? it.variants : [{ label: null, price: it.price ?? null }];
        const tagset = withAncestors(it.tags || []);
        for (let vi = 0; vi < variants.length; vi++) {
          const v = variants[vi];
          if (v.protein) tagset.add(v.protein);
          await client.query(
            "insert into menu_item_variants (item_id, label, price, currency, is_vegetarian, position) values ($1,$2,$3,$4,$5,$6)",
            [itemId, v.label ?? null, v.price ?? null, v.currency ?? menu.currency ?? "AUD", v.is_vegetarian ?? null, vi],
          );
        }
        for (const s of tagset)
          await client.query(
            "insert into menu_item_tags (menu_item_id, dish_category_id) values ($1,$2) on conflict do nothing",
            [itemId, bySlug.get(s).id],
          );
      }
    }
    await client.query(
      // Replace tags with the coarse rollup (NOT union): the menu is the authoritative
      // source of specialties for a seeded restaurant, and union can't shrink, which is
      // what over-stuffed the tags. Non-seeded restaurants keep their name-derived tags.
      `update restaurants set price_min=$2, price_max=$3, menu_item_count=$4, menu_parsed_at=now(),
         tags = $5::text[]
       where id=$1`,
      [rid, priceMin, priceMax, itemCount, [...coarse].sort()],
    );
    await client.query("COMMIT");
    console.log("committed.");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  await pool.end();
}

main().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
