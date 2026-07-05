import type { ComponentType } from "react";
import type { ExploreCardMockupProps } from "./explore-card/types";
import { MenuPeekCard } from "./explore-card/MenuPeekCard";
import { MatchSummaryCard } from "./explore-card/MatchSummaryCard";
import { UnifiedRowCard } from "./explore-card/UnifiedRowCard";
import { ClassicSplitCard } from "./explore-card/ClassicSplitCard";

// Registry of Explore place-card mockups for the UI Playground (separate from
// the homepage PLACE_CARD_MOCKUPS registry: Explore cards carry dish-search
// matches and render as a desktop row / mobile list row, not the vertical
// card). Add a candidate by dropping a component under ./explore-card/ (props
// = ExploreCardMockupProps) and listing it here. When one wins, port its dish
// treatment into PlaceCard/ExploreListCard and remove it from this list.
export type ExploreCardMockup = {
	id: string;
	label: string;
	Component: ComponentType<ExploreCardMockupProps>;
};

export const EXPLORE_CARD_MOCKUPS: ExploreCardMockup[] = [
	{ id: "unified", label: "Unified + variants", Component: UnifiedRowCard },
	{ id: "menu-peek", label: "Menu peek", Component: MenuPeekCard },
	{ id: "match-summary", label: "Match summary", Component: MatchSummaryCard },
	// the pre-unification desktop-row/mobile-list pair, kept browsable
	{ id: "classic", label: "Classic (archived)", Component: ClassicSplitCard },
];
