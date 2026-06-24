"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { PencilSimple } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

// Edit link shown only to an admin or the restaurant's owner. The detail page is
// ISR-cached and per-user-free, so (like SaveButton) it checks permission on the
// client. Opens the admin editor for this restaurant.
export function EditButton({
  slug,
  restaurantId,
  className,
  variant = "inline",
}: {
  slug: string;
  restaurantId: string;
  className?: string;
  // "inline" = pencil + "Edit" text label.
  // "floating" = white circular icon-only button overlaid on the cover photo
  // (mirrors SaveButton's floating variant so the two sit together).
  variant?: "inline" | "floating";
}) {
  const { isSignedIn } = useUser();
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      setCanEdit(false);
      return;
    }
    let active = true;
    fetch(`/api/me?restaurantId=${restaurantId}`)
      .then((r) => (r.ok ? r.json() : { canEdit: false }))
      .then((d) => {
        if (active) setCanEdit(!!d.canEdit);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isSignedIn, restaurantId]);

  if (!canEdit) return null;

  if (variant === "floating") {
    return (
      <Link
        href={`/admin/${slug}`}
        aria-label="Edit this spot"
        title="Edit"
        className={cn(
          "grid place-items-center w-10 h-10 rounded-full bg-white shadow-md ring-1 ring-black/5 transition-colors text-ink-900 hover:bg-paper-100 hover:text-chili-500",
          className,
        )}
      >
        <PencilSimple size={20} />
      </Link>
    );
  }

  return (
    <Link
      href={`/admin/${slug}`}
      aria-label="Edit this spot"
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold text-ink-500 hover:text-chili-500 transition-colors",
        className,
      )}
    >
      <PencilSimple size={20} />
      Edit
    </Link>
  );
}
