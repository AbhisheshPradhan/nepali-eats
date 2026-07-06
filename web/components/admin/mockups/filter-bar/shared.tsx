"use client";

import type { ReactNode } from "react";
import { MagnifyingGlass, NavigationArrow } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

// Shared bits for the Explore filter-bar mockups: the sample filter data
// (mirrors FLAG_OPTIONS / CATEGORY_CHIPS in ExploreClient plus the momo facet
// set), a chip with the bar's real styling, and the shell that frames every
// design (fake search row on top, map placeholder below, so each design's
// vertical cost above the map is visible at a glance).

// Every mockup takes just the viewport; all filter state is internal to the
// mockup so the bars are directly clickable in the lab.
export type FilterBarMockupProps = {
	viewport: "desktop" | "mobile";
};

export const CATEGORIES: [string, string][] = [
	["momo", "Momo"],
	["newari", "Newari"],
	["sekuwa", "Sekuwa"],
	["tibetan", "Tibetan"],
	["thakali", "Thakali"],
];

export const FLAGS: [string, string][] = [
	["menu", "Menu on here"],
	["veg", "Vegetarian"],
	["takeout", "Takeaway"],
	["delivery", "Delivery"],
	["dinein", "Dine-in"],
	["alcohol", "Licensed"],
	["outdoor", "Outdoor seating"],
	["kid", "Kid-friendly"],
	["groups", "Good for groups"],
	["reservable", "Takes bookings"],
	["cocktails", "Cocktails"],
	["music", "Live music"],
	["dogs", "Dog-friendly"],
	["wheelchair", "Wheelchair access"],
];
export const FLAG_LABEL = new Map(FLAGS);

// The same 14 flags, grouped for the "grouped panel" candidate.
export const FLAG_GROUPS: { label: string; items: [string, string][] }[] = [
	{
		label: "Ordering",
		items: [
			["menu", "Menu on here"],
			["takeout", "Takeaway"],
			["delivery", "Delivery"],
			["dinein", "Dine-in"],
		],
	},
	{
		label: "Food & drinks",
		items: [
			["veg", "Vegetarian"],
			["alcohol", "Licensed"],
			["cocktails", "Cocktails"],
		],
	},
	{
		label: "Vibe",
		items: [
			["outdoor", "Outdoor seating"],
			["kid", "Kid-friendly"],
			["groups", "Good for groups"],
			["reservable", "Takes bookings"],
			["music", "Live music"],
		],
	},
	{
		label: "Access",
		items: [
			["dogs", "Dog-friendly"],
			["wheelchair", "Wheelchair access"],
		],
	},
];

// The facet chips a momo dish search shows (preparations + proteins).
export const MOMO_FACETS: [string, string][] = [
	["steamed", "Steamed Momo"],
	["fried", "Fried Momo"],
	["kothey", "Kothey Momo"],
	["sandheko", "Sandheko Momo"],
	["jhol", "Jhol Momo"],
	["cmomo", "Chilli Momo (C-Momo)"],
	["chicken", "Chicken"],
	["fveg", "Veg"],
	["lamb", "Lamb"],
	["goat", "Goat"],
	["buff", "Buff"],
	["pork", "Pork"],
	["paneer", "Paneer"],
];

// One filter chip in the bar's real styling. tone: chili = dish/navigation,
// coriander = filter. size "sm" is the hierarchy experiment: secondary chips
// a step smaller than the primary row.
export function BarChip({
	active,
	tone = "coriander",
	size = "md",
	onClick,
	children,
}: {
	active: boolean;
	tone?: "chili" | "coriander";
	size?: "md" | "sm";
	onClick?: () => void;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			aria-pressed={active}
			onClick={onClick}
			className={cn(
				"shrink-0 inline-flex items-center gap-1.5 border-2 rounded-full cursor-pointer font-display font-bold transition-colors",
				size === "sm"
					? "px-3 py-[3px] text-[0.8rem]"
					: "px-3.5 py-[5px] text-[0.9rem]",
				active
					? tone === "chili"
						? "bg-chili-500 border-chili-500 text-white"
						: "bg-coriander-500 border-coriander-500 text-white"
					: "bg-white border-sand-400 text-ink-700 hover:bg-paper-100",
			)}
		>
			{children}
		</button>
	);
}

// A non-functional stand-in for the Sort select.
export function FakeSort({ size = "md" }: { size?: "md" | "sm" }) {
	return (
		<div className="flex items-center gap-2 shrink-0">
			<span
				className={cn(
					"font-display font-bold text-ink-700",
					size === "sm" ? "text-[0.8rem]" : "text-[0.9rem]",
				)}
			>
				Sort
			</span>
			<span
				className={cn(
					"rounded-full border-2 border-sand-400 bg-white font-display font-bold text-ink-900",
					size === "sm"
						? "px-3 py-[3px] text-[0.8rem]"
						: "px-3.5 py-[5px] text-[0.9rem]",
				)}
			>
				Popular ▾
			</span>
		</div>
	);
}

// A filter row: single scrollable line on mobile (like the real bar's bleed
// rows), wrapping on desktop.
export function BarRow({
	mobile,
	className,
	children,
}: {
	mobile: boolean;
	className?: string;
	children: ReactNode;
}) {
	return (
		<div
			className={cn(
				"flex items-center gap-2.5",
				mobile
					? "flex-nowrap overflow-x-auto scrollbar-hide"
					: "flex-wrap gap-y-2",
				className,
			)}
		>
			{children}
		</div>
	);
}

// The frame every design renders in: search band + Near me on top (fake, for
// context), the design's filter rows, then a map placeholder so it's obvious
// how much height each design leaves the map.
export function BarShell({
	mobile,
	action,
	children,
}: {
	mobile: boolean;
	// optional desktop-only control rendered to the right of "Near me"
	// (e.g. a Clear filters button). Hidden on mobile.
	action?: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="rounded-xl border border-paper-300 overflow-hidden bg-white">
			<div className="px-4 py-3 border-b border-paper-300 bg-paper-100">
				<div className="flex items-center gap-3">
					<div className="flex-1 min-w-0 max-w-[560px] h-11 rounded-full border border-sand-400 bg-white flex items-center gap-2 px-4 text-ink-400 text-[0.95rem]">
						<MagnifyingGlass size={17} />
						<span className="truncate">
							Search a dish, restaurant, or suburb
						</span>
					</div>
					{!mobile && (
						<span className="shrink-0 inline-flex items-center gap-2 h-11 rounded-full bg-chili-500 text-white px-5 font-display font-bold text-[0.95rem]">
							<NavigationArrow weight="fill" size={16} />
							Near me
						</span>
					)}
					{!mobile && action}
				</div>
				{children}
			</div>
			<div className="h-[150px] bg-paper-200 grid place-items-center text-ink-400 font-display font-bold">
				Map
			</div>
		</div>
	);
}
