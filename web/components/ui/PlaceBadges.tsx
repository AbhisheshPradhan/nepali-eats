import { Fire, Star, SealCheck } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/Badge";

// Single source of truth for the Featured / Popular badges so the styling can be
// tweaked in one spot while it's still being decided. Used on PlaceCard and the
// restaurant detail header.

export function FeaturedBadge({ className }: { className?: string }) {
	return (
		<Badge
			tone="chili"
			solid
			className={className}
		>
			<Star
				size={13}
				weight="fill"
			/>
			Featured
		</Badge>
	);
}

export function PopularBadge({ className }: { className?: string }) {
	return (
		<Badge
			tone="marigold"
			solid
			className={className}
		>
			<Fire
				size={13}
				weight="fill"
				color="black"
			/>
			Popular
		</Badge>
	);
}

// Shown once a claim is verified (restaurant_owners row). SOFT coriander, not
// solid: it's a trust mark, not an editorial pick — Featured/Popular keep the
// loud treatment. The title tells diners why it matters.
export function OwnerVerifiedBadge({ className }: { className?: string }) {
	return (
		<span title="The owner keeps this page's details current">
			<Badge
				tone="coriander"
				className={className}
			>
				<SealCheck
					size={13}
					weight="fill"
				/>
				Owner-verified
			</Badge>
		</span>
	);
}
