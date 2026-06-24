import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import {
  getRestaurantIdBySlug,
  getPhotoMedia,
  updateRestaurantFields,
} from "@/lib/admin/queries";
import { getCardBySlug } from "@/lib/queries";
import { saveMedia, deleteMedia, coverKey } from "@/lib/admin/storage";

// POST a standalone cover/hero photo. Two shapes:
//   - multipart (field "file"): upload a new cover, stored under media/covers/<id>/
//     and marked cover_source='upload'.
//   - JSON { fromPhotoId }: promote an existing gallery photo to cover, copying
//     its storage_key/source/attribution (no new file written).
// Either way cover_key points at the lead image; DELETE clears the cover.
//
// We only ever delete the PREVIOUS cover file when it lives under covers/ (a
// prior upload). Backfilled covers point into photos/<id>/ — files that are (or
// were) gallery photos — so deleting them could orphan a gallery row or remove
// the only copy; we leave those on disk.
function ownsCoverFile(key: string | null | undefined): key is string {
  return !!key && key.startsWith("covers/");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const blocked = await requireAdmin();
  if (blocked) return blocked;

  const { slug } = await params;
  const id = await getRestaurantIdBySlug(slug);
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Promote an existing gallery photo to cover (no upload).
  if ((request.headers.get("content-type") || "").includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    const fromPhotoId = Number(body.fromPhotoId);
    if (!Number.isFinite(fromPhotoId)) {
      return NextResponse.json({ error: "fromPhotoId required" }, { status: 400 });
    }
    const photo = await getPhotoMedia(fromPhotoId);
    if (!photo || photo.restaurantId !== id) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }
    const prev = (await getCardBySlug(slug))?.coverKey;
    const restaurant = await updateRestaurantFields(slug, {
      coverKey: photo.storageKey,
      coverSource: photo.source ?? "",
      coverAttribution: photo.attribution ?? "",
    });
    if (ownsCoverFile(prev) && prev !== photo.storageKey) await deleteMedia(prev);
    return NextResponse.json({ ok: true, coverKey: photo.storageKey, restaurant });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Image file required" }, { status: 400 });
  }

  const prev = (await getCardBySlug(slug))?.coverKey;
  const buf = Buffer.from(await file.arrayBuffer());
  const key = await saveMedia(coverKey(id, file.name), buf);
  const restaurant = await updateRestaurantFields(slug, {
    coverKey: key,
    coverSource: "upload",
    coverAttribution: "",
  });
  if (ownsCoverFile(prev) && prev !== key) await deleteMedia(prev);

  return NextResponse.json({ ok: true, coverKey: key, restaurant });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const blocked = await requireAdmin();
  if (blocked) return blocked;

  const { slug } = await params;
  const prev = (await getCardBySlug(slug))?.coverKey;
  await updateRestaurantFields(slug, {
    coverKey: "",
    coverSource: "",
    coverAttribution: "",
  });
  if (ownsCoverFile(prev)) await deleteMedia(prev);
  return NextResponse.json({ ok: true });
}
