import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import {
  getRestaurantIdBySlug,
  getPhotoMedia,
  deletePhotoRow,
  updateRestaurantFields,
} from "@/lib/admin/queries";
import { getCardBySlug } from "@/lib/queries";
import { saveMedia, copyMedia, deleteMedia, logoKey } from "@/lib/admin/storage";

// POST a brand logo. Two shapes:
//   - multipart (field "file"; image incl. SVG): upload a new logo, stored under
//     media/logos/<id>/.
//   - JSON { fromPhotoId } | { fromKey }: promote an existing gallery photo (or
//     the current cover, by key) to logo. We COPY the source file into
//     media/logos/<id>/ so the logo owns its own file (otherwise logo_key would
//     point at the shared gallery file and deleting that photo would break the
//     logo). After copying, the source gallery photo is a duplicate, so we delete
//     it (row + file) — UNLESS it's also the current cover, in which case we keep
//     it so a single image can serve as both cover and logo.
// Either way logo_key points at a file under logos/; DELETE clears it.
//
// Since every logo we write now lives under logos/, we always own (and can
// safely delete) the PREVIOUS logo file. The guard also covers legacy rows whose
// logo_key still points into photos/ from before the copy-on-promote fix: those
// are (or were) gallery images, so we leave them on disk.
function ownsLogoFile(key: string | null | undefined): key is string {
  return !!key && key.startsWith("logos/");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const blocked = await requireAdmin();
  if (blocked) return blocked;

  const { slug } = await params;
  const id = await getRestaurantIdBySlug(slug);
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Promote an existing gallery photo or the current cover to logo (no upload).
  if ((request.headers.get("content-type") || "").includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    const card = await getCardBySlug(slug);
    let storageKey: string | null = null;
    let fromPhotoId: number | null = null;

    if (body.fromPhotoId != null) {
      const pid = Number(body.fromPhotoId);
      if (!Number.isFinite(pid)) {
        return NextResponse.json({ error: "fromPhotoId invalid" }, { status: 400 });
      }
      const photo = await getPhotoMedia(pid);
      if (!photo || photo.restaurantId !== id) {
        return NextResponse.json({ error: "Photo not found" }, { status: 404 });
      }
      storageKey = photo.storageKey;
      fromPhotoId = pid;
    } else if (typeof body.fromKey === "string" && body.fromKey) {
      // Promote the restaurant's current cover by key (must be this row's cover).
      if (card?.coverKey !== body.fromKey) {
        return NextResponse.json({ error: "Key not allowed" }, { status: 400 });
      }
      storageKey = body.fromKey;
    } else {
      return NextResponse.json(
        { error: "fromPhotoId or fromKey required" },
        { status: 400 }
      );
    }

    if (!storageKey) {
      return NextResponse.json({ error: "Source has no file" }, { status: 400 });
    }

    // Copy the source into logos/ so the logo owns its own file (deleting the
    // source gallery photo/cover must not break the logo).
    const key = await copyMedia(storageKey, logoKey(id, storageKey));
    const restaurant = await updateRestaurantFields(slug, { logoKey: key });
    if (ownsLogoFile(card?.logoKey) && card?.logoKey !== key) {
      await deleteMedia(card.logoKey);
    }

    // The logo now has its own copy, so the source gallery photo is a duplicate:
    // remove it (row + file). EXCEPTION: if that photo is also the current cover,
    // keep it so a single image can intentionally serve as both cover and logo
    // (deleting it would also strip the cover's file).
    let deletedPhotoId: number | null = null;
    if (fromPhotoId != null && card?.coverKey !== storageKey) {
      const removed = await deletePhotoRow(fromPhotoId);
      if (removed) await deleteMedia(removed);
      deletedPhotoId = fromPhotoId;
    }

    return NextResponse.json({ ok: true, logoKey: key, restaurant, deletedPhotoId });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Image file required" }, { status: 400 });
  }

  // remove the previous logo file so it doesn't linger orphaned
  const prev = (await getCardBySlug(slug))?.logoKey;
  const buf = Buffer.from(await file.arrayBuffer());
  const key = await saveMedia(logoKey(id, file.name), buf);
  const restaurant = await updateRestaurantFields(slug, { logoKey: key });
  if (ownsLogoFile(prev) && prev !== key) await deleteMedia(prev);

  return NextResponse.json({ ok: true, logoKey: key, restaurant });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const blocked = await requireAdmin();
  if (blocked) return blocked;

  const { slug } = await params;
  const prev = (await getCardBySlug(slug))?.logoKey;
  await updateRestaurantFields(slug, { logoKey: "" });
  if (ownsLogoFile(prev)) await deleteMedia(prev);
  return NextResponse.json({ ok: true });
}
