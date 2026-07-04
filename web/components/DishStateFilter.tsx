import Link from "next/link";

// States below this many venues have no dish x state page (see MIN_RENDER in
// app/nepali-food/[slug]/[state]/page.tsx), so we never link a chip that 404s.
const MIN = 5;
const ORDER = ["NSW", "VIC", "QLD", "WA", "SA", "ACT", "TAS", "NT"];

// Row of state pills above a dish page's results. Each links to the (indexable)
// /nepali-food/<slug>/<state> page; the active one is highlighted. Server-side
// links, no client JS, so it doubles as internal linking for SEO.
export function DishStateFilter({
	slug,
	counts,
	active,
}: {
	slug: string;
	// dishStateCounts() rows (per-state venue counts for this dish).
	counts: { state: string; n: number }[];
	// Current state code (e.g. "NSW"), or undefined on the national page.
	active?: string;
}) {
	const states = counts
		.filter((c) => c.n >= MIN)
		.sort((a, b) => ORDER.indexOf(a.state) - ORDER.indexOf(b.state));
	// Nothing to narrow to and not already narrowed: no filter worth showing.
	if (states.length < 2 && !active) return null;

	const total = counts.reduce((sum, c) => sum + c.n, 0);
	const base =
		"shrink-0 rounded-full px-4 py-1.5 font-display font-semibold text-[0.95rem] border transition-colors inline-flex items-center gap-1.5";
	const on = "bg-chili-500 border-chili-500 text-white";
	const off =
		"bg-white border-paper-300 text-ink-800 shadow-sm hover:text-chili-600 hover:border-chili-300";

	return (
		<div className="mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
			<div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
				<Link
					href={`/nepali-food/${slug}`}
					className={`${base} ${active ? off : on}`}
					aria-current={active ? undefined : "page"}
				>
					All Australia
					<span className={active ? "text-ink-500" : "text-white/70"}>
						{total}
					</span>
				</Link>
				{states.map((s) => {
					const isOn = s.state === active;
					return (
						<Link
							key={s.state}
							href={`/nepali-food/${slug}/${s.state.toLowerCase()}`}
							className={`${base} ${isOn ? on : off}`}
							aria-current={isOn ? "page" : undefined}
						>
							{s.state}
							<span className={isOn ? "text-white/70" : "text-ink-500"}>
								{s.n}
							</span>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
