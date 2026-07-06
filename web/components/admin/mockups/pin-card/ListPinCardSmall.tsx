"use client";

import { ExploreCard } from "@/components/explore/ExploreCard";
import type { ExploreCardMockupProps } from "../explore-card/types";
import { PinCardFrame } from "./PinCardFrame";

// Candidate: the List card, scaled DOWN. Same ExploreCard as "List card" but
// zoomed to ~80%, so every font, the logo, the pills and the spacing all shrink
// together — a more compact popup for a phone map. `zoom` (not transform:scale)
// so the box actually reflows to the smaller size and the frame hugs it.
const SCALE = 0.8;

export function ListPinCardSmall({
	r,
	pills,
	dishName,
	fallbackOrigin,
}: ExploreCardMockupProps) {
	return (
		<PinCardFrame width="fit-content">
			<div
				className="@container rounded-2xl bg-white shadow-xl overflow-hidden p-2.5 w-[300px]"
				style={{ zoom: SCALE }}
			>
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
