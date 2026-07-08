"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CircleNotch, Phone, SealCheck, EnvelopeSimple } from "@phosphor-icons/react";
import { pressable } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export type ClaimRow = {
	id: string;
	name: string;
	role: string;
	note: string | null;
	emailMatch: boolean;
	status: "pending" | "approved" | "rejected";
	reason: string | null;
	created: string;
	slug: string;
	restaurantName: string;
	restaurantPhone: string | null;
	restaurantEmail: string | null;
	instagram: string | null;
	facebook: string | null;
	accountEmail: string | null;
};

// The claims queue table. The admin-notification email deep-links here with
// ?claim=<id>; that row gets highlighted + scrolled into view so it's obvious
// which claim the email was about.
export function ClaimsTable({
	rows,
	highlightId,
}: {
	rows: ClaimRow[];
	highlightId?: string;
}) {
	const router = useRouter();
	const [busy, setBusy] = useState<string | null>(null);
	const highlightRef = useRef<HTMLTableRowElement>(null);

	useEffect(() => {
		highlightRef.current?.scrollIntoView({ block: "center" });
	}, []);

	const decide = async (id: string, action: "approve" | "reject") => {
		if (
			action === "reject" &&
			!confirm(
				"Reject this claim? No email is sent automatically. Remember to write them a personal note.",
			)
		)
			return;
		setBusy(id);
		try {
			const res = await fetch(`/api/admin/claims/${id}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				toast.error(data.error ?? "Failed");
				return;
			}
			toast.success(
				action === "approve"
					? "Approved. They have edit access and an email on the way."
					: "Rejected. Now email them a personal note.",
			);
			router.refresh();
		} finally {
			setBusy(null);
		}
	};

	const chip = (status: ClaimRow["status"], emailMatch: boolean) =>
		status === "approved" ? (
			<span className="inline-flex items-center gap-1 rounded-full bg-coriander-500/15 text-coriander-600 px-2.5 py-0.5 text-xs font-bold">
				<SealCheck size={12} weight="fill" />
				approved{emailMatch ? " · auto" : ""}
			</span>
		) : status === "rejected" ? (
			<span className="inline-flex rounded-full bg-paper-200 text-ink-500 px-2.5 py-0.5 text-xs font-bold">
				rejected
			</span>
		) : (
			// a pending claim can never carry an email match: a verified match
			// is auto-approved before any pending row is written
			<span className="inline-flex rounded-full bg-marigold-100 text-marigold-700 px-2.5 py-0.5 text-xs font-bold">
				pending
			</span>
		);

	return (
		<div className="overflow-x-auto rounded-xl border border-paper-300 bg-white">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b border-paper-300 text-left text-ink-500">
						<th className="px-4 py-3 font-semibold">Restaurant</th>
						<th className="px-4 py-3 font-semibold">Claimant</th>
						<th className="px-4 py-3 font-semibold">Verify via</th>
						<th className="px-4 py-3 font-semibold">Status</th>
						<th className="px-4 py-3 font-semibold">Received</th>
						<th className="px-4 py-3" />
					</tr>
				</thead>
				<tbody>
					{rows.map((c) => {
						const hl = c.id === highlightId;
						return (
							<tr
								key={c.id}
								ref={hl ? highlightRef : undefined}
								className={cn(
									"border-b border-paper-200 align-top",
									hl && "bg-marigold-100/50",
								)}
							>
								<td className="px-4 py-3">
									<Link
										href={`/restaurant/${c.slug}`}
										target="_blank"
										className="font-display font-bold text-ink-900 hover:text-chili-600"
									>
										{c.restaurantName}
									</Link>
									{c.restaurantEmail && (
										<div className="text-ink-500 text-xs mt-0.5 flex items-center gap-1">
											<EnvelopeSimple size={12} />
											{c.restaurantEmail}
										</div>
									)}
								</td>
								<td className="px-4 py-3">
									<div className="font-semibold text-ink-900">
										{c.name}{" "}
										<span className="text-ink-500 font-normal">
											({c.role})
										</span>
									</div>
									<div className="text-ink-500 text-xs mt-0.5">
										{c.accountEmail ?? "no email"}
									</div>
									{c.note && (
										<div className="text-ink-600 text-xs mt-1 max-w-[260px]">
											&ldquo;{c.note}&rdquo;
										</div>
									)}
								</td>
								<td className="px-4 py-3">
									{/* channel ladder: socials first (the verified-alive
									    channel; find + save via the edit panel when
									    missing), then listed email/phone as fallbacks */}
									<div className="flex flex-col gap-0.5 text-xs">
										{c.instagram && (
											<a href={c.instagram} target="_blank" rel="noopener noreferrer" className="font-semibold text-chili-600 hover:underline">
												Instagram ↗
											</a>
										)}
										{c.facebook && (
											<a href={c.facebook} target="_blank" rel="noopener noreferrer" className="font-semibold text-chili-600 hover:underline">
												Facebook ↗
											</a>
										)}
										{!c.instagram && !c.facebook && (
											<span className="text-marigold-700 font-semibold">
												no socials on file: find + save first
											</span>
										)}
										<span className="inline-flex items-center gap-1 text-ink-600">
											<Phone size={12} weight="fill" className="text-ink-400" />
											{c.restaurantPhone ?? "no listed number"}
										</span>
									</div>
								</td>
								<td className="px-4 py-3">{chip(c.status, c.emailMatch)}</td>
								<td className="px-4 py-3 whitespace-nowrap text-ink-600">
									{c.created}
								</td>
								<td className="px-4 py-3 whitespace-nowrap text-right">
									{c.status === "pending" && (
										<div className="inline-flex gap-2">
											<button
												type="button"
												disabled={busy === c.id}
												onClick={() => decide(c.id, "approve")}
												className={cn(
													"inline-flex items-center gap-1.5 rounded-full bg-coriander-500 text-white px-3.5 py-1.5 font-display font-bold text-xs cursor-pointer hover:bg-coriander-600 disabled:opacity-60",
													pressable,
												)}
											>
												{busy === c.id && (
													<CircleNotch size={12} className="animate-spin" />
												)}
												Approve
											</button>
											<button
												type="button"
												disabled={busy === c.id}
												onClick={() => decide(c.id, "reject")}
												className={cn(
													"rounded-full border-2 border-sand-400 text-ink-700 px-3.5 py-1.5 font-display font-bold text-xs cursor-pointer hover:bg-paper-100 disabled:opacity-60",
													pressable,
												)}
											>
												Reject
											</button>
										</div>
									)}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
