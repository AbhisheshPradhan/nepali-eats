"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import type { MenuCategory, MenuVariant } from "@/lib/types";

const fmtPrice = (price: number | null, currency = "AUD"): string =>
	price == null
		? ""
		: new Intl.NumberFormat("en-AU", {
				style: "currency",
				currency,
			}).format(price);

// Detail-page menu: a sticky toolbar (heading + search + category jump-nav) over the
// rendered sections. Filtering is client-side (the menu is already loaded).
export function RestaurantMenu({ menu }: { menu: MenuCategory[] }) {
	const [q, setQ] = useState("");
	const [active, setActive] = useState<number | null>(menu[0]?.id ?? null);
	const sections = useRef<Map<number, HTMLElement>>(new Map());

	const filtered = useMemo(() => {
		const query = q.trim().toLowerCase();
		if (!query) return menu;
		return menu
			.map((cat) => ({
				...cat,
				items: cat.items.filter(
					(it) =>
						it.name.toLowerCase().includes(query) ||
						(it.description?.toLowerCase().includes(query) ??
							false),
				),
			}))
			.filter((c) => c.items.length > 0);
	}, [menu, q]);

	// Scroll-spy: highlight the category chip for the section nearest the top.
	useEffect(() => {
		const obs = new IntersectionObserver(
			(entries) => {
				const vis = entries
					.filter((e) => e.isIntersecting)
					.sort(
						(a, b) =>
							a.boundingClientRect.top - b.boundingClientRect.top,
					);
				if (vis[0])
					setActive(
						Number((vis[0].target as HTMLElement).dataset.catId),
					);
			},
			{ rootMargin: "-150px 0px -65% 0px" },
		);
		sections.current.forEach((el) => obs.observe(el));
		return () => obs.disconnect();
	}, [filtered]);

	const jump = useCallback((id: number) => {
		sections.current
			.get(id)
			?.scrollIntoView({ behavior: "smooth", block: "start" });
	}, []);

	if (!menu.length) return null;

	return (
		<section className="mb-8">
			{/* sticky toolbar — heading + search (wraps on mobile) + category chips */}
			<div className="sticky top-12 z-20 bg-paper-50 pt-4 pb-3">
				<div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-2">
					<h2 className="font-display font-extrabold text-[1.5rem] text-balance m-0">
						The Menu
					</h2>
					<div className="relative w-full sm:w-72">
						<MagnifyingGlass
							size={17}
							weight="bold"
							className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 pointer-events-none"
						/>
						<input
							type="text"
							value={q}
							onChange={(e) => setQ(e.target.value)}
							placeholder="Search the menu…"
							aria-label="Search the menu"
							className="w-full bg-white border border-sand-400 rounded-full pl-9 pr-9 py-2 text-[0.9rem] text-ink-900 placeholder:text-ink-500"
						/>
						{q && (
							<button
								type="button"
								onClick={() => setQ("")}
								aria-label="Clear search"
								className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-900"
							>
								<X
									size={16}
									weight="bold"
								/>
							</button>
						)}
					</div>
				</div>

				{filtered.length > 1 && (
					<div className="flex gap-2 overflow-x-auto mt-3 -mx-1 px-1 pb-0.5 scrollbar-none">
						{filtered.map((cat) => (
							<button
								key={cat.id}
								type="button"
								onClick={() => jump(cat.id)}
								className={`shrink-0 font-body font-semibold text-[0.82rem] px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chili-400 ${
									active === cat.id
										? "bg-chili-500 border-chili-500 text-white"
										: "bg-white border-sand-400 text-ink-700 hover:border-chili-400"
								}`}
							>
								{cat.name}
							</button>
						))}
					</div>
				)}
			</div>

			{filtered.length === 0 ? (
				<p className="text-ink-500 mt-4 m-0">
					No dishes match “{q.trim()}”.
				</p>
			) : (
				<div className="space-y-8 mt-4">
					{filtered.map((cat) => {
						return (
							<div
								key={cat.id}
								data-cat-id={cat.id}
								ref={(el) => {
									if (el) sections.current.set(cat.id, el);
									else sections.current.delete(cat.id);
								}}
								className="scroll-mt-40"
							>
								<h3 className="font-display font-bold text-[1.15rem] tracking-tight text-chili-700 mb-2.5 text-balance">
									{cat.name}
								</h3>
								<ul className="list-none m-0 p-0 bg-white rounded-lg shadow-sm divide-y divide-paper-200">
									{cat.items.map((item) => {
										const priced = item.variants.filter(
											(v) => v.price != null,
										);
										const single = priced.length <= 1;
										const currency =
											item.variants[0]?.currency ?? "AUD";
										return (
											<li
												key={item.id}
												className="p-4"
											>
												<div className="flex gap-3 items-baseline">
													<span className="font-display font-bold text-ink-900 flex-1 min-w-0">
														{item.name}
													</span>
													{single && priced[0] ? (
														<span className="shrink-0 font-body font-semibold text-ink-900 tabular-nums whitespace-nowrap">
															{fmtPrice(
																priced[0].price,
																currency,
															)}
														</span>
													) : null}
												</div>
												{item.description ? (
													<p className="text-ink-500 text-[0.9rem] leading-snug m-0 mt-1">
														{item.description}
													</p>
												) : null}
												{!single ? (
													<div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.85rem] text-ink-500">
														{priced.map(
															(
																v: MenuVariant,
																i: number,
															) => (
																<span
																	key={i}
																	className="whitespace-nowrap"
																>
																	{v.label
																		? `${v.label} `
																		: ""}
																	<span className="font-semibold text-ink-900 tabular-nums">
																		{fmtPrice(
																			v.price,
																			currency,
																		)}
																	</span>
																</span>
															),
														)}
													</div>
												) : null}
											</li>
										);
									})}
								</ul>
							</div>
						);
					})}
				</div>
			)}
		</section>
	);
}
