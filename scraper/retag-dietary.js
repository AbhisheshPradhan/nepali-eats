// One-off backfill: tag already-seeded menu items with the dietary facets added
// 2026-07-05 (vegan under veg, gluten-free as kind 'diet'). Menus seeded from
// here on get these tags at transcription time; this pass covers the ~144
// restaurants seeded before the tags existed.
//
//   node scraper/retag-dietary.js            # dry-run: print candidates, no writes
//   node scraper/retag-dietary.js --commit   # write menu_item_tags
//
// HARD RULE (docs/ROADMAP.md "Dietary flags"): tag ONLY dishes the restaurant's
// own menu explicitly marks. Never inferred — vegan and coeliac are dietary
// claims. "Option available" / "can be made vegan" phrasing does NOT count:
// the item as listed isn't vegan/GF. Ingredient mentions ("vegan feta",
// "chopped gluten", "contains gluten") are the opposite of a claim.
// Vegan items also get veg (vegan ⊂ veg, mirrors the seeder's ancestor
// materialisation), so the Veg filter keeps matching them.
import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
const commit = process.argv.includes("--commit");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Menu-text sanity vetoes (reviewed 2026-07-05). The menu says GF but the text
// contradicts itself or marks an ingredient, not the dish:
//  919 Crushed Avo-mole ("on gluten-free bread" = the bread, not the dish)
//  934 Grilled Piggo (gluten-free is one bread CHOICE in a slash list)
// 8085 Wholemeal Roti ("wholemeal flatbread, gluten-free" — wholemeal IS wheat)
const GF_VETO_IDS = [919, 934, 8085];

// Mid-sentence "vegan <dish>" descriptions that ARE claims about the dish
// itself but don't fit the parenthetical/leading patterns (reviewed):
//  "Vegan vegetable pakoras…", "spicy vegan beetroot patties",
//  "These vegan crunchy lentil flitters…"
const VEGAN_EXTRA_SQL = `
  mi.description ~* 'vegan (vegetable pakora|beetroot patt|crunchy lentil)'`;

// Explicit vegan mark: "(vegan)" / "(Veg, Vegan, DF)" / "(VEGAN)" parentheticals
// (paren must OPEN at the mark so "(coconut cream for vegan option)" misses),
// "Suitable for vegans", or a description that leads with "Vegan …".
const VEGAN_MARK_SQL = `(
     mi.description ~* '\\((veg,? ?)?vegan'
  OR mi.description ~* 'suitable for vegans'
  OR mi.description ~* '^\\s*vegan\\M'
  OR ${VEGAN_EXTRA_SQL}
)`;
const VEGAN_NOT_SQL = `
  mi.description !~* 'vegan (option|available)|for vegan|can be vegan|vegan (feta|cheese|cream|chocolate|mayo|butter)'`;

// Explicit GF mark in the item NAME ("Aloo Tama (GF)") or description: leading
// menu codes ("GF.", "V GF", "VG GF DF"), "(GF)" / "(Veg, Gf)" parentheticals,
// prose claims ("All Our Curry Is Gluten Free", "All skewers are GF",
// trailing "gluten-free."). Excludes options, ingredient gluten, negations.
const GF_NAME_SQL = `(mi.name ~* 'gluten[- ]?free|\\mgf\\M' AND mi.name !~* 'option')`;
const GF_DESC_SQL = `(
     mi.description ~* '^\\s*(v |vg )?gf\\M'
  OR mi.description ~* '\\((veg|v|vg)?[^)]*\\mgf\\M[^)]*\\)'
  OR mi.description ~* 'gluten[- ]?free|glutenfree'
  OR mi.description ~* 'are gf\\M'
)`;
const GF_NOT_SQL = `
  mi.description !~* 'contains [^.]*gluten|chopped gluten|gluten[- ]?free (option|on request|available)|gluten[- ]free /'`;

async function candidates(where) {
  const { rows } = await pool.query(
    `SELECT mi.id, mi.name, left(coalesce(mi.description,''), 100) AS descr,
            r.slug AS restaurant
       FROM menu_items mi JOIN restaurants r ON r.id = mi.restaurant_id
      WHERE ${where}
      ORDER BY mi.id`,
  );
  return rows;
}

async function tagId(slug) {
  const { rows } = await pool.query(
    `SELECT id FROM dish_categories WHERE slug = $1`,
    [slug],
  );
  if (!rows[0]) throw new Error(`tag "${slug}" not seeded — run seed-taxonomy.ts first`);
  return rows[0].id;
}

async function apply(items, slugs) {
  let added = 0;
  for (const slug of slugs) {
    const id = await tagId(slug);
    const res = await pool.query(
      `INSERT INTO menu_item_tags (menu_item_id, dish_category_id)
       SELECT unnest($1::bigint[]), $2
       ON CONFLICT DO NOTHING`,
      [items.map((i) => i.id), id],
    );
    added += res.rowCount;
  }
  return added;
}

async function main() {
  const vegan = await candidates(
    `(mi.name ~* '\\mvegan' OR (${VEGAN_MARK_SQL} AND ${VEGAN_NOT_SQL}))`,
  );
  const gf = await candidates(
    `(${GF_NAME_SQL} OR (${GF_DESC_SQL} AND ${GF_NOT_SQL}))
     AND NOT mi.id = ANY($$IDS$$)`.replace(
      "$$IDS$$",
      `ARRAY[${GF_VETO_IDS.join(",")}]::bigint[]`,
    ),
  );

  console.log(`VEGAN → vegan + veg (${vegan.length} items):`);
  for (const i of vegan) console.log(`  #${i.id} [${i.restaurant}] ${i.name} :: ${i.descr}`);
  console.log(`\nGLUTEN-FREE (${gf.length} items):`);
  for (const i of gf) console.log(`  #${i.id} [${i.restaurant}] ${i.name} :: ${i.descr}`);

  if (!commit) {
    console.log("\n[dry-run] no writes. Re-run with --commit to tag.");
  } else {
    const v = await apply(vegan, ["vegan", "veg"]);
    const g = await apply(gf, ["gluten-free"]);
    console.log(`\ncommitted: ${v} vegan/veg tag rows, ${g} gluten-free tag rows`);
  }
  await pool.end();
}

main().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
