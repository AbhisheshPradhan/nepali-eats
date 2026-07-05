"use client";

import { CookingPot } from "@phosphor-icons/react";
import { dishPrice } from "@/lib/format";
import { CandidateShell } from "./CandidateShell";
import type { ExploreCardMockupProps } from "./types";

// Candidate: dish matches collapsed to ONE SUMMARY STRIP — the count and the
// cheapest price ("12 momo dishes · from $15.50") with the first few item
// names as a muted one-line teaser. The card stays as calm as a browse card;
// the full item list lives behind "See the menu".
export function MatchSummaryCard(props: ExploreCardMockupProps) {
	const { pills, dishName } = props;

	let slot: React.ReactNode;
	if (pills && pills.length > 0) {
		const prices = pills
			.map((p) => p.price)
			.filter((p): p is number => p != null);
		const min = prices.length ? Math.min(...prices) : null;
		const teaser = pills
			.slice(0, 3)
			.map((p) => p.label)
			.join(", ");
		slot = (
			<div className="flex flex-col gap-1 min-w-0">
				<span className="self-start inline-flex items-center gap-1.5 rounded-full bg-marigold-100 text-marigold-800 px-2.5 py-1 font-display font-bold text-[0.82rem]">
					<CookingPot weight="fill" size={14} />
					{pills.length} {dishName ?? "matching"}{" "}
					{pills.length === 1 ? "dish" : "dishes"}
					{min != null && (
						<>
							<span className="text-marigold-600">·</span>
							<span className="text-chili-600">
								from {dishPrice(min)}
							</span>
						</>
					)}
				</span>
				<span className="text-[0.83rem] text-ink-500 truncate min-w-0">
					{teaser}
					{pills.length > 3 && ` +${pills.length - 3} more`}
				</span>
			</div>
		);
	}

	return <CandidateShell {...props} dishSlot={slot} />;
}
