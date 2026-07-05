"use client";

import { useRef, useState } from "react";
import { Plus, ArrowCounterClockwise, X } from "@phosphor-icons/react";
import { LabCard } from "@/components/admin/LabCard";
import { Segmented } from "@/components/admin/labControls";
import { CurrentFilterBar } from "@/components/admin/mockups/filter-bar/CurrentFilterBar";
import { FILTER_BAR_MOCKUPS } from "@/components/admin/mockups/filterBarMockups";
import { cn } from "@/lib/cn";

// The design options each mockup can render: today's Explore filter bar plus
// the candidates from the filter-bar registry.
const DESIGNS = [
	{ id: "current", label: "Current", Component: CurrentFilterBar },
	...FILTER_BAR_MOCKUPS,
];
const designOf = (id: string) =>
	DESIGNS.find((d) => d.id === id) ?? DESIGNS[0];

type Viewport = "desktop" | "mobile";
type Mockup = { id: string; design: string; viewport: Viewport };

// The Explore FILTER BAR mockup playground. Every design is live: click the
// chips, open the panels, pick a dish, and watch how many rows stack up above
// the map placeholder. Author new designs under
// components/admin/mockups/filter-bar/ and register them to add options.
export function FilterBarMockups() {
	const nextId = useRef(1);
	const make = (): Mockup => ({
		id: String(nextId.current++),
		design: "current",
		viewport: "desktop",
	});
	const [mockups, setMockups] = useState<Mockup[]>(() => [
		{ id: "0", design: "current", viewport: "desktop" },
	]);

	const patch = (id: string, p: Partial<Mockup>) =>
		setMockups((xs) =>
			xs.map((m) => (m.id === id ? { ...m, ...p } : m)),
		);
	const remove = (id: string) =>
		setMockups((xs) => xs.filter((m) => m.id !== id));
	const generate = () => setMockups((xs) => [...xs, make()]);
	const reset = () => setMockups([make()]);

	return (
		<LabCard
			label="Explore Filter Bar Mockups"
			description="The filter stack above the Explore map. Each bar is live: toggle chips, pick a dish, open the panels, and compare how much height each design costs before the map starts."
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
						const mobile = m.viewport === "mobile";
						return (
							<div
								key={m.id}
								className="rounded-xl border border-paper-300 p-4"
							>
								<div className="flex flex-wrap items-center justify-between gap-3 mb-3">
									<div className="flex flex-wrap items-center gap-x-4 gap-y-2">
										<Segmented
											label="Design"
											value={m.design}
											options={DESIGNS.map((d) => ({
												value: d.id,
												label: d.label,
											}))}
											onChange={(v) => patch(m.id, { design: v })}
										/>
										<Segmented
											label="Viewport"
											value={m.viewport}
											options={[
												{ value: "desktop", label: "Desktop" },
												{ value: "mobile", label: "Mobile" },
											]}
											onChange={(v) =>
												patch(m.id, { viewport: v })
											}
										/>
									</div>
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

								{/* key on viewport so switching resets the bar's internal
								    state (a bar mid-interaction in the wrong viewport would
								    just confuse the comparison) */}
								<div
									className={cn(
										mobile ? "w-[375px] max-w-full" : "w-full",
									)}
								>
									<Component
										key={m.viewport}
										viewport={m.viewport}
									/>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</LabCard>
	);
}
