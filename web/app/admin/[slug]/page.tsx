import Link from "next/link";
import { notFound } from "next/navigation";
import { assertAdmin } from "@/lib/admin/guard";
import { getRestaurantBySlug } from "@/lib/queries";
import { getPhotosForAdmin } from "@/lib/admin/queries";
import { listMenuFiles } from "@/lib/admin/storage";
import { RestaurantEditor } from "@/components/admin/RestaurantEditor";
import { DeleteSpotButton } from "@/components/admin/DeleteSpotButton";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminEdit({ params }: { params: Promise<{ slug: string }> }) {
  await assertAdmin();
  const { slug } = await params;
  const r = await getRestaurantBySlug(slug);
  if (!r) notFound();
  const [photos, menuFiles] = await Promise.all([
    getPhotosForAdmin(r.id),
    listMenuFiles(r.id),
  ]);

  return (
    <div className="max-w-[820px] mx-auto px-6 py-8">
      <Link href="/admin" className="text-sm text-ink-500 hover:text-ink-900">
        ← All restaurants
      </Link>
      <h1 className="font-display font-extrabold text-2xl text-ink-900 mt-2 mb-1">{r.name}</h1>
      <p className="text-ink-500 text-sm mb-6">
        {[r.suburb, r.state].filter(Boolean).join(", ")} ·{" "}
        <Link href={`/restaurant/${r.slug}`} target="_blank" className="text-chili-600 hover:underline">
          view public page
        </Link>
      </p>
      <RestaurantEditor restaurant={r} initialPhotos={photos} initialMenuFiles={menuFiles} />

      <div className="mt-10 pt-6 border-t border-ink-100">
        <h2 className="font-display font-extrabold text-lg text-ink-900 mb-1">Danger zone</h2>
        <p className="text-ink-500 text-sm mb-3">
          Permanently removes this restaurant and all its photos and menu files.
        </p>
        <DeleteSpotButton slug={r.slug} name={r.name} redirectTo="/admin" />
      </div>
    </div>
  );
}
