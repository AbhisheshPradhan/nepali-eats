"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpenText, MapTrifold } from "@phosphor-icons/react";
import { Rating } from "@/components/ui/Rating";
import { PriceLevel } from "@/components/ui/PriceLevel";
import { VenueType } from "@/components/ui/VenueType";
import { OpenStatusBadge } from "@/components/OpenStatusBadge";
import { Avatar } from "@/components/Avatar";
import { mediaUrl } from "@/lib/media";
import { haversineKm, formatDistance } from "@/lib/format";
import { useUserLocation } from "@/lib/useUserLocation";
import type { ExploreCardMockupProps } from "./types";

// Shared chrome for the candidate Explore cards: the parts every design keeps
// (photo, name, rating, meta line, venue type, live status, CTAs) in both the
// desktop-row and mobile-list layouts. Candidates differ only in `dishSlot`,
// the treatment of the dish-search matches, so each candidate file stays a
// focused fork of that one block. When a design wins, port its slot back into
// PlaceCard/ExploreListCard and delete all this.
export function CandidateShell({
	r,
	viewport,
	fallbackOrigin,
	onViewMap,
	dishSlot,
}: Pick<
	ExploreCardMockupProps,
	"r" | "viewport" | "fallbackOrigin" | "onViewMap"
> & {
	dishSlot?: ReactNode;
}) {
	const userLoc = useUserLocation();
	const distOrigin = userLoc ?? fallbackOrigin ?? null;
	const distance =
		distOrigin && r.lat != null && r.lng != null
			? formatDistance(haversineKm(distOrigin, r.lat, r.lng))
			: undefined;
	const img = mediaUrl(r.logoKey) ?? mediaUrl(r.primaryPhoto);
	const location = [r.suburb, r.state].filter(Boolean).join(", ");

	const ctas = (
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
	);

	const statusRow = (
		<div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
			<OpenStatusBadge
				openingHours={r.openingHours}
				state={r.state}
				businessStatus={r.businessStatus ?? null}
				size="sm"
				className="min-w-0 max-w-full"
			/>
			{ctas}
		</div>
	);

	if (viewport === "mobile") {
		// Flat list row, mirroring ExploreListCard: text left, square photo right,
		// dish slot + status row full-width underneath.
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
						{r.rating != null && (
							<div className="flex items-center gap-2 min-w-0">
								<Rating value={r.rating} count={r.reviewCount} size={14} />
							</div>
						)}
						{((r.priceLevel ?? 0) > 0 || location || distance) && (
							<div className="flex items-center gap-1.5 text-ink-500 text-[0.9rem] min-w-0">
								<PriceLevel level={Math.min(4, r.priceLevel ?? 0)} />
								{(r.priceLevel ?? 0) > 0 && location && (
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
				{dishSlot && <div className="mt-2">{dishSlot}</div>}
				<div className="mt-2.5">{statusRow}</div>
			</Link>
		);
	}

	// Desktop side-panel row, mirroring PlaceCard variant="row": photo left,
	// body right with the dish slot between the meta line and the venue type.
	return (
		<Link
			href={`/restaurant/${r.slug}`}
			target="_blank"
			rel="noopener noreferrer"
			className="group flex rounded-lg overflow-hidden border-2 border-paper-300 bg-white shadow-sm transition hover:border-chili-500 hover:shadow-md"
		>
			<div className="relative w-[190px] shrink-0 self-stretch min-h-[190px] bg-paper-200">
				{img ? (
					<Image
						src={img}
						alt={r.name}
						fill
						sizes="190px"
						className="object-cover"
					/>
				) : (
					<div className="absolute inset-0 grid place-items-center">
						<Avatar name={r.name} logoKey={r.logoKey} id={r.id} size={84} />
					</div>
				)}
			</div>
			<div className="flex flex-col gap-2.5 p-4 flex-1 min-w-0">
				<h3 className="font-display font-bold text-[18px] text-ink-900 leading-tight truncate min-w-0">
					{r.name}
				</h3>
				{r.rating != null && (
					<Rating value={r.rating} count={r.reviewCount} size={16} />
				)}
				{((r.priceLevel ?? 0) > 0 || location || distance) && (
					<div className="flex items-center gap-1.5 text-ink-500 text-[0.95rem] min-w-0">
						<PriceLevel level={Math.min(4, r.priceLevel ?? 0)} />
						{(r.priceLevel ?? 0) > 0 && location && (
							<span className="shrink-0">·</span>
						)}
						{location && <span className="truncate min-w-0">{location}</span>}
						{distance && (
							<span className="shrink-0 whitespace-nowrap">· {distance}</span>
						)}
					</div>
				)}
				{dishSlot}
				<div className="mt-auto flex items-center gap-2 pt-0.5">
					<VenueType type={r.venueType} />
				</div>
				{statusRow}
			</div>
		</Link>
	);
}
