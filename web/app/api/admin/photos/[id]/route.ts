import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import {
  setPrimaryPhoto,
  deletePhotoRow,
  getPhotoMedia,
  getCoverKeyById,
  replacePhotoFile,
  setCoverKeyById,
} from "@/lib/admin/queries";
import { saveMedia, deleteMedia, photoKey } from "@/lib/admin/storage";

// PUT (multipart, field "file") -> replace this photo's file with a re-cropped
// version. Writes a fresh key, repoints the row, follows the cover if it pointed
// at the old file, then deletes the old file. Returns the new storage key.
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const blocked = await requireAdmin();
  if (blocked) return blocked;

  const id = Number((await params).id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const photo = await getPhotoMedia(id);
  if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Image file required" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const newKey = await saveMedia(photoKey(photo.restaurantId, file.name), buf);
  const res = await replacePhotoFile(id, newKey);
  if (!res) {
    await deleteMedia(newKey);
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }
  // Keep the cover following the re-crop if it pointed at this photo's file.
  if ((await getCoverKeyById(res.restaurantId)) === res.oldKey) {
    await setCoverKeyById(res.restaurantId, newKey);
  }
  if (res.oldKey && res.oldKey !== newKey) await deleteMedia(res.oldKey);

  return NextResponse.json({ ok: true, storageKey: newKey });
}

// PATCH { primary: true } -> make this photo the restaurant's primary.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const blocked = await requireAdmin();
  if (blocked) return blocked;

  const id = Number((await params).id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  if (body.primary) await setPrimaryPhoto(id);
  return NextResponse.json({ ok: true });
}

// DELETE -> hard-remove the row and its file on disk. EXCEPTION: if this photo is
// the restaurant's current cover (cover_key points at its file), keep it — the
// cover is a pointer to this gallery file, so deleting it would orphan the cover.
// We return { keptAsCover: true } so the caller can leave it in place and nudge
// the user to change the cover first.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const blocked = await requireAdmin();
  if (blocked) return blocked;

  const id = Number((await params).id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const photo = await getPhotoMedia(id);
  if (photo) {
    const coverKey = await getCoverKeyById(photo.restaurantId);
    if (coverKey && coverKey === photo.storageKey) {
      return NextResponse.json({ ok: true, keptAsCover: true });
    }
  }

  const key = await deletePhotoRow(id);
  if (key) await deleteMedia(key);
  return NextResponse.json({ ok: true });
}
