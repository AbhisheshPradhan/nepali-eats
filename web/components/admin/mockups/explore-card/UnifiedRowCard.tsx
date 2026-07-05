"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpenText, MapTrifold } from "@phosphor-icons/react";
import { Rating } from "@/components/ui/Rating";
import { PriceLevel } from "@/components/ui/PriceLevel";
import { VenueType } from "@/components/ui/VenueType";
import { OpenStatusBadge } from "@/components/OpenStatusBadge";
import { Avatar } from "@/components/Avatar";
import { mediaUrl } from "@/lib/media";
import { dishPrice, haversineKm, formatDistance } from "@/lib/format";
import { useUserLocation } from "@/lib/useUserLocation";
import { cn } from "@/lib/cn";
import type { ExploreCardMockupProps } from "./types";

const SHOWN = 3;

// Candidate: ONE layout for both viewports — the mobile list arrangement
// (text left, square thumbnail right) promoted to the desktop side panel too.
// The 190px photo column goes away (the image is usually a logo, which doesn't
// earn that much width), and the freed width goes to a full-width menu excerpt
// that also carries each item's labelled VARIANT prices (Veg / Chicken / Buff)
// on a muted sub-line. The thumbnail slot is where a matched-dish photo
// carousel would land later. Desktop keeps card chrome (border + hover) so the
// side panel still reads as cards; mobile stays a flat divided row.
export function UnifiedRowCard({
	r,
	viewport,
	pills,
	dishName,
	fallbackOrigin,
	onViewMap,
}: ExploreCardMockupProps) {
	const mobile = viewport === "mobile";
	const userLoc = useUserLocation();
	const distOrigin = userLoc ?? fallbackOrigin ?? null;
	const distance =
		distOrigin && r.lat != null && r.lng != null
			? formatDistance(haversineKm(distOrigin, r.lat, r.lng))
			: undefined;
	const img = mediaUrl(r.logoKey) ?? mediaUrl(r.primaryPhoto);
	const location = [r.suburb, r.state].filter(Boolean).join(", ");
	const priceLevel = r.priceLevel ? Math.min(4, r.priceLevel) : 0;
	const thumb = mobile ? 92 : 110;

	const excerpt =
		pills && pills.length > 0 ? (
			<div className="rounded-lg bg-paper-100 px-3 py-2 flex flex-col gap-1.5 min-w-0">
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
						{/* labelled variant prices, when the item has them */}
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
						+{pills.length - SHOWN} more {dishName ?? "matching"} dishes on
						the menu
					</span>
				)}
			</div>
		) : null;

	return (
		<Link
			href={`/restaurant/${r.slug}`}
			{...(mobile ? {} : { target: "_blank", rel: "noopener noreferrer" })}
			className={cn(
				"block transition-colors",
				mobile
					? "py-3.5 border-b border-paper-300 active:bg-paper-100"
					: "rounded-lg border-2 border-paper-300 bg-white shadow-sm p-3.5 hover:border-chili-500 hover:shadow-md",
			)}
		>
			<div className="flex items-start gap-3">
				<div className="min-w-0 flex-1 flex flex-col gap-1">
					<span className="font-display font-bold text-[1.05rem] text-ink-900 leading-tight line-clamp-2">
						{r.name}
					</span>
					{r.rating != null && (
						<div className="flex items-center gap-2 min-w-0">
							<Rating value={r.rating} count={r.reviewCount} size={14} />
						</div>
					)}
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
				{/* the thumbnail slot: venue logo/photo today, the matched-dish
				    photo carousel later */}
				<div
					className="relative shrink-0 rounded-lg overflow-hidden bg-paper-200"
					style={{ width: thumb, height: thumb }}
				>
					{img ? (
						<Image
							src={img}
							alt={r.name}
							fill
							sizes={`${thumb}px`}
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

			{excerpt && <div className="mt-2.5">{excerpt}</div>}

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
								e.preventDefault();
								e.stopPropagation();
							}}
							className="shrink-0 inline-flex items-center gap-1.5 rounded-full border-2 border-chili-500 text-chili-600 font-display font-bold text-[0.85rem] px-2.5 py-1 transition-colors hover:bg-chili-500 hover:text-white cursor-pointer"
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
							className="shrink-0 inline-flex items-center gap-1.5 rounded-full border-2 border-chili-500 text-chili-600 font-display font-bold text-[0.85rem] px-2.5 py-1 transition-colors hover:bg-chili-500 hover:text-white cursor-pointer"
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
