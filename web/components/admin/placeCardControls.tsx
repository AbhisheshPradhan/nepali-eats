"use client";

import type { PlaceCardData } from "@/components/PlaceCard";
import { Chip, Segmented } from "@/components/admin/labControls";
import {
	type StatusOpt,
	STATUS_OPTS,
	statusOverride,
} from "@/components/admin/labStatus";
import type { VenueType } from "@/lib/types";
import type { LatLng } from "@/lib/useUserLocation";

const VENUE_OPTS: VenueType[] = [
	"Restaurant",
	"Café",
	"Takeaway",
	"Food Truck",
	"Caterer",
	"Dessert",
	"Bar",
];

const PRICE_OPTS = [
	{ value: 0, label: "—" },
	{ value: 1, label: "$" },
	{ value: 2, label: "$$" },
	{ value: 3, label: "$$$" },
	{ value: 4, label: "$$$$" },
];

// A plain, serialisable description of one Place Card preview's state. Each
// mockup instance owns one of these, so they can be tweaked independently.
export type PlaceCardConfig = {
	featured: boolean;
	popular: boolean;
	status: StatusOpt;
	venue: VenueType;
	price: number;
	hasPhoto: boolean;
	hasRating: boolean;
	showDistance: boolean;
	hideState: boolean;
	longName: boolean;
};

// The default = how the current component looks with sensible badges on.
export const DEFAULT_CONFIG: PlaceCardConfig = {
	featured: true,
	popular: false,
	status: "open",
	venue: "Restaurant",
	price: 2,
	hasPhoto: true,
	hasRating: true,
	showDistance: false,
	hideState: true,
	longName: false,
};

// Apply a config to the real restaurant row to get the props a card needs.
export function deriveCardData(
	sample: PlaceCardData | null,
	c: PlaceCardConfig,
): {
	data: PlaceCardData | null;
	hideState: boolean;
	fallbackOrigin: LatLng | undefined;
} {
	const s = statusOverride(c.status);
	const data: PlaceCardData | null = sample
		? {
				...sample,
				name: c.longName
					? "Falcha Town Hall Authentic Nepali Kitchen and Momo Bar"
					: sample.name,
				isFeatured: c.featured,
				popular: c.popular,
				venueType: c.venue,
				priceLevel: c.price,
				rating: c.hasRating ? (sample.rating ?? 4.5) : null,
				primaryPhoto: c.hasPhoto ? sample.primaryPhoto : null,
				logoKey: c.hasPhoto ? sample.logoKey : null,
				openingHours: s.openingHours,
				businessStatus: s.businessStatus,
			}
		: null;

	const fallbackOrigin: LatLng | undefined =
		c.showDistance && sample?.lat != null && sample?.lng != null
			? [sample.lat + 0.05, sample.lng + 0.02]
			: undefined;

	return { data, hideState: c.hideState, fallbackOrigin };
}

// The variant / prop control bar, fully controlled: it reads `config` and emits
// patches, so the same bar drives the reference lab and each mockup instance.
export function PlaceCardControls({
	config,
	onChange,
}: {
	config: PlaceCardConfig;
	onChange: (patch: Partial<PlaceCardConfig>) => void;
}) {
	return (
		<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
			<Chip
				active={config.featured}
				onClick={() => onChange({ featured: !config.featured })}
			>
				Featured
			</Chip>
			<Chip
				active={config.popular}
				onClick={() => onChange({ popular: !config.popular })}
			>
				Popular
			</Chip>
			<Chip
				active={config.hasPhoto}
				onClick={() => onChange({ hasPhoto: !config.hasPhoto })}
			>
				Photo
			</Chip>
			<Chip
				active={config.hasRating}
				onClick={() => onChange({ hasRating: !config.hasRating })}
			>
				Rating
			</Chip>
			<Chip
				active={config.showDistance}
				onClick={() => onChange({ showDistance: !config.showDistance })}
			>
				Distance
			</Chip>
			<Chip
				active={config.hideState}
				onClick={() => onChange({ hideState: !config.hideState })}
			>
				Hide state
			</Chip>
			<Chip
				active={config.longName}
				onClick={() => onChange({ longName: !config.longName })}
			>
				Long name
			</Chip>
			<Segmented
				label="Hours"
				value={config.status}
				options={STATUS_OPTS}
				onChange={(v) => onChange({ status: v })}
			/>
			<Segmented
				label="Price"
				value={config.price}
				options={PRICE_OPTS}
				onChange={(v) => onChange({ price: v })}
			/>
			<Segmented
				label="Type"
				value={config.venue}
				options={VENUE_OPTS.map((v) => ({ value: v, label: v }))}
				onChange={(v) => onChange({ venue: v })}
			/>
		</div>
	);
}
