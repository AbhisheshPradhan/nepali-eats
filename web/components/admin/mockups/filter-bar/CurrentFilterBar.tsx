"use client";

import { useState } from "react";
import {
	Clock,
	CaretDown,
	CookingPot,
	NavigationArrow,
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
	FLAGS,
	MOMO_FACETS,
	type FilterBarMockupProps,
} from "./shared";

// Replica of what Explore ships today: primary row (Open + category chips +
// Sort + Filters), the dish facet row appearing UNDER it when a category chip
// is active, and the flat 14-chip panel behind the Filters toggle. Up to three
// chip rows stacked above the map. Interactive so the stacking is felt, not
// imagined; the viewport prop stands in for the real bar's md: breakpoints.
export function CurrentFilterBar({ viewport }: FilterBarMockupProps) {
	const mobile = viewport === "mobile";
	const [open, setOpen] = useState(false);
	const [dish, setDish] = useState<string | null>("momo");
	const [facets, setFacets] = useState<string[]>([]);
	const [flags, setFlags] = useState<string[]>([]);
	const [showFilters, setShowFilters] = useState(true);
	const toggle = (set: typeof setFlags) => (t: string) =>
		set((xs) => (xs.includes(t) ? xs.filter((x) => x !== t) : [...xs, t]));
	const count = flags.length + (open ? 1 : 0);

	return (
		<BarShell mobile={mobile}>
			<BarRow mobile={mobile} className="mt-3">
				{!mobile && (
					<BarChip active={open} onClick={() => setOpen((o) => !o)}>
						<Clock weight="fill" size={16} />
						Open
					</BarChip>
				)}
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
					onClick={() => setShowFilters((s) => !s)}
					className={cn(
						"shrink-0 inline-flex items-center gap-2 border-2 rounded-full px-4 py-[5px] cursor-pointer font-display font-bold text-[0.9rem] transition-colors",
						count > 0 || showFilters
							? "bg-coriander-500 border-coriander-500 text-white"
							: "bg-white border-sand-400 text-ink-700",
					)}
				>
					<SlidersHorizontal size={16} />
					Filters
					{count > 0 && (
						<span className="inline-grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-white/90 text-coriander-600 text-[0.72rem] leading-none">
							{count}
						</span>
					)}
					<CaretDown
						className={cn("transition-transform", showFilters && "rotate-180")}
						size={14}
					/>
				</button>
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

			{showFilters && (
				<div className="mt-2.5">
					{mobile && (
						<div className="flex flex-wrap items-center gap-2 pb-3 mb-3 border-b border-paper-300">
							<span className="shrink-0 inline-flex items-center gap-2 rounded-full bg-chili-500 text-white px-4 py-[7px] font-display font-bold text-[0.9rem]">
								<NavigationArrow weight="fill" size={16} />
								Near me
							</span>
							<BarChip active={open} onClick={() => setOpen((o) => !o)}>
								<Clock weight="fill" size={16} />
								Open now
							</BarChip>
						</div>
					)}
					<div className="flex flex-wrap gap-2 items-center">
						{FLAGS.map(([token, label]) => (
							<BarChip
								key={token}
								active={flags.includes(token)}
								onClick={() => toggle(setFlags)(token)}
							>
								{label}
							</BarChip>
						))}
						{count > 0 && (
							<button
								type="button"
								onClick={() => {
									setFlags([]);
									setOpen(false);
								}}
								className="px-2 font-display font-bold text-[0.85rem] text-chili-600 cursor-pointer hover:underline"
							>
								Clear all
							</button>
						)}
					</div>
				</div>
			)}
		</BarShell>
	);
}
