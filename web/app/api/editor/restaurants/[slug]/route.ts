import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { deleteRestaurantBySlug } from "@/lib/queries";
import { updateRestaurantFields } from "@/lib/admin/queries";
import { removeRestaurantMedia } from "@/lib/admin/storage";
import { requireAdmin } from "@/lib/admin/guard";
import {
  requireEditorBySlug,
  filterOwnerPatch,
  invalidLinkField,
} from "@/lib/editor/guard";

// SHARED editor endpoint (/api/editor): PATCH is admin OR verified owner of
// this restaurant (owners get a field allowlist — see filterOwnerPatch);
// DELETE stays strictly admin. The /api/admin twin re-exports these handlers
// so the edge-gated admin tools keep their URLs.

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const gate = await requireEditorBySlug(slug);
  if (gate instanceof NextResponse) return gate;

  let patch = await request.json();
  // owners edit a restricted field set; admins pass through unfiltered
  if (!gate.isAdmin) patch = filterOwnerPatch(patch);
  // link fields end up as raw hrefs on the public page: web URLs only
  const badLink = invalidLinkField(patch);
  if (badLink)
    return NextResponse.json(
      { error: `Links need the full address, starting with https:// (check ${badLink}).` },
      { status: 400 },
    );
  const updated = await updateRestaurantFields(slug, patch);
  if (!updated) {
    return NextResponse.json({ error: "Not found or no valid fields" }, { status: 404 });
  }
  // Bust the ISR cache for this restaurant's public detail page so an inline
  // edit shows up for visitors (the editor also calls router.refresh()).
  revalidatePath(`/restaurant/${slug}`);
  return NextResponse.json({ ok: true, restaurant: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const blocked = await requireAdmin();
  if (blocked) return blocked;

  const { slug } = await params;
  const deleted = await deleteRestaurantBySlug(slug);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Purge the row's on-disk photos/menus so files don't outlive the record.
  await removeRestaurantMedia(deleted.id);
  // Bust the ISR cache so the deleted spot's page 404s now, not in up to 1h.
  revalidatePath(`/restaurant/${slug}`);
  return NextResponse.json({ ok: true, name: deleted.name });
}
