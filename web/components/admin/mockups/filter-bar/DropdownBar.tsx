"use client";

import { useState, type ReactNode } from "react";
import { Popover } from "radix-ui";
import {
	Clock,
	CaretDown,
	CaretLeft,
	CookingPot,
	SlidersHorizontal,
	ArrowsDownUp,
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

// Candidate: DROPDOWN BAR. On DESKTOP the filters are a row of labelled
// dropdowns: Category / Dish type / Protein (single-select each) with a
// "Clear dish" button beside them, then a grouped multi-select Features menu
// and Sort. On MOBILE the dish filters collapse into ONE "Dish" button that
// opens a multi-stage bottom sheet (pick a cuisine, then refine styles /
// protein / spice), Features is its own bottom sheet, and each is cleared
// independently. There is no global "clear everything".

// --- data (mockup-local; the real bar reads dishData.facets + FLAG_COLS) -----

const CUISINES: [string, string, Icon][] = [
	["", "All cuisines", GlobeHemisphereWest],
	["momo", "Momo", BowlSteam],
	["newari", "Newari", ForkKnife],
	["sekuwa", "Sekuwa", Flame],
	["thakali", "Thakali", CookingPot],
	["tibetan", "Tibetan", BowlFood],
];
const CUISINE = new Map(CUISINES.map(([slug, label, icon]) => [slug, { label, icon }]));

// Momo's facets, split by kind. Single-select per kind (mirrors the real
// facetSel model). Spice is illustrative — not in the taxonomy yet.
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
const SPICE: [string, string][] = [
	["mild", "Mild"],
	["medium", "Medium"],
	["hot", "Hot"],
];
const labelOf = (list: [string, string][], slug: string | null) =>
	slug ? (list.find(([s]) => s === slug)?.[1] ?? null) : null;

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

// --- desktop dropdown pieces (Popover) ---------------------------------------

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
						<span className="eyebrow text-ink-400 text-[9px]">{eyebrow}</span>
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

// The floating panel. Portalled so BarShell's overflow never clips it.
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

// One selectable list row: check indicator + optional icon + label.
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

// --- mobile pieces (bottom sheet) --------------------------------------------

// A tappable pill that opens a bottom sheet (mobile). Same look as the desktop
// Trigger but a plain button (no Popover).
function MobilePill({
	label,
	icon,
	active,
	count,
	className,
	onClick,
}: {
	label: ReactNode;
	icon?: ReactNode;
	active?: boolean;
	count?: number;
	className?: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"inline-flex items-center gap-2 border-2 rounded-full px-4 py-[7px] cursor-pointer font-display font-bold text-[0.9rem] transition-colors",
				active
					? "bg-white border-chili-400 text-ink-900"
					: "bg-white border-sand-400 text-ink-700",
				className,
			)}
		>
			{icon}
			<span className="truncate min-w-0">{label}</span>
			{count ? (
				<span className="inline-grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-chili-500 text-white text-[0.72rem] leading-none">
					{count}
				</span>
			) : null}
			<CaretDown size={14} weight="bold" className="text-ink-400 shrink-0" />
		</button>
	);
}

// The in-frame bottom sheet: scrim + a bottom-anchored card with a grab handle,
// header (back + title + close), a scrollable body, and a sticky footer.
function BottomSheet({
	title,
	subtitle,
	onBack,
	onClose,
	footer,
	children,
}: {
	title: string;
	subtitle?: string;
	onBack?: () => void;
	onClose: () => void;
	footer: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="absolute inset-0">
			<button
				type="button"
				aria-label="Close"
				onClick={onClose}
				className="absolute inset-0 bg-ink-900/40 cursor-pointer animate-in fade-in-0 duration-300"
			/>
			<div className="absolute inset-x-0 bottom-0 flex max-h-[92%] flex-col rounded-t-2xl bg-paper-50 shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out">
				<div className="mx-auto mt-2.5 h-1 w-9 rounded-full bg-sand-400" />
				<div className="flex items-center gap-2 px-4 pt-2 pb-3 border-b border-paper-300">
					{onBack && (
						<button
							type="button"
							onClick={onBack}
							aria-label="Back"
							className="grid place-items-center w-8 h-8 rounded-full text-ink-600 hover:bg-paper-200 cursor-pointer -ml-1"
						>
							<CaretLeft size={18} weight="bold" />
						</button>
					)}
					<div className="min-w-0">
						<span className="font-display font-bold text-[1.15rem] text-ink-900">
							{title}
						</span>
						{subtitle && (
							<span className="font-display font-bold text-[1.15rem] text-ink-400">
								{" · "}
								{subtitle}
							</span>
						)}
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close"
						className="ml-auto grid place-items-center w-9 h-9 rounded-full bg-paper-200 text-ink-600 hover:bg-sand-400 cursor-pointer"
					>
						<X size={16} weight="bold" />
					</button>
				</div>
				<div className="overflow-y-auto px-4 py-3">{children}</div>
				<div className="mt-auto flex items-center gap-3 border-t border-paper-300 px-4 py-3">
					{footer}
				</div>
			</div>
		</div>
	);
}

