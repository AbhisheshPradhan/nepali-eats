"use client";

import { useState, type ReactNode } from "react";
import { Popover } from "radix-ui";
import {
	Clock,
	CaretDown,
	CookingPot,
	SlidersHorizontal,
	X,
	Check,
	GlobeHemisphereWest,
	BowlSteam,
	BowlFood,
	ForkKnife,
	Flame,
	type Icon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { BarShell, type FilterBarMockupProps } from "./shared";

// Candidate: DROPDOWN BAR. The flat chip dump collapses into a row of labelled
// dropdowns. Category is a single-select cuisine menu; picking one (e.g. Momo)
// reveals per-kind "Dish type" and "Protein" dropdowns beside it. Attribute
// flags move behind one grouped "Features" menu, and Sort sits last on the
// right. Open now stays a one-tap chip. Every menu is a Popover so the bar
// never grows past a single row above the map.

// --- data (mockup-local; the real bar reads dishData.facets + FLAG_COLS) -----

const CUISINES: [string, string, Icon][] = [
	["", "All cuisines", GlobeHemisphereWest],
	["momo", "Momo", BowlSteam],
	["newari", "Newari", ForkKnife],
	["sekuwa", "Sekuwa", Flame],
	["thakali", "Thakali", CookingPot],
	["tibetan", "Tibetan", BowlFood],
];

// Momo's facets, split by kind into their own dropdowns (single-select each).
const DISH_TYPES: [string, string][] = [
	["steamed", "Steamed"],
	["fried", "Fried"],
	["kothey", "Kothey"],
	["sandheko", "Sandheko"],
	["jhol", "Jhol"],
	["cmomo", "Chilli (C-Momo)"],
];
const PROTEINS: [string, string][] = [
	["chicken", "Chicken"],
	["fveg", "Veg"],
	["paneer", "Paneer"],
	["buff", "Buff"],
	["lamb", "Lamb"],
	["goat", "Goat"],
	["pork", "Pork"],
];

// The 14 attribute flags, grouped for the Features menu.
const FEATURE_GROUPS: { label: string; items: [string, string][] }[] = [
	{
		label: "Service",
		items: [
			["takeout", "Takeaway"],
			["delivery", "Delivery"],
			["dinein", "Dine-in"],
			["menu", "Menu on here"],
		],
	},
	{
		label: "Good to know",
		items: [
			["veg", "Vegetarian-friendly"],
			["alcohol", "Licensed"],
			["cocktails", "Cocktails"],
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

const SORTS: [string, string][] = [
	["popular", "Popular"],
	["rating", "Highest rated"],
	["nearest", "Nearest"],
];
const SORT_LABEL = new Map(SORTS);

// --- reusable dropdown pieces ------------------------------------------------

// The trigger button, in the bar's chip styling. `labeled` stacks a small
// eyebrow over the value (Category / Dish type / Protein); the plain form is a
// single-line pill (Features / Sort). `active` = a non-default value is picked.
function Trigger({
	eyebrow,
	value,
	icon,
	active,
	open,
	count,
}: {
	eyebrow?: string;
	value: ReactNode;
	icon?: ReactNode;
	active?: boolean;
	open: boolean;
	count?: number;
}) {
	return (
		<Popover.Trigger asChild>
			<button
				type="button"
				className={cn(
					"shrink-0 inline-flex items-center gap-2 border-2 rounded-full cursor-pointer font-display transition-colors",
					eyebrow ? "px-3.5 py-1.5" : "px-4 py-[7px]",
					active || open
						? "bg-white border-chili-400 text-ink-900"
						: "bg-white border-sand-400 text-ink-700 hover:bg-paper-100",
				)}
			>
				{icon}
				{eyebrow ? (
					<span className="flex flex-col items-start leading-tight text-left">
						<span className="eyebrow text-ink-400 text-[9px]">
							{eyebrow}
						</span>
						<span className="font-bold text-[0.92rem]">{value}</span>
					</span>
				) : (
					<span className="font-bold text-[0.9rem]">{value}</span>
				)}
				{count ? (
					<span className="inline-grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-chili-500 text-white text-[0.72rem] leading-none">
						{count}
					</span>
				) : null}
				<CaretDown
					size={14}
					weight="bold"
					className={cn(
						"text-ink-400 transition-transform",
						open && "rotate-180",
					)}
				/>
			</button>
		</Popover.Trigger>
	);
}

// The floating panel. Portalled so BarShell's overflow-hidden never clips it.
function Panel({
	align = "start",
	children,
}: {
	align?: "start" | "end";
	children: ReactNode;
}) {
	return (
		<Popover.Portal>
			<Popover.Content
				align={align}
				sideOffset={8}
				style={{ zIndex: 1300 }}
				className="min-w-[200px] rounded-2xl border border-paper-300 bg-white p-1.5 shadow-xl shadow-ink-900/10"
			>
				{children}
			</Popover.Content>
		</Popover.Portal>
	);
}

// One selectable row: check indicator + optional icon + label. `selected`
// paints it chili with a filled check (matches the screenshots).
function Row({
	selected,
	icon,
	label,
	onSelect,
}: {
	selected: boolean;
	icon?: ReactNode;
	label: ReactNode;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			className={cn(
				"w-full flex items-center gap-3 rounded-xl px-2.5 py-2 cursor-pointer text-left font-display transition-colors",
				selected ? "text-chili-600" : "text-ink-800 hover:bg-paper-100",
			)}
		>
			<span
				className={cn(
					"grid place-items-center w-[22px] h-[22px] rounded-md border-2 shrink-0 transition-colors",
					selected
						? "bg-chili-500 border-chili-500 text-white"
						: "border-sand-400 text-transparent",
				)}
			>
				<Check size={13} weight="bold" />
			</span>
			{icon && (
				<span className={selected ? "text-chili-500" : "text-ink-400"}>
					{icon}
				</span>
			)}
			<span className="font-bold text-[0.95rem]">{label}</span>
		</button>
	);
}

// A single-select menu that closes on pick. Controlled so a Row can close it.
function SingleMenu({
	eyebrow,
	value,
	icon,
	active,
	align,
	children,
}: {
	eyebrow?: string;
	value: ReactNode;
	icon?: ReactNode;
	active?: boolean;
	align?: "start" | "end";
	children: (close: () => void) => ReactNode;
}) {
	const [open, setOpen] = useState(false);
	return (
		<Popover.Root open={open} onOpenChange={setOpen}>
			<Trigger
				eyebrow={eyebrow}
				value={value}
				icon={icon}
				active={active}
				open={open}
			/>
			<Panel align={align}>{children(() => setOpen(false))}</Panel>
		</Popover.Root>
	);
}

// --- the bar -----------------------------------------------------------------

export function DropdownBar({ viewport }: FilterBarMockupProps) {
	const mobile = viewport === "mobile";
	const [openNow, setOpenNow] = useState(false);
	const [cuisine, setCuisine] = useState("momo");
	const [dishType, setDishType] = useState<string | null>(null);
	const [protein, setProtein] = useState<string | null>(null);
	const [flags, setFlags] = useState<string[]>([]);
	const [featOpen, setFeatOpen] = useState(false);
	const [sort, setSort] = useState("popular");

	const cuisineLabel =
		CUISINES.find(([slug]) => slug === cuisine)?.[1] ?? "All cuisines";
	const toggleFlag = (t: string) =>
		setFlags((xs) => (xs.includes(t) ? xs.filter((x) => x !== t) : [...xs, t]));

	// Open now moved into the Features menu, so its badge/count includes it.
	const featCount = flags.length + (openNow ? 1 : 0);

	// Anything off-default counts; "Clear filters" resets the whole bar.
	const dirty =
		openNow ||
		!!cuisine ||
		!!dishType ||
		!!protein ||
		flags.length > 0 ||
		sort !== "popular";
	const clearAll = () => {
		setOpenNow(false);
		setCuisine("");
		setDishType(null);
		setProtein(null);
		setFlags([]);
		setSort("popular");
	};

	return (
		<BarShell
			mobile={mobile}
			action={
				dirty ? (
					<button
						type="button"
						onClick={clearAll}
						className="shrink-0 inline-flex items-center gap-1.5 h-11 px-2 font-display font-bold text-[0.9rem] text-ink-500 cursor-pointer hover:text-ink-900 transition-colors"
					>
						<X size={15} weight="bold" />
						Clear filters
					</button>
				) : null
			}
		>
			<div
				className={cn(
					"mt-3 flex items-center gap-2.5",
					mobile
						? "flex-nowrap overflow-x-auto scrollbar-hide"
						: "flex-wrap gap-y-2",
				)}
			>
				{/* Category (single-select cuisine) — the primary dish filter */}
				<SingleMenu
					eyebrow="Category"
					value={cuisineLabel}
					active={!!cuisine}
				>
					{(close) =>
						CUISINES.map(([slug, label, IconC]) => (
							<Row
								key={slug || "all"}
								selected={cuisine === slug}
								icon={<IconC size={19} />}
								label={label}
								onSelect={() => {
									setCuisine(slug);
									setDishType(null);
									setProtein(null);
									close();
								}}
							/>
						))
					}
				</SingleMenu>

				{/* Dish refine: only once a cuisine with facets is picked. Momo is
				    the only one wired with facet data in this mockup. */}
				{cuisine === "momo" && (
					<>
						<SingleMenu
							eyebrow="Dish type"
							value={
								dishType
									? DISH_TYPES.find(([s]) => s === dishType)?.[1]
									: "Any"
							}
							active={!!dishType}
						>
							{(close) => (
								<>
									<Row
										selected={!dishType}
										label="Any dish type"
										onSelect={() => {
											setDishType(null);
											close();
										}}
									/>
									{DISH_TYPES.map(([slug, label]) => (
										<Row
											key={slug}
											selected={dishType === slug}
											label={label}
											onSelect={() => {
												setDishType(slug);
												close();
											}}
										/>
									))}
								</>
							)}
						</SingleMenu>

						<SingleMenu
							eyebrow="Protein"
							value={
								protein
									? PROTEINS.find(([s]) => s === protein)?.[1]
									: "Any"
							}
							active={!!protein}
						>
							{(close) => (
								<>
									<Row
										selected={!protein}
										label="Any protein"
										onSelect={() => {
											setProtein(null);
											close();
										}}
									/>
									{PROTEINS.map(([slug, label]) => (
										<Row
											key={slug}
											selected={protein === slug}
											label={label}
											onSelect={() => {
												setProtein(slug);
												close();
											}}
										/>
									))}
								</>
							)}
						</SingleMenu>
					</>
				)}

				{/* spacer pushes Features + Sort to the right (desktop only) */}
				{!mobile && <div className="ml-auto" />}

				{/* Features: grouped multi-select, stays open while toggling.
				    Open now lives here now (Availability), so dish filters own
				    the primary row. */}
				<Popover.Root open={featOpen} onOpenChange={setFeatOpen}>
					<Trigger
						value="Features"
						icon={<SlidersHorizontal size={16} />}
						active={featCount > 0}
						open={featOpen}
						count={featCount}
					/>
					<Panel align={mobile ? "start" : "end"}>
						<div className="max-h-[300px] overflow-y-auto px-1 pt-1 min-w-[230px]">
							<div className="mb-1.5">
								<div className="eyebrow text-ink-400 text-[10px] px-2.5 pt-1.5 pb-1">
									Availability
								</div>
								<Row
									selected={openNow}
									icon={<Clock weight="fill" size={17} />}
									label="Open now"
									onSelect={() => setOpenNow((o) => !o)}
								/>
							</div>
							{FEATURE_GROUPS.map((g) => (
								<div key={g.label} className="mb-1.5">
									<div className="eyebrow text-ink-400 text-[10px] px-2.5 pt-1.5 pb-1">
										{g.label}
									</div>
									{g.items.map(([token, label]) => (
										<Row
											key={token}
											selected={flags.includes(token)}
											label={label}
											onSelect={() => toggleFlag(token)}
										/>
									))}
								</div>
							))}
						</div>
						<div className="flex items-center justify-between gap-3 border-t border-paper-200 mt-1 px-2 pt-2">
							<button
								type="button"
								onClick={() => {
									setFlags([]);
									setOpenNow(false);
								}}
								disabled={featCount === 0}
								className="font-display font-bold text-[0.85rem] text-ink-500 cursor-pointer hover:underline disabled:opacity-40"
							>
								Clear all
							</button>
							<Popover.Close asChild>
								<button
									type="button"
									className="rounded-full bg-chili-500 text-white px-5 py-1.5 font-display font-bold text-[0.85rem] cursor-pointer hover:bg-chili-600 transition-colors"
								>
									Done{featCount ? ` (${featCount})` : ""}
								</button>
							</Popover.Close>
						</div>
					</Panel>
				</Popover.Root>

				{/* Sort: label + single-select, last on the row */}
				<div className="shrink-0 inline-flex items-center gap-2">
					<span className="font-display font-bold text-ink-500 text-[0.9rem]">
						Sort
					</span>
					<SingleMenu
						value={SORT_LABEL.get(sort)}
						align="end"
						active={sort !== "popular"}
					>
						{(close) =>
							SORTS.map(([slug, label]) => (
								<Row
									key={slug}
									selected={sort === slug}
									label={label}
									onSelect={() => {
										setSort(slug);
										close();
									}}
								/>
							))
						}
					</SingleMenu>
				</div>
			</div>
		</BarShell>
	);
}
