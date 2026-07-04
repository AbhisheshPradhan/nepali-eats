"use client";
import Image from "next/image";
import Link from "next/link";
import { MapTrifold } from "@phosphor-icons/react";
import { Rating } from "@/components/ui/Rating";
import { PriceLevel } from "@/components/ui/PriceLevel";
import { VenueType } from "@/components/ui/VenueType";
import { OpenStatusBadge } from "@/components/OpenStatusBadge";
import { Avatar } from "@/components/Avatar";
import type { PlaceCardData } from "@/components/PlaceCard";
import { mediaUrl } from "@/lib/media";
import { haversineKm, formatDistance } from "@/lib/format";
import { useUserLocation, type LatLng } from "@/lib/useUserLocation";

// Compact Google-Maps-style row for the MOBILE Explore list (the desktop side
// panel keeps the bigger PlaceCard). No card box — flat rows split by a bottom
// border. Text left, square photo right; the whole row links to the detail
// page, and a "View on map" CTA in the bottom row jumps to the map centred on
// the spot without navigating.
export function ExploreListCard({
	r,
	pills,
	fallbackOrigin,
	onViewMap,
}: {
	r: PlaceCardData;
	pills?: string[];
	fallbackOrigin?: LatLng;
	onViewMap?: () => void;
}) {
	const userLoc = useUserLocation();
	const distOrigin = userLoc ?? fallbackOrigin ?? null;
	const distance =
		distOrigin && r.lat != null && r.lng != null
			? formatDistance(haversineKm(distOrigin, r.lat, r.lng))
			: undefined;
	const img = mediaUrl(r.logoKey) ?? mediaUrl(r.primaryPhoto);
	const location = [r.suburb, r.state].filter(Boolean).join(", ");

	return (
		<Link
			href={`/restaurant/${r.slug}`}
			className="block py-3.5 border-b border-paper-300 active:bg-paper-100 transition-colors"
		>
			<div className="flex items-start gap-3">
				<div className="min-w-0 flex-1 flex flex-col gap-1">
					<span className="font-display font-bold text-[1.05rem] text-ink-900 leading-tight line-clamp-2">
						{r.name}
					</span>
					<div className="flex items-center gap-2 min-w-0">
						{r.rating != null && (
							<Rating
								value={r.rating}
								count={r.reviewCount}
								size={14}
							/>
						)}
						<PriceLevel level={r.priceLevel ?? 0} />
					</div>
					{(location || distance) && (
						<div className="flex items-center gap-1.5 text-ink-500 text-[0.9rem] min-w-0">
							{location && (
								<span className="truncate min-w-0">{location}</span>
							)}
							{distance && (
								<span className="shrink-0 whitespace-nowrap">
									· {distance}
								</span>
							)}
						</div>
					)}
					<div className="flex items-center gap-2.5 min-w-0">
						<VenueType type={r.venueType} />
					</div>
				</div>
				<div className="relative w-[92px] h-[92px] shrink-0 rounded-lg overflow-hidden bg-paper-200">
					{img ? (
						<Image
							src={img}
							alt={r.name}
							fill
							sizes="92px"
							className="object-cover"
						/>
					) : (
						<div className="absolute inset-0 grid place-items-center">
							<Avatar
								name={r.name}
								logoKey={r.logoKey}
								id={r.id}
								size={56}
							/>
						</div>
					)}
				</div>
			</div>

			{/* dish-search matches: one horizontally-scrollable row (scrollbar
			    hidden). TODO: when per-dish photos land, swap the pills for a photo
			    carousel of the matched items. */}
			{pills && pills.length > 0 && (
				<div className="mt-2 flex gap-1.5 flex-nowrap overflow-x-auto scrollbar-hide">
					{pills.map((p) => (
						<span
							key={p}
							className="shrink-0 whitespace-nowrap inline-flex items-center font-body font-semibold text-[0.76rem] text-marigold-700 bg-marigold-100 px-2 py-0.5 rounded-full"
						>
							{p}
						</span>
					))}
				</div>
			)}

			{/* bottom row: live open status + the "View on map" CTA */}
			<div className="mt-2.5 flex items-center justify-between gap-2 min-w-0">
				<OpenStatusBadge
					openingHours={r.openingHours}
					state={r.state}
					businessStatus={r.businessStatus ?? null}
					size="sm"
					className="min-w-0 max-w-full"
				/>
				{onViewMap && (
					<button
						type="button"
						onClick={(e) => {
							// inside the card's <Link>: don't navigate, just move the map
							e.preventDefault();
							e.stopPropagation();
							onViewMap();
						}}
						className="shrink-0 inline-flex items-center gap-1.5 rounded-full border-2 border-chili-500 text-chili-600 font-display font-bold text-[0.85rem] px-3 py-1.5 transition-colors hover:bg-chili-500 hover:text-white active:bg-chili-500 active:text-white cursor-pointer"
					>
						<MapTrifold size={15} weight="fill" />
						View on map
					</button>
				)}
			</div>
		</Link>
	);
}
