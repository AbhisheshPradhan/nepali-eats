"use client";
import { useEffect, useState } from "react";
import { Carousel } from "@/components/Carousel";
import { PlaceCard } from "@/components/PlaceCard";
import { useUserLocation, type LatLng } from "@/lib/useUserLocation";
import type { Restaurant } from "@/lib/types";

// Featured spots row. The server SSRs an IP-scoped set (`gems`/`state`/`metro`);
// once the visitor has shared their location we re-scope to their ACTUAL state
// via /api/featured, swapping both the cards and the "Where {metro}'s eating"
// heading. Each PlaceCard computes its own distance from the shared location
// (or the state capital `fallbackLoc` until then), so the page stays cacheable.
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

	// Starts at the server's IP-scoped render; the effect below swaps it when the
	// visitor's shared location resolves to a different state.
	const [view, setView] = useState({ gems, state, metro });

	useEffect(() => {
		if (!loc) return;
		const ctrl = new AbortController();
		fetch(`/api/featured?lat=${loc[0]}&lng=${loc[1]}`, {
			signal: ctrl.signal,
		})
			.then((r) => r.json())
			.then((d: { gems: Restaurant[]; state: string; metro: string }) => {
				if (!d?.state) return;
				// only re-render when the visitor's real state differs from what's shown
				setView((prev) =>
					d.state === prev.state
						? prev
						: { gems: d.gems, state: d.state, metro: d.metro },
				);
			})
			.catch(() => {});
		return () => ctrl.abort();
	}, [loc?.[0], loc?.[1]]);

	return (
		<div>
			<Carousel
				eyebrow="Local favourites"
				eyebrowClassName="text-marigold-700"
				title={`Where ${view.metro}'s eating this week`}
				trackClassName="gap-4 sm:gap-5 px-2 pt-3 pb-2.5"
				scrollBy={480}
			>
				{view.gems.map((r) => (
					<div
						key={r.id}
						className="shrink-0 w-[76%] max-w-70 sm:w-[230px] snap-start"
					>
						<PlaceCard
							r={r}
							fallbackOrigin={fallbackLoc}
							hideState
						/>
					</div>
				))}
			</Carousel>
		</div>
	);
}
