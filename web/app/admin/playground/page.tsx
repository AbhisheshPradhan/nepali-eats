import { getCardBySlug } from "@/lib/queries";
import { PlaceCardLab } from "@/components/admin/PlaceCardLab";
import { BadgeStatusLab } from "@/components/admin/BadgeStatusLab";

export const metadata = { robots: { index: false, follow: false } };

export default async function PlaygroundPage() {
	// Real row so the cards look like the live site: Falcha in both variants.
	const falcha = await getCardBySlug("falcha-town-hall-sydney");

	return (
		<div className="flex flex-col gap-8">
			<PlaceCardLab sample={falcha} />
			<BadgeStatusLab />
		</div>
	);
}
