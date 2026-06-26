import path from "node:path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

// Media store for the admin uploader: Cloudflare R2 (S3 API). Keys are identical
// to the scraper's (photos/<id>/..., covers/<id>/..., logos/<id>/..., menus/<id>/...)
// so mediaUrl() resolves the same object whether read from the local dev symlink
// or R2 in prod. R2 + Neon are the source of truth; these are the write-path ops.
//
// Server-side only (never NEXT_PUBLIC): R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
// R2_S3_API (or R2_ACCOUNT_ID), R2_BUCKET. Set them in web/.env* and on Vercel.

const BUCKET = process.env.R2_BUCKET || "";

// Endpoint must be the bare account host (no bucket path). Cloudflare shows the
// S3 API as ".../<bucket>", so strip any path; the bucket is passed per-command.
function endpoint(): string {
  const api = process.env.R2_S3_API;
  if (api) return api.replace(/^(https?:\/\/[^/]+).*$/, "$1");
  const acct = process.env.R2_ACCOUNT_ID;
  if (acct) return `https://${acct}.r2.cloudflarestorage.com`;
  return "";
}

let _s3: S3Client | null = null;
function s3(): S3Client {
  if (_s3) return _s3;
  const ep = endpoint();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
  if (!ep || !BUCKET || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 not configured: set R2_S3_API (or R2_ACCOUNT_ID), R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY",
    );
  }
  _s3 = new S3Client({
    region: "auto", // R2 ignores region but the SDK requires one
    endpoint: ep,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _s3;
}

// Map an extension to a Content-Type so R2 serves the object correctly (R2 won't
// sniff it from bytes). Mirrors the types present in media/.
const MIME: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
};
function contentType(key: string): string {
  return MIME[path.extname(key).toLowerCase()] || "application/octet-stream";
}

function safeExt(filename: string, fallback: string): string {
  const ext = path.extname(filename).toLowerCase().replace(/[^.a-z0-9]/g, "");
  return ext || fallback;
}

// --- key builders (unchanged contract: <category>/<id>/<name>.<ext>) ----------

// Build a collision-free storage_key. `up-<ts>` avoids clobbering the scraper's
// numeric keys (photos/<id>/0.webp). e.g. photos/123/up-1718900000000.jpg
export function photoKey(restaurantId: number, filename: string): string {
  return `photos/${restaurantId}/up-${Date.now()}${safeExt(filename, ".jpg")}`;
}

// A short random suffix keeps keys unique when several files are uploaded in the
// same millisecond (multi-file menu upload), so none clobber each other.
export function menuKey(restaurantId: number, filename: string): string {
  const rand = Math.random().toString(36).slice(2, 6);
  return `menus/${restaurantId}/menu-${Date.now()}-${rand}${safeExt(filename, ".pdf")}`;
}

export function logoKey(restaurantId: number, filename: string): string {
  return `logos/${restaurantId}/logo-${Date.now()}${safeExt(filename, ".png")}`;
}

export function coverKey(restaurantId: number, filename: string): string {
  return `covers/${restaurantId}/cover-${Date.now()}${safeExt(filename, ".jpg")}`;
}

// --- R2 object ops (same signatures as the old fs versions) -------------------

// Upload a buffer to <key> (Content-Type from extension). Returns the key.
export async function saveMedia(key: string, data: Buffer): Promise<string> {
  await s3().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: data,
      ContentType: contentType(key),
    }),
  );
  return key;
}

// Read an object back from R2 (server-side, no browser CORS). Used by the admin
// media proxy so the cropper can load an existing photo same-origin instead of
// hitting the cross-origin R2 public domain (which sends no CORS headers, so a
// direct <img crossOrigin> load + canvas export is blocked). Returns null if missing.
export async function getMedia(
  key: string,
): Promise<{ body: Buffer; contentType: string } | null> {
  try {
    const res = await s3().send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    if (!res.Body) return null;
    const bytes = await res.Body.transformToByteArray();
    return { body: Buffer.from(bytes), contentType: res.ContentType || contentType(key) };
  } catch {
    return null;
  }
}

// Server-side copy <srcKey> -> <destKey>. Used when promoting a gallery photo (or
// cover) into the cover/logo folder so the new role owns its own object and
// survives deletion of the source. Returns the dest key.
export async function copyMedia(srcKey: string, destKey: string): Promise<string> {
  await s3().send(
    new CopyObjectCommand({
      Bucket: BUCKET,
      // CopySource must be "<bucket>/<key>", URL-encoded.
      CopySource: encodeURI(`${BUCKET}/${srcKey}`),
      Key: destKey,
      ContentType: contentType(destKey),
      MetadataDirective: "REPLACE",
    }),
  );
  return destKey;
}

// List every object key under a prefix, following pagination.
async function listKeys(prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const res = await s3().send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken: token }),
    );
    for (const o of res.Contents ?? []) if (o.Key) keys.push(o.Key);
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

// Every menu file for a restaurant: the per-restaurant folder (menus/<id>/menu-*)
// plus any legacy flat file (menus/<id>.<ext>). Returns storage keys, folder
// files first, sorted. We list R2 rather than a DB table since uploaded menus are
// just stored for a later parsing pass.
export async function listMenuFiles(restaurantId: number): Promise<string[]> {
  const folder = (await listKeys(`menus/${restaurantId}/`)).sort();
  // Flat legacy files share the `menus/<id>` prefix but must match exactly
  // menus/<id>.<ext> (not menus/<id>0/...), so filter by regex.
  const flat = new RegExp(`^menus/${restaurantId}\\.[a-z0-9]+$`, "i");
  const legacy = (await listKeys(`menus/${restaurantId}.`)).filter((k) => flat.test(k)).sort();
  return [...folder, ...legacy];
}

// True if a storage key is one of this restaurant's menu files (guards deletes
// against arbitrary-path removal): menus/<id>/... or menus/<id>.<ext>.
export function isOwnMenuKey(restaurantId: number, key: string): boolean {
  return (
    key.startsWith(`menus/${restaurantId}/`) ||
    new RegExp(`^menus/${restaurantId}\\.[a-z0-9]+$`, "i").test(key)
  );
}

// Best-effort delete; a missing object is not an error, so callers stay idempotent.
export async function deleteMedia(key: string): Promise<void> {
  if (!key) return;
  await s3().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

// Delete up to 1000 keys per DeleteObjects call.
async function deleteKeys(keys: string[]): Promise<void> {
  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);
    if (!batch.length) continue;
    await s3().send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
      }),
    );
  }
}

// Remove ALL R2 media for a restaurant so objects don't outlive the deleted row
// (restaurant_photos rows cascade in the DB, but R2 objects would not). Sweeps
// every category (incl. covers, which the old fs version missed) in BOTH layouts:
// the per-restaurant folder (<cat>/<id>/...) and legacy flat files (<cat>/<id>.<ext>).
export async function removeRestaurantMedia(restaurantId: number): Promise<void> {
  const cats = ["photos", "menus", "logos", "covers"];
  const all: string[] = [];
  for (const cat of cats) {
    all.push(...(await listKeys(`${cat}/${restaurantId}/`)));
    const flat = new RegExp(`^${cat}/${restaurantId}\\.[a-z0-9]+$`, "i");
    all.push(...(await listKeys(`${cat}/${restaurantId}.`)).filter((k) => flat.test(k)));
  }
  await deleteKeys(all);
}
