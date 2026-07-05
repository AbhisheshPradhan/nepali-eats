"use client";

import { PlaceCard } from "@/components/PlaceCard";
import { ExploreListCard } from "@/components/explore/ExploreListCard";
import type { ExploreCardMockupProps } from "./types";

// ARCHIVED: what Explore rendered before the unified ExploreCard (2026-07-06)
// — the row-variant PlaceCard in the desktop side panel (big photo column
// left) and the compact flat list row on mobile, both rendered and one hidden
// per breakpoint. Kept browsable here because the desktop row look may find
// another home later; the components it uses still live in the codebase.
export function ClassicSplitCard({
	r,
	viewport,
	pills,
	fallbackOrigin,
	onViewMap,
}: ExploreCardMockupProps) {
	return viewport === "mobile" ? (
		<ExploreListCard
			r={r}
			pills={pills}
			fallbackOrigin={fallbackOrigin}
			onViewMap={onViewMap}
		/>
	) : (
		<PlaceCard
			r={r}
			variant="row"
			pills={pills}
			fallbackOrigin={fallbackOrigin}
			onViewMap={onViewMap}
		/>
	);
}
