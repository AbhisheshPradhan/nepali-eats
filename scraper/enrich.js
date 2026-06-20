import { chromium } from "playwright";
import fs from "fs";

// Enrich each scraped restaurant with its FULL formatted address (street, suburb,
// state, postcode), phone and website by opening its Google Maps place page.
// The list-card scrape only captured a street fragment; the place page has the
// complete address. Resumable: skips records that already have fullAddress.

const IN = "nepali-restaurants-au.json";
const OUT_JSON = "nepali-restaurants-au.json";
const OUT_CSV = "nepali-restaurants-au.csv";
const CONCURRENCY = Number(process.env.CONCURRENCY || 3);
const JITTER_MS = Number(process.env.JITTER_MS || 600); // per-request delay to dodge throttling

const records = JSON.parse(fs.readFileSync(IN, "utf8"));

function csvCell(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function save() {
  fs.writeFileSync(OUT_JSON, JSON.stringify(records, null, 2));
  const cols = [
    "name", "rating", "reviews", "category", "fullAddress", "address",
    "phone", "website", "lat", "lng", "featureId", "placeUrl", "foundVia",
  ];
  const rows = records.map((r) => cols.map((c) => csvCell(r[c])).join(","));
  fs.writeFileSync(OUT_CSV, [cols.join(","), ...rows].join("\n"));
}

// runs in the browser on the place page
function extractPlace() {
  const out = {};
  const addrBtn = document.querySelector('button[data-item-id="address"]');
  if (addrBtn) {
    out.fullAddress =
      addrBtn.querySelector(".Io6YTe")?.textContent?.trim() ||
      (addrBtn.getAttribute("aria-label") || "").replace(/^Address:\s*/, "").trim();
  }
  if (!out.fullAddress) {
    // fallback: address row sometimes renders without the button wrapper
    out.fullAddress =
      document
        .querySelector('[data-item-id="address"] .Io6YTe')
        ?.textContent?.trim() ||
      document
        .querySelector('button[aria-label^="Address:"]')
        ?.getAttribute("aria-label")
        ?.replace(/^Address:\s*/, "")
        .trim() ||
      "";
  }
  const phoneBtn = document.querySelector('button[data-item-id^="phone"]');
  if (phoneBtn) {
    out.phone =
      phoneBtn.querySelector(".Io6YTe")?.textContent?.trim() ||
      (phoneBtn.getAttribute("aria-label") || "").replace(/^Phone:\s*/, "").trim();
  }
  const site = document.querySelector('a[data-item-id="authority"]');
  if (site) out.website = site.href;
  // refine coords from the canonical URL once the panel has loaded
  const ll =
    location.href.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
    location.href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (ll) {
    out.lat = ll[1];
    out.lng = ll[2];
  }
  return out;
}

async function enrichOne(ctx, rec) {
  const page = await ctx.newPage();
  // block heavy assets to speed up
  await page.route("**/*", (route) => {
    const t = route.request().resourceType();
    if (t === "image" || t === "media" || t === "font") return route.abort();
    route.continue();
  });
  try {
    await page.goto(rec.placeUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    // wait for the place panel (address button) to render; longer to ride out throttling
    await page
      .locator('button[data-item-id="address"]')
      .first()
      .waitFor({ timeout: 25000 })
      .catch(() => {});
    if (JITTER_MS) await page.waitForTimeout(JITTER_MS + Math.random() * JITTER_MS);
    const data = await page.evaluate(extractPlace);
    Object.assign(rec, data);
    rec.enriched = true;
  } catch (err) {
    rec.enrichError = err.message.slice(0, 60);
  } finally {
    await page.close();
  }
}

async function run() {
  const todo = records.filter((r) => r.placeUrl && !r.fullAddress);
  console.log(
    `${records.length} total, ${todo.length} need enrichment, ` +
      `concurrency ${CONCURRENCY}.`
  );
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });
  const ctx = await browser.newContext({
    locale: "en-AU",
    timezoneId: "Australia/Sydney",
    viewport: { width: 1280, height: 1000 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });

  let done = 0,
    ok = 0,
    idx = 0;
  async function worker() {
    while (idx < todo.length) {
      const rec = todo[idx++];
      await enrichOne(ctx, rec);
      done++;
      if (rec.fullAddress) ok++;
      if (done % 20 === 0 || done === todo.length) {
        save();
        console.log(
          `  ${done}/${todo.length} processed, ${ok} addresses filled`
        );
      }
    }
  }
  await Promise.all(
    Array.from({ length: CONCURRENCY }, () => worker())
  );
  await browser.close();
  save();

  const filled = records.filter((r) => r.fullAddress).length;
  console.log(
    `\nDone. full address: ${filled}/${records.length} ` +
      `(${Math.round((100 * filled) / records.length)}%)`
  );
}

run();
