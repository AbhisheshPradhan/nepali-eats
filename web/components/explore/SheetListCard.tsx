"use client";
import Image from "next/image";
import { Rating } from "@/components/ui/Rating";
import { PriceLevel } from "@/components/ui/PriceLevel";
import { VenueType } from "@/components/ui/VenueType";
import { OpenStatusBadge } from "@/components/OpenStatusBadge";
import { Avatar } from "@/components/Avatar";
import type { PlaceCardData } from "@/components/PlaceCard";
import { mediaUrl } from "@/lib/media";
import { haversineKm, formatDistance } from "@/lib/format";
import { useUserLocation, type LatLng } from "@/lib/useUserLocation";

// Compact row for the mobile drawer list (Google-Maps-style entry): text left,
// square photo right, tap opens the in-drawer detail (no navigation). The big
// PlaceCard stays on desktop and the homepage.
export function SheetListCard({
	r,
	pills,
	fallbackOrigin,
	onOpen,
}: {
	r: PlaceCardData;
	pills?: string[];
	fallbackOrigin?: LatLng;
	onOpen: () => void;
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
		<button
			type="button"
			onClick={onOpen}
			className="w-full text-left flex items-start gap-3 py-3.5 border-b border-paper-300 last:border-0 cursor-pointer active:bg-paper-100 transition-colors"
		>
			<div className="min-w-0 flex-1 flex flex-col gap-1">
				{/* span, not h3: this is inside a <button> (h3 is invalid there);
				    line-clamp-2 so long Nepali names ("Everest Momo House & Bar")
				    wrap instead of truncating mid-word. */}
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
					<OpenStatusBadge
						openingHours={r.openingHours}
						state={r.state}
						businessStatus={r.businessStatus ?? null}
						size="sm"
						className="min-w-0"
					/>
				</div>
				{pills && pills.length > 0 && (
					<div className="flex gap-1.5 overflow-hidden">
						{pills.slice(0, 3).map((p) => (
							<span
								key={p}
								className="inline-flex items-center font-body font-semibold text-[0.76rem] text-marigold-700 bg-marigold-100 px-2 py-0.5 rounded-full whitespace-nowrap"
							>
								{p}
							</span>
						))}
						{pills.length > 3 && (
							<span className="inline-flex items-center font-body font-semibold text-[0.76rem] text-ink-500 whitespace-nowrap">
								+{pills.length - 3}
							</span>
						)}
					</div>
				)}
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
		</button>
	);
}
