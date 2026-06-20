// Dev: NEXT_PUBLIC_MEDIA_BASE unset -> "/media" (web/public/media symlink).
// Prod: set it to the R2 public domain. storage_key stays identical either way.
const BASE = process.env.NEXT_PUBLIC_MEDIA_BASE || "/media";

export function mediaUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  return `${BASE}/${key}`;
}
