import type { NextConfig } from "next";

// In dev, photos are served from /media (web/public/media -> ../../media symlink).
// In prod, set NEXT_PUBLIC_MEDIA_BASE to the R2 public domain and whitelist it here.
const mediaBase = process.env.NEXT_PUBLIC_MEDIA_BASE;
const remotePatterns = mediaBase
  ? [{ protocol: "https" as const, hostname: new URL(mediaBase).hostname }]
  : [];

const nextConfig: NextConfig = {
  turbopack: { root: import.meta.dirname },
  images: {
    remotePatterns,
    formats: ["image/webp"],
  },
};

export default nextConfig;
