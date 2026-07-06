"use client";

import type { ReactNode } from "react";
import { X } from "@phosphor-icons/react";

// The map-popup context every pin-card candidate renders in: a faint "map"
// backdrop with the card floating over it and the popup's close button, so each
// design is judged the way it actually appears on the Explore map (not on a
// clean white lab surface). `width` = the card's popup width.
export function PinCardFrame({
	width,
	children,
}: {
	// number → px; string → used as-is (e.g. "fit-content" so the frame hugs a
	// scaled card and the close button stays pinned to its real corner).
	width: number | string;
	children: ReactNode;
}) {
	return (
		<div
			className="relative grid place-items-center rounded-xl border border-paper-300 overflow-hidden py-10 px-4"
			style={{
				backgroundColor: "#e7e2d8",
				backgroundImage:
					"linear-gradient(rgba(255,255,255,0.55) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(255,255,255,0.55) 1.5px, transparent 1.5px)",
				backgroundSize: "46px 46px",
			}}
		>
			<span className="absolute bottom-2 left-3 text-ink-400 text-[11px] font-display font-bold opacity-70">
				map
			</span>
			<div
				className="relative"
				style={{ width: typeof width === "number" ? `${width}px` : width }}
			>
				<button
					type="button"
					aria-label="Close"
					className="absolute top-2 right-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-ink-900/70 text-white cursor-pointer"
				>
					<X size={14} weight="bold" />
				</button>
				{children}
			</div>
		</div>
	);
}
