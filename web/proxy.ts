import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Admin gate. Clerk handles authentication; authorization is ours: only Clerk
// user ids listed in ADMIN_USER_IDS may reach /admin or /api/admin. Everything
// else passes through untouched (clerkMiddleware just attaches auth state).
const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);
// Pages that require any signed-in user (the /api/* equivalents do their own
// auth and return 401 rather than redirecting).
const isSignedInRoute = createRouteMatcher(["/saved(.*)"]);

const ADMIN_IDS = (process.env.ADMIN_USER_IDS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    const { userId, redirectToSignIn } = await auth();
    const isApi = req.nextUrl.pathname.startsWith("/api/");

    if (!userId) {
      return isApi
        ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        : redirectToSignIn();
    }
    if (!ADMIN_IDS.includes(userId)) {
      return isApi
        ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
        : new NextResponse("Forbidden", { status: 403 });
    }
    return;
  }

  if (isSignedInRoute(req)) {
    const { userId, redirectToSignIn } = await auth();
    if (!userId) return redirectToSignIn();
  }
});

export const config = {
  matcher: [
    // Run on everything except Next internals and static assets, so Clerk can
    // attach auth state site-wide and protect the admin routes above.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/__clerk/:path*",
    "/(api|trpc)(.*)",
  ],
};
