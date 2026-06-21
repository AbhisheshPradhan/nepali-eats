"use client";
import { PlaceCard } from "@/components/PlaceCard";
import { useUserLocation, type LatLng } from "@/lib/useUserLocation";
import { haversineKm, formatDistance } from "@/lib/format";
import type { Restaurant } from "@/lib/types";

// Renders the featured grid with a straight-line distance per card (computed
// client-side from each card's lat/lng, so the page stays cacheable/SEO-safe).
// Uses the visitor's shared location when available, otherwise falls back to
// the state capital (`fallbackLoc`) so distances still show.
export function FeaturedCards({
  gems,
  fallbackLoc,
}: {
  gems: Restaurant[];
  fallbackLoc?: LatLng;
}) {
  const loc = useUserLocation() ?? fallbackLoc ?? null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
      {gems.map((r) => {
        const distance =
          loc && r.lat != null && r.lng != null
            ? formatDistance(haversineKm(loc, r.lat, r.lng))
            : undefined;
        return <PlaceCard key={r.id} r={r} distance={distance} />;
      })}
    </div>
  );
}
