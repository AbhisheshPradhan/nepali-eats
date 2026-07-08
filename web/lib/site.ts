// Single source of truth for the site's absolute URL (canonicals, sitemap,
// OG tags, email links). Comes from NEXT_PUBLIC_SITE_URL ONLY — never hardcode
// a hostname next to a usage (decided 2026-07-08: swapping the launch domain
// must be a one-line env change in Vercel, nothing else). The localhost
// fallback exists so a missing env var is obvious in dev, not silently wrong.
export const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
