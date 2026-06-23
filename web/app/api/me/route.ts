import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin/guard";
import { ensureCurrentUser, isOwnerOf } from "@/lib/users";

// Lightweight identity check for client UI (e.g. showing the Admin link in the
// header, or the per-restaurant Edit button). NOT a security boundary: /admin
// and /api/admin are gated in proxy.ts and per-route. Kept OUT of the /api/admin
// matcher on purpose so non-admins get a plain 200 instead of a 403, and so the
// ADMIN_USER_IDS allowlist never reaches the browser.
//
// With ?restaurantId=<id> it also reports `canEdit` = admin OR owner of that
// restaurant, used to reveal the Edit button on the detail page.
export async function GET(req: Request) {
  const isAdmin = await isAdminUser();
  const restaurantId = new URL(req.url).searchParams.get("restaurantId");

  let canEdit = isAdmin;
  if (!canEdit && restaurantId) {
    const user = await ensureCurrentUser();
    if (user) canEdit = await isOwnerOf(user.id, restaurantId);
  }

  return NextResponse.json({ isAdmin, canEdit });
}
