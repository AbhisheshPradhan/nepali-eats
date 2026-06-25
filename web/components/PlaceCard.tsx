"use client";
import Image from "next/image";
import Link from "next/link";
import { MapTrifold } from "@phosphor-icons/react";
import { FeaturedBadge, PopularBadge } from "@/components/ui/PlaceBadges";
import { Rating } from "@/components/ui/Rating";
import { VenueType } from "@/components/ui/VenueType";
import { PriceLevel } from "@/components/ui/PriceLevel";
import { Avatar } from "@/components/Avatar";
import { OpenStatusBadge } from "@/components/OpenStatusBadge";
import type { Restaurant } from "@/lib/types";
import { mediaUrl } from "@/lib/media";
import { hueFromId, haversineKm, formatDistance } from "@/lib/format";
import { useUserLocation, type LatLng } from "@/lib/useUserLocation";
import { cn } from "@/lib/cn";

// The card only needs these fields, so both a full Restaurant and a map pin
// (RestaurantPin + openingHours) can be passed.
export type PlaceCardData = Pick<
	Restaurant,
	| "id"
	| "slug"
	| "name"
	| "venueType"
	| "rating"
	| "reviewCount"
	| "suburb"
	| "state"
	| "primaryPhoto"
	| "openingHours"
	| "lat"
	| "lng"
> & {
	// optional: map-popup pins don't carry these, only full restaurant rows do
	isFeatured?: boolean;
	popular?: boolean;
	logoKey?: string | null;
	priceLevel?: number | null;
	priceRange?: string | null;
	businessStatus?: string | null;
};

// The full prop contract, exported so UI-Playground mockups can be typed as
// drop-in replacements for PlaceCard (same props in, swap the body out).
export type PlaceCardProps = {
	r: PlaceCardData;
	// Optional fallback reference point for distance when the visitor hasn't
	// shared their location (home: state capital; Explore: arrival point).
	fallbackOrigin?: LatLng;
	className?: string;
	href?: string;
	variant?: "card" | "row";
	selected?: boolean;
	hovered?: boolean;
	onHover?: (id: number | null) => void;
	newTab?: boolean;
	// drop the lift-on-hover effect (used for the static map popup card)
	noHover?: boolean;
	// show only the suburb (no ", STATE"), e.g. homepage featured cards
	hideState?: boolean;
	// when set, renders a "View on map" button (Explore list) that centres the map
	// on this spot instead of navigating to the detail page
	onViewMap?: () => void;
};

