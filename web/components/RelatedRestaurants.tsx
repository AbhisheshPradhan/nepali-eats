import { PlaceCard } from "@/components/PlaceCard";
import type { Restaurant } from "@/lib/types";
import type { LatLng } from "@/lib/useUserLocation";

// A titled grid of related spots for the detail page's internal-linking blocks
// ("More {brand} locations" and "Other Nepali spots nearby"). Self-hides when
// there's nothing to show. Distance labels reference `origin` (the current
// restaurant) unless the visitor has shared their own location.
export function RelatedRestaurants({
	title,
	subtitle,
	restaurants,
	origin,
}: {
	title: string;
	subtitle?: string;
	restaurants: Restaurant[];
	origin?: LatLng;
}) {
	if (!restaurants.length) return null;
	return (
		<section className="px-4 sm:px-0 mt-10">
			<h2 className="font-display font-extrabold text-[1.5rem] mb-1">
				{title}
			</h2>
			{subtitle && <p className="text-ink-500 mt-0 mb-4">{subtitle}</p>}
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
				{restaurants.map((r) => (
					<PlaceCard
						key={r.id}
						r={r}
						fallbackOrigin={origin}
					/>
				))}
			</div>
		</section>
	);
}
