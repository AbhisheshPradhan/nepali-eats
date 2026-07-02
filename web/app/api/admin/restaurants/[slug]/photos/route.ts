import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import {
  getRestaurantIdBySlug,
  addPhoto,
  getPhotosForAdmin,
  reorderPhotos,
} from "@/lib/admin/queries";
import { saveMedia, photoKey } from "@/lib/admin/storage";

// Per-file cap. Vercel's ~4.5MB request-body limit is the real ceiling; this
// gives a clear per-file signal instead of an opaque 413.
const MAX_BYTES = 8 * 1024 * 1024;

// POST a photo (multipart, field "file"; repeatable). Stores under media/, then
// inserts a restaurant_photos row. Returns the refreshed photo list plus the
// names of any files skipped (non-image or oversized), so the client can say so.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const blocked = await requireAdmin();
  if (blocked) return blocked;

  const { slug } = await params;
  const id = await getRestaurantIdBySlug(slug);
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await request.formData();
  const files = form.getAll("file").filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ error: "No file" }, { status: 400 });

  const skipped: string[] = [];
  for (const file of files) {
    if (!file.type.startsWith("image/") || file.size > MAX_BYTES) {
      skipped.push(file.name);
      continue;
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const key = await saveMedia(photoKey(id, file.name), buf);
    await addPhoto(id, key, { source: "upload" });
  }

  return NextResponse.json({ ok: true, skipped, photos: await getPhotosForAdmin(id) });
}

// PATCH { order: number[] } -> persist a new photo order (positions). Returns
// the refreshed photo list.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const blocked = await requireAdmin();
  if (blocked) return blocked;

  const { slug } = await params;
  const id = await getRestaurantIdBySlug(slug);
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as { order?: unknown };
  if (!Array.isArray(body.order) || body.order.some((n) => typeof n !== "number")) {
    return NextResponse.json({ error: "Expected { order: number[] }" }, { status: 400 });
  }
  await reorderPhotos(id, body.order as number[]);
  return NextResponse.json({ ok: true, photos: await getPhotosForAdmin(id) });
}
