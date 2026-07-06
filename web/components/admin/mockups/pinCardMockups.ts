import type { ComponentType } from "react";
import type { ExploreCardMockupProps } from "./explore-card/types";
import { ListPinCard } from "./pin-card/ListPinCard";
import { ListPinCardSmall } from "./pin-card/ListPinCardSmall";

// Registry of Explore MAP PIN CARD candidates for the playground. Each renders
// a card design inside the shared map-popup frame (PinCardFrame). The "current"
// PlaceCard is added by the lab as the reference; author new candidates under
// ./pin-card/ (props = ExploreCardMockupProps, reusing the explore-card knobs)
// and list them here. When one wins, port it into MapView's popup + dock card.
export type PinCardMockup = {
	id: string;
	label: string;
	Component: ComponentType<ExploreCardMockupProps>;
};

export const PIN_CARD_MOCKUPS: PinCardMockup[] = [
	{ id: "list", label: "List card", Component: ListPinCard },
	{ id: "list-small", label: "List card (small)", Component: ListPinCardSmall },
];
