import { NextResponse } from "next/server";
import { deleteRestaurantBySlug } from "@/lib/queries";
import { updateRestaurantFields } from "@/lib/admin/queries";
import { removeRestaurantMedia } from "@/lib/admin/storage";
import { blockInProd } from "@/lib/admin/guard";

// LOCAL-ONLY admin endpoint (404s in production via blockInProd). Edits a
// restaurant's fields/hours/menu link (PATCH) or deletes it + its media (DELETE).

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const blocked = blockInProd();
  if (blocked) return blocked;

  const { slug } = await params;
  const patch = await request.json();
  const updated = await updateRestaurantFields(slug, patch);
  if (!updated) {
    return NextResponse.json({ error: "Not found or no valid fields" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, restaurant: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const blocked = blockInProd();
  if (blocked) return blocked;

  const { slug } = await params;
  const deleted = await deleteRestaurantBySlug(slug);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Purge the row's on-disk photos/menus so files don't outlive the record.
  await removeRestaurantMedia(deleted.id);
  return NextResponse.json({ ok: true, name: deleted.name });
}
