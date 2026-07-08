// Transactional email via Resend's REST API (no SDK dependency). Graceful when
// unconfigured: without RESEND_API_KEY every send logs to the server console
// and reports ok:false, so flows never crash in dev or before the key exists.
//
// ⚠️ Resend sandbox (before a verified sending domain): mail only delivers to
// the account owner's own address — fine for ADMIN notifications, owner-facing
// mail goes live once the launch domain is verified in Resend. From-address is
// EMAIL_FROM (falls back to Resend's sandbox sender).

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || "NepaliEats <onboarding@resend.dev>";
// Claim notifications land here; override with ADMIN_EMAIL.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "pradhan.abhishesh@gmail.com";

// Every dynamic value interpolated into an email HTML body goes through this.
// Claim emails carry claimant-typed strings (name, note): unescaped they are
// live HTML in the recipient's inbox (phishing links styled as our own UI).
export function escapeHtml(s: string): string {
	return s
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

export async function sendEmail(opts: {
	to: string;
	subject: string;
	html: string;
}): Promise<{ ok: boolean }> {
	if (!RESEND_KEY) {
		console.log(
			`[email:noop] to=${opts.to} subject="${opts.subject}" (RESEND_API_KEY unset)`,
		);
		return { ok: false };
	}
	try {
		const res = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${RESEND_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				from: FROM,
				to: [opts.to],
				subject: opts.subject,
				html: opts.html,
			}),
		});
		if (!res.ok)
			console.error("[email] send failed", res.status, await res.text());
		return { ok: res.ok };
	} catch (e) {
		console.error("[email] send error", e);
		return { ok: false };
	}
}

export async function notifyAdmin(subject: string, html: string) {
	return sendEmail({ to: ADMIN_EMAIL, subject, html });
}
