"use client";

import { dishPrice } from "@/lib/format";
import { CandidateShell } from "./CandidateShell";
import type { ExploreCardMockupProps } from "./types";

const SHOWN = 3;

// Candidate: dish matches as a MENU EXCERPT instead of pills. Matched items
// render as menu-style rows (name, dotted leader, right-aligned price) inside
// a soft panel, capped at 3 with the overflow folded into one "+N more" line.
// Verbatim item names stop fighting the pill shape, prices line up so they can
// be scanned and compared, and the block reads like the menu it came from.
export function MenuPeekCard(props: ExploreCardMockupProps) {
	const { pills, dishName } = props;

	const excerpt =
		pills && pills.length > 0 ? (
			<div className="rounded-lg bg-paper-100 px-3 py-2 flex flex-col gap-1 min-w-0">
				{pills.slice(0, SHOWN).map((p) => (
					<div
						key={p.label}
						className="flex items-baseline gap-2 min-w-0 text-[0.85rem]"
					>
						<span className="truncate min-w-0 font-body font-semibold text-ink-800">
							{p.label}
						</span>
						<span className="flex-1 min-w-4 border-b border-dotted border-sand-400 -translate-y-[3px]" />
						{p.price != null && (
							<span className="shrink-0 whitespace-nowrap font-bold text-chili-600">
								{p.priceFrom ? "from " : ""}
								{dishPrice(p.price)}
							</span>
						)}
					</div>
				))}
				{pills.length > SHOWN && (
					<span className="text-[0.8rem] font-display font-bold text-marigold-700">
						+{pills.length - SHOWN} more {dishName ?? "matching"} dishes on
						the menu
					</span>
				)}
			</div>
		) : undefined;

	return <CandidateShell {...props} dishSlot={excerpt} />;
}
