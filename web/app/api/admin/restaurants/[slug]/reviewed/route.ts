import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import {
  getRestaurantIdBySlug,
  markPhotosReviewed,
  unmarkPhotosReviewed,
} from "@/lib/admin/queries";

// POST -> stamp photos_reviewed_at = now() (the triage "Mark reviewed / next").
// DELETE -> clear it (undo a mis-mark). Used only by /admin/triage.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const blocked = await requireAdmin();
  if (blocked) return blocked;

  const { slug } = await params;
  const id = await getRestaurantIdBySlug(slug);
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await markPhotosReviewed(slug);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const blocked = await requireAdmin();
  if (blocked) return blocked;

  const { slug } = await params;
  const id = await getRestaurantIdBySlug(slug);
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await unmarkPhotosReviewed(slug);
  return NextResponse.json({ ok: true });
}
