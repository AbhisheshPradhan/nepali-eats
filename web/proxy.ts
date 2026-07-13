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
  // next.config.ts sets skipTrailingSlashRedirect (only when PostHog is
  // configured) so the SDK's trailing-slash endpoints reach the /ingest
  // rewrite untouched. That flag is global, so re-create Next's default
  // /foo/ -> /foo 308 here (/ingest never reaches this handler; the matcher
  // below excludes it). Single-slash strip, same as Next's built-in. When the
  // flag is off, Next's built-in redirect runs before middleware and this
  // block is simply never reached with a trailing-slash path.
  const { pathname } = req.nextUrl;
  if (pathname !== "/" && pathname.endsWith("/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(0, -1);
    return NextResponse.redirect(url, 308);
  }

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
    // Run on everything except Next internals, the PostHog ingest proxy (high
    // volume, needs no auth state and must keep its trailing slashes), and
    // static assets, so Clerk can attach auth state site-wide and protect the
    // admin routes above.
    "/((?!_next|ingest/|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Static-extension paths WITH a trailing slash (/logo.png/) re-enter here
    // solely so the 308 replication above covers them; slash-less asset
    // requests stay excluded. Without this, skipTrailingSlashRedirect would
    // turn their old built-in 308 into a 404.
    "/([^?]*\\.(?:html?|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)/)",
    "/__clerk/:path*",
    "/(api|trpc)(.*)",
  ],
};