// A pill chip used inside the refine sheet (marigold when active, matching the
// warm dish-refine look).
function SheetChip({
	active,
	label,
	onClick,
}: {
	active: boolean;
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			aria-pressed={active}
			onClick={onClick}
			className={cn(
				"border-2 rounded-full px-4 py-2 cursor-pointer font-display font-bold text-[0.92rem] transition-colors",
				active
					? "bg-marigold-500 border-marigold-500 text-ink-900"
					: "bg-white border-sand-400 text-ink-800 hover:bg-paper-100",
			)}
		>
			{label}
		</button>
	);
}

const SheetGroup = ({
	label,
	icon,
	children,
}: {
	label: string;
	icon?: ReactNode;
	children: ReactNode;
}) => (
	<div className="mb-5 last:mb-1">
		<div className="eyebrow text-ink-500 text-[11px] mb-2.5 flex items-center gap-1.5">
			{icon}
			{label}
		</div>
		<div className="flex flex-wrap gap-2.5">{children}</div>
	</div>
);

// The primary "Show N places" footer button.
const ShowButton = ({ n, onClick }: { n: number; onClick: () => void }) => (
	<button
		type="button"
		onClick={onClick}
		className="flex-1 rounded-full bg-chili-500 text-white px-5 py-3 font-display font-bold text-[1rem] cursor-pointer hover:bg-chili-600 transition-colors"
	>
		Show {n} {n === 1 ? "place" : "places"}
	</button>
);

const TextButton = ({
	children,
	disabled,
	onClick,
}: {
	children: ReactNode;
	disabled?: boolean;
	onClick: () => void;
}) => (
	<button
		type="button"
		onClick={onClick}
		disabled={disabled}
		className="shrink-0 font-display font-bold text-[0.95rem] text-ink-500 px-2 cursor-pointer hover:text-ink-900 disabled:opacity-40 transition-colors"
	>
		{children}
	</button>
);

// --- the bar -----------------------------------------------------------------

