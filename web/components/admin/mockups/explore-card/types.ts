import type { PlaceCardData } from "@/components/PlaceCard";
import type { DishPill } from "@/lib/types";
import type { LatLng } from "@/lib/useUserLocation";

// Prop contract for Explore place-card mockups. `pills` + `dishName` are the
// dish-search context: the matched menu items (labelled variant prices
// included, on DishPill.variants since 2026-07-06) and what the user searched
// ("momo"). The production ExploreCard sizes itself from its @container
// parent, so `viewport` only matters to designs that branch layouts manually.
export type ExploreCardMockupProps = {
	r: PlaceCardData;
	viewport: "desktop" | "mobile";
	pills?: DishPill[];
	dishName?: string;
	fallbackOrigin?: LatLng;
	onViewMap?: () => void;
};
