"use client";
import { useEffect, useState } from "react";
import { Carousel } from "@/components/Carousel";
import { PlaceCard } from "@/components/PlaceCard";
import { useUserLocation } from "@/lib/useUserLocation";
import { capitalLatLng } from "@/lib/format";
import type { Restaurant } from "@/lib/types";

// One state-scoped homepage row, two flavours:
//   featured — editorial picks (non-null featured_rank), the paid row
//   popular  — hand-flagged crowd favourites (never featured rows)
// The server SSRs an IP-scoped set; once the visitor's shared location resolves
// to a DIFFERENT state we swap cards + heading via /api/{kind}. Each PlaceCard
// computes its own distance (shared location, else the shown state's capital),
// so the page stays cacheable. Renders nothing when the state has no picks.
const COPY = {
	featured: {
		eyebrow: "Featured",
		eyebrowClassName: "text-marigold-700",
		title: (metro: string) => `Where ${metro}'s eating this week`,
	},
	popular: {
		eyebrow: "Popular",
		eyebrowClassName: "text-chili-600",
		title: (metro: string) => `What ${metro} can't stop ordering`,
	},
} as const;

export function StateRow({
	kind,
	items,
	state,
	metro,
}: {
	kind: keyof typeof COPY;
	items: Restaurant[];
	state: string;
	metro: string;
}) {
	const loc = useUserLocation();
	const lat = loc?.[0];
	const lng = loc?.[1];

	// Starts at the server's IP-scoped render; swapped when the visitor's shared
	// location resolves to a different state.
	const [view, setView] = useState({ items, state, metro });

	useEffect(() => {
		if (lat == null || lng == null) return;
		const ctrl = new AbortController();
		fetch(`/api/${kind}?lat=${lat}&lng=${lng}`, { signal: ctrl.signal })
			.then((r) => r.json())
			.then((d: { items?: Restaurant[]; state?: string; metro?: string }) => {
				if (!d?.state || !d.metro) return;
				// only re-render when the real state differs from what's shown
				setView((prev) =>
					d.state === prev.state
						? prev
						: { items: d.items ?? [], state: d.state!, metro: d.metro! },
				);
			})
			.catch(() => {}); // network/parse/abort: keep the SSR'd view
		return () => ctrl.abort();
	}, [kind, lat, lng]);

	// No picks for this state -> no section at all (never look-alike filler).
	if (!view.items.length) return null;

	const c = COPY[kind];
	// Distance fallback follows the SHOWN state's capital until a real location lands.
	const fallbackLoc = capitalLatLng(view.state);

	return (
		<section className="max-w-[1180px] mx-auto px-4 sm:px-6 pb-6">
			<Carousel
				eyebrow={c.eyebrow}
				eyebrowClassName={c.eyebrowClassName}
				title={c.title(view.metro)}
				trackClassName="gap-4 sm:gap-5 px-2 pt-3 pb-2.5"
				scrollBy={480}
			>
				{view.items.map((r) => (
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
