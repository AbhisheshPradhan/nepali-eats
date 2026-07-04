import Link from "next/link";
import { suburbSlug } from "@/lib/format";
import type { Facet } from "@/lib/types";

// Homepage strip of suburb-page links (LAUNCH.md §2/§6). This carries the
// in-content homepage links the footer can't: the footer holds the sitewide
// state/dish/cuisine columns, this holds the suburb hotspots, so the two
// never duplicate each other.
export function MomoHotspots({
	suburbs,
}: {
	// suburbFacets() rows; the strip shows the busiest ones.
	suburbs: (Facet & { state: string })[];
}) {
	const chips = suburbs.filter((s) => s.count >= 2).slice(0, 8);
	if (chips.length === 0) return null;

	return (
		<section className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-14">
			<h2 className="font-display font-extrabold text-[1.6rem] text-ink-900 mb-1.5">
				Where the momo lives
			</h2>
			<p className="text-ink-700 mb-5 max-w-[640px]">
				The suburbs with the most Nepali kitchens. Pick one and start
				walking.
			</p>
			<div className="flex flex-wrap gap-2.5">
				{chips.map((s) => (
					<Link
						key={`${s.value}-${s.state}`}
						href={`/nepali-restaurants/${suburbSlug(s.value, s.state)}`}
						className="bg-white border border-paper-300 rounded-full pl-4 pr-3 py-2 font-display font-semibold text-ink-900 shadow-sm hover:text-chili-600 hover:border-chili-300 transition-colors inline-flex items-center gap-2"
					>
						{s.value}, {s.state}
						<span className="text-ink-500 font-semibold text-[0.85em] tabular-nums">
							{s.count}
						</span>
					</Link>
				))}
			</div>
			<p className="text-ink-700 mt-5">
				Chasing a dish instead?{" "}
				<Link
					href="/nepali-food"
					className="text-chili-600 font-semibold hover:text-chili-700"
				>
					See every dish and cuisine
				</Link>
				.
			</p>
		</section>
	);
}
