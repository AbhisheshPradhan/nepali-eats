import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// Generic colour tones, named after the design-system palette (not the feature
// they happen to mark). Callers pick the colour that fits the meaning; the Badge
// stays a dumb primitive. (Tailwind extracts classes statically, so these stay an
// explicit map rather than an interpolated `bg-${tone}-100`.)
type Tone = "ink" | "coriander" | "marigold" | "chili" | "himalaya";

const SOFT: Record<Tone, string> = {
	ink: "text-ink-700 bg-paper-200",
	coriander: "text-coriander-700 bg-coriander-100",
	marigold: "text-marigold-700 bg-marigold-100",
	chili: "text-chili-700 bg-chili-100",
	himalaya: "text-himalaya-700 bg-himalaya-100",
};
const SOLID: Record<Tone, string> = {
	ink: "text-white bg-ink-700",
	coriander: "text-white bg-coriander-500",
	marigold: "text-ink-900 bg-marigold-500",
	chili: "text-white bg-chili-600",
	himalaya: "text-white bg-himalaya-500",
};

export function Badge({
	children,
	tone = "ink",
	solid = false,
	className,
}: {
	children: ReactNode;
	tone?: Tone;
	solid?: boolean;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 font-body font-bold text-[0.78rem] tracking-[0.02em] px-[11px] py-1 rounded-full whitespace-nowrap",
				solid ? SOLID[tone] : SOFT[tone],
				className,
			)}
		>
			{children}
		</span>
	);
}
