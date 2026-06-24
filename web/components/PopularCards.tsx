"use client";
import { useEffect, useState } from "react";
import { Carousel } from "@/components/Carousel";
import { PlaceCard } from "@/components/PlaceCard";
import { useUserLocation, type LatLng } from "@/lib/useUserLocation";
import { capitalLatLng } from "@/lib/format";
import type { Restaurant } from "@/lib/types";

// "Popular" row: hand-flagged crowd favourites, state-scoped like Featured (but
// the free tag, never the paid Featured picks). The server SSRs an IP-scoped set
// (`popular`/`state`/`metro`); once the visitor shares their location we re-scope
// to their ACTUAL state via /api/popular, swapping cards + heading. The row is
// strict: a state with no flagged spots returns none, and this renders nothing,
// so the section only appears where the user is AND where there's a pick.
export function PopularCards({
	popular,
	state,
	metro,
}: {
	popular: Restaurant[];
	state: string;
	metro: string;
}) {
	const loc = useUserLocation();

	// Starts at the server's IP-scoped render; the effect below swaps it when the
	// visitor's shared location resolves to a different state.
	const [view, setView] = useState({ popular, state, metro });

	useEffect(() => {
		if (!loc) return;
		const ctrl = new AbortController();
		(async () => {
			try {
				const r = await fetch(`/api/popular?lat=${loc[0]}&lng=${loc[1]}`, {
					signal: ctrl.signal,
				});
				const d: { popular: Restaurant[]; state: string; metro: string } =
					await r.json();
				if (!d?.state) return;
				// only re-render when the visitor's real state differs from what's shown
				setView((prev) =>
					d.state === prev.state
						? prev
						: {
								popular: d.popular,
								state: d.state,
								metro: d.metro,
							},
				);
			} catch (err) {
				if ((err as Error)?.name !== "AbortError") {
					// network/parse error: keep the SSR'd view, nothing to do
				}
			}
		})();
		return () => ctrl.abort(new DOMException("unmounted", "AbortError"));
	}, [loc?.[0], loc?.[1]]);

	// Nothing flagged for this state → no section at all.
	if (!view.popular.length) return null;

	// Distances fall back to the (current) state capital until the visitor shares
	// their real location, matching the Featured row.
	const fallbackLoc = capitalLatLng(view.state);

	return (
		<section className="max-w-[1180px] mx-auto px-4 sm:px-6 pb-4 sm:pb-6">
			<Carousel
				eyebrow="Popular"
				eyebrowClassName="text-chili-600"
				title={`What ${view.metro} can't stop ordering`}
				trackClassName="gap-4 sm:gap-5 px-2 pt-3 pb-2.5"
				scrollBy={480}
			>
				{view.popular.map((r) => (
					<div
						key={r.id}
						className="shrink-0 w-[76%] max-w-60 sm:max-w-70 sm:w-[230px] snap-start"
					>
						<PlaceCard
							r={r}
							fallbackOrigin={fallbackLoc}
							hideState
						/>
					</div>
				))}
			</Carousel>
		</section>
	);
}
