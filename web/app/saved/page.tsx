import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ensureCurrentUser } from "@/lib/users";
import { listSavedRestaurants } from "@/lib/queries";
import { ListingGrid } from "@/components/ListingGrid";

export const metadata = {
  title: "Saved restaurants",
  robots: { index: false, follow: false },
};

// Per-user, never cached.
export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const { userId } = await auth();
  if (!userId) redirect("/"); // proxy also guards this route

  const me = await ensureCurrentUser();
  const list = me ? await listSavedRestaurants(me.id) : [];

  return (
    <ListingGrid
      eyebrow="Your list"
      title="Saved restaurants"
      intro={
        list.length
          ? "Every spot you've saved, in one place. Ready for the next time the craving hits."
          : "Nothing saved yet. Tap the heart on any restaurant and it lands here."
      }
      restaurants={list}
      exploreHref="/explore"
    />
  );
}
