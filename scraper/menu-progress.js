// Live menu-seeding progress, driven by the DB (source of truth = menu_item_count),
// so the checklist can never drift from what's actually seeded. Prints a status
// summary; `--write` regenerates the "## Checklist" section of MENU-SEEDING-PLAN.md
// (everything above that heading — the strategy/notes — is preserved).
//
//   node scraper/menu-progress.js            # print live status
//   node scraper/menu-progress.js --write    # also refresh the plan doc checklist
//
// Classifies each visible spot's menu_url into pdf / ownpage / aggregator (junk +
// social are dropped: CSS files, http://menu/, logos, FB/IG). A row is "done" when
// menu_item_count > 0. See MENU-SEEDING-PLAN.md.
import fs from "fs";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const write = process.argv.includes("--write");
const DOC = "MENU-SEEDING-PLAN.md";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const junk = (u) =>
  /\.css(\?|$)/i.test(u) || /^https?:\/\/menu\/?$/i.test(u) ||
  /\/wp-content\/(themes|plugins)\//i.test(u) || /cropped-logo|logo-original/i.test(u);
const social = (u) => /facebook|instagram|tiktok|linktr/i.test(u);
const pdf = (u) => /\.pdf(\?|$)/i.test(u);
const agg = (u) => /ubereats|doordash|menulog|order\.store|deliveroo|bopple|hungrypanda/i.test(u);
const bucketOf = (u) =>
  junk(u) ? "junk" : social(u) ? "social" : pdf(u) ? "pdf" : agg(u) ? "aggregator" : "ownpage";
const haveLocal = (id) =>
  fs.existsSync(`media/menus/${id}.pdf`) || fs.existsSync(`media/menus/${id}`);

async function main() {
  const { rows } = await pool.query(
    `SELECT id, name, suburb, state, coalesce(review_count,0) rc, menu_url,
            coalesce(menu_item_count,0) mic
       FROM restaurants
      WHERE is_nepali IS NOT FALSE
        AND business_status IS DISTINCT FROM 'CLOSED_PERMANENTLY'
        AND menu_url IS NOT NULL
      ORDER BY review_count DESC NULLS LAST`,
  );

  const buckets = { pdf: [], ownpage: [], aggregator: [] };
  for (const r of rows) {
    const b = bucketOf(r.menu_url);
    if (b in buckets) buckets[b].push(r);
  }
  const all = [...buckets.pdf, ...buckets.ownpage, ...buckets.aggregator];
  const done = all.filter((r) => r.mic > 0).length;
  const total = all.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  // console summary
  console.log(`menu seeding: ${done} / ${total} (${pct}%)`);
  for (const [k, v] of Object.entries(buckets))
    console.log(`  ${k}: ${v.filter((r) => r.mic > 0).length}/${v.length} done`);

  if (!write) {
    console.log("\n(run with --write to refresh MENU-SEEDING-PLAN.md)");
    return pool.end();
  }

  const line = (r) =>
    `- [${r.mic > 0 ? "x" : " "}] **${r.name.slice(0, 38)}** (${r.suburb}, ${r.state}) · ${r.rc} rev` +
    `${r.mic > 0 ? ` · ✓ ${r.mic} items` : haveLocal(r.id) ? " · 📁local" : ""}\n    ${r.menu_url.slice(0, 90)}`;
  const section = (title, list) =>
    `### ${title} — ${list.filter((r) => r.mic > 0).length}/${list.length} done\n` +
    list.map(line).join("\n");

  const md =
    `## Checklist\n\n` +
    `Source of truth = DB (\`menu_item_count\`); regenerate with ` +
    `\`node scraper/menu-progress.js --write\`. \`📁local\` = file under \`media/menus/\`.\n\n` +
    `**Progress: ${done} / ${total} seeded (${pct}%)** · refreshed ${new Date().toISOString().slice(0, 10)}\n\n` +
    section("A. PDF menus — start here", buckets.pdf) + "\n\n" +
    section("B. Own-site pages", buckets.ownpage) + "\n\n" +
    section("C. Aggregators — last resort (bot-walled, marked-up prices)", buckets.aggregator) + "\n";

  const cur = fs.existsSync(DOC) ? fs.readFileSync(DOC, "utf8") : "";
  const idx = cur.indexOf("## Checklist");
  fs.writeFileSync(DOC, (idx >= 0 ? cur.slice(0, idx) : cur + "\n\n") + md);
  console.log(`\nrewrote ${DOC} checklist (${total} items).`);
  return pool.end();
}
main().catch((e) => { console.error("ERR", e.message); process.exit(1); });
