import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { getMedia } from "@/lib/admin/storage";

// Same-origin media proxy for the admin editor. The cropper re-loads an existing
// photo into a <canvas> to re-frame it; loading the cross-origin R2 public URL
// (NEXT_PUBLIC_MEDIA_BASE) with crossOrigin="anonymous" fails (no CORS headers)
// and would taint the canvas anyway. Streaming the bytes back through this
// admin-gated, same-origin route sidesteps CORS entirely in both dev and prod.
//
// Admin-only: gated by the /api/admin(.*) matcher in proxy.ts (Clerk +
// ADMIN_USER_IDS) and re-checked here.
export async function GET(request: Request) {
  const blocked = await requireAdmin();
  if (blocked) return blocked;

  const key = new URL(request.url).searchParams.get("key");
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });
  // Only the known media prefixes are proxyable, so this can never stream an
  // arbitrary bucket object (defense-in-depth; the route is admin-only anyway).
  if (!/^(photos|covers|logos|menus)\//.test(key)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  const media = await getMedia(key);
  if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(new Uint8Array(media.body), {
    headers: {
      "content-type": media.contentType,
      "cache-control": "private, max-age=300",
    },
  });
}
