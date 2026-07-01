// Cheap menu-source acquisition for seeding — gets the menu in front of the model
// with the FEWEST tokens, then leaves the judgement (parse shape, price sanity,
// taxonomy mapping) to the model. It does NOT transcribe or hit the DB write path.
//
//   node scraper/menu-fetch.js <slug>
//
// What it does, in order:
//  1. Resolves id / menu_url / website from the DB (read-only) and prints the
//     branch address so the model can verify it's the right location.
//  2. Picks the source per the worker rules: local media/menus/<id>.pdf > a
//     menu_url on the restaurant's OWN domain > the restaurant website. Online
//     ordering / delivery PLATFORM urls are ignored (marked-up, not the real menu).
//  3. PDF (local file or .pdf url): runs `pdftotext -layout` FIRST.
//       - Enough text  -> prints the TEXT (near-zero image tokens vs reading pages
//         as JPEGs). Text-layer PDFs are exact (no OCR / downscale digit loss).
//       - Little/no text (image-only scan) -> rasterizes the menu pages to sized,
//         grayscale JPEGs (150dpi, <=1568px) in a temp dir and prints their paths
//         for the model to Read. Only then do we pay image tokens.
//     Detects MULTI-COLUMN layout (lines with 2+ prices) and warns, because
//     `pdftotext -layout` can mis-pair item<->price across columns — the model
//     should verify those against the page image.
//  4. HTML own-page: best-effort plain fetch + tag-strip to text (works for
//     server-rendered menus). If it looks empty / JS-rendered, says so — the
//     worker renders it with Playwright (web/node_modules) and reads innerText.
//
// The model still does the "does this make sense / does this map to our schema"
// pass on whatever this prints. This only makes GETTING the menu cheap.
import fs from "fs";
import { execFileSync } from "child_process";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const slug = process.argv[2];
if (!slug) {
  console.error("usage: node scraper/menu-fetch.js <slug>");
  process.exit(1);
}

const TMP = `scraper/.menu-tmp/${slug}`;
const MIN_TEXT_CHARS = 220; // below this a "PDF" is effectively an image scan
const MAX_RASTER_PAGES = 14;

// Platform hosts whose menus we never seed (marked-up prices, subset, platform combos).
const PLATFORM =
  /ubereats|uber\.com|doordash|menulog|deliveroo|order\.store|hungrypanda|bopple|mryum|yumbojumbo|tuckerfox|tapnorder|grubbio|ordereats/i;

const sh = (cmd, args) =>
  execFileSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

// same registrable-ish domain check: do the two urls share their last two labels?
function sameSite(a, b) {
  try {
    const host = (u) => new URL(u).hostname.replace(/^www\./, "");
    const tail = (h) => h.split(".").slice(-2).join(".");
    return tail(host(a)) === tail(host(b));
  } catch {
    return false;
  }
}

async function fetchTo(url, dest) {
  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return { buf, type: res.headers.get("content-type") || "" };
}

