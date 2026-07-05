"use client";

import type { PlaceCardData } from "@/components/PlaceCard";
import { Chip, Segmented } from "@/components/admin/labControls";
import {
	PlaceCardControls,
	deriveCardData,
	DEFAULT_CONFIG as CARD_DEFAULTS,
	type PlaceCardConfig,
} from "@/components/admin/placeCardControls";
import type { DishPill } from "@/lib/types";
import type { LatLng } from "@/lib/useUserLocation";

// Sample dish-search matches: verbatim-style momo names as a real seeded menu
// carries them (Chulho-style "Mo:Mo:" spellings included), so the mockups are
// stress-tested against the names the cards actually get. The first few carry
// labelled variant prices (the menu_item_variants shape) for the designs that
// surface them; `priceFrom: true` = the item has 2+ priced variants.
const SAMPLE_PILLS: DishPill[] = [
	{
		label: "Steamed Mo:Mo:",
		price: 15.5,
		priceFrom: true,
		variants: [
			{ label: "Veg", price: 15.5 },
			{ label: "Chicken", price: 17 },
			{ label: "Buff", price: 18.5 },
		],
	},
	{
		label: "C (Chilli MoMo) Steamed",
		price: 20,
		priceFrom: true,
		variants: [
			{ label: "Veg", price: 20 },
			{ label: "Chicken", price: 22 },
		],
	},
	{ label: "Spicy Mo:Mo: (Steamed)", price: 17, priceFrom: true },
	{
		label: "Fried Mo:Mo:",
		price: 17.5,
		priceFrom: true,
		variants: [
			{ label: "Veg", price: 17.5 },
			{ label: "Chicken", price: 19 },
			{ label: "Buff", price: 20.5 },
		],
	},
	{ label: "Jhol Mo:Mo:", price: 18, priceFrom: false },
	{ label: "Kothey Mo:Mo:", price: 17.5, priceFrom: false },
	{ label: "Open Mo:Mo:", price: 19, priceFrom: false },
	{ label: "Tandoori Mo:Mo:", price: 19.5, priceFrom: false },
	{ label: "Sadheko Mo:Mo:", price: 18.5, priceFrom: false },
	{ label: "Veg Steamed Mo:Mo:", price: 14.5, priceFrom: false },
	{ label: "Buff C-Mo:Mo:", price: 19, priceFrom: false },
	{ label: "Paneer Mo:Mo:", price: 18, priceFrom: false },
];

// Long-name stress variant (some menus write a paragraph per item).
const LONG_PILLS: DishPill[] = SAMPLE_PILLS.map((p) => ({
	...p,
	label: `${p.label} (10 pcs) with House Jhol Achar and Timur Chutney`,
}));

export const DISH_COUNT_OPTS = [0, 1, 3, 6, 12] as const;

// Explore preview state = the shared place-card config plus the Explore-only
// knobs: which viewport's card renders, how many dish matches the spot has
// (0 = plain browse, no dish search active), and the stress toggles.
export type ExploreCardConfig = PlaceCardConfig & {
	viewport: "desktop" | "mobile";
	dishCount: number;
	longDish: boolean;
	hasMenu: boolean;
	// ship the labelled variant prices with the pills (designs that don't
	// surface variants just ignore them)
	variants: boolean;
};

export const EXPLORE_DEFAULT_CONFIG: ExploreCardConfig = {
	...CARD_DEFAULTS,
	// Explore-list realities: rarely featured, distance shown, full location.
	featured: false,
	showDistance: true,
	hideState: false,
	viewport: "desktop",
	dishCount: 6,
	longDish: false,
	hasMenu: true,
	variants: true,
};

// Apply a config to the sample row: base card fields via deriveCardData, then
// the Explore extras (menu flag + the synthetic dish matches).
export function deriveExploreData(
	sample: PlaceCardData | null,
	c: ExploreCardConfig,
): {
	data: PlaceCardData | null;
	fallbackOrigin: LatLng | undefined;
	pills: DishPill[] | undefined;
	dishName: string | undefined;
} {
	const { data, fallbackOrigin } = deriveCardData(sample, c);
	const base =
		c.dishCount > 0
			? (c.longDish ? LONG_PILLS : SAMPLE_PILLS).slice(0, c.dishCount)
			: undefined;
	const pills =
		base && !c.variants
			? base.map(({ variants: _, ...p }) => p)
			: base;
	return {
		data: data ? { ...data, hasMenu: c.hasMenu } : null,
		fallbackOrigin,
		pills,
		dishName: pills ? "momo" : undefined,
	};
}

// The Explore control bar: viewport + dish-match knobs on top, then the shared
// place-card controls (status, price, type, …) driving the same config object.
export function ExploreCardControls({
	config,
	onChange,
}: {
	config: ExploreCardConfig;
	onChange: (patch: Partial<ExploreCardConfig>) => void;
}) {
	return (
		<div className="flex flex-col gap-2.5">
			<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
				<Segmented
					label="Viewport"
					value={config.viewport}
					options={[
						{ value: "desktop", label: "Desktop row" },
						{ value: "mobile", label: "Mobile list" },
					]}
					onChange={(v) => onChange({ viewport: v })}
				/>
				<Segmented
					label="Dish matches"
					value={config.dishCount}
					options={DISH_COUNT_OPTS.map((n) => ({
						value: n,
						label: n === 0 ? "Off" : String(n),
					}))}
					onChange={(v) => onChange({ dishCount: v })}
				/>
				<Chip
					active={config.longDish}
					onClick={() => onChange({ longDish: !config.longDish })}
				>
					Long dish names
				</Chip>
				<Chip
					active={config.variants}
					onClick={() => onChange({ variants: !config.variants })}
				>
					Variants
				</Chip>
				<Chip
					active={config.hasMenu}
					onClick={() => onChange({ hasMenu: !config.hasMenu })}
				>
					Has menu
				</Chip>
			</div>
			<PlaceCardControls config={config} onChange={onChange} />
		</div>
	);
}
