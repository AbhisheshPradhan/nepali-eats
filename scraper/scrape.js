import { chromium } from "playwright";
import dotenv from "dotenv";
import fs from "fs";
import { LOCATIONS } from "./locations.js";

dotenv.config();

// ---- proxy pool -----------------------------------------------------------
// WEBSHARE_PROXIES is a comma-separated list of http://user:pass@host:port URLs.
const PROXIES = (process.env.WEBSHARE_PROXIES || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((url) => {
    const u = new URL(url);
    return {
      server: `${u.protocol}//${u.hostname}:${u.port}`,
      username: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
    };
  });

let proxyIdx = 0;
const nextProxy = () => PROXIES[proxyIdx++ % PROXIES.length];

// ---- output / dedupe ------------------------------------------------------
const OUT_JSON = "nepali-restaurants-au.json";
const OUT_CSV = "nepali-restaurants-au.csv";
const QUERY = "Nepali restaurant";

const byId = new Map(); // featureId (or fallback key) -> record

function loadExisting() {
  if (fs.existsSync(OUT_JSON)) {
    try {
      for (const r of JSON.parse(fs.readFileSync(OUT_JSON, "utf8"))) {
        byId.set(r.dedupeKey, r);
      }
      console.log(`Resuming: ${byId.size} existing records loaded.`);
    } catch {}
  }
}

function saveJson() {
  fs.writeFileSync(OUT_JSON, JSON.stringify([...byId.values()], null, 2));
}

function csvCell(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function saveCsv() {
  const cols = [
    "name", "rating", "reviews", "category", "address",
    "phone", "website", "lat", "lng", "featureId", "placeUrl", "foundVia",
  ];
  const rows = [...byId.values()].map((r) =>
    cols.map((c) => csvCell(r[c])).join(",")
  );
  fs.writeFileSync(OUT_CSV, [cols.join(","), ...rows].join("\n"));
}

// ---- page extraction (runs in browser) ------------------------------------
function extractCards() {
  const out = [];
  const cards = document.querySelectorAll('div[role="feed"] div.Nv2PK');
  for (const card of cards) {
    const link = card.querySelector("a.hfpxzc");
    if (!link) continue;
    const href = link.href || "";
    const name = link.getAttribute("aria-label") || "";
    const text = card.innerText || "";

    const rating = card.querySelector(".MW4etd")?.textContent?.trim() || "";
    // review count lives in the star element's aria-label ("4.7 stars 123 Reviews")
    let reviews = "";
    const ariaImg =
      card.querySelector('span[role="img"]')?.getAttribute("aria-label") || "";
    const revM = ariaImg.match(/([\d,]+)\s*review/i);
    if (revM) reviews = revM[1].replace(/,/g, "");
    else
      reviews = (card.querySelector(".UY7F9")?.textContent || "").replace(
        /[^\d]/g,
        ""
      );

    // ".W4Efsd" blocks: rating, then "category MID [price] MID address" (a
    // clean copy + an hours-suffixed copy), then "Open/Closed ..." hours.
    const MID = /[·⋅•]/; // middot variants Google uses
    const HOURS = /\b(Open|Closed|Opens|Closes|Temporarily|Permanently)\b/i;
    const rows = [...card.querySelectorAll(".W4Efsd")].map((e) =>
      e.textContent.replace(/[\uE000-\uF8FF]/g, "").replace(/\s+/g, " ").trim()
    );
    // prefer the middot row WITHOUT hours (clean category / price / address)
    const infoLine =
      rows.find((r) => MID.test(r) && !HOURS.test(r)) ||
      rows.find((r) => MID.test(r)) ||
      rows[0] ||
      "";
    const parts = infoLine.split(MID).map((s) => s.trim()).filter(Boolean);
    const isPrice = (s) => /^[$\u20ac\u00a3\u20b9]|\b(AUD|USD)\b/i.test(s);
    const isDistance = (s) => /^\d+(\.\d+)?\s*(km|mi|m)\b/i.test(s);
    const category = parts[0] || "";
    // address = last segment after category that is not price or distance
    const addrParts = parts.slice(1).filter((s) => !isPrice(s) && !isDistance(s));
    let address = (addrParts[addrParts.length - 1] || "")
      .replace(
        /\s*(Open 24 hours|Open|Closed|Opens|Closes|Temporarily closed|Permanently closed)\b.*$/i,
        ""
      )
      .replace(/^[,\s]+|[,\s]+$/g, "")
      .trim();

    const phoneMatch = text.match(/(?:\+?61|0)[\d][\d \-]{6,}\d/);
    const phone = phoneMatch ? phoneMatch[0].trim() : "";

    const website = card.querySelector('a[data-value="Website"]')?.href || "";

    // place URLs carry coords as !3d<lat>!4d<lng>; fall back to @lat,lng
    const ll =
      href.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
      href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    const idm = href.match(/!1s(0x[0-9a-fA-F]+:0x[0-9a-fA-F]+)/);
    const featureId = idm ? idm[1] : "";

    out.push({
      name,
      rating,
      reviews,
      category,
      address,
      phone,
      website,
      lat: ll ? ll[1] : "",
      lng: ll ? ll[2] : "",
      featureId,
      placeUrl: href,
    });
  }
  return out;
}

// fallback: extract a single place from the detail panel
function extractCardFromPanel() {
  const name = document.querySelector("h1")?.textContent?.trim();
  if (!name) return null;
  const href = location.href;
  const ll =
    href.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
    href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  const idm = href.match(/!1s(0x[0-9a-fA-F]+:0x[0-9a-fA-F]+)/);
  return {
    name,
    rating:
      document.querySelector(".F7nice span[aria-hidden]")?.textContent || "",
    reviews: "",
    category:
      document.querySelector("button[jsaction*='category']")?.textContent?.trim() ||
      "",
    address:
      document
        .querySelector('button[data-item-id="address"]')
        ?.getAttribute("aria-label")
        ?.replace(/^Address:\s*/, "") || "",
    phone:
      document
        .querySelector('button[data-item-id^="phone"]')
        ?.getAttribute("aria-label")
        ?.replace(/^Phone:\s*/, "") || "",
    website: document.querySelector('a[data-item-id="authority"]')?.href || "",
    lat: ll ? ll[1] : "",
    lng: ll ? ll[2] : "",
    featureId: idm ? idm[1] : "",
    placeUrl: href,
  };
}

// ---- scrape one location --------------------------------------------------
async function scrapeLocation(location) {
  // Google challenges/stalls headless Chromium coming from datacenter proxies,
  // so proxy use is opt-in. Direct connection works reliably. Set USE_PROXY=1
  // to route through the rotating Webshare pool.
  const proxy = process.env.USE_PROXY ? nextProxy() : undefined;
  const browser = await chromium.launch({
    headless: true,
    ...(proxy ? { proxy } : {}),
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });
  const ctx = await browser.newContext({
    locale: "en-AU",
    timezoneId: "Australia/Sydney",
    viewport: { width: 1280, height: 1400 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });
  const page = await ctx.newPage();
  try {
    const url = `https://www.google.com/maps/search/${encodeURIComponent(
      QUERY + " " + location
    )}/?hl=en&gl=au`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    // consent page handling
    try {
      const consent = page.locator(
        'button[aria-label*="Accept"], form[action*="consent"] button'
      );
      if (await consent.first().isVisible({ timeout: 4000 })) {
        await consent.first().click();
        await page.waitForTimeout(1500);
      }
    } catch {}

    // Wait for either the feed or a single-place panel.
    const feed = page.locator('div[role="feed"]');
    try {
      await feed.waitFor({ state: "visible", timeout: 20000 });
    } catch {
      const single = await page.evaluate(extractCardFromPanel);
      await browser.close();
      return single ? [single] : [];
    }

    // Scroll the feed to load all results.
    let lastCount = -1,
      stagnant = 0;
    for (let i = 0; i < 60; i++) {
      await page.evaluate(() => {
        const f = document.querySelector('div[role="feed"]');
        if (f) f.scrollTo(0, f.scrollHeight);
      });
      await page.waitForTimeout(2200);
      const reachedEnd = await page.evaluate(() =>
        /reached the end of the list/i.test(
          document.querySelector('div[role="feed"]')?.innerText || ""
        )
      );
      const count = await page.evaluate(
        () => document.querySelectorAll('div[role="feed"] div.Nv2PK').length
      );
      if (count === lastCount) stagnant++;
      else stagnant = 0;
      lastCount = count;
      // require several stable polls before giving up (feed lazy-loads in bursts)
      if (reachedEnd || stagnant >= 5) break;
    }

    const results = await page.evaluate(extractCards);
    await browser.close();
    return results;
  } catch (err) {
    await browser.close();
    throw err;
  }
}

// ---- main -----------------------------------------------------------------
function dedupeKey(r) {
  if (r.featureId) return r.featureId;
  return `${r.name}|${r.address}`.toLowerCase().replace(/\s+/g, " ").trim();
}

async function run() {
  loadExisting();
  // Optional overrides for testing:
  //   LOCATION="Sydney NSW" node scrape.js   -> single location
  //   LIMIT=3 node scrape.js                 -> first N locations
  let locs = LOCATIONS;
  if (process.env.LOCATION) locs = [process.env.LOCATION];
  else if (process.env.LIMIT) locs = LOCATIONS.slice(0, Number(process.env.LIMIT));
  const total = locs.length;
  for (let i = 0; i < total; i++) {
    const loc = locs[i];
    const before = byId.size;
    let attempt = 0,
      results = null;
    while (attempt < 3 && results === null) {
      attempt++;
      try {
        results = await scrapeLocation(loc);
      } catch (err) {
        console.log(
          `  [${loc}] attempt ${attempt} failed: ${err.message.slice(0, 80)}`
        );
        if (attempt >= 3) results = [];
      }
    }
    for (const r of results) {
      if (!r.name) continue;
      r.foundVia = loc;
      r.dedupeKey = dedupeKey(r);
      if (!byId.has(r.dedupeKey)) byId.set(r.dedupeKey, r);
    }
    saveJson();
    saveCsv();
    console.log(
      `[${i + 1}/${total}] ${loc}: +${byId.size - before} new ` +
        `(${results.length} raw, ${byId.size} total)`
    );
    // polite delay between queries to reduce block risk on direct connection
    if (i < total - 1)
      await new Promise((r) => setTimeout(r, 2500 + Math.random() * 2500));
  }
  console.log(`\nDone. ${byId.size} unique restaurants.`);
  console.log(`  -> ${OUT_JSON}\n  -> ${OUT_CSV}`);
}

run();