function reportPdf(pdfPath) {
  const info = sh("pdfinfo", [pdfPath]);
  const pages = Number((info.match(/^Pages:\s+(\d+)/m) || [])[1] || 0);
  let text = "";
  try {
    text = sh("pdftotext", ["-layout", pdfPath, "-"]);
  } catch {
    text = "";
  }
  const chars = text.replace(/\s/g, "").length;
  console.log(`\nPDF: ${pdfPath} — ${pages} page(s), ${chars} extractable text chars`);

  if (chars >= MIN_TEXT_CHARS) {
    // Column-scramble heuristic: lines carrying 2+ price tokens => side-by-side columns.
    const lines = text.split("\n").filter((l) => l.trim());
    const priceLine = (l) => (l.match(/\$\s?\d/g) || []).length >= 2;
    const multi = lines.filter(priceLine).length;
    const ratio = lines.length ? multi / lines.length : 0;
    console.log("SOURCE: text-layer PDF (read the text below, no image tokens).");
    if (ratio > 0.12)
      console.log(
        `⚠️  MULTI-COLUMN layout (${multi} lines have 2+ prices) — \`-layout\` can\n` +
          "    mis-pair item<->price across columns. Verify prices against the page\n" +
          `    image before trusting them: render with \`pdftoppm -jpeg -r 150 ${pdfPath} ${TMP}/p\`.`,
      );
    console.log("\n----- MENU TEXT -----\n" + text.trimEnd() + "\n----- END -----");
    return;
  }

  // Image-only scan: rasterize the menu pages, sized + grayscale, for the model to Read.
  console.log(
    "SOURCE: image-only PDF (no usable text layer) — rasterizing pages so the model reads them.",
  );
  fs.mkdirSync(TMP, { recursive: true });
  const n = Math.min(pages || 1, MAX_RASTER_PAGES);
  sh("pdftoppm", [
    "-jpeg", "-r", "150", "-gray", "-scale-to", "1568",
    "-f", "1", "-l", String(n), pdfPath, `${TMP}/p`,
  ]);
  const imgs = fs
    .readdirSync(TMP)
    .filter((f) => f.endsWith(".jpg"))
    .sort()
    .map((f) => `${TMP}/${f}`);
  console.log(`Read these ${imgs.length} page image(s):`);
  imgs.forEach((p) => console.log("  " + p));
  if (pages > n)
    console.log(`  (capped at ${n}/${pages} pages — re-run pdftoppm for the rest if needed)`);
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const { rows } = await pool.query(
    "select id, name, suburb, state, menu_url, website from restaurants where slug=$1",
    [slug],
  );
  await pool.end();
  if (!rows.length) {
    console.error(`slug "${slug}" not found in DB`);
    process.exit(1);
  }
  const r = rows[0];
  console.log(`${r.name} — ${r.suburb}, ${r.state} (id ${r.id})`);
  console.log(`⚠️  Verify the menu you seed is for THIS branch (${r.suburb}).`);
  console.log(`menu_url: ${r.menu_url || "(none)"}`);
  console.log(`website:  ${r.website || "(none)"}`);

  const localPdf = `media/menus/${r.id}.pdf`;
  const localBig = fs.existsSync(localPdf) && fs.statSync(localPdf).size > 2000;

  // 1. local downloaded PDF (skip tiny placeholder/logo files)
  if (localBig) {
    console.log(`\n> using local file ${localPdf}`);
    reportPdf(localPdf);
    return;
  }

  // decide the url: own-domain menu_url, else website. Never a platform url.
  const mu = r.menu_url;
  const muUsable = mu && !PLATFORM.test(mu) && (!r.website || sameSite(mu, r.website) || /\.pdf(\?|$)/i.test(mu));
  const target = muUsable ? mu : r.website;
  if (mu && PLATFORM.test(mu))
    console.log("\n> menu_url is an ordering PLATFORM — ignored (not the real menu).");
  if (!target) {
    console.log("\nNo own-site source. Find the menu on the website manually, or SKIP + log it.");
    return;
  }
  if (PLATFORM.test(target)) {
    console.log(
      `\n> fallback source ${target} is ALSO an ordering platform — no real own site.\n` +
        "  SKIP this restaurant (keep the claim lock) and log it in MENU-TAXONOMY-TODO.md.",
    );
    return;
  }

  fs.mkdirSync(TMP, { recursive: true });

  // 2. PDF url -> download + text-first
  if (/\.pdf(\?|$)/i.test(target)) {
    console.log(`\n> downloading PDF ${target}`);
    try {
      const dest = `${TMP}/menu.pdf`;
      await fetchTo(target, dest);
      reportPdf(dest);
    } catch (e) {
      console.log(`  download failed (${e.message}) — fetch it in the browser / Playwright.`);
    }
    return;
  }

  // 3. HTML page -> best-effort text (server-rendered). JS pages fall back to Playwright.
  console.log(`\n> fetching page ${target}`);
  try {
    const { buf, type } = await fetchTo(target, `${TMP}/page.html`);
    if (/pdf/i.test(type)) {
      const dest = `${TMP}/menu.pdf`;
      fs.writeFileSync(dest, buf);
      return reportPdf(dest);
    }
    const html = buf.toString("utf8");
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n\s*\n+/g, "\n\n")
      .trim();
    const hasPrices = (text.match(/\$\s?\d/g) || []).length;
    console.log(`fetched ${html.length} bytes HTML, ${text.length} text chars, ${hasPrices} price tokens.`);
    if (text.length < 400 || hasPrices < 3) {
      console.log(
        "⚠️  Looks empty / JS-rendered. Render with Playwright (web/node_modules) and read\n" +
          "    innerText of the menu container instead of this static HTML.",
      );
    }
    console.log("\n----- PAGE TEXT (strip; verify against the live page) -----\n" + text.slice(0, 20000) + "\n----- END -----");
  } catch (e) {
    console.log(`  fetch failed (${e.message}) — render with Playwright.`);
  }
}

main().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
