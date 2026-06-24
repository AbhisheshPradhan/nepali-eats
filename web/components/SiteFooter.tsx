"use client";
import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

// Explore is a full-viewport app shell (its own internal scroll), so the page
// footer is hidden there to keep the header + search + filters pinned.
export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/explore")) return null;
  // Restaurant detail pages render a phone-only fixed action bar; pad the
  // footer so its disclaimer links clear it on mobile.
  return <Footer clearMobileActionBar={pathname.startsWith("/restaurant/")} />;
}
