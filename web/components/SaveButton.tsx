"use client";

import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Heart } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

// Heart toggle for saving a restaurant. Fetches its own saved-state on the
// client so the (ISR-cached) detail page stays per-user-free. Signed-out users
// are prompted to sign in.
export function SaveButton({
  restaurantId,
  className,
  variant = "inline",
}: {
  restaurantId: string;
  className?: string;
  // "inline" = heart + text label (used in the info strip).
  // "floating" = white circular icon-only button overlaid on the cover photo.
  variant?: "inline" | "floating";
}) {
  const { isSignedIn, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      setSaved(false);
      return;
    }
    let active = true;
    fetch(`/api/saved?restaurantId=${restaurantId}`)
      .then((r) => (r.ok ? r.json() : { saved: false }))
      .then((d) => {
        if (active) setSaved(!!d.saved);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isSignedIn, restaurantId]);

  async function toggle() {
    if (!isLoaded) return;
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    const next = !saved;
    setSaved(next); // optimistic
    setBusy(true);
    try {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, saved: next }),
      });
      if (!res.ok) setSaved(!next);
    } catch {
      setSaved(!next);
    } finally {
      setBusy(false);
    }
  }

  if (variant === "floating") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={saved}
        aria-label={saved ? "Remove from saved" : "Save this spot"}
        title={saved ? "Saved" : "Save"}
        className={cn(
          "grid place-items-center w-10 h-10 rounded-full bg-white shadow-md ring-1 ring-black/5 transition-colors cursor-pointer hover:bg-paper-100 disabled:opacity-50 disabled:cursor-not-allowed",
          saved ? "text-chili-500" : "text-ink-900",
          className,
        )}
      >
        <Heart size={20} weight={saved ? "fill" : "regular"} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save this spot"}
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        saved ? "text-chili-500" : "text-ink-500 hover:text-chili-500",
        className,
      )}
    >
      <Heart size={20} weight={saved ? "fill" : "regular"} />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
