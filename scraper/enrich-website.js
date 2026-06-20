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

// Phase 2 — website pass. For each restaurant with a website: extract email
// (incl. Cloudflare cfemail decode) + socials (fb/ig/tiktok/whatsapp) + phone,
// download own-site photos (og:image + gallery), and discover/download the menu
// file (pdf/image) or ordering link. curl-first via proxy, Playwright fallback.
// Resumable: targets website_checked_at IS NULL.

const CONCURRENCY = Number(process.env.CONCURRENCY || 10);
const MAX_SITE_PHOTOS = Number(process.env.MAX_SITE_PHOTOS || 4);
const MEDIA = "media";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const rawProxies = (process.env.WEBSHARE_PROXIES || "").split(",").map((s) => s.trim()).filter(Boolean);
let pi = 0; const nextProxy = () => rawProxies[pi++ % rawProxies.length];
const pwProxy = (raw) => { const x = new URL(raw); return { server: `${x.protocol}//${x.hostname}:${x.port}`, username: decodeURIComponent(x.username), password: decodeURIComponent(x.password) }; };

const decodeCfemail = (hex) => {
  try { const k = parseInt(hex.substr(0, 2), 16); let s = "";
    for (let i = 2; i < hex.length; i += 2) s += String.fromCharCode(parseInt(hex.substr(i, 2), 16) ^ k);
    return s; } catch { return null; }
};
const JUNK_EMAIL = /sentry|wixpress|\.png|\.jpg|\.gif|example\.(com|org)|yourdomain|domain\.com|godaddy|@sentry|placeholder|@2x/i;
const cleanUrl = (u) => u.replace(/[)"'<>\\]+$/, "").trim();

function extractFromHtml(html, baseUrl) {
  const out = { socials: {}, gallery: [] };
  const emails = new Set();
  for (const m of html.matchAll(/mailto:([^"'?>\s]+)/gi)) emails.add(decodeURIComponent(m[1]));
  for (const m of html.matchAll(/data-cfemail="([a-f0-9]+)"/gi)) { const d = decodeCfemail(m[1]); if (d) emails.add(d); }
  for (const m of html.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)) emails.add(m[0]);
  out.email = [...emails].map((e) => e.toLowerCase()).find((e) => !JUNK_EMAIL.test(e) && e.length < 60) || null;

  const grab = (re, drop) => { for (const m of html.matchAll(re)) { const u = cleanUrl(m[0]); if (!drop || !drop.test(u)) return u; } return null; };
  out.socials.facebook = grab(/https?:\/\/(?:www\.)?facebook\.com\/[^\s"'<>)]+/gi, /sharer|\/plugins|facebook\.com\/tr|\/dialog|\/share/i);
  out.socials.instagram = grab(/https?:\/\/(?:www\.)?instagram\.com\/[^\s"'<>)]+/gi, /\/p\/|\/embed|accounts\//i);
  out.socials.tiktok = grab(/https?:\/\/(?:www\.)?tiktok\.com\/@[^\s"'<>)]+/gi);
  out.socials.whatsapp = grab(/https?:\/\/(?:wa\.me|api\.whatsapp\.com)\/[^\s"'<>)]+/gi);
  const tel = html.match(/tel:([+0-9()\s-]{7,}\d)/i); if (tel) out.phone = tel[1].trim();

  // og:image (both attr orders)
  out.ogImage = (html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i))?.[1] || null;
  // gallery imgs (skip logos/icons/svg)
  const seen = new Set();
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+\.(?:jpe?g|png|webp)[^"']*)/gi)) {
    let src = m[1]; if (/logo|icon|sprite|favicon|spinner|loader|avatar|badge/i.test(src)) continue;
    try { src = new URL(src, baseUrl).href; } catch { continue; }
    if (!seen.has(src)) { seen.add(src); out.gallery.push(src); }
  }
  if (out.ogImage) { try { out.ogImage = new URL(out.ogImage, baseUrl).href; } catch {} }

  // menu discovery
  const ordering = grab(/https?:\/\/[^\s"'<>)]*(?:ubereats|uber\.com\/[^\s"']*food|menulog|doordash|deliveroo|order\.store|hungrypanda|bopple|mryum|order\.online)[^\s"'<>)]*/gi);
  const pdf = grab(new RegExp(`https?://[^\\s"'<>)]+\\.pdf`, "gi")) || (html.match(/href=["']([^"']+\.pdf)/i) ? new URL(html.match(/href=["']([^"']+\.pdf)/i)[1], baseUrl).href : null);
  const menuPage = (html.match(/href=["']([^"']*menu[^"']*)["']/i)?.[1]);
  if (ordering) { out.menuUrl = ordering; out.menuSource = "ordering"; }
  else if (pdf && /menu/i.test(pdf)) { out.menuUrl = pdf; out.menuSource = "pdf"; }
  else if (pdf) { out.menuUrl = pdf; out.menuSource = "pdf"; }
  else if (menuPage) { try { out.menuUrl = new URL(menuPage, baseUrl).href; out.menuSource = "page"; } catch {} }
  return out;
}

async function curlGet(url) {
  const { stdout } = await exec("curl", ["-sL", "--max-time", "25", "-x", nextProxy(), "-A", UA, url],
    { encoding: "buffer", maxBuffer: 30 * 1024 * 1024 });
  return stdout;
}
async function downloadImage(url, destNoExt) {
  const buf = await curlGet(url);
  if (!buf || buf.length < 2500) throw new Error("tiny");
  const { data, info } = await sharp(buf).resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
  await fs.promises.writeFile(`${destNoExt}.webp`, data);
  return { width: info.width, height: info.height };
}

async function getViaPlaywright(url) {
  const browser = await chromium.launch({ headless: true, proxy: pwProxy(nextProxy()), args: ["--no-sandbox"] });
  try {
    const page = await (await browser.newContext({ locale: "en-AU", userAgent: UA })).newPage();
    await page.route("**/*", (r) => ["image", "media", "font"].includes(r.request().resourceType()) ? r.abort() : r.continue());
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1500);
    const html = await page.content();
    await browser.close();
    return html;
  } catch { await browser.close().catch(() => {}); return null; }
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const { rows: todo } = await pool.query(
    `SELECT id, website FROM restaurants WHERE website IS NOT NULL AND website_checked_at IS NULL
     ${process.env.LIMIT ? `LIMIT ${Number(process.env.LIMIT)}` : ""}`);
  console.log(`${todo.length} sites to scrape, concurrency=${CONCURRENCY}`);

  let i = 0, done = 0, gotEmail = 0, gotSocial = 0, gotPhoto = 0, gotMenu = 0;
  async function worker() {
    while (i < todo.length) {
      const rec = todo[i++];
      const base = rec.website.startsWith("http") ? rec.website : "https://" + rec.website;
      let data = null;
      try {
        let html = (await curlGet(base))?.toString("utf8");
        let d = html ? extractFromHtml(html, base) : null;
        // try contact pages if no email/socials yet
        if (d && !d.email && !d.socials.facebook && !d.socials.instagram) {
          for (const sub of ["/contact", "/contact-us", "/about"]) {
            try { const h2 = (await curlGet(new URL(sub, base).href))?.toString("utf8");
              if (h2) { const d2 = extractFromHtml(h2, base);
                d.email = d.email || d2.email; for (const k in d2.socials) d.socials[k] = d.socials[k] || d2.socials[k];
                d.menuUrl = d.menuUrl || d2.menuUrl; d.menuSource = d.menuSource || d2.menuSource;
                if (d.email || d.socials.facebook || d.socials.instagram) break; } } catch {}
          }
        }
        // Playwright fallback if curl found nothing useful (likely JS-rendered)
        if (!d || (!d.email && !d.socials.facebook && !d.socials.instagram && !d.ogImage)) {
          const html2 = await getViaPlaywright(base);
          if (html2) d = extractFromHtml(html2, base);
        }
        data = d;
      } catch {}
      done++;

      if (data) {
        const s = data.socials;
        await pool.query(
          `UPDATE restaurants SET
             email=COALESCE(email,$2), phone=COALESCE(phone,$3),
             facebook=COALESCE(facebook,$4), instagram=COALESCE(instagram,$5),
             tiktok=COALESCE(tiktok,$6), whatsapp=COALESCE(whatsapp,$7),
             menu_url=COALESCE(menu_url,$8), menu_source=COALESCE(menu_source,$9),
             website_checked_at=now(), updated_at=now()
           WHERE id=$1`,
          [rec.id, data.email, data.phone || null, s.facebook, s.instagram, s.tiktok, s.whatsapp,
           data.menuUrl || null, data.menuSource || null]);
        if (data.email) gotEmail++;
        if (s.facebook || s.instagram || s.tiktok || s.whatsapp) gotSocial++;
        if (data.menuUrl) gotMenu++;

        // own-site photos: og:image first, then a few gallery
        const imgs = [...new Set([data.ogImage, ...data.gallery].filter(Boolean))].slice(0, MAX_SITE_PHOTOS);
        if (imgs.length) {
          const { rows: ex } = await pool.query(`SELECT COALESCE(max(position),-1) m FROM restaurant_photos WHERE restaurant_id=$1`, [rec.id]);
          let pos = ex[0].m + 1; let any = false;
          const dir = path.join(MEDIA, "photos", String(rec.id));
          await fs.promises.mkdir(dir, { recursive: true });
          for (const url of imgs) {
            try { const key = path.join("photos", String(rec.id), String(pos));
              const dim = await downloadImage(url, path.join(MEDIA, key));
              await pool.query(
                `INSERT INTO restaurant_photos (restaurant_id, storage_key, source, source_url, attribution, width, height, position, is_primary)
                 VALUES ($1,$2,'website',$3,'Restaurant website',$4,$5,$6,$7)
                 ON CONFLICT (restaurant_id, storage_key) DO NOTHING`,
                [rec.id, key + ".webp", url, dim.width, dim.height, pos, pos === 0]);
              pos++; any = true;
            } catch {}
          }
          if (any) gotPhoto++;
        }
        // download menu pdf/image file
        if (data.menuUrl && (data.menuSource === "pdf" || /\.(pdf|jpe?g|png)$/i.test(data.menuUrl))) {
          try { const buf = await curlGet(data.menuUrl);
            if (buf && buf.length > 3000) {
              const ext = data.menuUrl.match(/\.(pdf|jpe?g|png)/i)?.[1] || "pdf";
              const mdir = path.join(MEDIA, "menus"); await fs.promises.mkdir(mdir, { recursive: true });
              await fs.promises.writeFile(path.join(mdir, `${rec.id}.${ext}`), buf);
            } } catch {}
        }
      } else {
        await pool.query(`UPDATE restaurants SET website_checked_at=now() WHERE id=$1`, [rec.id]);
      }
      if (done % 20 === 0 || done === todo.length)
        console.log(`  ${done}/${todo.length} | ${gotEmail} email | ${gotSocial} social | ${gotPhoto} photos | ${gotMenu} menu`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const { rows } = await pool.query(
    `SELECT count(email) email, count(facebook) fb, count(instagram) ig, count(tiktok) tt, count(whatsapp) wa, count(menu_url) menu FROM restaurants`);
  console.log("\nDone."); console.table(rows[0]);
  await pool.end();
}
main();
