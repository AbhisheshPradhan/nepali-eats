import { SealCheck } from "@phosphor-icons/react/dist/ssr";
import { assertAdmin } from "@/lib/admin/guard";
import { query } from "@/lib/db";
import { AdminEmpty } from "@/components/admin/AdminEmpty";
import { ClaimsTable, type ClaimRow } from "@/components/admin/ClaimsTable";

export const metadata = { robots: { index: false, follow: false } };
// Always fresh: this is the approval queue, never cache it.
export const dynamic = "force-dynamic";

// The claim-verification queue (docs/CLAIM-FLOW.md). Playbook per pending
// row: verify through the restaurant's SOCIALS (shown per row; find + save
// them if missing), send the invite link (v1.1) or DM-confirm then Approve.
// Fallbacks: listed email, listed phone. Rejections send NO automated email:
// write the personal note yourself (the UI reminds you).
export default async function ClaimsPage({
	searchParams,
}: {
	searchParams: Promise<{ claim?: string }>;
}) {
	await assertAdmin();
	const { claim } = await searchParams;

	const rows = await query<ClaimRow>(
		`SELECT c.id::text, c.name, c.role, c.note,
		        c.email_match AS "emailMatch", c.status, c.reason,
		        to_char(c.created_at, 'DD Mon HH24:MI') AS created,
		        r.slug, r.name AS "restaurantName", r.phone AS "restaurantPhone",
		        r.email AS "restaurantEmail", r.instagram, r.facebook,
		        u.email AS "accountEmail"
		   FROM claims c
		   JOIN restaurants r ON r.id = c.restaurant_id
		   JOIN users u ON u.id = c.user_id
		  ORDER BY (c.status = 'pending') DESC, c.created_at DESC
		  LIMIT 200`,
	);

	if (!rows.length)
		return (
			<AdminEmpty
				title="Claim Requests"
				subtitle="Owners asking to claim their restaurant show up here."
				icon={<SealCheck size={40} weight="regular" />}
				message="No claim requests yet."
			/>
		);

	return (
		<div>
			<h1 className="font-display font-extrabold text-[1.6rem] text-ink-900">
				Claim Requests
			</h1>
			<p className="text-ink-600 mt-1 mb-5 max-w-[640px]">
				Verify a pending claim through the restaurant&apos;s socials (or
				the listed email/phone as fallbacks). Approving grants edit access
				immediately and emails them. Rejecting sends nothing: remember to
				email them a personal note.
			</p>
			<ClaimsTable rows={rows} highlightId={claim} />
		</div>
	);
}
