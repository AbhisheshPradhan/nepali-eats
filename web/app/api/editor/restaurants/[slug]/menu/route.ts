import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireEditorBySlug } from "@/lib/editor/guard";
import { notifyAdmin } from "@/lib/email";
import { getRestaurantIdBySlug, updateRestaurantFields } from "@/lib/admin/queries";
import { getCardBySlug } from "@/lib/queries";
import {
  saveMedia,
  menuKey,
  deleteMedia,
  listMenuFiles,
  isOwnMenuKey,
} from "@/lib/admin/storage";

// POST menu files (multipart, one or more "file" fields; images or PDFs). Each
// is stored under media/menus/<id>/ for later parsing. menu_url points at the
// first stored file (menu_source "upload") so the restaurant page shows a menu;
// the rest sit on disk until the menu-extraction pass reads them. Returns the
// full on-disk file list so the editor can show every menu.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const gate = await requireEditorBySlug(slug);
  if (gate instanceof NextResponse) return gate;

  const id = await getRestaurantIdBySlug(slug);
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await request.formData();
  const files = form.getAll("file").filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (files.some((f) => !(f.type.startsWith("image/") || f.type === "application/pdf"))) {
    return NextResponse.json({ error: "Images or PDFs only" }, { status: 400 });
  }

  const uploaded: string[] = [];
  for (const file of files) {
    const buf = Buffer.from(await file.arrayBuffer());
    uploaded.push(await saveMedia(menuKey(id, file.name), buf));
  }

  // Point the public page at a menu if none is set yet; otherwise leave it.
  const current = await getCardBySlug(slug);
  const menuUrl = current?.menuUrl || uploaded[0];
  if (!current?.menuUrl) {
    await updateRestaurantFields(slug, { menuUrl, menuSource: "upload" });
  }

  // An OWNER uploading a menu is the reseed trigger: owners can't edit the
  // structured menu themselves (v1), so fresh files must reach the admin.
  // Awaited: on serverless the function can freeze once the response returns,
  // silently dropping an un-awaited send.
  if (!gate.isAdmin) {
    const who = gate.user?.email ?? "an owner";
    await notifyAdmin(
      `Menu upload: ${slug}`,
      `<p>${who} uploaded ${uploaded.length} menu file(s) for <strong>${slug}</strong>.</p>
       <p>Re-transcribe + reseed when you get a chance: <code>node scraper/seed-menu.js ${slug}</code></p>`,
    );
  }

  revalidatePath(`/restaurant/${slug}`);
  return NextResponse.json({ ok: true, menuUrl, files: await listMenuFiles(id) });
}

// DELETE one menu file (body { key }). Removes it from disk; if it was the file
// shown on the public page (menu_url), repoints menu_url at the next remaining
// uploaded file, or clears it. Returns the updated file list + menuUrl.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const gate = await requireEditorBySlug(slug);
  if (gate instanceof NextResponse) return gate;

  const id = await getRestaurantIdBySlug(slug);
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as { key?: unknown };
  const key = typeof body.key === "string" ? body.key : "";
  if (!key || !isOwnMenuKey(id, key)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  await deleteMedia(key);

  // If we just deleted the public menu, repoint it at a remaining file (or clear).
  const current = await getCardBySlug(slug);
  const files = await listMenuFiles(id);
  let menuUrl = current?.menuUrl ?? null;
  if (current?.menuUrl === key) {
    menuUrl = files[0] ?? null;
    await updateRestaurantFields(slug, {
      menuUrl: menuUrl ?? "",
      menuSource: menuUrl ? "upload" : "",
    });
  }

  revalidatePath(`/restaurant/${slug}`);
  return NextResponse.json({ ok: true, menuUrl, files });
}
