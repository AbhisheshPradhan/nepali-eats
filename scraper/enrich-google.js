import { chromium } from "playwright";
import pg from "pg";
import dotenv from "dotenv";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

dotenv.config();
const exec = promisify(execFile);

// Combined Google place-page pass: one render per restaurant (via rotating
// proxies) yields photos + price + review_count + rating + opening hours.
// Photos are downloaded through a proxy, optimized to WebP, and self-hosted
// under ./media/photos/<id>/. Resumable: targets place_enriched_at IS NULL.

const CONCURRENCY = Number(process.env.CONCURRENCY || 4);
const MAX_PHOTOS = Number(process.env.MAX_PHOTOS || 8);
const MEDIA = "media";

const rawProxies = (process.env.WEBSHARE_PROXIES || "")
  .split(",").map((s) => s.trim()).filter(Boolean);
const pwExits = [null, ...rawProxies.map((u) => {
  const x = new URL(u);
  return { server: `${x.protocol}//${x.hostname}:${x.port}`,
           username: decodeURIComponent(x.username), password: decodeURIComponent(x.password) };
})];
let ei = 0, pi = 0;
const nextExit = () => pwExits[ei++ % pwExits.length];
const nextRawProxy = () => rawProxies[pi++ % rawProxies.length];

// ---- runs in the browser ----
function extractPlace() {
  const out = {};
  const f7 = document.querySelector(".F7nice")?.innerText || "";
  const rc = f7.match(/\(([\d,]+)\)/)?.[1];
  if (rc) out.reviewCount = rc.replace(/,/g, "");
  const rt = f7.match(/(\d(?:\.\d)?)/);
  if (rt) out.rating = rt[1];

  // price: "$10–20", "$$", "$1–20" — search compact text nodes near category
  let price = null;
  for (const e of document.querySelectorAll("span, div")) {
    const t = (e.childElementCount === 0 ? e.textContent : "").trim();
    if (/^\$\d{1,4}\s*[–-]\s*\$?\d{1,4}$/.test(t) || /^\${1,4}$/.test(t) || /^\$\d{1,4}\+?$/.test(t)) { price = t; break; }
  }
  if (!price) {
    const a = [...document.querySelectorAll("[aria-label]")].map((e) => e.getAttribute("aria-label"))
      .find((a) => a && /price/i.test(a) && /\$|inexpensive|moderate|expensive/i.test(a));
    if (a) price = a.replace(/^Price:\s*/i, "").trim();
  }
  if (price) {
    out.priceRange = price;
    if (/^\${1,4}$/.test(price)) out.priceLevel = price.length;
    else if (/inexpensive/i.test(price)) out.priceLevel = 1;
    else if (/moderate/i.test(price)) out.priceLevel = 2;
    else if (/very expensive/i.test(price)) out.priceLevel = 4;
    else if (/expensive/i.test(price)) out.priceLevel = 3;
  }

  // photos: googleusercontent / ggpht urls from img src + background-image
  const urls = new Set();
  for (const img of document.querySelectorAll("img")) {
    const s = img.src || img.getAttribute("data-src") || "";
    if (/googleusercontent|ggpht/.test(s) && /=w\d|=s\d/.test(s)) urls.add(s);
  }
  for (const el of document.querySelectorAll('[style*="background-image"]')) {
    const m = (el.getAttribute("style") || "").match(/url\(["']?(https:\/\/[^"')]+(?:googleusercontent|ggpht)[^"')]+)/);
    if (m) urls.add(m[1]);
  }
  out.photos = [...urls].slice(0, 16);

  // opening hours (best effort) from per-day aria-labels
  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const hrs = {};
  for (const el of document.querySelectorAll("[aria-label]")) {
    const a = el.getAttribute("aria-label") || "";
    const m = a.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s*(.+)$/);
    if (m && !hrs[m[1]]) hrs[m[1]] = m[2].replace(/[,.]?\s*(Copy|Hide|Suggest).*$/i, "").replace(/\.$/, "").trim();
  }
  if (Object.keys(hrs).length >= 4) out.hours = hrs; // only store a reasonably complete week
  return out;
}

const upsize = (u) => u.replace(/=w\d+-h\d+/, "=w1200-h900").replace(/=s\d+/, "=s1200");

