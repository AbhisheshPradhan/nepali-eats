"use client";
import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

// Explore is a full-viewport app shell (its own internal scroll), so the page
// footer is hidden there to keep the header + search + filters pinned.
export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/explore")) return null;
  return <Footer />;
}
