"use client";
import { useEffect, useState } from "react";

export type LatLng = [number, number];

const KEY = "ne:userloc";
const TTL = 1000 * 60 * 30; // 30 min: a shared location is "fresh" for half an hour

// Persist a shared location so other pages (home, listings) can show distances
// without re-prompting. Call this wherever we obtain coords (e.g. the hero
// "Share your location" button).
export function storeLoc(lat: number, lng: number) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ lat, lng, t: Date.now() }));
  } catch {}
}

function readStoredLoc(): LatLng | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { lat, lng, t } = JSON.parse(raw);
    if (Date.now() - t > TTL) return null;
    return [lat, lng];
  } catch {
    return null;
  }
}

// Returns the visitor's location ONLY if they've already shared it (persisted
// from a previous share, or browser permission already granted). Never prompts.
export function useUserLocation(): LatLng | null {
  const [loc, setLoc] = useState<LatLng | null>(null);

  useEffect(() => {
    const stored = readStoredLoc();
    if (stored) setLoc(stored);

    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    const grab = () =>
      navigator.geolocation.getCurrentPosition(
        (p) => {
          const c: LatLng = [p.coords.latitude, p.coords.longitude];
          setLoc(c);
          storeLoc(c[0], c[1]);
        },
        () => {},
        { timeout: 6000 }
      );

    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((r) => {
          if (r.state === "granted") grab();
        })
        .catch(() => {});
    }
  }, []);

  return loc;
}
