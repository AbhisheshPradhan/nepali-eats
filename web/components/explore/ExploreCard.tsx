"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpenText, MapTrifold } from "@phosphor-icons/react";
import { FeaturedBadge, PopularBadge } from "@/components/ui/PlaceBadges";
import { Rating } from "@/components/ui/Rating";
import { PriceLevel } from "@/components/ui/PriceLevel";
import { VenueType } from "@/components/ui/VenueType";
import { OpenStatusBadge } from "@/components/OpenStatusBadge";
import { Avatar } from "@/components/Avatar";
import type { PlaceCardData } from "@/components/PlaceCard";
import { mediaUrl } from "@/lib/media";
import { haversineKm, formatDistance, dishPrice } from "@/lib/format";
import { useUserLocation, type LatLng } from "@/lib/useUserLocation";
import type { DishPill } from "@/lib/types";
import { cn } from "@/lib/cn";

const SHOWN = 3;

// THE Explore result card, one component for every width (unified 2026-07-06;
// it replaced the PlaceCard variant="row" / ExploreListCard pair that rendered
// BOTH cards and hid one per breakpoint). Layout is driven by CONTAINER
// queries, not the viewport — the parent must be `@container` — so the same
// element renders as a flat divided list row in a narrow container (the mobile
// list) and grows card chrome + the map-sync highlight in a wide one (the
// desktop side panel), and the admin playground can preview either by sizing
// a wrapper. The venue image is a square thumbnail: the big photo column
// didn't earn its width (it's usually a logo) and the space now goes to the
// dish-search menu excerpt. TODO: when per-dish photos land, the thumbnail
// slot becomes a carousel of the matched items.
export function ExploreCard({
	r,
	pills,
	dishName,
	fallbackOrigin,
	onViewMap,
	hovered = false,
	selected = false,
	onHover,
}: {
	r: PlaceCardData;
	// dish-search matches (name + price) rendered as a menu excerpt, plus the
	// searched dish's display name for the "+N more" line
	pills?: DishPill[];
	dishName?: string;
	fallbackOrigin?: LatLng;
	// centres the map on this spot instead of navigating
	onViewMap?: () => void;
	// map-pin sync (desktop side panel)
	hovered?: boolean;
	selected?: boolean;
	onHover?: (id: number | null) => void;
}) {
	const userLoc = useUserLocation();
	const distOrigin = userLoc ?? fallbackOrigin ?? null;
	const distance =
		distOrigin && r.lat != null && r.lng != null
			? formatDistance(haversineKm(distOrigin, r.lat, r.lng))
			: undefined;
	const img = mediaUrl(r.logoKey) ?? mediaUrl(r.primaryPhoto);
	const location = [r.suburb, r.state].filter(Boolean).join(", ");
	const priceLevel = r.priceLevel ? Math.min(4, r.priceLevel) : 0;
	const hi = hovered || selected;

	// Open in a new tab only when the map side panel exists (real desktop
	// viewport): the Explore state is worth keeping there. Mounted default =
	// same-tab, so mobile/SSR behaviour never flashes.
	const [newTab, setNewTab] = useState(false);
	useEffect(() => {
		setNewTab(window.matchMedia("(min-width: 768px)").matches);
	}, []);

	return (
		<Link
			href={`/restaurant/${r.slug}`}
			{...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
			onMouseEnter={onHover ? () => onHover(r.id) : undefined}
			onMouseLeave={onHover ? () => onHover(null) : undefined}
			className={cn(
				"block transition-colors",
				// narrow container (mobile list): flat rows split by a border
				"py-3.5 border-b border-paper-300 @max-md:active:bg-paper-100",
				// wide container (desktop side panel): card chrome + highlight
				"@md:rounded-lg @md:border-2 @md:shadow-sm @md:p-3.5",
				hi
					? "@md:border-chili-500 @md:shadow-md"
					: "@md:border-paper-300",
				selected ? "@md:bg-paper-100" : "@md:bg-white",
			)}
		>
			<div className="flex items-start gap-3">
				<div className="min-w-0 flex-1 flex flex-col gap-1">
					{/* Featured/Popular sat on the old card's photo; the thumbnail is
					    too small for overlays, so they lead the text stack instead */}
					{(r.isFeatured || r.popular) && (
						<div className="flex items-center gap-1.5 pb-0.5">
							{r.isFeatured && <FeaturedBadge />}
							{r.popular && <PopularBadge />}
						</div>
					)}
					<span className="font-display font-bold text-[1.05rem] @md:text-[18px] text-ink-900 leading-tight line-clamp-2">
						{r.name}
					</span>
					{r.rating != null && (
						<div className="flex items-center gap-2 min-w-0">
							<Rating
								value={r.rating}
								count={r.reviewCount}
								size={14}
							/>
						</div>
					)}
					{/* meta line: "$$ · Suburb, STATE · 4.2 km" */}
					{(priceLevel > 0 || location || distance) && (
						<div className="flex items-center gap-1.5 text-ink-500 text-[0.9rem] min-w-0">
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
					<div className="flex items-center gap-2.5 min-w-0">
						<VenueType type={r.venueType} />
					</div>
				</div>
				{/* square thumbnail (future: matched-dish photo carousel) */}
				<div className="relative w-[92px] h-[92px] @md:w-[110px] @md:h-[110px] shrink-0 rounded-lg overflow-hidden bg-paper-200">
					{img ? (
						<Image
							src={img}
							alt={r.name}
							fill
							sizes="110px"
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

			{/* dish-search matches as a menu excerpt: menu-style rows with dotted
			    leaders and right-aligned prices (labelled variant prices on a muted
			    sub-line), overflow folded into "+N more". */}
			{pills && pills.length > 0 && (
				<div className="mt-2.5 rounded-lg bg-paper-100 px-3 py-2 flex flex-col gap-1 min-w-0">
					{pills.slice(0, SHOWN).map((p) => (
						<div key={p.label} className="min-w-0">
							<div className="flex items-baseline gap-2 min-w-0 text-[0.85rem]">
								<span className="truncate min-w-0 font-body font-semibold text-ink-800">
									{p.label}
								</span>
								<span className="flex-1 min-w-4 border-b border-dotted border-sand-400 -translate-y-[3px]" />
								{p.price != null && (
									<span className="shrink-0 whitespace-nowrap font-bold text-chili-600">
										{p.priceFrom ? "from " : ""}
										{dishPrice(p.price)}
									</span>
								)}
							</div>
							{p.variants && p.variants.length > 0 && (
								<div className="text-[0.78rem] text-ink-500 truncate min-w-0">
									{p.variants
										.map((v) => `${v.label} ${dishPrice(v.price)}`)
										.join(" · ")}
								</div>
							)}
						</div>
					))}
					{pills.length > SHOWN && (
						<span className="text-[0.8rem] font-display font-bold text-marigold-700">
							+{pills.length - SHOWN} more{" "}
							{dishName ?? "matching"} dishes on the menu
						</span>
					)}
				</div>
			)}

			{/* bottom row: live open status + the CTAs */}
			<div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 min-w-0">
				<OpenStatusBadge
					openingHours={r.openingHours}
					state={r.state}
					businessStatus={r.businessStatus ?? null}
					size="sm"
					className="min-w-0 max-w-full"
				/>
				<div className="shrink-0 flex items-center gap-1.5 ml-auto">
					{r.hasMenu && (
						<button
							type="button"
							onClick={(e) => {
								// inside the card's <Link> (no nested anchors): open the
								// detail page at the menu in a new tab so Explore stays put.
								e.preventDefault();
								e.stopPropagation();
								window.open(
									`/restaurant/${r.slug}#menu`,
									"_blank",
									"noopener,noreferrer",
								);
							}}
							className="shrink-0 inline-flex items-center gap-1.5 rounded-full border-2 border-chili-500 text-chili-600 font-display font-bold text-[0.85rem] px-3 py-1.5 transition-colors hover:bg-chili-500 hover:text-white active:bg-chili-500 active:text-white cursor-pointer"
						>
							<BookOpenText size={15} weight="fill" />
							See the menu
						</button>
					)}
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
			</div>
		</Link>
	);
}
