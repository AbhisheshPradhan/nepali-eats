import { MapTrifold } from "@phosphor-icons/react/dist/ssr";
import { PlaceCard } from "@/components/PlaceCard";
import { Button } from "@/components/ui/Button";
import type { Restaurant } from "@/lib/types";

export function ListingGrid({
	eyebrow,
	title,
	intro,
	restaurants,
	exploreHref,
}: {
	eyebrow: string;
	title: string;
	intro: string;
	restaurants: Restaurant[];
	exploreHref?: string;
}) {
	return (
		<div className="max-w-[1180px] mx-auto px-6 pt-10 pb-4">
			<div className="flex items-end justify-between flex-wrap gap-3 mb-7">
				<div className="max-w-[680px]">
					<span className="eyebrow text-chili-500">{eyebrow}</span>
					<h1 className="text-[2.6rem] text-ink-900 mt-1.5 mb-2">
						{title}
					</h1>
					<p className="text-ink-700 text-[1.15rem] leading-relaxed">
						{intro}
					</p>
				</div>
				{exploreHref && (
					<Button
						href={exploreHref}
						variant="outline"
						iconLeft={<MapTrifold size={18} />}
					>
						View on map
					</Button>
				)}
			</div>

			{restaurants.length === 0 ? (
				<p className="text-ink-500 py-12 text-center">
					No spots here yet. Try the map to explore nearby.
				</p>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{restaurants.map((r) => (
						<PlaceCard
							key={r.id}
							r={r}
						/>
					))}
				</div>
			)}
		</div>
	);
}
