"use client";

import { useState } from "react";
import {
	Clock,
	CookingPot,
	SlidersHorizontal,
	X,
} from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import {
	BarChip,
	BarRow,
	BarShell,
	FakeSort,
	CATEGORIES,
	FLAG_GROUPS,
	FLAG_LABEL,
	MOMO_FACETS,
	type FilterBarMockupProps,
} from "./shared";

// Candidate: GROUPED FILTER PANEL. The flat 14-chip dump becomes a structured
// panel of labelled groups (Ordering / Food & drinks / Vibe / Access) behind
// "All filters", with the two filters that actually decide dinner (Open, Menu
// on here) promoted to the bar. While the panel is closed, active picks echo
// back into the bar as removable chips, so state never hides. Dish facets are
// unchanged from today.
export function GroupedFiltersBar({ viewport }: FilterBarMockupProps) {
	const mobile = viewport === "mobile";
	const [open, setOpen] = useState(false);
	const [menuHere, setMenuHere] = useState(false);
	const [dish, setDish] = useState<string | null>("momo");
	const [facets, setFacets] = useState<string[]>([]);
	const [flags, setFlags] = useState<string[]>([]);
	const [showPanel, setShowPanel] = useState(false);
	const toggle = (set: typeof setFlags) => (t: string) =>
		set((xs) => (xs.includes(t) ? xs.filter((x) => x !== t) : [...xs, t]));
	// "Menu on here" lives in the bar; drop it from the panel's Ordering group
	// so it isn't togglable in two places.
	const panelFlags = flags.filter((f) => f !== "menu");
	const count = panelFlags.length;

	return (
		<BarShell mobile={mobile}>
			<BarRow mobile={mobile} className="mt-3">
				<BarChip active={open} onClick={() => setOpen((o) => !o)}>
					<Clock weight="fill" size={16} />
					Open
				</BarChip>
				<BarChip active={menuHere} onClick={() => setMenuHere((m) => !m)}>
					Menu on here
				</BarChip>
				{CATEGORIES.map(([slug, label]) => (
					<BarChip
						key={slug}
						tone="chili"
						active={dish === slug}
						onClick={() => {
							setDish((d) => (d === slug ? null : slug));
							setFacets([]);
						}}
					>
						{label}
					</BarChip>
				))}
				<FakeSort />
				<button
					type="button"
					onClick={() => setShowPanel((s) => !s)}
					className={cn(
						"shrink-0 inline-flex items-center gap-2 border-2 rounded-full px-4 py-[5px] cursor-pointer font-display font-bold text-[0.9rem] transition-colors",
						count > 0 || showPanel
							? "bg-coriander-500 border-coriander-500 text-white"
							: "bg-white border-sand-400 text-ink-700",
					)}
				>
					<SlidersHorizontal size={16} />
					All filters
					{count > 0 && (
						<span className="inline-grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-white/90 text-coriander-600 text-[0.72rem] leading-none">
							{count}
						</span>
					)}
				</button>

				{/* active picks echoed as removable chips while the panel is closed */}
				{!showPanel &&
					panelFlags.map((token) => (
						<button
							key={token}
							type="button"
							onClick={() => toggle(setFlags)(token)}
							className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-coriander-500 border-2 border-coriander-500 text-white px-3 py-[5px] cursor-pointer font-display font-bold text-[0.85rem]"
						>
							{FLAG_LABEL.get(token)}
							<X size={12} weight="bold" />
						</button>
					))}
			</BarRow>

			{dish && (
				<BarRow mobile={mobile} className="mt-2.5">
					<button
						type="button"
						onClick={() => {
							setDish(null);
							setFacets([]);
						}}
						className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-chili-500 border-2 border-chili-500 text-white px-3.5 py-[5px] cursor-pointer font-display font-bold text-[0.9rem]"
					>
						<CookingPot weight="fill" size={15} />
						Momo
						<X size={13} weight="bold" />
					</button>
					{MOMO_FACETS.map(([slug, label]) => (
						<BarChip
							key={slug}
							active={facets.includes(slug)}
							onClick={() => toggle(setFacets)(slug)}
						>
							{label}
						</BarChip>
					))}
				</BarRow>
			)}

			{showPanel && (
				<div className="mt-2.5 rounded-xl border border-paper-300 bg-white p-4 flex flex-col gap-4">
					{FLAG_GROUPS.map((g) => {
						const items = g.items.filter(([t]) => t !== "menu");
						if (!items.length) return null;
						return (
							<div key={g.label}>
								<div className="eyebrow text-chili-600 text-[11px] mb-2">
									{g.label}
								</div>
								<div className="flex flex-wrap gap-2">
									{items.map(([token, label]) => (
										<BarChip
											key={token}
											active={flags.includes(token)}
											onClick={() => toggle(setFlags)(token)}
										>
											{label}
										</BarChip>
									))}
								</div>
							</div>
						);
					})}
					<div className="flex items-center justify-between pt-1 border-t border-paper-200">
						<button
							type="button"
							onClick={() => setFlags([])}
							className="font-display font-bold text-[0.85rem] text-ink-500 cursor-pointer hover:underline disabled:opacity-40"
							disabled={count === 0}
						>
							Clear all
						</button>
						<button
							type="button"
							onClick={() => setShowPanel(false)}
							className="rounded-full bg-chili-500 text-white px-5 py-1.5 font-display font-bold text-[0.9rem] cursor-pointer hover:bg-chili-600 transition-colors"
						>
							Done{count > 0 ? ` (${count})` : ""}
						</button>
					</div>
				</div>
			)}
		</BarShell>
	);
}