async function downloadPhoto(url, destNoExt) {
  const proxy = nextRawProxy();
  const { stdout } = await exec("curl",
    ["-s", "--max-time", "25", "-x", proxy, "-A", "Mozilla/5.0", upsize(url)],
    { encoding: "buffer", maxBuffer: 25 * 1024 * 1024 });
  if (!stdout || stdout.length < 2000) throw new Error("tiny/empty");
  const { data, info } = await sharp(stdout)
    .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
  await fs.promises.writeFile(`${destNoExt}.webp`, data);
  return { width: info.width, height: info.height };
}

async function renderPlace(url) {
  const exit = nextExit();
  const browser = await chromium.launch({
    headless: true, ...(exit ? { proxy: exit } : {}),
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });
  try {
    const page = await (await browser.newContext({ locale: "en-AU" })).newPage();
    await page.route("**/*", (r) =>
      ["image", "media", "font", "stylesheet"].includes(r.request().resourceType()) ? r.abort() : r.continue());
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 35000 });
    await page.locator('button[data-item-id="address"]').first().waitFor({ timeout: 18000 }).catch(() => {});
    await page.waitForFunction(() => /\(\d/.test(document.querySelector(".F7nice")?.innerText || ""),
      { timeout: 9000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const data = await page.evaluate(extractPlace);
    await browser.close();
    return data;
  } catch (e) {
    await browser.close().catch(() => {});
    return null;
  }
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const { rows: todo } = await pool.query(
    `SELECT id, google_maps_url FROM restaurants
      WHERE google_maps_url IS NOT NULL AND place_enriched_at IS NULL
      ${process.env.LIMIT ? `LIMIT ${Number(process.env.LIMIT)}` : ""}`);
  console.log(`${todo.length} to enrich. exits=${pwExits.length}, concurrency=${CONCURRENCY}, maxPhotos=${MAX_PHOTOS}`);

  let i = 0, done = 0, withPhoto = 0, withPrice = 0;
  async function worker() {
    while (i < todo.length) {
      const rec = todo[i++];
      const data = (await renderPlace(rec.google_maps_url)) ||
                   (await renderPlace(rec.google_maps_url)); // one retry, new exit
      done++;
      if (data) {
        // photos
        let pos = 0;
        if (data.photos?.length) {
          const dir = path.join(MEDIA, "photos", String(rec.id));
          await fs.promises.mkdir(dir, { recursive: true });
          for (const url of data.photos) {
            if (pos >= MAX_PHOTOS) break;
            try {
              const key = path.join("photos", String(rec.id), String(pos));
              const dim = await downloadPhoto(url, path.join(MEDIA, key));
              await pool.query(
                `INSERT INTO restaurant_photos (restaurant_id, storage_key, source, source_url, attribution, width, height, position, is_primary)
                 VALUES ($1,$2,'google',$3,'Google / the business',$4,$5,$6,$7)
                 ON CONFLICT (restaurant_id, storage_key) DO NOTHING`,
                [rec.id, key + ".webp", url, dim.width, dim.height, pos, pos === 0]);
              pos++;
            } catch {}
          }
          if (pos) withPhoto++;
        }
        if (data.priceRange) withPrice++;
        await pool.query(
          `UPDATE restaurants SET
             price_level   = COALESCE($2, price_level),
             price_range   = COALESCE($3, price_range),
             review_count  = COALESCE($4, review_count),
             rating        = COALESCE($5, rating),
             opening_hours = COALESCE($6, opening_hours),
             place_enriched_at = now(), updated_at = now()
           WHERE id = $1`,
          [rec.id, data.priceLevel ?? null, data.priceRange ?? null,
           data.reviewCount ? parseInt(data.reviewCount, 10) : null,
           data.rating ? Number(data.rating) : null,
           data.hours ? JSON.stringify(data.hours) : null]);
      } else {
        // mark attempted so we don't loop forever; leaves data null
        await pool.query(`UPDATE restaurants SET place_enriched_at = now() WHERE id=$1`, [rec.id]);
      }
      if (done % 10 === 0 || done === todo.length)
        console.log(`  ${done}/${todo.length} | ${withPhoto} w/photos | ${withPrice} w/price`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const { rows } = await pool.query(
    `SELECT count(*) total, count(price_range) w_price, count(review_count) w_reviews,
            count(opening_hours) w_hours,
            (SELECT count(DISTINCT restaurant_id) FROM restaurant_photos) w_photos
     FROM restaurants`);
  console.log("\nDone."); console.table(rows[0]);
  await pool.end();
}
main();
