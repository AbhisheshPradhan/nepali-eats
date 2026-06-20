import { chromium } from "playwright";
import pg from "pg";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// Enrich restaurants missing a full address by rendering their Google Maps place
// page through a rotating pool of [direct + Webshare proxies], blocking heavy
// assets so the proxies stay fast. Writes each result straight to Postgres, so
// it's resumable: just re-run and it picks up whatever is still NULL.

const CONCURRENCY = Number(process.env.CONCURRENCY || 6);
const MAX_ATTEMPTS = Number(process.env.MAX_ATTEMPTS || 3);

const proxies = (process.env.WEBSHARE_PROXIES || "")
  .split(",").map((s) => s.trim()).filter(Boolean)
  .map((url) => {
    const u = new URL(url);
    return {
      server: `${u.protocol}//${u.hostname}:${u.port}`,
      username: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
    };
  });
// exits: direct first, then every proxy
const EXITS = [null, ...proxies];
let exitIdx = 0;
const nextExit = () => EXITS[exitIdx++ % EXITS.length];

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "ACT", "TAS", "NT"];
function parseAddress(full) {
  const out = { street: "", suburb: "", state: "", postcode: "" };
  if (!full) return out;
  out.postcode = full.match(/\b(\d{4})\b\s*(?:,?\s*Australia)?\s*$/)?.[1] || "";
  out.state = full.match(new RegExp(`\\b(${STATES.join("|")})\\b`))?.[1] || "";
  const segs = full.split(",").map((s) => s.trim()).filter(Boolean);
  // drop a trailing "Australia"
  if (/^australia$/i.test(segs[segs.length - 1])) segs.pop();
  const last = segs[segs.length - 1] || "";
  let suburb = last.replace(new RegExp(`\\b(${STATES.join("|")})\\b.*$`), "").trim();
  if (!suburb && segs.length >= 2) suburb = segs[segs.length - 2];
  out.suburb = suburb;
  out.street = segs.slice(0, -1).join(", ") || (out.suburb ? "" : full);
  return out;
}

function extractPlace() {
  const out = {};
  const addrBtn =
    document.querySelector('button[data-item-id="address"]') ||
    document.querySelector('button[aria-label^="Address:"]');
  if (addrBtn)
    out.fullAddress =
      addrBtn.querySelector(".Io6YTe")?.textContent?.trim() ||
      (addrBtn.getAttribute("aria-label") || "").replace(/^Address:\s*/, "").trim();
  const phoneBtn = document.querySelector('button[data-item-id^="phone"]');
  if (phoneBtn)
    out.phone =
      phoneBtn.querySelector(".Io6YTe")?.textContent?.trim() ||
      (phoneBtn.getAttribute("aria-label") || "").replace(/^Phone:\s*/, "").trim();
  out.website = document.querySelector('a[data-item-id="authority"]')?.href || "";
  // review count: prefer .F7nice text "4.8(519)", fall back to "519 reviews" aria-label
  const f7 = document.querySelector(".F7nice")?.innerText || "";
  let rc = f7.match(/\(([\d,]+)\)/)?.[1];
  if (!rc) {
    const aria = [...document.querySelectorAll("[aria-label]")]
      .map((e) => e.getAttribute("aria-label"))
      .map((a) => a && a.match(/^([\d,]+)\s+reviews?$/i))
      .find(Boolean);
    if (aria) rc = aria[1];
  }
  if (rc) out.reviewCount = rc.replace(/,/g, "");
  // overall rating (re-confirm / backfill)
  const rt = f7.match(/(\d(?:\.\d)?)/);
  if (rt) out.rating = rt[1];
  const ll =
    location.href.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
    location.href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (ll) { out.lat = ll[1]; out.lng = ll[2]; }
  return out;
}

async function fetchPlace(url) {
  const exit = nextExit();
  const browser = await chromium.launch({
    headless: true,
    ...(exit ? { proxy: exit } : {}),
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });
  try {
    const page = await (await browser.newContext({ locale: "en-AU" })).newPage();
    await page.route("**/*", (r) => {
      const t = r.request().resourceType();
      return ["image", "media", "font", "stylesheet"].includes(t)
        ? r.abort()
        : r.continue();
    });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 35000 });
    await page
      .locator('button[data-item-id="address"]')
      .first()
      .waitFor({ timeout: 18000 })
      .catch(() => {});
    // the rating number renders before the (count); wait for the count to populate
    await page
      .waitForFunction(
        () => /\(\d/.test(document.querySelector(".F7nice")?.innerText || ""),
        { timeout: 9000 }
      )
      .catch(() => {});
    const data = await page.evaluate(extractPlace);
    await browser.close();
    // success if the place panel yielded anything useful
    return data.fullAddress || data.reviewCount || data.phone || data.website
      ? data
      : null;
  } catch {
    await browser.close().catch(() => {});
    return null;
  }
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const { rows: todo } = await pool.query(
    `SELECT google_feature_id, google_maps_url
       FROM restaurants
       WHERE google_maps_url IS NOT NULL
         AND (full_address IS NULL OR review_count IS NULL)
       ${process.env.LIMIT ? `LIMIT ${Number(process.env.LIMIT)}` : ""}`
  );
  console.log(
    `${todo.length} rows need addresses. exits=${EXITS.length} ` +
      `(1 direct + ${proxies.length} proxies), concurrency=${CONCURRENCY}.`
  );

  let i = 0, done = 0, ok = 0;
  async function worker() {
    while (i < todo.length) {
      const rec = todo[i++];
      let data = null;
      for (let a = 0; a < MAX_ATTEMPTS && !data; a++)
        data = await fetchPlace(rec.google_maps_url);
      done++;
      if (data) {
        const ad = parseAddress(data.fullAddress || "");
        await pool.query(
          `UPDATE restaurants SET
             full_address=COALESCE(NULLIF($2,''),full_address),
             street=COALESCE(NULLIF($3,''),street),
             suburb=COALESCE(NULLIF($4,''),suburb),
             state=COALESCE(NULLIF($5,''),state),
             postcode=COALESCE(NULLIF($6,''),postcode),
             phone=COALESCE(NULLIF($7,''),phone),
             website=COALESCE(NULLIF($8,''),website),
             lat=COALESCE($9,lat), lng=COALESCE($10,lng),
             rating=COALESCE($11,rating),
             review_count=COALESCE($12,review_count),
             address_source=CASE WHEN NULLIF($2,'') IS NOT NULL THEN 'google'
                                 ELSE address_source END,
             enriched_at=now(), updated_at=now()
           WHERE google_feature_id=$1`,
          [
            rec.google_feature_id, data.fullAddress || "", ad.street, ad.suburb,
            ad.state, ad.postcode, data.phone || "", data.website || "",
            data.lat ? Number(data.lat) : null, data.lng ? Number(data.lng) : null,
            data.rating ? Number(data.rating) : null,
            data.reviewCount ? parseInt(data.reviewCount, 10) : null,
          ]
        );
        ok++;
      }
      if (done % 20 === 0 || done === todo.length)
        console.log(`  ${done}/${todo.length} processed, ${ok} filled this run`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const { rows } = await pool.query(
    `SELECT count(*) total, count(full_address) with_addr,
            count(phone) with_phone, count(website) with_site
       FROM restaurants`
  );
  console.log("\nDone.");
  console.table(rows[0]);
  await pool.end();
}

main();
