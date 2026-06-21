import { NextResponse } from "next/server";
import { deleteRestaurantBySlug } from "@/lib/queries";

// ⚠️ TEMPORARY ADMIN ENDPOINT — UNAUTHENTICATED BY DEFAULT.
// REMOVE, HIDE, OR GATE BEHIND A REAL ADMIN ROLE BEFORE LAUNCH.
// Optional stop-gap: set ADMIN_TOKEN in the env and the matching
// "x-admin-token" header will be required (see DeleteSpotButton).
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const token = process.env.ADMIN_TOKEN;
  if (token && _request.headers.get("x-admin-token") !== token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const name = await deleteRestaurantBySlug(slug);
  if (!name) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, name });
}
