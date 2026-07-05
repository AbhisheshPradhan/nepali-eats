"use client";
import Image from "next/image";
import Link from "next/link";
import { FeaturedBadge, PopularBadge } from "@/components/ui/PlaceBadges";
import { Rating } from "@/components/ui/Rating";
import { CardMeta } from "@/components/ui/CardMeta";
import { CardActions } from "@/components/ui/CardActions";
import { VenueType } from "@/components/ui/VenueType";
import { Avatar } from "@/components/Avatar";
import { CardCarousel } from "@/components/CardCarousel";
import { OpenStatusBadge } from "@/components/OpenStatusBadge";
import type { Restaurant, DishPill } from "@/lib/types";
import { mediaUrl } from "@/lib/media";
import { hueFromId, haversineKm, formatDistance, dishPrice } from "@/lib/format";
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
	hasMenu?: boolean; // menu seeded on the site -> "See the menu" action
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
	// when 2+ slides result, the image slot becomes a photo carousel (Explore map
	// popup). Fewer than 2 falls back to the single image below.
	gallery?: string[];
	// optional brand logo, shown as the first (contained, not cropped) slide so
	// the venue is instantly recognisable before the food photos.
	galleryLogo?: string | null;
	// matched menu items on a dish search ("Steamed Momo", "Jhol Momo") with
	// their price, shown as small pills so the user sees WHY this spot matched
	// and what it costs. Capped; the overflow shows as "+N more".
	pills?: DishPill[];
};

const MAX_PILLS = 4;

// One card, two layouts:
//   "card" — vertical (homepage featured, listings, map popup)
//   "row"  — horizontal; adds hover/selected highlight + opens in a new tab.
//            ARCHIVED from Explore (2026-07-06): the list now renders the
//            unified ExploreCard, so nothing ships "row" except the admin
//            PlaceCardLab. Kept on purpose (the big-photo row look may find
//            another home later) — don't strip the variant.
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
	gallery,
	galleryLogo,
	pills,
}: PlaceCardProps) {
	// Carousel slides = logo (if any) first, then the food photos.
	const carouselSlides = galleryLogo
		? [galleryLogo, ...(gallery ?? [])]
		: (gallery ?? []);
	const row = variant === "row";
	// Row cards always open in a new tab; other cards opt in via `newTab`.
	const openNewTab = newTab ?? row;
	// Prefer the brand logo as the card image; fall back to the hero photo.
	const img = mediaUrl(r.logoKey) ?? mediaUrl(r.primaryPhoto);
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
				{carouselSlides.length > 1 ? (
					<CardCarousel
						photos={carouselSlides}
						logoFirst={!!galleryLogo}
						alt={r.name}
					/>
				) : img ? (
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

				<CardMeta
					priceLevel={r.priceLevel}
					location={location}
					distance={distance}
					className="text-[0.95rem]"
				/>

				{/* dish-search matches: the items that made this spot a result */}
				{pills && pills.length > 0 && (
					<div className="flex flex-wrap gap-1.5">
						{pills.slice(0, MAX_PILLS).map((p) => (
							<span
								key={p.label}
								className="inline-flex items-center gap-1 max-w-full font-body font-semibold text-[0.78rem] text-marigold-700 bg-marigold-100 px-2 py-0.5 rounded-full"
							>
								<span className="truncate min-w-0">
									{p.label}
								</span>
								{p.price != null && (
									<span className="shrink-0 whitespace-nowrap text-chili-600">
										· {p.priceFrom ? "from " : ""}
										{dishPrice(p.price)}
									</span>
								)}
							</span>
						))}
						{pills.length > MAX_PILLS && (
							<span className="inline-flex items-center font-body font-semibold text-[0.78rem] text-ink-500 px-1 py-0.5">
								+{pills.length - MAX_PILLS} more
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
				<div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
					<OpenStatusBadge
						openingHours={r.openingHours}
						state={r.state}
						businessStatus={r.businessStatus ?? null}
						size="sm"
						className="min-w-0 max-w-full"
					/>

					<CardActions
						slug={r.slug}
						hasMenu={r.hasMenu}
						onViewMap={onViewMap}
						compact
					/>
				</div>
			</div>
		</Link>
	);

	return card;
}
