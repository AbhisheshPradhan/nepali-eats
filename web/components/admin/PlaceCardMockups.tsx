"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, ArrowCounterClockwise, X } from "@phosphor-icons/react";
import { PlaceCard, type PlaceCardData } from "@/components/PlaceCard";
import { LabCard } from "@/components/admin/LabCard";
import { Segmented } from "@/components/admin/labControls";
import {
	PlaceCardControls,
	deriveCardData,
	DEFAULT_CONFIG,
	type PlaceCardConfig,
} from "@/components/admin/placeCardControls";
import { PLACE_CARD_MOCKUPS } from "@/components/admin/mockups/placeCardMockups";

// The design options each mockup can render: the live component plus any
// candidate forks from the registry.
const DESIGNS = [
	{ id: "current", label: "Current", Component: PlaceCard },
	...PLACE_CARD_MOCKUPS,
];
const designOf = (id: string) =>
	DESIGNS.find((d) => d.id === id) ?? DESIGNS[0];

type Mockup = { id: string; design: string; config: PlaceCardConfig };

// The Place Card mockup playground. Starts on the current component; "Generate"
// spawns another mockup you can retune independently, "Reset" drops everything
// back to a single current component. Author new designs under
// components/admin/mockups/place-card/ and register them to add design options.
export function PlaceCardMockups({ sample }: { sample: PlaceCardData | null }) {
	// id 0 is the initial mockup (a literal, so no ref access during render);
	// make() is only called from event handlers.
	const nextId = useRef(1);
	const make = (): Mockup => ({
		id: String(nextId.current++),
		design: "current",
		config: { ...DEFAULT_CONFIG },
	});
	const [mockups, setMockups] = useState<Mockup[]>(() => [
		{ id: "0", design: "current", config: { ...DEFAULT_CONFIG } },
	]);

	if (!sample) {
		return (
			<LabCard label="Place Card Mockups">
				<p className="text-ink-400 text-sm">
					No sample restaurant available to preview.
				</p>
			</LabCard>
		);
	}

	const patch = (id: string, p: Partial<PlaceCardConfig>) =>
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
			label="Place Card Mockups"
			description="Generate variants and retune each one. Reset restores the current component."
			headerRight={
				<Link
					href="/admin/playground"
					className="inline-flex items-center gap-1 text-chili-600 hover:text-chili-700 font-display font-bold text-sm"
				>
					<ArrowLeft
						size={15}
						weight="bold"
					/>
					Place Card Lab
				</Link>
			}
		>
			<div className="flex items-center gap-2.5 mb-5">
				<button
					type="button"
					onClick={generate}
					className="inline-flex items-center gap-1.5 rounded-full bg-chili-500 text-white px-3.5 py-1.5 font-display font-bold text-sm hover:bg-chili-600 transition-colors"
				>
					<Plus
						size={15}
						weight="bold"
					/>
					Generate mockup
				</button>
				<button
					type="button"
					onClick={reset}
					className="inline-flex items-center gap-1.5 rounded-full border border-paper-300 text-ink-600 px-3.5 py-1.5 font-display font-bold text-sm hover:bg-paper-100 transition-colors"
				>
					<ArrowCounterClockwise
						size={15}
						weight="bold"
					/>
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
						const { data, hideState, fallbackOrigin } =
							deriveCardData(sample, m.config);
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
										<X
											size={14}
											weight="bold"
										/>
										Remove
									</button>
								</div>

								<PlaceCardControls
									config={m.config}
									onChange={(p) => patch(m.id, p)}
								/>

								<div className="mt-4 w-[230px]">
									{data && (
										<Component
											r={data}
											hideState={hideState}
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
