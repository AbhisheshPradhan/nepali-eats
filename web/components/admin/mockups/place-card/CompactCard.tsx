import Image from "next/image";
import Link from "next/link";
import { FeaturedBadge } from "@/components/ui/PlaceBadges";
import { Rating } from "@/components/ui/Rating";
import { PriceLevel } from "@/components/ui/PriceLevel";
import { VenueType } from "@/components/ui/VenueType";
import { Avatar } from "@/components/Avatar";
import type { PlaceCardProps } from "@/components/PlaceCard";
import { mediaUrl } from "@/lib/media";
import { hueFromId } from "@/lib/format";

// MOCKUP — a scratch variant of PlaceCard for the UI Playground. Edit freely;
// when a design wins, port it into components/PlaceCard.tsx. Not used on the site.
// "Compact": a dense list-row with a square thumbnail, for tight layouts.
export function CompactCard({ r, href, hideState }: PlaceCardProps) {
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
			className="group flex w-full items-center gap-3 rounded-xl border border-paper-300 bg-white p-2.5 transition hover:bg-paper-50 hover:shadow-sm"
		>
			<div
				className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg"
				style={{
					background: `linear-gradient(135deg, hsl(${hue} 90% 62%), hsl(${(hue + 24) % 360} 85% 55%))`,
				}}
			>
				{img ? (
					<Image
						src={img}
						alt={r.name}
						fill
						sizes="64px"
						className="object-cover"
					/>
				) : (
					<div className="absolute inset-0 grid place-items-center">
						<Avatar
							name={r.name}
							logoKey={r.logoKey}
							id={r.id}
							size={36}
						/>
					</div>
				)}
			</div>

			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<h3 className="font-display font-bold text-ink-900 text-[16px] truncate">
						{r.name}
					</h3>
					{r.isFeatured && <FeaturedBadge />}
				</div>
				{r.rating != null && (
					<Rating
						value={r.rating}
						count={r.reviewCount}
						size={14}
					/>
				)}
				<div className="flex items-center gap-1.5 text-ink-500 text-[0.85rem] min-w-0">
					<VenueType type={r.venueType} />
					<PriceLevel level={priceLevel} />
					{location && <span className="truncate">· {location}</span>}
				</div>
			</div>
		</Link>
	);
}
