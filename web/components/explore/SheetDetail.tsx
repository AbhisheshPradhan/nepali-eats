"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { NavigationArrow, Phone, X, ArrowRight } from "@phosphor-icons/react";
import { Rating } from "@/components/ui/Rating";
import { VenueType } from "@/components/ui/VenueType";
import { PriceLevel } from "@/components/ui/PriceLevel";
import { OpenStatusBadge } from "@/components/OpenStatusBadge";
import { CardCarousel } from "@/components/CardCarousel";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/Button";
import type { ExploreSpot } from "@/lib/types";
import { mediaUrl } from "@/lib/media";
import { directionsUrl } from "@/lib/format";

// The DETAIL state of the mobile Explore drawer (sheet UI): a rich preview of
// the tapped spot — photos, live status, dish pills, primary actions — with
// "Full details" linking to the real page. Stage 2 replaces this with the full
// detail rendered in-drawer via an intercepting route.

type Gallery = { logo: string | null; photos: string[] };
const galleryCache = new Map<string, Gallery>();

export function SheetDetail({
	spot,
	pills,
	onClose,
}: {
	spot: ExploreSpot;
	pills?: string[];
	onClose: () => void;
}) {
	const [gallery, setGallery] = useState<Gallery>({ logo: null, photos: [] });
	const scrollRef = useRef<HTMLDivElement>(null);

	// Lazy-load the photo carousel per spot, cached by slug (same data the map
	// popup uses; the endpoint is CDN-cached).
	useEffect(() => {
		const cached = galleryCache.get(spot.slug);
		if (cached) {
			setGallery(cached);
			return;
		}
		setGallery({ logo: null, photos: [] });
		let cancelled = false;
		fetch(`/api/restaurants/${spot.slug}/photos`)
			.then((r) => r.json())
			.then((d: { logo?: string | null; photos?: string[] }) => {
				if (cancelled) return;
				const g: Gallery = { logo: d.logo ?? null, photos: d.photos ?? [] };
				galleryCache.set(spot.slug, g);
				setGallery(g);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [spot.slug]);

	// New spot -> start at the top of the sheet content.
	useEffect(() => {
		scrollRef.current?.scrollTo({ top: 0 });
	}, [spot.id]);

	const slides = gallery.logo
		? [gallery.logo, ...gallery.photos]
		: gallery.photos;
	const img = mediaUrl(spot.logoKey) ?? mediaUrl(spot.primaryPhoto);

	return (
		<div
			ref={scrollRef}
			className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
		>
			<div className="flex items-start justify-between gap-3 pt-1 pb-2">
				<div className="min-w-0">
					<h2 className="font-display font-extrabold text-[1.35rem] text-ink-900 leading-tight m-0 truncate">
						{spot.name}
					</h2>
					<div className="mt-1 flex items-center gap-2 flex-wrap text-ink-500 text-[0.95rem]">
						{spot.rating != null && (
							<Rating
								value={spot.rating}
								count={spot.reviewCount}
								size={15}
							/>
						)}
						<PriceLevel level={spot.priceLevel ?? 0} />
						{(spot.suburb || spot.state) && (
							<span className="truncate">
								{[spot.suburb, spot.state]
									.filter(Boolean)
									.join(", ")}
							</span>
						)}
					</div>
					<div className="mt-1 flex items-center gap-2.5 flex-wrap">
						<VenueType type={spot.venueType} />
						<OpenStatusBadge
							openingHours={spot.openingHours}
							state={spot.state}
							businessStatus={spot.businessStatus}
							size="sm"
						/>
					</div>
				</div>
				<button
					type="button"
					aria-label="Close"
					onClick={onClose}
					className="shrink-0 grid h-8 w-8 place-items-center rounded-full bg-paper-200 text-ink-700 hover:bg-paper-300 cursor-pointer"
				>
					<X size={16} weight="bold" />
				</button>
			</div>

			{/* dish-search matches: why this spot is a result */}
			{pills && pills.length > 0 && (
				<div className="flex flex-wrap gap-1.5 pb-2.5">
					{pills.slice(0, 6).map((p) => (
						<span
							key={p}
							className="inline-flex items-center font-body font-semibold text-[0.8rem] text-marigold-700 bg-marigold-100 px-2 py-0.5 rounded-full"
						>
							{p}
						</span>
					))}
					{pills.length > 6 && (
						<span className="inline-flex items-center font-body font-semibold text-[0.8rem] text-ink-500 px-1 py-0.5">
							+{pills.length - 6} more
						</span>
					)}
				</div>
			)}

			{/* actions */}
			<div className="flex gap-2 pb-3">
				<Button
					href={directionsUrl({
						fullAddress: null,
						name: spot.name,
						lat: spot.lat,
						lng: spot.lng,
					})}
					newTab
					block
					size="sm"
					iconLeft={<NavigationArrow size={16} weight="fill" />}
				>
					Directions
				</Button>
				{spot.phone && (
					<Button
						href={`tel:${spot.phone}`}
						block
						size="sm"
						variant="outline"
						iconLeft={<Phone size={16} />}
					>
						Call
					</Button>
				)}
				<Button
					href={`/restaurant/${spot.slug}`}
					block
					size="sm"
					variant="outline"
					iconRight={<ArrowRight size={16} />}
				>
					Full details
				</Button>
			</div>

			{/* photos */}
			<div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-paper-200">
				{slides.length > 1 ? (
					<CardCarousel
						photos={slides}
						logoFirst={!!gallery.logo}
						alt={spot.name}
					/>
				) : img ? (
					<Image
						src={img}
						alt={spot.name}
						fill
						sizes="(max-width: 768px) 100vw, 480px"
						className="object-cover"
					/>
				) : (
					<div className="absolute inset-0 grid place-items-center">
						<Avatar
							name={spot.name}
							logoKey={spot.logoKey}
							id={spot.id}
							size={88}
						/>
					</div>
				)}
			</div>

			<Link
				href={`/restaurant/${spot.slug}`}
				className="mt-3 flex items-center justify-center gap-2 w-full rounded-lg bg-marigold-100 py-3 text-marigold-700 font-display font-bold hover:bg-marigold-300/50 transition-colors"
			>
				See menu, hours and photos
				<ArrowRight size={16} weight="bold" />
			</Link>
		</div>
	);
}
