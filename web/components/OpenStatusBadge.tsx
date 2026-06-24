"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { openStatus } from "@/lib/format";
import type { OpeningHours } from "@/lib/types";

// Live "Open till 10pm / Opens today at 5pm" status badge. The detail page is
// ISR-cached, so a server-computed status would be stale; this computes it in the
// browser against the visitor's current time (in the restaurant's local tz via
// state) and re-ticks each minute so it flips live at open/close. Renders nothing
// until mounted (no SSR/CSR mismatch on a time-dependent label).
export function OpenStatusBadge({
	openingHours,
	state,
	businessStatus,
	className,
}: {
	openingHours: OpeningHours | null;
	state: string | null;
	businessStatus: string | null;
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
			<Badge
				tone="ink"
				solid
				className={className}
			>
				Permanently closed
			</Badge>
		);
	if (businessStatus === "CLOSED_TEMPORARILY")
		return (
			<Badge
				tone="ink"
				solid
				className={className}
			>
				Temporarily closed
			</Badge>
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
		<Badge
			tone={tone[status.kind]}
			className={className}
		>
			{status.label}
		</Badge>
	);
}
