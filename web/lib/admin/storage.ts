import { mkdir, writeFile, unlink, rm, rmdir, readdir } from "node:fs/promises";
import path from "node:path";

// Local media store for the admin uploader. Files live under the shared project
// `media/` dir (same tree the scraper writes + the dev symlink web/public/media
// serves), keyed exactly like scraped photos so mediaUrl() resolves them in dev
// and R2 in prod. This is the ONE seam to swap for R2 later: replace the fs
// writes with an S3 PutObject and keep the same storage_key contract.
const MEDIA_ROOT = path.resolve(process.cwd(), "..", "media");

function safeExt(filename: string, fallback: string): string {
  const ext = path.extname(filename).toLowerCase().replace(/[^.a-z0-9]/g, "");
  return ext || fallback;
}

// Build a collision-free storage_key. `up-<ts>` avoids clobbering the scraper's
// numeric keys (photos/<id>/0.webp). e.g. photos/123/up-1718900000000.jpg
export function photoKey(restaurantId: number, filename: string): string {
  return `photos/${restaurantId}/up-${Date.now()}${safeExt(filename, ".jpg")}`;
}

// A short random suffix keeps keys unique when several files are uploaded in the
// same millisecond (multi-file menu upload), so none clobber each other on disk.
export function menuKey(restaurantId: number, filename: string): string {
  const rand = Math.random().toString(36).slice(2, 6);
  return `menus/${restaurantId}/menu-${Date.now()}-${rand}${safeExt(filename, ".pdf")}`;
}

export function logoKey(restaurantId: number, filename: string): string {
  return `logos/${restaurantId}/logo-${Date.now()}${safeExt(filename, ".png")}`;
}

// Write a buffer to media/<key>, creating parent dirs. Returns the key unchanged.
export async function saveMedia(key: string, data: Buffer): Promise<string> {
  const dest = path.join(MEDIA_ROOT, key);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, data);
  return key;
}

// List every on-disk menu file for a restaurant: the per-restaurant folder
// (menus/<id>/menu-*.ext) plus any legacy flat file (menus/<id>.<ext>). Returns
// storage keys, folder files first, sorted. We read the filesystem rather than a
// DB table since uploaded menus are just stored for a later parsing pass.
export async function listMenuFiles(restaurantId: number): Promise<string[]> {
  const keys: string[] = [];
  try {
    const files = await readdir(path.join(MEDIA_ROOT, "menus", String(restaurantId)));
    for (const f of files.sort()) keys.push(`menus/${restaurantId}/${f}`);
  } catch {
    /* no per-restaurant folder */
  }
  try {
    const flat = new RegExp(`^${restaurantId}\\.[a-z0-9]+$`, "i");
    const entries = await readdir(path.join(MEDIA_ROOT, "menus"));
    for (const e of entries) if (flat.test(e)) keys.push(`menus/${e}`);
  } catch {
    /* no menus dir */
  }
  return keys;
}

// True if a storage key is one of this restaurant's menu files (guards deletes
// against arbitrary-path removal): menus/<id>/... or menus/<id>.<ext>.
export function isOwnMenuKey(restaurantId: number, key: string): boolean {
  return (
    key.startsWith(`menus/${restaurantId}/`) ||
    new RegExp(`^menus/${restaurantId}\\.[a-z0-9]+$`, "i").test(key)
  );
}

// Best-effort delete; ignores a missing file so callers stay idempotent. Also
// removes the parent dir if it's now empty (rmdir only succeeds when empty), so
// per-photo/logo/menu deletes don't leave behind empty <id>/ folders.
export async function deleteMedia(key: string): Promise<void> {
  const full = path.join(MEDIA_ROOT, key);
  try {
    await unlink(full);
  } catch {
    /* already gone */
  }
  try {
    await rmdir(path.dirname(full));
  } catch {
    /* dir not empty or missing */
  }
}

// Remove ALL on-disk media for a restaurant so files don't outlive the deleted
// row (restaurant_photos rows cascade in the DB, but the files on disk would
// not). Sweeps BOTH layouts in each category: the per-restaurant folder
// (<cat>/<id>/...) and any legacy flat file (<cat>/<id>.<ext>). Keyed by id, so
// it also catches stray files not tracked in any table.
export async function removeRestaurantMedia(restaurantId: number): Promise<void> {
  const cats = ["photos", "menus", "logos"];
  const jobs: Promise<unknown>[] = [];
  for (const cat of cats) {
    // per-restaurant folder
    jobs.push(rm(path.join(MEDIA_ROOT, cat, String(restaurantId)), { recursive: true, force: true }));
    // legacy flat files <cat>/<id>.<ext>
    jobs.push(
      (async () => {
        const flat = new RegExp(`^${restaurantId}\\.[a-z0-9]+$`, "i");
        try {
          const entries = await readdir(path.join(MEDIA_ROOT, cat));
          await Promise.all(
            entries
              .filter((e) => flat.test(e))
              .map((e) => rm(path.join(MEDIA_ROOT, cat, e), { force: true }))
          );
        } catch {
          /* category dir missing */
        }
      })()
    );
  }
  await Promise.all(jobs);
}
