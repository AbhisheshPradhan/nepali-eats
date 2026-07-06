"use client";

import { ExploreCard } from "@/components/explore/ExploreCard";
import type { ExploreCardMockupProps } from "../explore-card/types";
import { PinCardFrame } from "./PinCardFrame";

// Candidate: the Explore LIST card as the pin popup. Renders the real
// ExploreCard (the same component the list uses) at popup width inside a white
// card, so the matched-dish pills we already show in the list appear on the map
// too. ExploreCard sizes off its @container parent, so the ~300px frame makes it
// pick its compact row layout. No "View on map" here (you're already on it).
export function ListPinCard({
	r,
	pills,
	dishName,
	fallbackOrigin,
}: ExploreCardMockupProps) {
	return (
		<PinCardFrame width={300}>
			<div className="@container rounded-2xl bg-white shadow-xl overflow-hidden p-2.5">
				<ExploreCard
					r={r}
					pills={pills}
					dishName={dishName}
					fallbackOrigin={fallbackOrigin}
				/>
			</div>
		</PinCardFrame>
	);
}
