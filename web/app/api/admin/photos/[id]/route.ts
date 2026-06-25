import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import {
  setPrimaryPhoto,
  deletePhotoRow,
  getPhotoMedia,
  getCoverKeyById,
} from "@/lib/admin/queries";
import { deleteMedia } from "@/lib/admin/storage";

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
