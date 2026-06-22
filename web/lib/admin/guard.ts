import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { NextResponse } from "next/server";

// Admin access = authenticated via Clerk AND the Clerk user id is listed in the
// ADMIN_USER_IDS allowlist (comma-separated). Authentication is Clerk's job;
// authorization is ours. The edge gate in proxy.ts is the primary boundary;
// these helpers are defense-in-depth inside the pages and route handlers.
const ADMIN_IDS = (process.env.ADMIN_USER_IDS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export async function isAdminUser(): Promise<boolean> {
  const { userId } = await auth();
  return !!userId && ADMIN_IDS.includes(userId);
}

// Pages: 404 the whole /admin subtree for anyone who is not an admin.
export async function assertAdmin(): Promise<void> {
  if (!(await isAdminUser())) notFound();
}

// API routes: call and early-return if the result is truthy.
export async function requireAdmin(): Promise<NextResponse | null> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!ADMIN_IDS.includes(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
