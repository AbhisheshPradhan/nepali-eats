import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { setPrimaryPhoto, deletePhotoRow } from "@/lib/admin/queries";
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

// DELETE -> hard-remove the row and its file on disk.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const blocked = await requireAdmin();
  if (blocked) return blocked;

  const id = Number((await params).id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const key = await deletePhotoRow(id);
  if (key) await deleteMedia(key);
  return NextResponse.json({ ok: true });
}
