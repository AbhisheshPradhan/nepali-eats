// Single source of truth for the site's absolute URL (canonicals, sitemap,
// OG tags, email links). Comes from NEXT_PUBLIC_SITE_URL ONLY — never hardcode
// a hostname next to a usage (decided 2026-07-08: swapping the launch domain
// must be a one-line env change in Vercel, nothing else). The localhost
// fallback exists so a missing env var is obvious in dev, not silently wrong.
// Trailing slashes are stripped so `${SITE}/path` never yields "//path"
// (a trailing slash in the Vercel env var briefly shipped double-slash
// sitemap URLs on launch day, 2026-07-10).
export const SITE = (
	process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/+$/, "");
