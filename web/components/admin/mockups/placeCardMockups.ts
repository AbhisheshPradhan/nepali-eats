import type { ComponentType } from "react";
import type { PlaceCardProps } from "@/components/PlaceCard";
import { OverlayCard } from "./place-card/OverlayCard";
import { CompactCard } from "./place-card/CompactCard";

// Registry of PlaceCard mockups for the UI Playground. Add a candidate by
// dropping a component under ./place-card/ (same props as PlaceCard) and listing
// it here; the lab renders each under the shared state toggles. When one wins,
// port it into components/PlaceCard.tsx and remove it from this list.
export type PlaceCardMockup = {
	id: string;
	label: string;
	Component: ComponentType<PlaceCardProps>;
};

export const PLACE_CARD_MOCKUPS: PlaceCardMockup[] = [
	{ id: "overlay", label: "Overlay", Component: OverlayCard },
	{ id: "compact", label: "Compact", Component: CompactCard },
];
