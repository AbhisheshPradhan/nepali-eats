import { getCardBySlug } from "@/lib/queries";
import { PlaceCardMockups } from "@/components/admin/PlaceCardMockups";
import { ExploreCardMockups } from "@/components/admin/ExploreCardMockups";
import { FilterBarMockups } from "@/components/admin/FilterBarMockups";

export const metadata = { robots: { index: false, follow: false } };

export default async function MockupsPage() {
	const falcha = await getCardBySlug("falcha-town-hall-sydney");

	return (
		<div className="flex flex-col gap-8">
			<PlaceCardMockups sample={falcha} />
			<ExploreCardMockups sample={falcha} />
			<FilterBarMockups />
		</div>
	);
}
