import type { NextConfig } from "next";

// In dev, photos are served from /media (web/public/media -> ../../media symlink).
// In prod, set NEXT_PUBLIC_MEDIA_BASE to the R2 public domain and whitelist it here.
const mediaBase = process.env.NEXT_PUBLIC_MEDIA_BASE;
const remotePatterns = mediaBase
  ? [{ protocol: "https" as const, hostname: new URL(mediaBase).hostname }]
  : [];

// PostHog hosts come from lib/posthog (single source, validated there: a bad
// NEXT_PUBLIC_POSTHOG_HOST fails this import and therefore the build, instead
// of silently dropping every event at runtime). The browser SDK posts to
// same-origin /ingest (see instrumentation-client.ts) and the rewrites below
// forward it, so ad blockers that blocklist *.posthog.com don't drop events.
import {
  POSTHOG_ENABLED,
  POSTHOG_INGEST_HOST,
  POSTHOG_ASSETS_HOST,
} from "./lib/posthog";

const nextConfig: NextConfig = {
  turbopack: { root: import.meta.dirname },
  // Phosphor's barrel re-exports ~9k icons; without this every `import { X } from
  // "@phosphor-icons/react"` makes the bundler crawl the whole barrel on each dev
  // compile. Not in Next's default optimizePackageImports list, so add it (both the
  // client barrel and the /dist/ssr barrel used by RSC pages).
  experimental: {
    optimizePackageImports: [
      "@phosphor-icons/react",
      "@phosphor-icons/react/dist/ssr",
    ],
  },
  images: {
    remotePatterns,
    formats: ["image/webp"],
  },
  // The dish/cuisine hubs moved from /tag/[slug] to /nepali-food/[slug]. Redirect
  // any stray old link (momo keeps its own /momo route).
  async redirects() {
    return [
      { source: "/tag/:slug", destination: "/nepali-food/:slug", permanent: true },
    ];
  },
  async rewrites() {
    if (!POSTHOG_ENABLED) return [];
    return [
      { source: "/ingest/static/:path*", destination: `${POSTHOG_ASSETS_HOST}/static/:path*` },
      { source: "/ingest/:path*", destination: `${POSTHOG_INGEST_HOST}/:path*` },
    ];
  },
  // PostHog SDK endpoints use trailing slashes (/ingest/e/ etc.); Next's
  // automatic trailing-slash 308 would strip them before the rewrite runs.
  // This flag disables that redirect SITE-WIDE, so proxy.ts re-creates the
  // /foo/ -> /foo 308 for everything outside /ingest (keeps SEO behaviour).
  // Keyed to POSTHOG_ENABLED so a build without the PostHog env vars behaves
  // like stock Next instead of shipping the trade-off with no rewrite to
  // justify it. Change this and proxy.ts's redirect together or not at all.
  skipTrailingSlashRedirect: POSTHOG_ENABLED,
};

export default nextConfig;
