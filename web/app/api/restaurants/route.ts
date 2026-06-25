import { NextResponse } from "next/server";
import { listRestaurants, countRestaurants, pinsInBounds, type ListOpts } from "@/lib/queries";
import type { Bbox } from "@/lib/types";

const PAGE_SIZE = 30;
const SORT: Record<string, ListOpts["orderBy"]> = {
  featured: "featured",
  rating: "rating",
  newest: "newest",
};

function parseBbox(s: string | null): Bbox | undefined {
  if (!s) return undefined;
  const parts = s.split(",").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return undefined;
  const [w, so, e, n] = parts;
  return { w, s: so, e, n };
}

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);

  const opts: ListOpts = {
    bbox: parseBbox(sp.get("bbox")),
    tag: sp.get("tag") || undefined,
    venueType: sp.get("venue") || undefined,
    state: sp.get("state") || undefined,
    suburb: sp.get("suburb") || undefined,
    priceLevel: Number(sp.get("price")) || undefined,
    minRating: Number(sp.get("rating")) || undefined,
    // Boolean attribute filters: ?flags=veg,alcohol,kid (allowlisted in queries.ts).
    // Backend is live; the Explore UI for these is still scaffolded/commented.
    flags: (sp.get("flags") || "").split(",").map((s) => s.trim()).filter(Boolean),
    orderBy: SORT[sp.get("sort") || "featured"] || "popular",
    // Default (Featured) view only: float spots with a photo above photoless ones.
    // Explicit Rating/Newest sorts stay pure so a top pick isn't buried for lacking a photo.
    photosFirst: !sp.get("sort") || sp.get("sort") === "featured",
  };

  const items = await listRestaurants({
    ...opts,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  // pins + total only needed on a fresh load (page 1); "load more" skips them.
  if (page === 1) {
    const [total, pins] = await Promise.all([
      countRestaurants(opts),
      opts.bbox ? pinsInBounds(opts) : Promise.resolve([]),
    ]);
    return NextResponse.json({ items, total, pins, pageSize: PAGE_SIZE });
  }
  return NextResponse.json({ items, pageSize: PAGE_SIZE });
}
