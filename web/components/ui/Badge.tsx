import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "open" | "closed" | "favourite" | "info";

const SOFT: Record<Tone, string> = {
	neutral: "text-ink-700 bg-paper-200",
	open: "text-coriander-700 bg-coriander-100",
	closed: "text-chili-700 bg-chili-100",
	favourite: "text-marigold-700 bg-marigold-100",
	info: "text-himalaya-700 bg-himalaya-100",
};
const SOLID: Record<Tone, string> = {
	neutral: "text-white bg-ink-700",
	open: "text-white bg-coriander-500",
	closed: "text-white bg-chili-600",
	favourite: "text-ink-900 bg-marigold-500",
	info: "text-white bg-himalaya-500",
};

export function Badge({
	children,
	tone = "neutral",
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
