import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Storefront, PencilSimple, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ensureCurrentUser } from "@/lib/users";
import { query } from "@/lib/db";
import { mediaUrl } from "@/lib/media";
import Image from "next/image";

export const metadata: Metadata = {
	title: "My restaurants",
	robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

// The owner dashboard, v1: every restaurant this account holds a verified
// claim on (restaurant_owners), with a straight line to the page + editor.
// Keyed by USER, never by brand (a franchisee may own one branch of many).
export default async function MyRestaurantsPage() {
	const { userId } = await auth();
	if (!userId) redirect("/");
	const user = await ensureCurrentUser();
	if (!user) redirect("/");

	const rows = await query<{
		slug: string;
		name: string;
		suburb: string | null;
		state: string | null;
		logo_key: string | null;
		cover_key: string | null;
		menu_item_count: number | null;
	}>(
		`SELECT r.slug, r.name, r.suburb, r.state, r.logo_key, r.cover_key, r.menu_item_count
		   FROM restaurant_owners o
		   JOIN restaurants r ON r.id = o.restaurant_id
		  WHERE o.user_id = $1
		  ORDER BY r.name`,
		[user.id],
	);

	return (
		<div className="max-w-[860px] mx-auto px-4 sm:px-6 py-10">
			<span className="eyebrow text-chili-500">Your kitchens</span>
			<h1 className="font-display font-extrabold text-[2rem] text-ink-900 mt-1.5">
				My restaurants
			</h1>

			{rows.length === 0 ? (
				<div className="mt-8 bg-white rounded-xl shadow-sm p-8 text-center text-ink-600">
					<Storefront size={36} className="mx-auto text-ink-400" />
					<p className="mt-3">
						No restaurants on this account yet. Found your place on
						NepaliEats? Open its page and claim it.
					</p>
				</div>
			) : (
				<div className="mt-6 flex flex-col gap-3">
					{rows.map((r) => {
						const img = mediaUrl(r.logo_key) ?? mediaUrl(r.cover_key);
						const where = [r.suburb, r.state].filter(Boolean).join(", ");
						return (
							<div
								key={r.slug}
								className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4"
							>
								<div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-paper-200">
									{img && (
										<Image
											src={img}
											alt={r.name}
											fill
											sizes="56px"
											className="object-cover"
										/>
									)}
								</div>
								<div className="min-w-0 flex-1">
									<div className="font-display font-bold text-ink-900 truncate">
										{r.name}
									</div>
									<div className="text-ink-500 text-sm">
										{where}
										{r.menu_item_count
											? ` · ${r.menu_item_count} dishes on your page`
											: ""}
									</div>
								</div>
								{/* the editor lives on the page itself (the Edit
								    Restaurant pencil, visible to you as the owner) */}
								<Link
									href={`/restaurant/${r.slug}`}
									className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-chili-500 text-white px-4 py-2 font-display font-bold text-sm hover:bg-chili-600 transition active:scale-[0.97]"
								>
									<PencilSimple size={15} weight="bold" />
									Open &amp; edit
									<ArrowRight size={14} />
								</Link>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
