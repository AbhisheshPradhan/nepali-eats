"use client";

import { useEffect, useState } from "react";
import { Clock } from "@phosphor-icons/react";
import { openStatus } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { OpeningHours } from "@/lib/types";

// Plain icon + text (no pill); colour comes from the domain state.
function StatusText({
	tone,
	size = "lg",
	className,
	children,
}: {
	tone: "coriander" | "marigold" | "himalaya" | "ink";
	size?: "lg" | "sm";
	className?: string;
	children: React.ReactNode;
}) {
	const color = {
		coriander: "text-coriander-700",
		marigold: "text-marigold-700",
		himalaya: "text-himalaya-700",
		ink: "text-ink-700",
	}[tone];
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 font-body font-bold",
				size === "sm" && "text-[0.78rem]",
				color,
				className,
			)}
		>
			<Clock
				size={size === "sm" ? 13 : 18}
				weight="regular"
				className="shrink-0"
			/>
			{children}
		</span>
	);
}

// Live "Open till 10pm / Opens today at 5pm" status badge. The detail page is
// ISR-cached, so a server-computed status would be stale; this computes it in the
// browser against the visitor's current time (in the restaurant's local tz via
// state) and re-ticks each minute so it flips live at open/close. Renders nothing
// until mounted (no SSR/CSR mismatch on a time-dependent label).
export function OpenStatusBadge({
	openingHours,
	state,
	businessStatus,
	size = "lg",
	className,
}: {
	openingHours: OpeningHours | null;
	state: string | null;
	businessStatus: string | null;
	size?: "lg" | "sm";
	className?: string;
}) {
	const [now, setNow] = useState<Date | null>(null);

	useEffect(() => {
		setNow(new Date());
		const id = setInterval(() => setNow(new Date()), 60_000);
		return () => clearInterval(id);
	}, []);

	// Permanently/temporarily closed is a business-level fact, not a time-of-day
	// one — show it regardless of the clock (and before mount).
	if (businessStatus === "CLOSED_PERMANENTLY")
		return (
			<StatusText
				tone="ink"
				size={size}
				className={className}
			>
				Permanently closed
			</StatusText>
		);
	if (businessStatus === "CLOSED_TEMPORARILY")
		return (
			<StatusText
				tone="ink"
				size={size}
				className={className}
			>
				Temporarily closed
			</StatusText>
		);

	if (!now) return null; // pre-mount: skip the time-dependent label
	const status = openStatus(openingHours, state, now);
	if (!status) return null; // no hours data

	// Map the domain state to a palette colour (semantics stay in openStatus).
	const tone = {
		open: "coriander",
		closing: "marigold",
		opening: "himalaya",
		closed: "ink",
	} as const;

	return (
		<StatusText
			tone={tone[status.kind]}
			size={size}
			className={className}
		>
			{status.label}
		</StatusText>
	);
}
