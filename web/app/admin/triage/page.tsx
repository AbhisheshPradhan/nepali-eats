import Link from "next/link";
import { assertAdmin } from "@/lib/admin/guard";
import {
	triageQueue,
	triageCounts,
	type TriageMode,
	type ReviewedFilter,
} from "@/lib/admin/queries";
import { stateFacets } from "@/lib/queries";
import { TriageClient } from "@/components/admin/TriageClient";

export const metadata = { robots: { index: false, follow: false } };

type SP = Promise<{
	mode?: string;
	state?: string;
	reviewed?: string;
	media?: string;
}>;

const REVIEWED_FILTERS: { key: ReviewedFilter; label: string }[] = [
	{ key: "pending", label: "Unreviewed" },
	{ key: "all", label: "All" },
	{ key: "only", label: "Reviewed only" },
];

const PAGE_SIZE = 24;

const MODES: { key: TriageMode; label: string; hint: string }[] = [
	{ key: "photo", label: "Photos", hint: "Flag junk, set primary, add photos" },
	{ key: "menu", label: "Menus", hint: "Spots missing a menu file" },
];

export default async function AdminTriage({
	searchParams,
}: {
	searchParams: SP;
}) {
	await assertAdmin();
	const sp = await searchParams;
	const mode: TriageMode = sp.mode === "menu" ? "menu" : "photo";
	const state = sp.state || undefined;
	const reviewed: ReviewedFilter =
		sp.reviewed === "all" ? "all" : sp.reviewed === "only" ? "only" : "pending";
	const hideNoMedia = sp.media === "with";

	const [items, counts, states] = await Promise.all([
		triageQueue({ mode, state, reviewed, hideNoMedia }, PAGE_SIZE),
		triageCounts(state),
		stateFacets(),
	]);

	// Preserve filters when switching mode / state / reviewed / media.
	const hrefWith = (over: {
		mode?: TriageMode;
		state?: string | null;
		reviewed?: ReviewedFilter;
		hideNoMedia?: boolean;
	}) => {
		const qs = new URLSearchParams();
		const m = over.mode ?? mode;
		if (m !== "photo") qs.set("mode", m);
		const s = over.state !== undefined ? over.state : state;
		if (s) qs.set("state", s);
		const rv = over.reviewed ?? reviewed;
		if (rv !== "pending") qs.set("reviewed", rv);
		const nm = over.hideNoMedia ?? hideNoMedia;
		if (nm) qs.set("media", "with");
		const q = qs.toString();
		return q ? `/admin/triage?${q}` : "/admin/triage";
	};

	return (
		<div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-8">
			<div className="flex items-baseline justify-between gap-4 mb-1">
				<h1 className="font-display font-extrabold text-2xl text-ink-900">
					Admin · triage
				</h1>
				<div className="flex items-center gap-3 text-sm">
					<Link href="/admin" className="text-chili-600 hover:underline">
						← Coverage table
					</Link>
					<Link
						href="/admin/review"
						className="text-chili-600 hover:underline"
					>
						Review
					</Link>
				</div>
			</div>
			<p className="text-ink-500 text-sm mb-5">
				Batch media cleanup, best and most-visible spots first. Photo mode:
				flag bad shots, set the primary, add photos. Menu mode: drag in a
				photo or PDF.
			</p>

			{/* Mode tabs */}
			<div className="flex flex-wrap items-center gap-2 mb-4">
				{MODES.map((m) => {
					const active = m.key === mode;
					return (
						<Link
							key={m.key}
							href={hrefWith({ mode: m.key })}
							title={m.hint}
							className={`rounded-full px-4 py-1.5 text-sm font-display font-bold border-2 transition-colors ${
								active
									? "bg-chili-500 text-white border-chili-500"
									: "bg-white text-ink-700 border-ink-200 hover:border-chili-300"
							}`}
						>
							{m.label}{" "}
							<span className={active ? "opacity-80" : "text-ink-400"}>
								{counts[m.key]}
							</span>
						</Link>
					);
				})}
			</div>

			{/* Filters */}
			<div className="flex flex-wrap items-center gap-3 mb-6 text-sm">
				<div className="flex flex-wrap gap-1.5">
					<Link
						href={hrefWith({ state: null })}
						className={`rounded-md px-2.5 py-1 font-display font-bold ${
							!state
								? "bg-ink-900 text-white"
								: "text-ink-600 hover:bg-paper-100 border border-ink-200"
						}`}
					>
						All AU
					</Link>
					{states.map((s) => (
						<Link
							key={s.value}
							href={hrefWith({ state: s.value })}
							className={`rounded-md px-2.5 py-1 font-display font-bold ${
								state === s.value
									? "bg-ink-900 text-white"
									: "text-ink-600 hover:bg-paper-100 border border-ink-200"
							}`}
						>
							{s.value}{" "}
							<span className="text-ink-400 font-normal">{s.count}</span>
						</Link>
					))}
				</div>
				{mode === "photo" && (
					<div className="flex gap-1.5">
						{REVIEWED_FILTERS.map((f) => {
							const active = reviewed === f.key;
							return (
								<Link
									key={f.key}
									href={hrefWith({ reviewed: f.key })}
									className={`rounded-md px-2.5 py-1 font-display font-bold border ${
										active
											? "bg-emerald-600 text-white border-emerald-600"
											: "text-ink-600 border-ink-200 hover:bg-paper-100"
									}`}
								>
									{f.label}
								</Link>
							);
						})}
					</div>
				)}
				<Link
					href={hrefWith({ hideNoMedia: !hideNoMedia })}
					title="Hide spots with no cover, logo, or photos"
					className={`rounded-md px-2.5 py-1 font-display font-bold border ${
						hideNoMedia
							? "bg-marigold-500 text-ink-900 border-marigold-500"
							: "text-ink-600 border-ink-200 hover:bg-paper-100"
					}`}
				>
					{hideNoMedia ? "Hiding no-media" : "Hide no-media"}
				</Link>
			</div>

			<TriageClient
				key={`${mode}-${state ?? "all"}-${reviewed}-${hideNoMedia ? 1 : 0}`}
				initialItems={items}
				mode={mode}
				state={state ?? null}
				reviewed={reviewed}
				hideNoMedia={hideNoMedia}
				pageSize={PAGE_SIZE}
			/>
		</div>
	);
}
