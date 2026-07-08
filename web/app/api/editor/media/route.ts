import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin/guard";
import { ensureCurrentUser, isOwnerOf } from "@/lib/users";
import { getMedia } from "@/lib/admin/storage";

// Same-origin media proxy for the SHARED editor (see /api/admin/media for the
// original rationale: the cropper needs same-origin bytes, R2 sends no CORS
// headers). This twin serves OWNERS too, so the guard is key-scoped: every
// proxyable key embeds its restaurant id as the second path segment
// (photos/<id>/…, covers/<id>/…, logos/<id>/…, menus/<id>/…), and a non-admin
// may only stream keys belonging to a restaurant they own.
export async function GET(request: Request) {
	const key = new URL(request.url).searchParams.get("key");
	if (!key)
		return NextResponse.json({ error: "key required" }, { status: 400 });
	const m = /^(photos|covers|logos|menus)\/(\d+)\//.exec(key);
	if (!m) return NextResponse.json({ error: "Invalid key" }, { status: 400 });

	if (!(await isAdminUser())) {
		const user = await ensureCurrentUser();
		if (!user || !(await isOwnerOf(user.id, Number(m[2]))))
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const media = await getMedia(key);
	if (!media)
		return NextResponse.json({ error: "Not found" }, { status: 404 });

	return new NextResponse(new Uint8Array(media.body), {
		headers: {
			"content-type": media.contentType,
			"cache-control": "private, max-age=300",
		},
	});
}
