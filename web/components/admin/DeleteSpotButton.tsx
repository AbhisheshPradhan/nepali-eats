"use client";

// ⚠️ TEMPORARY ADMIN CONTROL — visible to everyone right now.
// REMOVE, HIDE, OR GATE BEHIND A REAL ADMIN ROLE BEFORE LAUNCH.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash } from "@phosphor-icons/react";

export function DeleteSpotButton({
  slug,
  name,
  redirectTo = "/explore",
}: {
  slug: string;
  name: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (
      !window.confirm(
        `Delete "${name}" for good? This removes it (and all its photos/menus) from the directory and can't be undone.`
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${slug}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      window.alert(
        `Couldn't delete this spot: ${err instanceof Error ? err.message : "unknown error"}`
      );
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={busy}
      className="w-full rounded-lg py-3 inline-flex items-center justify-center gap-2 font-display font-bold text-[0.95rem] border-2 border-dashed border-chili-300 text-chili-600 hover:bg-chili-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Trash size={18} weight="fill" />
      {busy ? "Deleting…" : "Delete this spot (admin)"}
    </button>
  );
}
