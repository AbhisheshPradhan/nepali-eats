"use client";
import { useEffect, useState } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { Carousel } from "@/components/Carousel";
import { PlaceCard } from "@/components/PlaceCard";
import { Button } from "@/components/ui/Button";
import { useUserLocation, type LatLng } from "@/lib/useUserLocation";
import { haversineKm, formatDistance } from "@/lib/format";
import type { Restaurant } from "@/lib/types";

// Featured spots row. The server SSRs an IP-scoped set (`gems`/`state`/`metro`);
// once the visitor has shared their location we re-scope to their ACTUAL state
// via /api/featured, swapping both the cards and the "Where {metro}'s eating"
// heading. Distance per card is computed client-side from each card's lat/lng
// (so the page stays cacheable/SEO-safe), using the shared location when
// available, otherwise the state capital (`fallbackLoc`). Uses the shared
// Carousel for the header + arrows; mobile also gets a "View all spots" button.
export function FeaturedCards({
	gems,
	state,
	metro,
	fallbackLoc,
}: {
	gems: Restaurant[];
	state: string;
	metro: string;
	fallbackLoc?: LatLng;
}) {
	const loc = useUserLocation();
	const origin = loc ?? fallbackLoc ?? null;

	// Starts at the server's IP-scoped render; the effect below swaps it when the
	// visitor's shared location resolves to a different state.
	const [view, setView] = useState({ gems, state, metro });

	useEffect(() => {
		if (!loc) return;
		const ctrl = new AbortController();
		fetch(`/api/featured?lat=${loc[0]}&lng=${loc[1]}`, { signal: ctrl.signal })
			.then((r) => r.json())
			.then((d: { gems: Restaurant[]; state: string; metro: string }) => {
				if (!d?.state) return;
				// only re-render when the visitor's real state differs from what's shown
				setView((prev) =>
					d.state === prev.state ? prev : { gems: d.gems, state: d.state, metro: d.metro },
				);
			})
			.catch(() => {});
		return () => ctrl.abort();
	}, [loc?.[0], loc?.[1]]);

	const cards = view.gems.map((r) => {
		const distance =
			origin && r.lat != null && r.lng != null
				? formatDistance(haversineKm(origin, r.lat, r.lng))
				: undefined;
		return { r, distance };
	});

	return (
		<div>
			<Carousel
				eyebrow="Local favourites"
				eyebrowClassName="text-marigold-700"
				title={`Where ${view.metro}'s eating this week`}
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