// One card, two layouts:
//   "card" — vertical (homepage featured, listings, map popup)
//   "row"  — horizontal (Explore list); adds hover/selected highlight + opens
//            in a new tab. Both modes show the same details.
export function PlaceCard({
	r,
	fallbackOrigin,
	className,
	href,
	variant = "card",
	selected = false,
	hovered = false,
	onHover,
	newTab,
	noHover = false,
	hideState = false,
	onViewMap,
}: PlaceCardProps) {
	const row = variant === "row";
	// Row cards always open in a new tab; other cards opt in via `newTab`.
	const openNewTab = newTab ?? row;
	// Prefer the brand logo as the card image; fall back to the hero photo.
	const img = mediaUrl(r.logoKey) ?? mediaUrl(r.primaryPhoto);
	// Price as a 4-pip dollar scale: the level's signs filled, the rest muted.
	const priceLevel = r.priceLevel ? Math.min(4, r.priceLevel) : 0;
	const hue = hueFromId(r.id);
	const location = [r.suburb, hideState ? null : r.state]
		.filter(Boolean)
		.join(", ");
	const hi = hovered || selected;
	const featured = !!r.isFeatured;
	const popular = !!r.popular;

	// Distance is computed here (not passed in) so every PlaceCard renders the
	// same UI. Origin = the visitor's shared location (one app-wide context, so
	// a big grid doesn't fire N geolocation calls), else the caller's fallback.
	const userLoc = useUserLocation();
	const distOrigin = userLoc ?? fallbackOrigin ?? null;
	const distance =
		distOrigin && r.lat != null && r.lng != null
			? formatDistance(haversineKm(distOrigin, r.lat, r.lng))
			: undefined;

	const card = (
		<Link
			href={href ?? `/restaurant/${r.slug}`}
			{...(openNewTab
				? { target: "_blank", rel: "noopener noreferrer" }
				: {})}
			onMouseEnter={onHover ? () => onHover(r.id) : undefined}
			onMouseLeave={onHover ? () => onHover(null) : undefined}
			className={cn(
				"group bg-white overflow-hidden rounded-lg transition",
				row
					? cn(
							"flex flex-col sm:flex-row border-2",
							selected ? "bg-paper-100" : "bg-white",
							hi
								? "border-chili-500 shadow-md"
								: "border-paper-300 shadow-sm",
						)
					: cn(
							"flex flex-col shadow-md",
							!noHover && "hover:shadow-lg hover:-translate-y-1",
						),
				className,
			)}
		>
			{/* image */}
			<div
				className={cn(
					"relative overflow-hidden",
					row
						? "w-full aspect-[4/3] shrink-0 sm:aspect-auto sm:w-[210px] sm:h-auto sm:min-h-[190px] sm:self-stretch"
						: "aspect-[4/3]",
				)}
				style={{
					background: `linear-gradient(135deg, hsl(${hue} 90% 62%), hsl(${(hue + 24) % 360} 85% 55%))`,
				}}
			>
				{img ? (
					<Image
						src={img}
						alt={r.name}
						fill
						sizes="(max-width: 768px) 100vw, 360px"
						className={cn(
							"object-cover",
							!row &&
								!noHover &&
								"transition-transform duration-500 group-hover:scale-105",
						)}
					/>
				) : (
					<div className="absolute inset-0 grid place-items-center">
						<Avatar
							name={r.name}
							logoKey={r.logoKey}
							id={r.id}
							size={row ? 84 : 96}
						/>
					</div>
				)}

				{/* Featured + Popular badges, stacked top-left */}
				{(featured || popular) && (
					<div className="absolute top-3 left-3 right-3 flex flex-col items-start gap-2">
						{featured && <FeaturedBadge />}
						{popular && <PopularBadge />}
					</div>
				)}
			</div>

			{/* body */}
			<div className="flex flex-col gap-2.5 p-4 flex-1 min-w-0">
				<h3 className="font-display font-bold text-[18px] text-ink-900 leading-tight truncate min-w-0">
					{r.name}
				</h3>

				{r.rating != null && (
					<Rating
						value={r.rating}
						count={r.reviewCount}
						size={16}
					/>
				)}

				{/* Meta line: "$$ · Sydney · 4.2 km". Price (dollar signs) and
            distance each show only when known; suburb truncates so distance
            (the valuable bit) stays pinned. */}
				{(priceLevel > 0 || location || distance) && (
					<div className="flex items-center gap-1.5 text-ink-500 text-[0.95rem] min-w-0">
						<PriceLevel level={priceLevel} />
						{priceLevel > 0 && location && (
							<span className="shrink-0">·</span>
						)}
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

				{/* venue-type tag (moved down off the photo) */}
				<div className="mt-auto flex items-center gap-2 pt-0.5">
					<VenueType type={r.venueType} />
				</div>

				{/* Bottom row: live open/closed status (hidden until mounted / when no
            hours), plus the Explore "View on map" action pinned to the right. */}
				<div className="flex items-center justify-between gap-2 min-w-0">
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
								// sits inside the card's <Link>; don't navigate, just move the map
								e.preventDefault();
								e.stopPropagation();
								onViewMap();
							}}
							className="shrink-0 inline-flex items-center gap-1.5 rounded-full border-2 border-chili-500 text-chili-600 font-display font-bold text-[0.85rem] px-2 py-1 transition-colors hover:bg-chili-500 hover:text-white cursor-pointer"
						>
							<MapTrifold
								size={15}
								weight="fill"
							/>
							View on map
						</button>
					)}
				</div>
			</div>
		</Link>
	);

	return card;
}
