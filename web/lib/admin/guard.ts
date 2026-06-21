import { notFound } from "next/navigation";
import { NextResponse } from "next/server";

const IS_PROD = process.env.NODE_ENV === "production";

// The admin surface is LOCAL-ONLY and UNAUTHENTICATED by design (pre-launch data
// entry against local Postgres + media/). It must never be reachable in prod, so
// every admin page and API route checks this first. Add real auth here
// (session/role check) before ever shipping admin to production.

// Pages: 404s the whole /admin subtree in production.
export function assertLocalAdmin() {
  if (IS_PROD) notFound();
}

// API routes: returns a 404 Response in production (call and early-return if
// truthy), since notFound() doesn't render cleanly inside route handlers.
export function blockInProd(): NextResponse | null {
  return IS_PROD ? NextResponse.json({ error: "Not found" }, { status: 404 }) : null;
}
