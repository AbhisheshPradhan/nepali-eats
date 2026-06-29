// Store a restaurant's source menu file(s) (image/PDF) to R2 under menus/<id>/, the
// same convention the admin editor uses. R2-only (no DB record — menu files are found
// by listing R2; see MENU-PLAN.md). Input is a URL or a local file path; a pasted
// screenshot can't be used (no file bytes). Also mirrors into local media/.
//
//   node scraper/add-menu-file.js <slug> <url-or-path>
//
// PDFs (print menus are often 100MB+) are rasterized to web-sized page images via
// pdftoppm (poppler) instead of storing the raw file. Single images are capped in size.
import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync, execSync } from "child_process";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;
const [, , slug, src] = process.argv;
if (!slug || !src) {
  console.error("usage: node scraper/add-menu-file.js <slug> <url-or-path>");
  process.exit(1);
}
const hasBin = (b) => { try { execSync(`command -v ${b}`, { stdio: "ignore" }); return true; } catch { return false; } };
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const { rows } = await pool.query("select id, name from restaurants where slug=$1", [slug]);
  if (!rows.length) throw new Error(`no restaurant with slug "${slug}"`);
  const { id: rid, name } = rows[0];

  // Resolve src -> a local file.
  let local = src, tmp = null;
  if (/^https?:\/\//i.test(src)) {
    const ext = (src.split("?")[0].match(/\.[a-z0-9]+$/i) || [".pdf"])[0].toLowerCase();
    tmp = path.join(os.tmpdir(), `menu-dl-${Date.now()}${ext}`);
    execFileSync("curl", ["-fsSL", "-o", tmp, src]);
    local = tmp;
  }
  if (!fs.existsSync(local)) throw new Error(`file not found: ${local}`);
  const ext = (path.extname(local) || ".jpg").toLowerCase();

  // R2 upload helper (same bucket/endpoint as the sync script) + local media/ mirror.
  const api = process.env.R2_S3_API || "";
  const endpoint = (api.match(/^https?:\/\/[^/]+/) || [`https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`])[0];
  const r2env = { ...process.env, AWS_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION: "auto" };
  const putR2 = (file, key) => {
    const dest = path.join("media", key);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(file, dest);
    execFileSync("aws", ["s3", "cp", dest, `s3://${process.env.R2_BUCKET}/${key}`,
      "--endpoint-url", endpoint, "--cache-control", "public, max-age=86400", "--no-progress"],
      { env: r2env, stdio: "inherit" });
    return key;
  };

  const stored = [];
  if (ext === ".pdf") {
    if (!hasBin("pdftoppm")) throw new Error("pdftoppm not found (brew install poppler) — needed to rasterize PDF menus");
    const prefix = path.join(os.tmpdir(), `menu-pg-${Date.now()}`);
    execFileSync("pdftoppm", ["-jpeg", "-r", "110", local, prefix]);
    const pages = fs.readdirSync(os.tmpdir())
      .filter((f) => f.startsWith(path.basename(prefix)) && f.endsWith(".jpg")).sort();
    pages.forEach((f, i) => {
      stored.push(putR2(path.join(os.tmpdir(), f), `menus/${rid}/menu-page-${i + 1}.jpg`));
      fs.unlinkSync(path.join(os.tmpdir(), f));
    });
  } else {
    if (hasBin("sips")) { try { execFileSync("sips", ["-Z", "2200", local], { stdio: "ignore" }); } catch {} }
    const rand = Math.random().toString(36).slice(2, 6);
    stored.push(putR2(local, `menus/${rid}/menu-${Date.now()}-${rand}${ext}`));
  }

  const base = (process.env.NEXT_PUBLIC_MEDIA_BASE || "").replace(/\/$/, "");
  console.log(`stored ${stored.length} menu file(s) for ${name} (id ${rid}):`);
  stored.forEach((k) => console.log(base ? `  https://${base}/${k}` : `  ${k}`));
  if (tmp) fs.unlinkSync(tmp);
  await pool.end();
}

main().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
