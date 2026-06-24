import Link from "next/link";
import { assertAdmin } from "@/lib/admin/guard";
import {
	reviewQueue,
	reviewCounts,
	type ReviewMode,
} from "@/lib/admin/queries";
import { ReviewClient } from "@/components/admin/ReviewClient";

export const metadata = { robots: { index: false, follow: false } };

type SP = Promise<{ mode?: string; page?: string }>;

const MODES: { key: ReviewMode; label: string; hint: string }[] = [
	{
		key: "review_needed",
		label: "Review needed",
		hint: "Confirm Nepali or remove false positives",
	},
	{ key: "no_photo", label: "No photo", hint: "Spots missing all photos" },
	{
		key: "has_photo",
		label: "Has photo",
		hint: "Eyeball for wrong/bad photos",
	},
	{ key: "all", label: "All", hint: "Everything" },
];

const PAGE_SIZE = 60;

export default async function AdminReview({
	searchParams,
}: {
	searchParams: SP;
}) {
	await assertAdmin();
	const sp = await searchParams;
	const mode: ReviewMode =
		(MODES.find((m) => m.key === sp.mode)?.key as ReviewMode) ??
		"review_needed";
	const page = Math.max(1, Number(sp.page) || 1);
	const offset = (page - 1) * PAGE_SIZE;

	const [items, counts] = await Promise.all([
		reviewQueue(mode, PAGE_SIZE, offset),
		reviewCounts(),
	]);
	const total = counts[mode];
	const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

	return (
		<div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-8">
			<div className="flex items-baseline justify-between gap-4 mb-1">
				<h1 className="font-display font-extrabold text-2xl text-ink-900">
					Admin · review
				</h1>
				<div className="flex items-center gap-3 text-sm">
					<Link
						href="/admin/triage"
						className="text-chili-600 hover:underline"
					>
						Triage
					</Link>
					<Link
						href="/admin"
						className="text-chili-600 hover:underline"
					>
						← Coverage table
					</Link>
				</div>
			</div>
			<p className="text-ink-500 text-sm mb-5">
				Visual pass for false positives and photo QA. Keep / exclude is
				reversible; delete is permanent.
			</p>

			<div className="flex flex-wrap gap-2 mb-6">
				{MODES.map((m) => {
					const active = m.key === mode;
					return (
						<Link
							key={m.key}
							href={`/admin/review?mode=${m.key}`}
							title={m.hint}
							className={`rounded-full px-4 py-1.5 text-sm font-display font-bold border-2 transition-colors ${
								active
									? "bg-chili-500 text-white border-chili-500"
									: "bg-white text-ink-700 border-ink-200 hover:border-chili-300"
							}`}
						>
							{m.label}{" "}
							<span
								className={
									active ? "opacity-80" : "text-ink-400"
								}
							>
								{counts[m.key]}
							</span>
						</Link>
					);
				})}
			</div>

			<ReviewClient items={items} />

			{total > PAGE_SIZE && (
				<div className="flex items-center justify-center gap-4 mt-8 text-sm">
					{page > 1 ? (
						<Link
							href={`/admin/review?mode=${mode}&page=${page - 1}`}
							className="text-chili-600 hover:underline font-bold"
						>
							← Prev
						</Link>
					) : (
						<span className="text-ink-300">← Prev</span>
					)}
					<span className="text-ink-500">
						Page {page} of {lastPage}
					</span>
					{page < lastPage ? (
						<Link
							href={`/admin/review?mode=${mode}&page=${page + 1}`}
							className="text-chili-600 hover:underline font-bold"
						>
							Next →
						</Link>
					) : (
						<span className="text-ink-300">Next →</span>
					)}
				</div>
			)}
		</div>
	);
}
