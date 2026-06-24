"use client";
import { useEffect, useState } from "react";
import { CaretDown, MapPinLine } from "@phosphor-icons/react";
import { STATE_CAPITAL, metroFromState } from "@/lib/format";
import { readStateOverride, writeStateOverride } from "@/lib/stateOverride";
import { cn } from "@/lib/cn";

const STATES = Object.keys(STATE_CAPITAL); // NSW, VIC, QLD, WA, SA, ACT, TAS, NT

// Admin-only control to preview the geo-personalised site as any AU state. Sets
// the ne_admin_state cookie (honored server-side only for admins via
// resolveState) then full-reloads: SSR re-renders for that state AND the
// persistent UserLocationProvider remounts to suppress the admin's real location
// (see useUserLocation), so the preview isn't overwritten after hydration.
export function AdminStateSwitcher({
	variant = "desktop",
}: {
	variant?: "desktop" | "mobile";
}) {
	const [value, setValue] = useState(""); // "" = Auto (IP)

	useEffect(() => {
		setValue(readStateOverride());
	}, []);

	function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
		const next = e.target.value;
		setValue(next);
		writeStateOverride(next);
		window.location.reload();
	}

	const isMobile = variant === "mobile";

	return (
		<label
			className={cn(
				"relative inline-flex items-center font-display font-bold text-chili-500",
				isMobile
					? "w-full rounded-xl bg-chili-100/60 px-4 py-3.5 text-[1.1rem]"
					: "rounded-full border-2 border-chili-500 px-3 py-2 text-[0.9375rem] hover:bg-chili-100",
			)}
			title="Preview the site as a visitor in this state"
		>
			<MapPinLine
				size={isMobile ? 20 : 16}
				className="shrink-0"
			/>
			<select
				value={value}
				onChange={onChange}
				aria-label="Preview state"
				className={cn(
					"cursor-pointer appearance-none bg-transparent font-display font-bold text-chili-500 focus:outline-none",
					isMobile ? "ml-3 flex-1 pr-6" : "ml-1.5 pr-5",
				)}
			>
				<option value="">Auto (IP)</option>
				{STATES.map((s) => (
					<option
						key={s}
						value={s}
					>
						{s} - {metroFromState(s)}
					</option>
				))}
			</select>
			<CaretDown
				size={isMobile ? 18 : 14}
				weight="bold"
				className="pointer-events-none absolute right-3 shrink-0"
			/>
		</label>
	);
}
