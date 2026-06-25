"use client";
import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

// Crop an image to a fixed aspect ratio before upload. Client-side only: the
// chosen region is drawn to a canvas and returned as a JPEG blob, so the stored
// file already matches the target shape (no CSS object-cover guesswork later).
//
// `src` is an object URL (new uploads) or a media URL (re-framing an existing
// photo). Re-framing an existing photo loads it into a <canvas>, which taints
// the canvas if the image is cross-origin without CORS headers — in dev the
// /media symlink is same-origin so it just works; in prod R2 must send
// Access-Control-Allow-Origin (we request the image with crossOrigin below).

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // allow canvas export for cross-origin (R2) sources
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't load the image"));
    img.src = src;
  });
}

async function cropToBlob(src: string, area: Area): Promise<Blob> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(
    img,
    area.x, area.y, area.width, area.height,
    0, 0, area.width, area.height,
  );
  return new Promise((resolve, reject) => {
    // toBlob throws/returns null if the canvas is tainted (cross-origin, no CORS).
    try {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Export failed (image may block cross-origin use)"))),
        "image/jpeg",
        0.9,
      );
    } catch {
      reject(new Error("This image can't be cropped here (cross-origin). Re-upload it instead."));
    }
  });
}

export function CropModal({
  src,
  aspect,
  title,
  onCancel,
  onConfirm,
}: {
  src: string;
  aspect: number; // e.g. 16/9 for the cover, 4/3 for gallery photos
  title: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void | Promise<void>;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onComplete = useCallback((_: Area, px: Area) => setArea(px), []);

  async function apply() {
    if (!area) return;
    setBusy(true);
    try {
      const blob = await cropToBlob(src, area);
      await onConfirm(blob);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Couldn't crop the image");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-ink-900/70 grid place-items-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-ink-100 flex items-center justify-between">
          <h3 className="font-display font-extrabold text-ink-900">{title}</h3>
          <span className="text-xs text-ink-400">Drag to reposition, scroll to zoom</span>
        </div>
        <div className="relative h-[60vh] bg-ink-900">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onComplete}
            restrictPosition
          />
        </div>
        <div className="px-5 py-3 flex items-center gap-4">
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-chili-500"
            aria-label="Zoom"
          />
          <button
            onClick={onCancel}
            disabled={busy}
            className="text-sm text-ink-500 hover:text-ink-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={apply}
            disabled={busy || !area}
            className="bg-chili-500 text-white rounded-md px-5 py-1.5 font-display font-bold hover:bg-chili-600 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Apply crop"}
          </button>
        </div>
      </div>
    </div>
  );
}
