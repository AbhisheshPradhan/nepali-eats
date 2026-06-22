import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin/guard";

// Lightweight identity check for client UI (e.g. showing the Admin link in the
// header). NOT a security boundary — /admin and /api/admin are gated in proxy.ts
// and per-route. Kept OUT of the /api/admin matcher on purpose so non-admins get
// a plain 200 { isAdmin: false } instead of a 403, and so the ADMIN_USER_IDS
// allowlist never reaches the browser.
export async function GET() {
  return NextResponse.json({ isAdmin: await isAdminUser() });
}
