"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser, useClerk } from "@clerk/nextjs";
import { CircleNotch, SealCheck, Clock } from "@phosphor-icons/react";
import { Button, pressable } from "@/components/ui/Button";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { cn } from "@/lib/cn";
import { trackEvent } from "@/lib/analytics";

// The claim form (docs/CLAIM-FLOW.md). Pitch is public; auth happens HERE on
// the button (value before commitment). Submits to /api/claims, which decides
// instantly (verified-email match) or queues for admin verification through
// the restaurant's own channels (socials first).
export function ClaimForm({
	slug,
	restaurantName,
}: {
	slug: string;
	restaurantName: string;
}) {
	const { isSignedIn, user } = useUser();
	const { openSignIn } = useClerk();
	// The ACCOUNT is the source of truth for identity: when Clerk has a name
	// (social sign-in, or set in Manage account) it's shown read-only. The
	// input only exists for email signups that never provided one.
	const accountName = user?.fullName?.trim() ?? "";
	const [name, setName] = useState("");
	const [role, setRole] = useState<"owner" | "manager">("owner");
	const [note, setNote] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<"approved" | "pending" | null>(null);

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setBusy(true);
		try {
			const res = await fetch("/api/claims", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ slug, name: accountName || name, role, note }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				setError(data.error ?? "Something went wrong. Try again.");
				return;
			}
			setResult(data.status === "approved" ? "approved" : "pending");
			trackEvent("claim_submitted", {
				slug,
				status: data.status === "approved" ? "approved" : "pending",
			});
		} finally {
			setBusy(false);
		}
	};

	if (result === "approved")
		return (
			<div className="mt-8 bg-white rounded-xl shadow-sm p-6">
				<span className="text-coriander-500">
					<SealCheck size={28} weight="fill" />
				</span>
				<h2 className="font-display font-bold text-[1.2rem] text-ink-900 mt-2">
					Verified. {restaurantName} is yours.
				</h2>
				<p className="text-ink-700 mt-1.5">
					This account holds the keys. Open your page and hit Edit
					Restaurant to update your menu, photos and hours.
				</p>
				<Button href={`/restaurant/${slug}`} className="mt-4">
					Go to your page
				</Button>
			</div>
		);

	if (result === "pending")
		return (
			<div className="mt-8 bg-white rounded-xl shadow-sm p-6">
				<span className="text-marigold-700">
					<Clock size={28} weight="fill" />
				</span>
				<h2 className="font-display font-bold text-[1.2rem] text-ink-900 mt-2">
					Got it. We&apos;ll confirm with the restaurant.
				</h2>
				<p className="text-ink-700 mt-1.5">
					We check every claim with the restaurant directly, usually within
					a day or two. You&apos;ll get an email the moment it&apos;s done.
				</p>
				<Link
					href={`/restaurant/${slug}`}
					className="inline-block mt-4 font-display font-bold text-chili-600 hover:underline"
				>
					Back to the page
				</Link>
			</div>
		);

	if (!isSignedIn)
		return (
			<div className="mt-8 bg-white rounded-xl shadow-sm p-6">
				<h2 className="font-display font-bold text-[1.15rem] text-ink-900">
					Ready when you are
				</h2>
				<p className="text-ink-700 mt-1.5">
					Sign in (or make a free account) and the claim takes about a
					minute.
				</p>
				<Button className="mt-4" onClick={() => openSignIn()}>
					Claim this restaurant
				</Button>
			</div>
		);

	const input =
		"w-full rounded-lg border-2 border-sand-400 bg-white px-3.5 py-2.5 text-ink-900 outline-none focus:border-sand-500";

	return (
		<form onSubmit={submit} className="mt-8 bg-white rounded-xl shadow-sm p-6">
			<h2 className="font-display font-bold text-[1.15rem] text-ink-900">
				Claim {restaurantName}
			</h2>

			<div className="grid sm:grid-cols-2 gap-4 mt-5">
				<label className="block">
					<span className="font-display font-semibold text-ink-800 text-sm">
						Your name
					</span>
					{/* account name is authoritative: disabled when Clerk has one;
					    editable only for email signups that never provided a name */}
					<input
						className={cn(
							input,
							"mt-1 disabled:bg-paper-100 disabled:border-paper-300 disabled:text-ink-600",
						)}
						value={accountName || name}
						onChange={(e) => setName(e.target.value)}
						disabled={!!accountName}
						required
						placeholder="Who are we talking to?"
					/>
				</label>
				<label className="block">
					<span className="font-display font-semibold text-ink-800 text-sm">
						Email
					</span>
					<input
						className={cn(
							input,
							"mt-1 disabled:bg-paper-100 disabled:border-paper-300 disabled:text-ink-600",
						)}
						value={user?.primaryEmailAddress?.emailAddress ?? ""}
						disabled
						readOnly
					/>
				</label>
				<div>
					<span className="font-display font-semibold text-ink-800 text-sm">
						Your role
					</span>
					{/* the house dropdown (ui/SelectMenu), styled as a form input */}
					<SelectMenu
						value={role}
						onChange={setRole}
						ariaLabel="Your role"
						className={cn(input, "mt-1")}
						options={[
							{ value: "owner", label: "Owner" },
							{ value: "manager", label: "Manager" },
						]}
					/>
				</div>


			</div>
			<label className="block mt-4">
				<span className="font-display font-semibold text-ink-800 text-sm">
					Anything we should know? (optional)
				</span>
				<textarea
					className={cn(input, "mt-1 min-h-20")}
					value={note}
					onChange={(e) => setNote(e.target.value)}
				/>
			</label>

			{error && (
				<p className="mt-3 text-[0.9rem] font-semibold text-chili-600">
					{error}
				</p>
			)}

			<button
				type="submit"
				disabled={busy}
				className={cn(
					"mt-5 inline-flex items-center gap-2 rounded-full bg-chili-500 text-white px-6 py-3 font-display font-bold cursor-pointer hover:bg-chili-600 transition-colors disabled:opacity-60",
					pressable,
				)}
			>
				{busy && <CircleNotch size={18} className="animate-spin" />}
				Send my claim
			</button>
			<p className="text-ink-500 text-[0.85rem] mt-3">
				We confirm every claim with the restaurant directly, usually within
				a day or two.
			</p>
		</form>
	);
}
