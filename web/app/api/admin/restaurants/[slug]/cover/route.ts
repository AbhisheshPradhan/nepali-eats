import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { getRestaurantIdBySlug, updateRestaurantFields } from "@/lib/admin/queries";
import { getCardBySlug } from "@/lib/queries";
import { saveMedia, deleteMedia, coverKey } from "@/lib/admin/storage";

// POST a standalone cover/hero photo (multipart, field "file"). Stores under
// media/covers/<id>/ and points cover_key at the storage_key, marking it an
// uploaded photo (cover_source='upload'). DELETE clears the cover.
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
