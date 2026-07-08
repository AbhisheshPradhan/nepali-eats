import { NextResponse } from "next/server";
import { getRestaurantBySlug } from "@/lib/queries";
import { getPhotosForAdmin } from "@/lib/admin/queries";
import { listMenuFiles } from "@/lib/admin/storage";
import { requireEditorBySlug } from "@/lib/editor/guard";

// Loads the editor's media for the inline Edit Details panel (photos + menu
// files) so the drawer can populate those tabs on open without shipping admin
// data to every visitor of the public detail page.
//
// Protected twice over: the /api/admin(.*) matcher in proxy.ts gates this with
// Clerk auth + the ADMIN_USER_IDS allowlist, and requireEditorBySlug() is the boundary here (admin or this restaurant's owner).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const gate = await requireEditorBySlug((await params).slug);
  if (gate instanceof NextResponse) return gate;

  const { slug } = await params;
  const r = await getRestaurantBySlug(slug);
  if (!r) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const [photos, menuFiles] = await Promise.all([
    getPhotosForAdmin(r.id),
    listMenuFiles(r.id),
  ]);
  return NextResponse.json({ photos, menuFiles });
}
