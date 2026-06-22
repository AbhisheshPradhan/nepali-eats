import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { getRestaurantIdBySlug, updateRestaurantFields } from "@/lib/admin/queries";
import { getCardBySlug } from "@/lib/queries";
import { saveMedia, deleteMedia, logoKey } from "@/lib/admin/storage";

// POST a brand logo (multipart, field "file"; image incl. SVG). Stores under
// media/logos/<id>/ and points logo_key at the storage_key. Replaces any prior
// logo file. DELETE clears logo_key and removes the file.
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

  // remove the previous logo file so it doesn't linger orphaned
  const prev = (await getCardBySlug(slug))?.logoKey;
  const buf = Buffer.from(await file.arrayBuffer());
  const key = await saveMedia(logoKey(id, file.name), buf);
  const restaurant = await updateRestaurantFields(slug, { logoKey: key });
  if (prev && prev !== key) await deleteMedia(prev);

  return NextResponse.json({ ok: true, logoKey: key, restaurant });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const blocked = await requireAdmin();
  if (blocked) return blocked;

  const { slug } = await params;
  const prev = (await getCardBySlug(slug))?.logoKey;
  await updateRestaurantFields(slug, { logoKey: "" });
  if (prev) await deleteMedia(prev);
  return NextResponse.json({ ok: true });
}
