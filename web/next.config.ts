import type { NextConfig } from "next";

// In dev, photos are served from /media (web/public/media -> ../../media symlink).
// In prod, set NEXT_PUBLIC_MEDIA_BASE to the R2 public domain and whitelist it here.
const mediaBase = process.env.NEXT_PUBLIC_MEDIA_BASE;
const remotePatterns = mediaBase
  ? [{ protocol: "https" as const, hostname: new URL(mediaBase).hostname }]
  : [];

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
};

export default nextConfig;
