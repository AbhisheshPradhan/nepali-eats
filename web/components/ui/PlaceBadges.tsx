import { Fire, Star } from "@phosphor-icons/react/dist/ssr";
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
