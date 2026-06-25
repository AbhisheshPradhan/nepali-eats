"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { FeaturedBadge, PopularBadge } from "@/components/ui/PlaceBadges";
import { VenueType } from "@/components/ui/VenueType";
import { OpenStatusBadge } from "@/components/OpenStatusBadge";
import { LabCard, LabSection } from "@/components/admin/LabCard";
import { Segmented } from "@/components/admin/labControls";
import { STATUS_OPTS, statusOverride } from "@/components/admin/labStatus";

const TONES = ["ink", "coriander", "marigold", "chili", "himalaya"] as const;

type Fill = "soft" | "solid" | "both";
const FILL_OPTS: { value: Fill; label: string }[] = [
	{ value: "soft", label: "Soft" },
	{ value: "solid", label: "Solid" },
	{ value: "both", label: "Both" },
];

type Size = "lg" | "sm";
const SIZE_OPTS: { value: Size; label: string }[] = [
	{ value: "lg", label: "lg" },
	{ value: "sm", label: "sm" },
];

// Shows the live Badge and OpenStatusBadge components in every state, with
// toggles for the props that change them. This is the reference / regression
// view of what ships today (no mockups here).
export function BadgeStatusLab() {
	const [fill, setFill] = useState<Fill>("both");
	const [size, setSize] = useState<Size>("lg");

	const showSoft = fill !== "solid";
	const showSolid = fill !== "soft";

	return (
		<LabCard
			label="Badge & Open-Status Lab"
			description="The live Badge + OpenStatusBadge in every tone and state."
		>
			<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
				<Segmented
					label="Fill"
					value={fill}
					options={FILL_OPTS}
					onChange={setFill}
				/>
				<Segmented
					label="Size"
					value={size}
					options={SIZE_OPTS}
					onChange={setSize}
				/>
			</div>

			<LabSection
				title="Brand badges"
				hint="components/ui/PlaceBadges.tsx · VenueType.tsx"
			>
				<div className="flex flex-wrap items-center gap-3">
					<FeaturedBadge />
					<PopularBadge />
					<VenueType type="Restaurant" />
				</div>
			</LabSection>

			<LabSection
				title="Badge tones"
				hint="components/ui/Badge.tsx"
			>
				<div className="flex flex-wrap gap-x-8 gap-y-4">
					{TONES.map((tone) => (
						<div
							key={tone}
							className="flex flex-col gap-2"
						>
							<span className="text-ink-400 text-[0.7rem] font-bold uppercase tracking-wide">
								{tone}
							</span>
							{showSoft && (
								<Badge tone={tone}>{tone}</Badge>
							)}
							{showSolid && (
								<Badge
									tone={tone}
									solid
								>
									{tone}
								</Badge>
							)}
						</div>
					))}
				</div>
			</LabSection>

			<LabSection
				title="Open-status outcomes"
				hint="components/OpenStatusBadge.tsx — synthesised hours (NSW)"
			>
				<div className="flex flex-col gap-3">
					{STATUS_OPTS.map(({ value, label }) => {
						const o = statusOverride(value);
						return (
							<div
								key={value}
								className="flex items-center gap-3"
							>
								<span className="text-ink-400 text-[0.7rem] font-bold uppercase tracking-wide w-24 shrink-0">
									{label}
								</span>
								<OpenStatusBadge
									openingHours={o.openingHours}
									state="NSW"
									businessStatus={o.businessStatus}
									size={size}
								/>
							</div>
						);
					})}
				</div>
			</LabSection>
		</LabCard>
	);
}
