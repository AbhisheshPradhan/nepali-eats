"use client";

// LOCAL-ONLY admin review grid. Visual pass for false-positive cleanup and photo
// QA: see each spot's photos, confirm it's Nepali (keep) or hide it (exclude),
// delete outright, and drop individual wrong photos. Actions are optimistic.
import { useState } from "react";
import Link from "next/link";
import { Trash, Check, X, ArrowSquareOut } from "@phosphor-icons/react";
import { mediaUrl } from "@/lib/media";
import type { ReviewItem } from "@/lib/admin/queries";

export function ReviewClient({ items }: { items: ReviewItem[] }) {
  const [list, setList] = useState(items);

  if (!list.length) {
    return <p className="text-ink-400 py-12 text-center">Nothing left in this queue. 🎉</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {list.map((r) => (
        <ReviewCard
          key={r.id}
          item={r}
          onResolved={() => setList((l) => l.filter((x) => x.id !== r.id))}
        />
      ))}
    </div>
  );
}

function ReviewCard({ item, onResolved }: { item: ReviewItem; onResolved: () => void }) {
  const [photos, setPhotos] = useState(item.photos);
  const [busy, setBusy] = useState(false);

  async function call(url: string, method: string, body?: unknown) {
    setBusy(true);
    try {
      const res = await fetch(url, {
        method,
        ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || `Request failed (${res.status})`);
      }
      return true;
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
      return false;
    }
  }

  async function keep() {
    if (await call(`/api/admin/restaurants/${item.slug}/review`, "POST", { isNepali: true })) onResolved();
  }
  async function exclude() {
    if (await call(`/api/admin/restaurants/${item.slug}/review`, "POST", { isNepali: false })) onResolved();
  }
  async function del() {
    if (!window.confirm(`Delete "${item.name}" permanently? This can't be undone.`)) return;
    if (await call(`/api/admin/restaurants/${item.slug}`, "DELETE")) onResolved();
  }
  async function removePhoto(id: number) {
    if (await call(`/api/admin/photos/${id}`, "DELETE")) {
      setPhotos((p) => p.filter((x) => x.id !== id));
      setBusy(false);
    }
  }

  const where = [item.suburb, item.state].filter(Boolean).join(", ");

  return (
    <div className={`bg-white rounded-lg border border-ink-100 overflow-hidden flex flex-col ${busy ? "opacity-50 pointer-events-none" : ""}`}>
      {/* photos */}
      {photos.length ? (
        <div className="grid grid-cols-3 gap-px bg-ink-100">
          {photos.slice(0, 6).map((p) => (
            <div key={p.id} className="relative aspect-square bg-paper-200 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(p.key) ?? ""}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(p.id)}
                title={`Remove this ${p.source ?? ""} photo`}
                className="absolute top-1 right-1 h-6 w-6 grid place-items-center rounded-full bg-ink-900/70 text-white opacity-0 group-hover:opacity-100 hover:bg-chili-600 transition"
              >
                <X size={13} weight="bold" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="aspect-[3/1] bg-paper-100 grid place-items-center text-ink-300 text-sm">
          No photos
        </div>
      )}

      {/* body */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-bold text-ink-900 leading-tight">{item.name}</h3>
          {item.rating != null && (
            <span className="text-sm text-ink-500 shrink-0">
              ★ {item.rating}{item.reviewCount != null ? ` (${item.reviewCount})` : ""}
            </span>
          )}
        </div>
        <p className="text-sm text-ink-500">
          {item.venueType ? `${item.venueType} · ` : ""}{where || "—"}
        </p>
        {item.fullAddress && <p className="text-xs text-ink-400 line-clamp-1">{item.fullAddress}</p>}
        {item.relevance && (
          <p className="text-xs text-ink-400">
            bucket: <span className="font-medium">{item.relevance}</span>
          </p>
        )}
        {item.tags.length > 0 && (
          <p className="text-xs text-ink-400 line-clamp-1">{item.tags.join(", ")}</p>
        )}

        <div className="flex flex-wrap gap-2 mt-1 text-xs">
          <Link href={`/admin/${item.slug}`} className="text-chili-600 hover:underline font-medium">
            Edit
          </Link>
          {item.website && (
            <a href={item.website} target="_blank" rel="noopener noreferrer" className="text-ink-500 hover:text-chili-600 inline-flex items-center gap-0.5">
              Site <ArrowSquareOut size={12} />
            </a>
          )}
          {item.googleMapsUrl && (
            <a href={item.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-ink-500 hover:text-chili-600 inline-flex items-center gap-0.5">
              Maps <ArrowSquareOut size={12} />
            </a>
          )}
        </div>

        {/* actions */}
        <div className="flex gap-2 mt-auto pt-3">
          <button
            type="button"
            onClick={keep}
            className="flex-1 inline-flex items-center justify-center gap-1 rounded-md py-1.5 text-sm font-display font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
          >
            <Check size={15} weight="bold" /> Keep
          </button>
          <button
            type="button"
            onClick={exclude}
            title="Hide from directory (reversible)"
            className="flex-1 inline-flex items-center justify-center gap-1 rounded-md py-1.5 text-sm font-display font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
          >
            <X size={15} weight="bold" /> Not Nepali
          </button>
          <button
            type="button"
            onClick={del}
            title="Delete permanently"
            className="inline-flex items-center justify-center rounded-md px-2.5 py-1.5 text-chili-600 border border-chili-200 hover:bg-chili-50"
          >
            <Trash size={15} weight="fill" />
          </button>
        </div>
      </div>
    </div>
  );
}
