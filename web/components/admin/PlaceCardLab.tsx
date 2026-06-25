"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { PlaceCard, type PlaceCardData } from "@/components/PlaceCard";
import { LabCard } from "@/components/admin/LabCard";
import {
	PlaceCardControls,
	deriveCardData,
	DEFAULT_CONFIG,
	type PlaceCardConfig,
} from "@/components/admin/placeCardControls";

// Reference view of the live PlaceCard in its two layouts (homepage "card" +
// Explore "row"), under the state toggles. The "Mockups" link opens the route
// where candidate redesigns are generated and tweaked.
export function PlaceCardLab({ sample }: { sample: PlaceCardData | null }) {
	const [hovered, setHovered] = useState<number | null>(null);
	const [config, setConfig] = useState<PlaceCardConfig>(DEFAULT_CONFIG);
	const { data, hideState, fallbackOrigin } = deriveCardData(sample, config);

	if (!data) {
		return (
			<LabCard label="Place Card Lab">
				<p className="text-ink-400 text-sm">
					No sample restaurant available to preview.
				</p>
			</LabCard>
		);
	}

	const update = (patch: Partial<PlaceCardConfig>) =>
		setConfig((c) => ({ ...c, ...patch }));

	return (
		<LabCard
			label="Place Card Lab"
			headerRight={
				<Link
					href="/admin/playground/mockups"
					className="inline-flex items-center gap-1 text-chili-600 hover:text-chili-700 font-display font-bold text-sm"
				>
					Mockups
					<ArrowRight
						size={15}
						weight="bold"
					/>
				</Link>
			}
		>
			<PlaceCardControls
				config={config}
				onChange={update}
			/>

			<div className="mt-5 flex flex-wrap items-start gap-6">
				<div className="w-[230px]">
					<PlaceCard
						r={data}
						hideState={hideState}
						fallbackOrigin={fallbackOrigin}
					/>
				</div>
				<div className="w-full max-w-[460px]">
					<PlaceCard
						r={data}
						variant="row"
						hovered={hovered === data.id}
						onHover={setHovered}
						onViewMap={() => {}}
						hideState={hideState}
						fallbackOrigin={fallbackOrigin}
					/>
				</div>
			</div>
		</LabCard>
	);
}
