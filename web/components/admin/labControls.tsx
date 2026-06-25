"use client";

import { cn } from "@/lib/cn";

// Shared toggle widgets for the UI Playground labs.

// A pill toggle for a boolean state (e.g. Featured on/off).
export function Chip({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			aria-pressed={active}
			onClick={onClick}
			className={cn(
				"rounded-full border px-3 py-1 text-[0.8rem] font-display font-bold transition-colors",
				active
					? "bg-chili-500 border-chili-500 text-white"
					: "border-paper-300 text-ink-600 hover:bg-paper-100",
			)}
		>
			{children}
		</button>
	);
}

// A labelled segmented control for picking one option from a small set.
export function Segmented<T extends string | number>({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: T;
	options: { value: T; label: string }[];
	onChange: (v: T) => void;
}) {
	return (
		<div className="flex items-center gap-1.5">
			<span className="text-ink-400 text-[0.7rem] font-bold uppercase tracking-wide">
				{label}
			</span>
			<div className="inline-flex rounded-lg border border-paper-300 overflow-hidden">
				{options.map((o) => (
					<button
						key={String(o.value)}
						type="button"
						onClick={() => onChange(o.value)}
						className={cn(
							"px-2.5 py-1 text-[0.78rem] font-display font-bold transition-colors",
							value === o.value
								? "bg-chili-500 text-white"
								: "text-ink-600 hover:bg-paper-100",
						)}
					>
						{o.label}
					</button>
				))}
			</div>
		</div>
	);
}
