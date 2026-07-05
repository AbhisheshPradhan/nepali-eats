"use client";

import { ExploreCard } from "@/components/explore/ExploreCard";
import type { ExploreCardMockupProps } from "./types";

// What Explore renders today: the unified ExploreCard (2026-07-06). It sizes
// itself off its @container parent (the lab's preview wrapper), so the
// viewport prop is unused here — the wrapper's width IS the viewport.
export function CurrentExploreCard({
	r,
	pills,
	dishName,
	fallbackOrigin,
	onViewMap,
}: ExploreCardMockupProps) {
	return (
		<ExploreCard
			r={r}
			pills={pills}
			dishName={dishName}
			fallbackOrigin={fallbackOrigin}
			onViewMap={onViewMap}
		/>
	);
}
