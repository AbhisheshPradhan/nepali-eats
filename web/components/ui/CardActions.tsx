"use client";

import { BookOpenText, MapTrifold } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

const BTN =
	"shrink-0 inline-flex items-center gap-1.5 rounded-full border-2 border-chili-500 text-chili-600 font-display font-bold text-[0.85rem] transition-colors hover:bg-chili-500 hover:text-white active:bg-chili-500 active:text-white cursor-pointer";

// The card CTA pair: "See the menu" (opens the detail page at the menu in a
// new tab so the current page stays put) + "View on map" (recentres the
// Explore map on the spot). Shared by PlaceCard and ExploreCard so the pill
// styling can't drift between cards. The buttons sit INSIDE the card's <Link>
// (no nested anchors), so they preventDefault/stopPropagation and act
// themselves. `compact` = the tighter padding the vertical PlaceCard uses.
export function CardActions({
	slug,
	hasMenu,
	onViewMap,
	compact = false,
}: {
	slug: string;
	hasMenu?: boolean;
	onViewMap?: () => void;
	compact?: boolean;
}) {
	if (!hasMenu && !onViewMap) return null;
	const pad = compact ? "px-2 py-1" : "px-3 py-1.5";
	return (
		<div className="shrink-0 flex items-center gap-1.5 ml-auto">
			{hasMenu && (
				<button
					type="button"
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						window.open(
							`/restaurant/${slug}#menu`,
							"_blank",
							"noopener,noreferrer",
						);
					}}
					className={cn(BTN, pad)}
				>
					<BookOpenText size={15} weight="fill" />
					See the menu
				</button>
			)}
			{onViewMap && (
				<button
					type="button"
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onViewMap();
					}}
					className={cn(BTN, pad)}
				>
					<MapTrifold size={15} weight="fill" />
					View on map
				</button>
			)}
		</div>
	);
}
