import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin/guard";
import { ensureCurrentUser, isOwnerOf, type DbUser } from "@/lib/users";
import { getRestaurantIdBySlug, getPhotoMedia } from "@/lib/admin/queries";

// Guard for the SHARED editor surface (/api/editor/...): an editor is an admin
// OR the verified owner of the specific restaurant being edited (a
// restaurant_owners row, granted by the claim flow). Unlike /api/admin (edge-
// gated to the allowlist in proxy.ts), these routes are open past the edge and
// THIS check is the boundary — always scope to the restaurant, never grant
// "owner of something" access to everything.

export type Editor = {
	isAdmin: boolean;
	user: DbUser | null; // local users row (null only for allowlisted admins missing a row)
	restaurantId: number;
};

async function gate(restaurantId: number | null): Promise<NextResponse | Editor> {
	if (restaurantId == null)
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	const { userId } = await auth();
	if (!userId)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const isAdmin = await isAdminUser();
	const user = await ensureCurrentUser();
	if (!isAdmin) {
		if (!user || !(await isOwnerOf(user.id, restaurantId)))
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}
	return { isAdmin, user, restaurantId };
}

export async function requireEditorBySlug(
	slug: string,
): Promise<NextResponse | Editor> {
	return gate(await getRestaurantIdBySlug(slug));
}

export async function requireEditorByPhotoId(
	photoId: number,
): Promise<NextResponse | Editor> {
	if (!Number.isFinite(photoId))
		return NextResponse.json({ error: "Bad id" }, { status: 400 });
	const photo = await getPhotoMedia(photoId);
	return gate(photo ? photo.restaurantId : null);
}

// Fields an OWNER may PATCH. Deliberately excluded: tags (SEO vocabulary,
// seeder-owned), featuredRank/popular/rating/reviewCount (editorial/derived),
// address fields (drive geo + landing pages; admin-only for now), cover/logo
// keys + menuSource (set server-side by their own routes), and EMAIL — it is
// the Lane-A instant-claim anchor (claims route compares verified Clerk emails
// against it), so only an admin may move it (decided 2026-07-08). Admins pass
// the patch through unfiltered.
const OWNER_FIELDS = new Set([
	"name",
	"description",
	"venueType",
	"halalStatus",
	"priceLevel",
	"priceRange",
	"openingHours",
	"menuUrl",
	"phone",
	"website",
	"facebook",
	"instagram",
	"tiktok",
	"whatsapp",
]);

export function filterOwnerPatch(
	patch: Record<string, unknown>,
): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(patch).filter(([k]) => OWNER_FIELDS.has(k)),
	);
}

// Link fields are rendered as raw <a href> on the PUBLIC detail page, so only
// real web URLs may be stored — a `javascript:` href here would run in every
// diner's browser. Applies to admins too: it is never valid data.
const LINK_FIELDS = [
	"website",
	"menuUrl",
	"facebook",
	"instagram",
	"tiktok",
	"whatsapp",
] as const;

export function invalidLinkField(patch: Record<string, unknown>): string | null {
	for (const f of LINK_FIELDS) {
		const v = patch[f];
		if (typeof v === "string" && v.trim() && !/^https?:\/\//i.test(v.trim()))
			return f;
	}
	return null;
}
