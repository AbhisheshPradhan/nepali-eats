"use client";

import { PlaceCard } from "@/components/PlaceCard";
import type { ExploreCardMockupProps } from "../explore-card/types";
import { PinCardFrame } from "./PinCardFrame";

// What the map pin popup renders TODAY: the compact PlaceCard. It carries no
// menu data, so dish-search matches never show here — the gap this lab exists
// to close. (pills/dishName are ignored on purpose, to show the status quo.)
export function CurrentPinCard({ r }: ExploreCardMockupProps) {
	return (
		<PinCardFrame width={230}>
			<PlaceCard r={r} className="w-[230px]" newTab noHover />
		</PinCardFrame>
	);
}
