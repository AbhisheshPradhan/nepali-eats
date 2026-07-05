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
import { CurrentExploreCard } from "@/components/admin/mockups/explore-card/CurrentExploreCard";
import { EXPLORE_CARD_MOCKUPS } from "@/components/admin/mockups/exploreCardMockups";
import { cn } from "@/lib/cn";

// The design options each mockup can render: what Explore ships today plus
// the candidate forks from the Explore registry.
const DESIGNS = [
	{ id: "current", label: "Current", Component: CurrentExploreCard },
	...EXPLORE_CARD_MOCKUPS,
];
const designOf = (id: string) =>
	DESIGNS.find((d) => d.id === id) ?? DESIGNS[0];

type Mockup = { id: string; design: string; config: ExploreCardConfig };

// The EXPLORE Place Card mockup playground: the desktop side-panel row and the
// mobile list row, with dish-search matches (the pills) as a first-class knob.
// Separate from PlaceCardMockups, which previews the homepage vertical card.
// Author new designs under components/admin/mockups/explore-card/ and register
// them in exploreCardMockups.ts to add design options.
export function ExploreCardMockups({ sample }: { sample: PlaceCardData | null }) {
	// id 0 is the initial mockup (a literal, so no ref access during render);
	// make() is only called from event handlers.
	const nextId = useRef(1);
	const make = (): Mockup => ({
		id: String(nextId.current++),
		design: "current",
		config: { ...EXPLORE_DEFAULT_CONFIG },
	});
	const [mockups, setMockups] = useState<Mockup[]>(() => [
		{ id: "0", design: "current", config: { ...EXPLORE_DEFAULT_CONFIG } },
	]);

	if (!sample) {
		return (
			<LabCard label="Explore Place Card Mockups">
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
		setMockups((xs) =>
			xs.map((m) => (m.id === id ? { ...m, design } : m)),
		);
	const remove = (id: string) =>
		setMockups((xs) => xs.filter((m) => m.id !== id));
	const generate = () => setMockups((xs) => [...xs, make()]);
	const reset = () => setMockups([make()]);

	return (
		<LabCard
			label="Explore Place Card Mockups"
			description="The card the Explore list renders (desktop side-panel row + mobile list row), with dish-search matches. Generate variants and retune each one."
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
						const mobile = m.config.viewport === "mobile";
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

								{/* Preview at the width the card really gets: the mobile
								    list row in a 375px phone frame on the list's paper
								    background, the desktop row at the side panel's width.
								    @container so the production ExploreCard (Current) picks
								    its layout from this wrapper's width. */}
								<div
									className={cn(
										"mt-4 @container",
										mobile
											? "w-[375px] max-w-full rounded-xl border border-paper-300 bg-paper-50 px-4 py-1"
											: "w-full max-w-[508px]",
									)}
								>
									{data && (
										<Component
											r={data}
											viewport={m.config.viewport}
											pills={pills}
											dishName={dishName}
											fallbackOrigin={fallbackOrigin}
											onViewMap={() => {}}
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
