import { Tray } from "@phosphor-icons/react/dist/ssr";
import { AdminEmpty } from "@/components/admin/AdminEmpty";

export const metadata = { robots: { index: false, follow: false } };

export default function SubmissionsPage() {
	return (
		<AdminEmpty
			title="New Submissions"
			subtitle="Spots sent in through Add a Spot land here for review."
			icon={<Tray size={40} weight="regular" />}
			message="No new submissions yet."
		/>
	);
}
