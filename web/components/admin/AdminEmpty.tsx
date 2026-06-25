import type { ReactNode } from "react";

// Shared shell for the admin sections that have no data yet. Keeps the page
// header consistent with the Restaurants view and shows a quiet empty state.
export function AdminEmpty({
	title,
	subtitle,
	icon,
	message,
}: {
	title: string;
	subtitle: string;
	icon: ReactNode;
	message: string;
}) {
	return (
		<div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
			<h1 className="font-display font-extrabold text-2xl text-ink-900 mb-1">
				{title}
			</h1>
			<p className="text-ink-500 text-sm mb-8">{subtitle}</p>
			<div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-paper-300 bg-paper-50 py-20 text-center">
				<span className="text-ink-300">{icon}</span>
				<p className="text-ink-400 font-display font-bold">{message}</p>
			</div>
		</div>
	);
}
