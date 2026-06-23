import Link from "next/link";
import { assertAdmin } from "@/lib/admin/guard";
import {
	adminList,
	adminCards,
	adminCoverage,
	type MissingFilter,
} from "@/lib/admin/queries";
import { stateFacets } from "@/lib/queries";
import { PlaceCard } from "@/components/PlaceCard";

export const metadata = { robots: { index: false, follow: false } };

type SP = Promise<{
	state?: string;
	q?: string;
	missing?: string;
	view?: string;
	page?: string;
}>;

const MISSING_OPTS: MissingFilter[] = [
	"photo",
	"hours",
	"price",
	"menu",
	"contact",
];

const PAGE_SIZE = 50;

function Dot({ on }: { on: boolean }) {
	return (
		<span
			className={`inline-block h-2.5 w-2.5 rounded-full ${on ? "bg-emerald-500" : "bg-ink-200"}`}
		/>
	);
}

export default async function AdminIndex({
	searchParams,
}: {
	searchParams: SP;
}) {
	await assertAdmin();
	const sp = await searchParams;
	const missing = (MISSING_OPTS as string[]).includes(sp.missing || "")
		? (sp.missing as MissingFilter)
		: undefined;
	const view = sp.view === "grid" ? "grid" : "table";
	const filters = {
		state: sp.state || undefined,
		q: sp.q || undefined,
		missing,
	};
	const page = Math.max(1, Number(sp.page) || 1);
	const offset = (page - 1) * PAGE_SIZE;

	const [rows, cards, coverage, states] = await Promise.all([
		adminList(filters, PAGE_SIZE, offset),
		view === "grid"
			? adminCards(filters, PAGE_SIZE, offset)
			: Promise.resolve([]),
		adminCoverage(filters),
		stateFacets(),
	]);

	const total = coverage.total;
	const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

	// Build a URL preserving current filters/view, overriding the given keys.
	const hrefWith = (over: { view?: "table" | "grid"; page?: number }) => {
		const qs = new URLSearchParams();
		if (sp.q) qs.set("q", sp.q);
		if (sp.state) qs.set("state", sp.state);
		if (missing) qs.set("missing", missing);
		const v = over.view ?? (view === "grid" ? "grid" : undefined);
		if (v === "grid") qs.set("view", "grid");
		const pg = over.page ?? page;
		if (pg > 1) qs.set("page", String(pg));
		const s = qs.toString();
		return s ? `/admin?${s}` : "/admin";
	};
	const viewHref = (v: "table" | "grid") => hrefWith({ view: v, page: 1 });

	return (
		<div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
			<div className="flex items-baseline justify-between gap-4 mb-1">
				<h1 className="font-display font-extrabold text-2xl text-ink-900">
					Admin · data entry
				</h1>
				<div className="flex items-center gap-3 text-sm">
					<div className="inline-flex rounded-md border border-ink-200 overflow-hidden">
						<Link
							href={viewHref("table")}
							className={`px-3 py-1 font-display font-bold ${view === "table" ? "bg-chili-500 text-white" : "text-ink-600 hover:bg-paper-100"}`}
						>
							Table
						</Link>
						<Link
							href={viewHref("grid")}
							className={`px-3 py-1 font-display font-bold ${view === "grid" ? "bg-chili-500 text-white" : "text-ink-600 hover:bg-paper-100"}`}
						>
							Grid
						</Link>
					</div>
				</div>
			</div>
			<p className="text-ink-500 text-sm mb-5">
				Local-only editor. {total} restaurants · with photo{" "}
				{coverage.photo} · hours {coverage.hours} · price{" "}
				{coverage.price} · menu {coverage.menu} · contactable{" "}
				{coverage.contactable}
			</p>

			<form
				method="get"
				className="flex flex-wrap gap-2 mb-5 text-sm"
			>
				{view === "grid" && (
					<input
						type="hidden"
						name="view"
						value="grid"
					/>
				)}
				<input
					name="q"
					defaultValue={sp.q || ""}
					placeholder="Search name…"
					className="border border-ink-200 rounded-md px-3 py-1.5 w-52"
				/>
				<select
					name="state"
					defaultValue={sp.state || ""}
					className="border border-ink-200 rounded-md px-3 py-1.5"
				>
					<option value="">All states</option>
					{states.map((s) => (
						<option
							key={s.value}
							value={s.value}
						>
							{s.value} ({s.count})
						</option>
					))}
				</select>
				<select
					name="missing"
					defaultValue={missing || ""}
					className="border border-ink-200 rounded-md px-3 py-1.5"
				>
					<option value="">Any coverage</option>
					{MISSING_OPTS.map((m) => (
						<option
							key={m}
							value={m}
						>
							Missing {m}
						</option>
					))}
				</select>
				<button
					type="submit"
					className="bg-chili-500 text-white rounded-md px-4 py-1.5 font-display font-bold hover:bg-chili-600"
				>
					Filter
				</button>
				<Link
					href="/admin"
					className="px-3 py-1.5 text-ink-500 hover:text-ink-900"
				>
					Reset
				</Link>
			</form>

			{view === "grid" ? (
				cards.length ? (
					<div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-4 gap-5">
						{cards.map((c) => (
							<div
								key={c.id}
								className="flex flex-col gap-1"
							>
								<PlaceCard
									r={c}
									newTab
								/>
								<Link
									href={`/admin/${c.slug}`}
									className="text-xs text-ink-400 hover:text-chili-600 self-start"
								>
									Edit in admin →
								</Link>
							</div>
						))}
					</div>
				) : (
					<p className="text-ink-400 py-12 text-center">
						No restaurants match.
					</p>
				)
			) : (
				<div className="overflow-x-auto border border-ink-100 rounded-lg">
					<table className="w-full text-sm">
						<thead className="bg-paper-100 text-ink-500 text-left">
							<tr>
								<th className="px-3 py-2 font-semibold">
									Name
								</th>
								<th className="px-3 py-2 font-semibold">
									Area
								</th>
								<th className="px-3 py-2 font-semibold text-right">
									Reviews
								</th>
								<th className="px-3 py-2 font-semibold text-center">
									Photo
								</th>
								<th className="px-3 py-2 font-semibold text-center">
									Hours
								</th>
								<th className="px-3 py-2 font-semibold text-center">
									Price
								</th>
								<th className="px-3 py-2 font-semibold text-center">
									Menu
								</th>
								<th className="px-3 py-2 font-semibold text-center">
									Contactable
								</th>
								<th className="px-3 py-2 font-semibold text-center">
									Ready
								</th>
								<th className="px-3 py-2 font-semibold text-center">
									★
								</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((r) => (
								<tr
									key={r.id}
									className="border-t border-ink-100 hover:bg-paper-50"
								>
									<td className="px-3 py-2">
										<Link
											href={`/admin/${r.slug}`}
											className="text-chili-600 hover:underline font-medium"
										>
											{r.name}
										</Link>
									</td>
									<td className="px-3 py-2 text-ink-500">
										{[r.suburb, r.state]
											.filter(Boolean)
											.join(", ")}
									</td>
									<td className="px-3 py-2 text-right text-ink-500">
										{r.reviewCount ?? "—"}
									</td>
									<td className="px-3 py-2 text-center">
										<Dot on={r.hasPhoto} />
									</td>
									<td className="px-3 py-2 text-center">
										<Dot on={r.hasHours} />
									</td>
									<td className="px-3 py-2 text-center">
										<Dot on={r.hasPrice} />
									</td>
									<td className="px-3 py-2 text-center">
										<Dot on={r.hasMenu} />
									</td>
									<td className="px-3 py-2 text-center">
										<Dot on={r.contactable} />
									</td>
									<td className="px-3 py-2 text-center">
										{r.markedReady ? (
											<span title="Marked ready">✅</span>
										) : (
											""
										)}
									</td>
									<td className="px-3 py-2 text-center text-ink-500">
										{r.featuredRank ?? ""}
									</td>
								</tr>
							))}
							{!rows.length && (
								<tr>
									<td
										colSpan={10}
										className="px-3 py-8 text-center text-ink-400"
									>
										No restaurants match.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			)}

			{total > PAGE_SIZE && (
				<div className="flex items-center justify-center gap-4 mt-6 text-sm">
					{page > 1 ? (
						<Link
							href={hrefWith({ page: page - 1 })}
							className="text-chili-600 hover:underline font-bold"
						>
							← Prev
						</Link>
					) : (
						<span className="text-ink-300">← Prev</span>
					)}
					<span className="text-ink-500">
						{offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of{" "}
						{total} · page {page} of {lastPage}
					</span>
					{page < lastPage ? (
						<Link
							href={hrefWith({ page: page + 1 })}
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
