import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import {
  getRestaurantIdBySlug,
  addPhoto,
  getPhotosForAdmin,
  reorderPhotos,
} from "@/lib/admin/queries";
import { saveMedia, photoKey } from "@/lib/admin/storage";

// POST a photo (multipart, field "file"; repeatable). Stores under media/, then
// inserts a restaurant_photos row. Returns the refreshed photo list.
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

  for (const file of files) {
    if (!file.type.startsWith("image/")) continue; // images only
    const buf = Buffer.from(await file.arrayBuffer());
    const key = await saveMedia(photoKey(id, file.name), buf);
    await addPhoto(id, key, { source: "upload" });
  }

  return NextResponse.json({ ok: true, photos: await getPhotosForAdmin(id) });
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
