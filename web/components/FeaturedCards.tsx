"use client";
import { ArrowRight } from "@phosphor-icons/react";
import { Carousel } from "@/components/Carousel";
import { PlaceCard } from "@/components/PlaceCard";
import { Button } from "@/components/ui/Button";
import { useUserLocation, type LatLng } from "@/lib/useUserLocation";
import { haversineKm, formatDistance } from "@/lib/format";
import type { Restaurant } from "@/lib/types";

// Featured spots row. Renders a straight-line distance per card (computed
// client-side from each card's lat/lng, so the page stays cacheable/SEO-safe),
// using the visitor's shared location when available, otherwise the state
// capital (`fallbackLoc`). Uses the shared Carousel for the header + arrows;
// mobile also gets a "View all spots" button below the row.
export function FeaturedCards({
	gems,
	metro,
	fallbackLoc,
}: {
	gems: Restaurant[];
	metro: string;
	fallbackLoc?: LatLng;
}) {
	const loc = useUserLocation() ?? fallbackLoc ?? null;

	const cards = gems.map((r) => {
		const distance =
			loc && r.lat != null && r.lng != null
				? formatDistance(haversineKm(loc, r.lat, r.lng))
				: undefined;
		return { r, distance };
	});

	return (
		<div>
			<Carousel
				eyebrow="Local favourites"
				eyebrowClassName="text-marigold-700"
				title={`Where ${metro}'s eating this week`}
				trackClassName="gap-4 sm:gap-5 px-2 pt-3 pb-2.5"
				scrollBy={480}
			>
				{cards.map(({ r, distance }) => (
					<div
						key={r.id}
						className="shrink-0 w-[76%] max-w-70 sm:w-[230px] snap-start"
					>
						<PlaceCard
							r={r}
							distance={distance}
							hideState
						/>
					</div>
				))}
			</Carousel>
		</div>
	);
}
