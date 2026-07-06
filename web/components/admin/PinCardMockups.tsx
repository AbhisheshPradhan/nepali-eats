"use client";

import { useRef, useState } from "react";
import { Plus, ArrowCounterClockwise, X } from "@phosphor-icons/react";
import type { PlaceCardData } from "@/components/PlaceCard";
import { LabCard } from "@/components/admin/LabCard";
import { Segmented } from "@/components/admin/labControls";
import {
	ExploreCardControls,
	deriveExploreData,
	EXPLORE_DEFAULT_CONFIG,
	type ExploreCardConfig,
} from "@/components/admin/exploreCardControls";
import { CurrentPinCard } from "@/components/admin/mockups/pin-card/CurrentPinCard";
import { PIN_CARD_MOCKUPS } from "@/components/admin/mockups/pinCardMockups";

// The design options: what the map pin popup ships today (the compact
// PlaceCard) plus the candidate forks from the pin-card registry.
const DESIGNS = [
	{ id: "current", label: "Current (PlaceCard)", Component: CurrentPinCard },
	...PIN_CARD_MOCKUPS,
];
const designOf = (id: string) => DESIGNS.find((d) => d.id === id) ?? DESIGNS[0];

type Mockup = { id: string; design: string; config: ExploreCardConfig };

// The Explore MAP PIN CARD playground: the card that opens when you tap a pin,
// shown in a map-popup frame. Reuses the Explore-card knobs (dish matches,
// variants…) so you can see how each design carries the dish-search context the
// list already shows. Sibling to ExploreCardMockups (the list card) — author
// candidates under components/admin/mockups/pin-card/ and register them in
// pinCardMockups.ts.
export function PinCardMockups({ sample }: { sample: PlaceCardData | null }) {
	const nextId = useRef(1);
	const make = (): Mockup => ({
		id: String(nextId.current++),
		design: "list",
		config: { ...EXPLORE_DEFAULT_CONFIG },
	});
	const [mockups, setMockups] = useState<Mockup[]>(() => [
		{ id: "0", design: "list", config: { ...EXPLORE_DEFAULT_CONFIG } },
	]);

	if (!sample) {
		return (
			<LabCard label="Explore Place Map Pin Card Mockups">
				<p className="text-ink-400 text-sm">
					No sample restaurant available to preview.
				</p>
			</LabCard>
		);
	}

	const patch = (id: string, p: Partial<ExploreCardConfig>) =>
		setMockups((xs) =>
			xs.map((m) =>
				m.id === id ? { ...m, config: { ...m.config, ...p } } : m,
			),
		);
	const setDesign = (id: string, design: string) =>
		setMockups((xs) => xs.map((m) => (m.id === id ? { ...m, design } : m)));
	const remove = (id: string) =>
		setMockups((xs) => xs.filter((m) => m.id !== id));
	const generate = () => setMockups((xs) => [...xs, make()]);
	const reset = () => setMockups([make()]);

	return (
		<LabCard
			label="Explore Place Map Pin Card Mockups"
			description="The card that opens when you tap a map pin, shown in a map-popup frame. Compare the current PlaceCard against reusing the Explore list card so the dish-search matches show on the map too."
		>
			<div className="flex items-center gap-2.5 mb-5">
				<button
					type="button"
					onClick={generate}
					className="inline-flex items-center gap-1.5 rounded-full bg-chili-500 text-white px-3.5 py-1.5 font-display font-bold text-sm hover:bg-chili-600 transition-colors"
				>
					<Plus size={15} weight="bold" />
					Generate mockup
				</button>
				<button
					type="button"
					onClick={reset}
					className="inline-flex items-center gap-1.5 rounded-full border border-paper-300 text-ink-600 px-3.5 py-1.5 font-display font-bold text-sm hover:bg-paper-100 transition-colors"
				>
					<ArrowCounterClockwise size={15} weight="bold" />
					Reset
				</button>
				<span className="text-ink-400 text-xs">
					{mockups.length} mockup{mockups.length === 1 ? "" : "s"}
				</span>
			</div>

			{mockups.length === 0 ? (
				<p className="text-ink-400 text-sm py-8 text-center">
					No mockups. Generate one or reset.
				</p>
			) : (
				<div className="flex flex-col gap-5">
					{mockups.map((m) => {
						const { Component } = designOf(m.design);
						const { data, fallbackOrigin, pills, dishName } =
							deriveExploreData(sample, m.config);
						return (
							<div
								key={m.id}
								className="rounded-xl border border-paper-300 p-4"
							>
								<div className="flex items-center justify-between gap-3 mb-3">
									<Segmented
										label="Design"
										value={m.design}
										options={DESIGNS.map((d) => ({
											value: d.id,
											label: d.label,
										}))}
										onChange={(v) => setDesign(m.id, v)}
									/>
									<button
										type="button"
										onClick={() => remove(m.id)}
										aria-label="Remove mockup"
										className="inline-flex items-center gap-1 text-ink-400 hover:text-chili-600 text-sm font-bold"
									>
										<X size={14} weight="bold" />
										Remove
									</button>
								</div>

								<ExploreCardControls
									config={m.config}
									onChange={(p) => patch(m.id, p)}
								/>

								<div className="mt-4 max-w-[520px]">
									{data && (
										<Component
											r={data}
											viewport={m.config.viewport}
											pills={pills}
											dishName={dishName}
											fallbackOrigin={fallbackOrigin}
										/>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</LabCard>
	);
}
