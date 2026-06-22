import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { setNepaliStatus } from "@/lib/admin/queries";

// LOCAL-ONLY. Curation decision for a restaurant: keep it in the directory
// (is_nepali = true) or hide a false positive (is_nepali = false). Reversible;
// it never deletes. POST { isNepali: boolean }.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const blocked = await requireAdmin();
  if (blocked) return blocked;

  const { slug } = await params;
  const body = (await request.json().catch(() => ({}))) as { isNepali?: unknown };
  if (typeof body.isNepali !== "boolean") {
    return NextResponse.json(
      { error: "Expected { isNepali: boolean }" },
      { status: 400 }
    );
  }
  const name = await setNepaliStatus(slug, body.isNepali);
  if (!name) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, name });
}
