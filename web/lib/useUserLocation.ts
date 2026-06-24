"use client";
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { readStateOverride } from "@/lib/stateOverride";

export type LatLng = [number, number];

const KEY = "ne:userloc";
const TTL = 1000 * 60 * 30; // 30 min: a shared location is "fresh" for half an hour
const EVENT = "ne:userloc-change";

// Persist a shared location AND notify the provider, so every card can show
// distances without re-prompting. Call wherever we obtain coords (hero "Share
// location" button, Explore "Near me", etc.).
export function storeLoc(lat: number, lng: number) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ lat, lng, t: Date.now() }));
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent<LatLng>(EVENT, { detail: [lat, lng] }));
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

const Ctx = createContext<LatLng | null>(null);

// Single source of the visitor's location for the whole app. The
// geolocation/permission logic runs ONCE here, so a 30-card grid doesn't fire 30
// geolocation requests; cards read the value cheaply via useUserLocation().
// Never prompts: only uses an already-granted permission or a previously shared
// location, and updates live when anything calls storeLoc().
export function UserLocationProvider({ children }: { children: ReactNode }) {
  const [loc, setLoc] = useState<LatLng | null>(null);

  useEffect(() => {
    // Admin state-preview: simulate a fresh visitor in the previewed state with
    // NO shared location, so featured/popular/distances reflect that state and
    // aren't overwritten by the admin's real/stored location. Ignore stored loc,
    // geolocation, and storeLoc events until the override is cleared.
    if (readStateOverride()) {
      setLoc(null);
      return;
    }

    const stored = readStoredLoc();
    if (stored) setLoc(stored);

    const onChange = (e: Event) => {
      const d = (e as CustomEvent<LatLng>).detail;
      if (d) setLoc(d);
    };
    window.addEventListener(EVENT, onChange);

    if (
      typeof navigator !== "undefined" &&
      navigator.geolocation &&
      navigator.permissions?.query
    ) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((r) => {
          if (r.state === "granted") {
            navigator.geolocation.getCurrentPosition(
              (p) => storeLoc(p.coords.latitude, p.coords.longitude),
              () => {},
              { timeout: 6000 },
            );
          }
        })
        .catch(() => {});
    }

    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  return createElement(Ctx.Provider, { value: loc }, children);
}

// Cheap context read. Returns the visitor's location only if shared/granted.
export function useUserLocation(): LatLng | null {
  return useContext(Ctx);
}
