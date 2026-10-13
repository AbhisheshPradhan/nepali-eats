// Dev: NEXT_PUBLIC_MEDIA_BASE unset -> "/media" (web/public/media symlink).
// Prod: set it to the R2 public domain. storage_key stays identical either way.
const BASE = process.env.NEXT_PUBLIC_MEDIA_BASE || "/media";

// R2 photos are already resized WebPs (scraper pipeline) served via Cloudflare
// with free egress, so every next/image rendering one passes `unoptimized`:
// the Vercel optimizer added nothing but quota burn (5K/month on Hobby).
// Images under /public (food heroes) still go through the optimizer.
export function mediaUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  return `${BASE}/${key}`;
}
