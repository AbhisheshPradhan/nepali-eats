import type { ReactNode } from "react";

// A labelled panel for the UI Playground. Each experiment (e.g. "Place Card
// Lab") gets one of these so the playground reads as a tidy stack of cards.
export function LabCard({
	label,
	description,
	headerRight,
	children,
}: {
	label: string;
	description?: string;
	// Optional element rendered in the header, opposite the label (e.g. a link).
	headerRight?: ReactNode;
	children: ReactNode;
}) {
	return (
		<section className="rounded-2xl border border-paper-300 bg-white shadow-sm overflow-hidden">
			<header className="px-5 py-4 border-b border-paper-200 bg-paper-50">
				<div className="flex flex-wrap items-start gap-x-4 gap-y-3 justify-between">
					<div>
						<h2 className="font-display font-extrabold text-ink-900 text-lg">
							{label}
						</h2>
						{description && (
							<p className="text-ink-500 text-sm mt-0.5">
								{description}
							</p>
						)}
					</div>
					{headerRight}
				</div>
			</header>
			<div className="p-5">{children}</div>
		</section>
	);
}

// A titled sub-area inside a LabCard, e.g. the "Homepage" vs "Explore" splits.
export function LabSection({
	title,
	hint,
	children,
}: {
	title: string;
	hint?: string;
	children: ReactNode;
}) {
	return (
		<div className="not-first:mt-8">
			<div className="flex items-baseline gap-2 mb-3">
				<span className="eyebrow text-chili-600 text-[12px]">
					{title}
				</span>
				{hint && <span className="text-ink-400 text-xs">{hint}</span>}
			</div>
			{children}
		</div>
	);
}
