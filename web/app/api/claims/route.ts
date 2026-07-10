import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import { query } from "@/lib/db";
import { ensureCurrentUser, grantOwnership, isOwnerOf } from "@/lib/users";
import { sendEmail, notifyAdmin, escapeHtml } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { SITE } from "@/lib/site";

// POST /api/claims — an owner requesting their restaurant (docs/CLAIM-FLOW.md).
// FINAL flow (Abhishesh, 2026-07-08):
//   INSTANT: a Clerk-VERIFIED email that exactly matches the restaurant's
//   listed address = proof of inbox control -> ownership granted on the spot.
//   EVERYONE ELSE: pending -> admin verifies through the restaurant's socials
//   and sends an invite link (v1.1; the Approve button covers it meanwhile).
// No phone is collected: if a call is needed we use the listed number already
// on file. Rejections send NO automated email (personal note instead).

export async function POST(request: Request) {
	const { userId } = await auth();
	if (!userId)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	// Every claim writes rows and sends up to two emails, so it's metered
	// tighter than search: per ACCOUNT (keyed by Clerk id so it runs BEFORE
	// ensureCurrentUser's DB read — limited retries never touch Postgres) and
	// per IP (blunts many-accounts-one-machine spam). Account first, IP only
	// if that passes: a blocked account retrying must not drain the shared
	// budget of an office/CGNAT IP other owners may be behind.
	const byUser = await rateLimit(`claims:u:${userId}`, 5, 3600);
	const byIp = byUser.ok
		? await rateLimit(`claims:ip:${clientIp(request)}`, 10, 3600)
		: byUser;
	if (!byUser.ok || !byIp.ok)
		return NextResponse.json(
			{
				error:
					"That's a lot of claims in one go. Give it an hour and try again, or email hello@nepalieats.com.au.",
			},
			{ status: 429, headers: { "Retry-After": "3600" } },
		);

	const user = await ensureCurrentUser();
	if (!user)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const body = await request.json().catch(() => ({}));
	const slug = String(body.slug ?? "");
	const name = String(body.name ?? "").trim();
	const role = body.role === "manager" ? "manager" : "owner";
	const note = String(body.note ?? "").trim() || null;
	if (!slug || !name)
		return NextResponse.json(
			{ error: "Your name is required" },
			{ status: 400 },
		);

	const rows = await query<{
		id: number;
		name: string;
		email: string | null;
	}>(`SELECT id, name, email FROM restaurants WHERE slug = $1`, [slug]);
	const r = rows[0];
	if (!r)
		return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });

	// Already yours? Already someone's? (unique index also enforces the latter)
	if (await isOwnerOf(user.id, r.id))
		return NextResponse.json({ status: "approved", already: true });
	const taken = await query(
		`SELECT 1 FROM restaurant_owners WHERE restaurant_id = $1`,
		[r.id],
	);
	if (taken.length)
		return NextResponse.json(
			{ error: "This restaurant has already been claimed." },
			{ status: 409 },
		);
	const dup = await query(
		`SELECT 1 FROM claims WHERE restaurant_id = $1 AND user_id = $2 AND status = 'pending'`,
		[r.id, user.id],
	);
	if (dup.length)
		return NextResponse.json({ status: "pending", already: true });

	// Lane A: any VERIFIED Clerk email == the on-file restaurant email.
	const cu = await currentUser();
	const verified = (cu?.emailAddresses ?? [])
		.filter((e) => e.verification?.status === "verified")
		.map((e) => e.emailAddress.trim().toLowerCase());
	const onFile = r.email?.trim().toLowerCase() ?? null;
	const emailMatch = !!onFile && verified.includes(onFile);
	const accountEmail = cu?.primaryEmailAddress?.emailAddress ?? user.email;

	// Claimant-typed strings are untrusted: everything interpolated into email
	// HTML below goes through escapeHtml (the form's disabled fields don't bind
	// a hand-rolled POST).
	const safeName = escapeHtml(name);
	const safeRestaurant = escapeHtml(r.name);
	const safeAccountEmail = accountEmail ? escapeHtml(accountEmail) : null;

	if (emailMatch) {
		await grantOwnership(user.id, r.id);
		await query(
			`INSERT INTO claims (restaurant_id, user_id, name, role, note,
			                     email_match, status, reason, decided_at)
			 VALUES ($1,$2,$3,$4,$5,true,'approved','auto: verified email matches listed address',now())`,
			[r.id, user.id, name, role, note],
		);
		// Awaited: on serverless the function can freeze the moment the response
		// returns, silently dropping an un-awaited send. sendEmail never throws
		// (it reports {ok:false}), so a failed email still never fails the claim.
		await Promise.allSettled([
			...(accountEmail
				? [
						sendEmail({
							to: accountEmail,
							subject: `${r.name} is yours to edit`,
							html: `<p>Your claim is verified: the email on your account matches the one ${safeRestaurant} lists, so you're in already.</p>
							 <p><a href="${SITE}/restaurant/${slug}">Open your page</a> and hit Edit Restaurant to update your menu, photos and hours. Fresh menu uploads reach us automatically.</p>`,
						}),
					]
				: []),
			notifyAdmin(
				`Claim AUTO-APPROVED: ${r.name}`,
				`<p>${safeName} (${role}, ${safeAccountEmail ?? "no email"}) claimed <strong>${safeRestaurant}</strong> via verified email match.</p>
				 <p>Audit / revoke: <a href="${SITE}/admin/claims">/admin/claims</a></p>`,
			),
		]);
		// the public page shows the claim CTA + verified badge: bust its ISR cache
		revalidatePath(`/restaurant/${slug}`);
		return NextResponse.json({ status: "approved" });
	}

	// everyone else: queue for social-channel verification + invite
	const inserted = await query<{ id: number }>(
		`INSERT INTO claims (restaurant_id, user_id, name, role, note, email_match)
		 VALUES ($1,$2,$3,$4,$5,false) RETURNING id`,
		[r.id, user.id, name, role, note],
	);
	const claimId = inserted[0].id;
	await Promise.allSettled([
		...(accountEmail
			? [
					sendEmail({
						to: accountEmail,
						subject: `We got your claim for ${r.name}`,
						html: `<p>Thanks ${safeName}. We confirm every claim with the restaurant directly, usually within a day or two. You'll hear from us the moment it's done.</p>`,
					}),
				]
			: []),
		notifyAdmin(
			`Claim request: ${r.name} (${role})`,
			`<p><strong>${safeName}</strong> (${role}) is claiming <strong>${safeRestaurant}</strong>.</p>
			 <ul><li>Account email: ${safeAccountEmail ?? "unknown"}</li><li>Note: ${note ? escapeHtml(note) : ""}</li></ul>
			 <p>Verify via the restaurant's social/listed channels, then decide here:
			 <a href="${SITE}/admin/claims?claim=${claimId}">/admin/claims?claim=${claimId}</a></p>`,
		),
	]);
	return NextResponse.json({ status: "pending" });
}
