import Image from "next/image";
import Link from "next/link";
import { FeaturedBadge, PopularBadge } from "@/components/ui/PlaceBadges";
import { Rating } from "@/components/ui/Rating";
import { VenueType } from "@/components/ui/VenueType";
import { PriceLevel } from "@/components/ui/PriceLevel";
import { Avatar } from "@/components/Avatar";
import type { PlaceCardProps } from "@/components/PlaceCard";
import { mediaUrl } from "@/lib/media";
import { hueFromId } from "@/lib/format";

// MOCKUP — a scratch variant of PlaceCard for the UI Playground. Edit freely;
// when a design wins, port it into components/PlaceCard.tsx. Not used on the site.
// "Overlay": name + rating sit on a scrim over the photo, meta below.
export function OverlayCard({ r, href, hideState }: PlaceCardProps) {
	const img = mediaUrl(r.logoKey) ?? mediaUrl(r.primaryPhoto);
	const hue = hueFromId(r.id);
	const priceLevel = r.priceLevel ? Math.min(4, r.priceLevel) : 0;
	const location = [r.suburb, hideState ? null : r.state]
		.filter(Boolean)
		.join(", ");

	return (
		<Link
			href={href ?? `/restaurant/${r.slug}`}
			target="_blank"
			rel="noopener noreferrer"
			className="group block overflow-hidden rounded-2xl border-2 border-paper-300 bg-white shadow-sm transition hover:shadow-lg"
		>
			<div
				className="relative aspect-[4/3]"
				style={{
					background: `linear-gradient(135deg, hsl(${hue} 90% 62%), hsl(${(hue + 24) % 360} 85% 55%))`,
				}}
			>
				{img ? (
					<Image
						src={img}
						alt={r.name}
						fill
						sizes="320px"
						className="object-cover transition-transform duration-500 group-hover:scale-105"
					/>
				) : (
					<div className="absolute inset-0 grid place-items-center">
						<Avatar
							name={r.name}
							logoKey={r.logoKey}
							id={r.id}
							size={96}
						/>
					</div>
				)}

				{(r.isFeatured || r.popular) && (
					<div className="absolute top-3 left-3 flex flex-col items-start gap-2">
						{r.isFeatured && <FeaturedBadge />}
						{r.popular && <PopularBadge />}
					</div>
				)}

				<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 pt-10">
					<h3 className="font-display font-bold text-white text-[18px] leading-tight truncate">
						{r.name}
					</h3>
					{r.rating != null && (
						<div className="mt-1">
							<Rating
								value={r.rating}
								count={r.reviewCount}
								size={15}
								className="text-white [&_*]:text-white"
							/>
						</div>
					)}
				</div>
			</div>

			<div className="flex items-center justify-between gap-2 p-3">
				<VenueType type={r.venueType} />
				<div className="flex items-center gap-1.5 text-ink-500 text-[0.9rem] min-w-0">
					<PriceLevel level={priceLevel} />
					{location && <span className="truncate">· {location}</span>}
				</div>
			</div>
		</Link>
	);
}
