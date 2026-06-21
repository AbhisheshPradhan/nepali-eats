import { chromium } from "playwright";
import pg from "pg";
import dotenv from "dotenv";
import { parseHours } from "./hours.js";

dotenv.config();

// Daily opening-hours pass. Headless Maps only exposes TODAY's row, so this
// captures one weekday per run and accumulates the week in `opening_hours_raw`
// across ~7-9 daily runs. Each run also rebuilds canonical `opening_hours` from
// the merged raw (parseHours) and opportunistically backfills price. No photos.
//
// Resumability: re-scrapes every row once per calendar day
// (hours_scraped_at::date < CURRENT_DATE), so a daily cron fills the week.
// Reuses enrich-google's render approach: direct + rotating proxies, asset
// blocking, one retry on a fresh exit.

const CONCURRENCY = Number(process.env.CONCURRENCY || 4);

const rawProxies = (process.env.WEBSHARE_PROXIES || "")
  .split(",").map((s) => s.trim()).filter(Boolean);
const pwExits = [null, ...rawProxies.map((u) => {
  const x = new URL(u);
  return { server: `${x.protocol}//${x.hostname}:${x.port}`,
           username: decodeURIComponent(x.username), password: decodeURIComponent(x.password) };
})];
let ei = 0;
const nextExit = () => pwExits[ei++ % pwExits.length];

// ---- runs in the browser: today's hours row + price (no expansion needed) ----
function extractTodayHours() {
  const out = {};

  // today's per-day row is present in the DOM by default; take the first (primary
  // hours block, not Lunch/Dinner/Online sub-sections which follow it).
  const dayRe = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s*(.+)$/;
  for (const el of document.querySelectorAll("[aria-label]")) {
    const a = el.getAttribute("aria-label") || "";
    const m = a.match(dayRe);
    if (m) {
      const hrs = m[2]
        .replace(/,?\s*(Copy|Hide|Suggest|Updated|Show).*$/i, "")
        .replace(/\.$/, "").trim();
      if (hrs) { out.today = { day: m[1], hours: hrs }; break; }
    }
  }

  // price (same heuristics as enrich-google): compact "$10–20" / "$$" text node.
  let price = null;
  for (const e of document.querySelectorAll("span, div")) {
    const t = (e.childElementCount === 0 ? e.textContent : "").trim();
    if (/^\$\d{1,4}\s*[–-]\s*\$?\d{1,4}$/.test(t) || /^\${1,4}$/.test(t) || /^\$\d{1,4}\+?$/.test(t)) { price = t; break; }
  }
  if (price) {
    out.priceRange = price;
    if (/^\${1,4}$/.test(price)) out.priceLevel = price.length;
  }
  return out;
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
    // wait until a per-day hours row is present
    await page.waitForFunction(() =>
      [...document.querySelectorAll("[aria-label]")].some((e) =>
        /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),/.test(e.getAttribute("aria-label") || "")),
      { timeout: 9000 }).catch(() => {});
    await page.waitForTimeout(600);
    const data = await page.evaluate(extractTodayHours);
    await browser.close();
    return data;
  } catch {
    await browser.close().catch(() => {});
    return null;
  }
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const { rows: todo } = await pool.query(
    `SELECT id, google_maps_url, opening_hours_raw FROM restaurants
      WHERE google_maps_url IS NOT NULL AND is_nepali IS NOT FALSE
        AND (hours_scraped_at IS NULL OR hours_scraped_at::date < CURRENT_DATE)
      ${process.env.LIMIT ? `LIMIT ${Number(process.env.LIMIT)}` : ""}`);
  console.log(`${todo.length} to scrape today. exits=${pwExits.length}, concurrency=${CONCURRENCY}`);

  let i = 0, done = 0, gotDay = 0, gotPrice = 0;
  async function worker() {
    while (i < todo.length) {
      const rec = todo[i++];
      const data = (await renderPlace(rec.google_maps_url)) ||
                   (await renderPlace(rec.google_maps_url)); // one retry, new exit
      done++;

      if (data?.today) {
        // merge today's day into accumulated raw, then rebuild canonical from it
        const raw = { ...(rec.opening_hours_raw || {}), [data.today.day]: data.today.hours };
        const canonical = parseHours(raw);
        await pool.query(
          `UPDATE restaurants SET
             opening_hours_raw = $2,
             opening_hours     = $3,
             price_range       = COALESCE(price_range, $4),
             price_level       = COALESCE(price_level, $5),
             hours_scraped_at  = now(), updated_at = now()
           WHERE id = $1`,
          [rec.id, JSON.stringify(raw), canonical ? JSON.stringify(canonical) : null,
           data.priceRange ?? null, data.priceLevel ?? null]);
        gotDay++;
        if (data.priceRange) gotPrice++;
      } else {
        // attempted today; failures retry on the next daily run
        await pool.query(`UPDATE restaurants SET hours_scraped_at = now() WHERE id = $1`, [rec.id]);
      }
      if (done % 20 === 0 || done === todo.length)
        console.log(`  ${done}/${todo.length} | ${gotDay} got today's row | ${gotPrice} price`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const { rows } = await pool.query(
    `SELECT count(*) FILTER (WHERE opening_hours_raw IS NOT NULL) any_day,
            count(*) FILTER (WHERE opening_hours_raw IS NOT NULL
                             AND (SELECT count(*) FROM jsonb_object_keys(opening_hours_raw)) >= 7) full_week,
            count(opening_hours) canonical
     FROM restaurants WHERE is_nepali IS NOT FALSE`);
  console.log("\nDone."); console.table(rows[0]);
  await pool.end();
}
main();
