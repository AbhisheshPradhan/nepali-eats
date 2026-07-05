"use client";

import { useState } from "react";
import {
	Clock,
	CaretDown,
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
	FLAGS,
	MOMO_FACETS,
	type FilterBarMockupProps,
} from "./shared";

// Candidate: TWO-ROW BUDGET + SIZE HIERARCHY. Picking a dish REPLACES the
// category row instead of adding a row under it: the active dish chip (with
// its x) takes the row over and its facets render beside it a size smaller,
// so dish mode costs zero extra rows. Secondary chips (facets + the flags
// panel) drop a size so the primary row visibly outranks them. Max two chip
// rows above the map in every state.
export function TwoRowBar({ viewport }: FilterBarMockupProps) {
	const mobile = viewport === "mobile";
	const [open, setOpen] = useState(false);
	const [dish, setDish] = useState<string | null>("momo");
	const [facets, setFacets] = useState<string[]>([]);
	const [flags, setFlags] = useState<string[]>([]);
	const [showFilters, setShowFilters] = useState(false);
	const toggle = (set: typeof setFlags) => (t: string) =>
		set((xs) => (xs.includes(t) ? xs.filter((x) => x !== t) : [...xs, t]));
	const count = flags.length + (open ? 1 : 0);

	const filtersButton = (
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
	);

	return (
		<BarShell mobile={mobile}>
			{dish ? (
				// Dish mode: the dish chip takes the category row over; facets sit
				// beside it a size smaller. Clearing the dish restores the categories.
				<BarRow mobile={mobile} className="mt-3">
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
							size="sm"
							active={facets.includes(slug)}
							onClick={() => toggle(setFacets)(slug)}
						>
							{label}
						</BarChip>
					))}
					<FakeSort size="sm" />
					{filtersButton}
				</BarRow>
			) : (
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
							active={false}
							onClick={() => {
								setDish(slug);
								setFacets([]);
							}}
						>
							{label}
						</BarChip>
					))}
					<FakeSort />
					{filtersButton}
				</BarRow>
			)}

			{showFilters && (
				<div className="mt-2.5 flex flex-wrap gap-2 items-center">
					{mobile && (
						<BarChip
							size="sm"
							active={open}
							onClick={() => setOpen((o) => !o)}
						>
							<Clock weight="fill" size={14} />
							Open now
						</BarChip>
					)}
					{FLAGS.map(([token, label]) => (
						<BarChip
							key={token}
							size="sm"
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
			)}
		</BarShell>
	);
}