export function DropdownBar({ viewport }: FilterBarMockupProps) {
	const mobile = viewport === "mobile";
	const [cuisine, setCuisine] = useState("momo");
	const [dishType, setDishType] = useState<string | null>("steamed");
	const [protein, setProtein] = useState<string | null>(null);
	const [spice, setSpice] = useState<string | null>(null);
	const [flags, setFlags] = useState<string[]>([]);
	const [openNow, setOpenNow] = useState(false);
	const [sort, setSort] = useState("popular");
	const [featOpen, setFeatOpen] = useState(false);

	// mobile: which sheet is open, and (for the dish sheet) which stage.
	const [sheet, setSheet] = useState<null | "dish" | "features" | "sort">(null);
	const [stage, setStage] = useState<"category" | "refine">("refine");

	const toggleFlag = (t: string) =>
		setFlags((xs) => (xs.includes(t) ? xs.filter((x) => x !== t) : [...xs, t]));
	const one =
		<T,>(set: (v: T | null) => void, cur: T | null) =>
		(v: T) =>
			set(cur === v ? null : v);

	const featCount = flags.length + (openNow ? 1 : 0);
	const dishActive = !!cuisine || !!dishType || !!protein || !!spice;
	const hasFacets = cuisine === "momo"; // only momo is wired with facet data
	const clearDish = () => {
		setCuisine("");
		setDishType(null);
		setProtein(null);
		setSpice(null);
	};
	const clearFeatures = () => {
		setFlags([]);
		setOpenNow(false);
	};

	// Illustrative result count that shrinks as filters narrow.
	const resultCount = Math.max(
		6,
		(!cuisine ? 437 : dishType || protein || spice ? 41 : 128) - featCount * 12,
	);

	const cuisineLabel = CUISINE.get(cuisine)?.label ?? "All cuisines";
	// Mobile dish-pill label: the most specific thing chosen.
	const dishPillLabel = !cuisine
		? "Dish"
		: [labelOf(DISH_TYPES, dishType), cuisineLabel].filter(Boolean).join(" ") +
			(protein ? ` · ${labelOf(PROTEINS, protein)}` : "");

	const closeSheet = () => setSheet(null);

	// ---- mobile bottom sheets ----
	const dishSheet =
		stage === "category" || !hasFacets ? (
			<BottomSheet
				title="Category"
				onClose={closeSheet}
				footer={
					<>
						<TextButton disabled={!dishActive} onClick={clearDish}>
							Reset
						</TextButton>
						<ShowButton n={resultCount} onClick={closeSheet} />
					</>
				}
			>
				<div className="flex flex-col gap-1.5">
					{CUISINES.map(([slug, label, IconC]) => {
						const selected = cuisine === slug;
						return (
							<button
								key={slug || "all"}
								type="button"
								onClick={() => {
									setCuisine(slug);
									setDishType(null);
									setProtein(null);
									setSpice(null);
									// advance to refine when the cuisine has dishes
									if (slug === "momo") setStage("refine");
								}}
								className={cn(
									"flex items-center gap-3 rounded-2xl px-3 py-3.5 cursor-pointer text-left border-2 transition-colors",
									selected
										? "bg-chili-50 border-chili-200"
										: "bg-transparent border-transparent hover:bg-paper-100",
								)}
							>
								<span className={selected ? "text-chili-500" : "text-chili-500/80"}>
									<IconC size={24} />
								</span>
								<span
									className={cn(
										"font-display font-bold text-[1.05rem]",
										selected ? "text-chili-600" : "text-ink-800",
									)}
								>
									{label}
								</span>
								<span
									className={cn(
										"ml-auto grid place-items-center w-7 h-7 rounded-full border-2 transition-colors",
										selected
											? "bg-chili-500 border-chili-500 text-white"
											: "border-sand-400 text-transparent",
									)}
								>
									<Check size={15} weight="bold" />
								</span>
							</button>
						);
					})}
				</div>
				<div className="mt-4 flex items-start gap-2 rounded-xl border border-marigold-300 bg-marigold-100/60 px-3.5 py-3 text-marigold-700">
					<CaretDown size={16} weight="bold" className="mt-0.5 -rotate-90 shrink-0" />
					<span className="font-display font-bold text-[0.95rem] leading-snug">
						Choosing a cuisine unlocks its dishes &amp; proteins on the next step.
					</span>
				</div>
			</BottomSheet>
		) : (
			<BottomSheet
				title="Dish type"
				subtitle={cuisineLabel}
				onBack={() => setStage("category")}
				onClose={closeSheet}
				footer={
					<>
						<TextButton disabled={!dishActive} onClick={clearDish}>
							Clear
						</TextButton>
						<ShowButton n={resultCount} onClick={closeSheet} />
					</>
				}
			>
				<SheetGroup
					label={`${cuisineLabel} styles`}
					icon={<BowlSteam size={16} className="text-chili-500" />}
				>
					{DISH_TYPES.map(([slug, label]) => (
						<SheetChip
							key={slug}
							active={dishType === slug}
							label={label}
							onClick={() => one(setDishType, dishType)(slug)}
						/>
					))}
				</SheetGroup>
				<SheetGroup label="Protein">
					{PROTEINS.map(([slug, label]) => (
						<SheetChip
							key={slug}
							active={protein === slug}
							label={label}
							onClick={() => one(setProtein, protein)(slug)}
						/>
					))}
				</SheetGroup>
				<SheetGroup label="Spice level">
					{SPICE.map(([slug, label]) => (
						<SheetChip
							key={slug}
							active={spice === slug}
							label={label}
							onClick={() => one(setSpice, spice)(slug)}
						/>
					))}
				</SheetGroup>
			</BottomSheet>
		);

	const featuresSheet = (
		<BottomSheet
			title="Features"
			onClose={closeSheet}
			footer={
				<>
					<TextButton disabled={featCount === 0} onClick={clearFeatures}>
						Clear
					</TextButton>
					<ShowButton n={resultCount} onClick={closeSheet} />
				</>
			}
		>
			<SheetGroup label="Availability">
				<SheetChip
					active={openNow}
					label="Open now"
					onClick={() => setOpenNow((o) => !o)}
				/>
			</SheetGroup>
			{FEATURE_GROUPS.map((g) => (
				<SheetGroup key={g.label} label={g.label}>
					{g.items.map(([token, label]) => (
						<SheetChip
							key={token}
							active={flags.includes(token)}
							label={label}
							onClick={() => toggleFlag(token)}
						/>
					))}
				</SheetGroup>
			))}
		</BottomSheet>
	);

	const sortSheet = (
		<BottomSheet
			title="Sort by"
			onClose={closeSheet}
			footer={<ShowButton n={resultCount} onClick={closeSheet} />}
		>
			<div className="flex flex-col gap-1">
				{SORTS.map(([slug, label]) => (
					<Row
						key={slug}
						selected={sort === slug}
						label={label}
						onSelect={() => {
							setSort(slug);
							closeSheet();
						}}
					/>
				))}
			</div>
		</BottomSheet>
	);

	// ================= MOBILE =================
	if (mobile) {
		return (
			<BarShell
				mobile
				sheet={
					sheet === "dish"
						? dishSheet
						: sheet === "features"
							? featuresSheet
							: sheet === "sort"
								? sortSheet
								: null
				}
			>
				<div className="mt-3 flex items-center gap-2.5 justify-between">
					<MobilePill
						className="min-w-0"
						label={dishPillLabel}
						icon={
							cuisine ? (
								(() => {
									const I = CUISINE.get(cuisine)?.icon ?? CookingPot;
									return <I size={17} className="text-chili-500 shrink-0" />;
								})()
							) : (
								<CookingPot size={17} className="text-chili-500 shrink-0" />
							)
						}
						active={dishActive}
						onClick={() => {
							setStage(hasFacets ? "refine" : "category");
							setSheet("dish");
						}}
					/>
					<MobilePill
						className="shrink-0"
						label="Features"
						icon={<SlidersHorizontal size={16} className="shrink-0" />}
						active={featCount > 0}
						count={featCount}
						onClick={() => setSheet("features")}
					/>
					{/* Sort: icon-only so the row never needs horizontal scroll */}
					<button
						type="button"
						aria-label={`Sort: ${SORT_LABEL.get(sort)}`}
						onClick={() => setSheet("sort")}
						className={cn(
							"shrink-0 grid place-items-center w-10 h-10 rounded-full border-2 cursor-pointer transition-colors",
							sort !== "popular"
								? "bg-white border-chili-400 text-chili-600"
								: "bg-white border-sand-400 text-ink-700",
						)}
					>
						<ArrowsDownUp size={18} weight="bold" />
					</button>
				</div>
			</BarShell>
		);
	}

	// ================= DESKTOP =================
	return (
		<BarShell mobile={false}>
			<div className="mt-3 flex items-center gap-2.5 flex-wrap gap-y-2">
				{/* Category (single-select cuisine) — the primary dish filter */}
				<SingleMenu eyebrow="Category" value={cuisineLabel} active={!!cuisine}>
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
									setSpice(null);
									close();
								}}
							/>
						))
					}
				</SingleMenu>

				{/* Dish refine: only once a cuisine with facets is picked. */}
				{hasFacets && (
					<>
						<SingleMenu
							eyebrow="Dish type"
							value={labelOf(DISH_TYPES, dishType) ?? "Any"}
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
							value={labelOf(PROTEINS, protein) ?? "Any"}
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

				{/* Clear dish: sits to the right of the dish dropdowns, clears only
				    the dish filters (cuisine + refinements), not Features. */}
				{dishActive && (
					<button
						type="button"
						onClick={clearDish}
						className="shrink-0 inline-flex items-center gap-1.5 font-display font-bold text-[0.9rem] text-ink-500 px-1.5 cursor-pointer hover:text-ink-900 transition-colors"
					>
						<X size={14} weight="bold" />
						Clear dish
					</button>
				)}

				{/* spacer pushes Features + Sort to the right (desktop) */}
				<div className="ml-auto" />

				{/* Features: grouped multi-select, stays open while toggling. Open
				    now lives here (Availability) so dish filters own the row. */}
				<Popover.Root open={featOpen} onOpenChange={setFeatOpen}>
					<Trigger
						value="Features"
						icon={<SlidersHorizontal size={16} />}
						active={featCount > 0}
						open={featOpen}
						count={featCount}
					/>
					<Panel align="end">
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
								onClick={clearFeatures}
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
