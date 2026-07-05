"use client";

import { PriceLevel } from "@/components/ui/PriceLevel";
import { cn } from "@/lib/cn";

// The card meta line: "$$ · Suburb, STATE · 4.2 km". Price pips (clamped to
// the 4-pip scale) and distance each show only when known; the location
// truncates so the distance stays pinned. Shared by PlaceCard and ExploreCard
// so the price/location treatment can't drift between cards. Renders nothing
// when there is nothing to show.
export function CardMeta({
	priceLevel,
	location,
	distance,
	className,
}: {
	priceLevel?: number | null;
	location?: string;
	distance?: string;
	className?: string;
}) {
	const level = priceLevel ? Math.min(4, priceLevel) : 0;
	if (level <= 0 && !location && !distance) return null;
	return (
		<div
			className={cn(
				"flex items-center gap-1.5 text-ink-500 min-w-0",
				className,
			)}
		>
			<PriceLevel level={level} />
			{level > 0 && location && <span className="shrink-0">·</span>}
			{location && <span className="truncate min-w-0">{location}</span>}
			{distance && (
				<span className="shrink-0 whitespace-nowrap">· {distance}</span>
			)}
		</div>
	);
}
