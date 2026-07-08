import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import { query } from "@/lib/db";
import { grantOwnership } from "@/lib/users";
import { sendEmail, escapeHtml } from "@/lib/email";
import { SITE } from "@/lib/site";

// POST { action: "approve" | "reject", reason? } — decide a pending claim.
// Approve = grant ownership (one owner per restaurant, enforced by the unique
// index) + email the claimant. Reject = status only; the admin sends a
// personal email themselves (explicit product decision, no automated mail).
export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const blocked = await requireAdmin();
	if (blocked) return blocked;

	const id = Number((await params).id);
	if (!Number.isFinite(id))
		return NextResponse.json({ error: "Bad id" }, { status: 400 });
	const body = await request.json().catch(() => ({}));
	const action = body.action === "approve" ? "approve" : body.action === "reject" ? "reject" : null;
	if (!action)
		return NextResponse.json({ error: "action must be approve|reject" }, { status: 400 });

	const rows = await query<{
		id: number;
		restaurant_id: number;
		user_id: number;
		status: string;
		name: string;
		slug: string;
		restaurant_name: string;
		account_email: string | null;
		contact_email: string | null;
	}>(
		`SELECT c.id, c.restaurant_id, c.user_id, c.status, c.name,
		        r.slug, r.name AS restaurant_name,
		        u.email AS account_email, c.email AS contact_email
		   FROM claims c
		   JOIN restaurants r ON r.id = c.restaurant_id
		   JOIN users u ON u.id = c.user_id
		  WHERE c.id = $1`,
		[id],
	);
	const c = rows[0];
	if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
	if (c.status !== "pending")
		return NextResponse.json({ error: `Already ${c.status}` }, { status: 409 });

	if (action === "approve") {
		// one owner per restaurant: fail loudly if someone got there first
		const taken = await query(
			`SELECT 1 FROM restaurant_owners WHERE restaurant_id = $1 AND user_id <> $2`,
			[c.restaurant_id, c.user_id],
		);
		if (taken.length)
			return NextResponse.json(
				{ error: "This restaurant already has a different owner." },
				{ status: 409 },
			);
		await grantOwnership(String(c.user_id), c.restaurant_id);
		await query(
			`UPDATE claims SET status='approved', reason=$2, decided_at=now() WHERE id=$1`,
			[id, "verified with the restaurant"],
		);
		const to = c.account_email ?? c.contact_email;
		// Awaited: an un-awaited send can be dropped when the serverless function
		// freezes after the response. sendEmail never throws.
		if (to)
			await sendEmail({
				to,
				subject: `${c.restaurant_name} is yours to edit`,
				html: `<p>Hi ${escapeHtml(c.name)}, your claim is verified.</p>
				 <p><a href="${SITE}/restaurant/${c.slug}">Open your page</a> and hit Edit Restaurant to update your menu, photos and hours. Fresh menu uploads reach us automatically.</p>
				 <p>Now go feed them well. 🥟</p>`,
			});
		// the public page shows the claim CTA + verified badge: bust its ISR cache
		revalidatePath(`/restaurant/${c.slug}`);
		return NextResponse.json({ ok: true, status: "approved" });
	}

	await query(
		`UPDATE claims SET status='rejected', reason=$2, decided_at=now() WHERE id=$1`,
		[id, String(body.reason ?? "") || null],
	);
	// deliberately NO automated email on rejection (send a personal note)
	return NextResponse.json({ ok: true, status: "rejected" });
}
