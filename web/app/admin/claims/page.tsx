import { SealCheck } from "@phosphor-icons/react/dist/ssr";
import { AdminEmpty } from "@/components/admin/AdminEmpty";

export const metadata = { robots: { index: false, follow: false } };

export default function ClaimsPage() {
	return (
		<AdminEmpty
			title="Claim Requests"
			subtitle="Owners asking to claim their listing show up here."
			icon={<SealCheck size={40} weight="regular" />}
			message="No claim requests yet."
		/>
	);
}
