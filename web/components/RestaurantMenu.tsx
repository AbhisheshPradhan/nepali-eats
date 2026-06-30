"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MagnifyingGlass, X, CaretLeft, CaretRight, ThumbsUp } from "@phosphor-icons/react";
import type { MenuCategory, MenuVariant } from "@/lib/types";

const fmtPrice = (price: number | null, currency = "AUD"): string =>
  price == null
    ? ""
    : new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(price);

// Detail-page menu: a sticky toolbar (heading + search + category jump-nav) over the
// rendered sections. Filtering is client-side (the menu is already loaded).
export function RestaurantMenu({ menu }: { menu: MenuCategory[] }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState<number | null>(menu[0]?.id ?? null);
  const [arrows, setArrows] = useState({ left: false, right: false });
  const sections = useRef<Map<number, HTMLElement>>(new Map());
  const toolbarRef = useRef<HTMLDivElement>(null);
  const chipBarRef = useRef<HTMLDivElement>(null);
  const lastActive = useRef<number | null>(menu[0]?.id ?? null);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return menu;
    return menu
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (it) =>
            it.name.toLowerCase().includes(query) ||
            (it.description?.toLowerCase().includes(query) ?? false),
        ),
      }))
      .filter((c) => c.items.length > 0);
  }, [menu, q]);

  // Scroll-spy: the last section whose top has reached the sticky toolbar is "current".
  // When it changes, highlight its chip AND scroll the bar so the chip is at the left.
  useEffect(() => {
    const onScroll = () => {
      const tb = toolbarRef.current;
      const threshold = (tb ? tb.getBoundingClientRect().bottom : 120) + 8;
      let current = filtered[0]?.id ?? null;
      for (const cat of filtered) {
        const el = sections.current.get(cat.id);
        if (el && el.getBoundingClientRect().top <= threshold) current = cat.id;
      }
      if (current === lastActive.current) return;
      lastActive.current = current;
      setActive(current);
      const bar = chipBarRef.current;
      const chip = current != null ? bar?.querySelector<HTMLElement>(`[data-chip="${current}"]`) : null;
      if (bar && chip) {
        // Lazy: only move once the active chip leaves view. While it's still fully
        // visible (the first categories that already fit), the bar stays put.
        const c = chip.getBoundingClientRect();
        const r = bar.getBoundingClientRect();
        if (c.left < r.left || c.right > r.right) {
          bar.scrollBy({ left: c.left - r.left - 8, behavior: "auto" });
        }
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [filtered]);

  const updateArrows = useCallback(() => {
    const bar = chipBarRef.current;
    if (!bar) return;
    setArrows({
      left: bar.scrollLeft > 4,
      right: bar.scrollLeft < bar.scrollWidth - bar.clientWidth - 4,
    });
  }, []);
  useEffect(() => {
    updateArrows();
  }, [filtered, updateArrows]);

  const jump = useCallback((id: number) => {
    sections.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  const nudge = (dir: 1 | -1) =>
    chipBarRef.current?.scrollBy({ left: dir * 220, behavior: "smooth" });

  if (!menu.length) return null;

  return (
    <section className="mb-8">
      {/* sticky toolbar — heading + search (wraps on mobile) + category chips */}
      <div ref={toolbarRef} className="sticky top-12 z-20 bg-paper-50 pt-4 pb-3">
        <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-2">
          <h2 className="font-display font-extrabold text-[1.5rem] text-balance m-0">
            The menu
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
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-900 cursor-pointer"
              >
                <X size={16} weight="bold" />
              </button>
            )}
          </div>
        </div>

        {filtered.length > 1 && (
          <div className="mt-3 flex items-center gap-1.5">
            {arrows.left && (
              <button
                type="button"
                onClick={() => nudge(-1)}
                aria-label="Scroll categories left"
                className="hidden sm:flex shrink-0 items-center justify-center w-7 h-7 rounded-full bg-white border border-sand-400 shadow-sm cursor-pointer text-ink-700 hover:border-chili-400"
              >
                <CaretLeft size={14} weight="bold" />
              </button>
            )}
            <div
              ref={chipBarRef}
              onScroll={updateArrows}
              className="flex-1 flex gap-2 overflow-x-auto scrollbar-none py-0.5"
            >
              {filtered.map((cat) => (
                <button
                  key={cat.id}
                  data-chip={cat.id}
                  type="button"
                  onClick={() => jump(cat.id)}
                  className={`shrink-0 cursor-pointer font-body font-semibold text-[0.82rem] px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                    active === cat.id
                      ? "bg-chili-500 border-chili-500 text-white"
                      : "bg-white border-sand-400 text-ink-700 hover:border-chili-400"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            {arrows.right && (
              <button
                type="button"
                onClick={() => nudge(1)}
                aria-label="Scroll categories right"
                className="hidden sm:flex shrink-0 items-center justify-center w-7 h-7 rounded-full bg-white border border-sand-400 shadow-sm cursor-pointer text-ink-700 hover:border-chili-400"
              >
                <CaretRight size={14} weight="bold" />
              </button>
            )}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-ink-500 mt-4 m-0">No dishes match “{q.trim()}”.</p>
      ) : (
        <div className="space-y-8 mt-4">
          {filtered.map((cat) => (
            <div
              key={cat.id}
              data-cat-id={cat.id}
              ref={(el) => {
                if (el) sections.current.set(cat.id, el);
                else sections.current.delete(cat.id);
              }}
              className="scroll-mt-52 sm:scroll-mt-44"
            >
              <h3 className="font-display font-bold text-[1.15rem] tracking-tight text-chili-700 mb-2.5 text-balance">
                {cat.name}
              </h3>
              <ul className="list-none m-0 p-0 divide-y divide-paper-300 sm:divide-y-0 sm:grid sm:grid-cols-2 sm:gap-3">
                {cat.items.map((item) => {
                  const priced = item.variants.filter((v) => v.price != null);
                  const single = priced.length <= 1;
                  const currency = item.variants[0]?.currency ?? "AUD";
                  const minPrice = priced.length
                    ? Math.min(...priced.map((v) => v.price as number))
                    : null;
                  return (
                    <li
                      key={item.id}
                      className="py-4 sm:p-4 sm:bg-white sm:rounded-lg sm:shadow-sm"
                    >
                      <div className="flex gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-display font-bold text-ink-900 text-[1.02rem] leading-tight m-0">
                            {item.name}
                          </h4>
                          {/* Price + review. Price in brand red; "from" prefix when
                              there are multiple priced variants. Review renders only
                              once we have rating data (ratingPct/reviewCount). */}
                          {priced.length > 0 || item.ratingPct != null ? (
                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.9rem]">
                              {priced.length > 0 ? (
                                <span className="font-body font-bold text-chili-500 tabular-nums whitespace-nowrap">
                                  {single ? (
                                    fmtPrice(priced[0].price, currency)
                                  ) : (
                                    <>
                                      <span className="font-normal">from </span>
                                      {fmtPrice(minPrice, currency)}
                                    </>
                                  )}
                                </span>
                              ) : null}
                              {item.ratingPct != null ? (
                                <span className="inline-flex items-center gap-1 text-ink-500">
                                  <span aria-hidden>·</span>
                                  <ThumbsUp size={13} weight="fill" className="text-coriander-500" />
                                  {item.ratingPct}%
                                  {item.reviewCount != null ? ` (${item.reviewCount})` : ""}
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                          {item.description ? (
                            <p className="text-ink-500 text-[0.9rem] leading-snug m-0 mt-1.5">
                              {item.description}
                            </p>
                          ) : null}
                          {!single ? (
                            <div className="mt-2.5 flex flex-wrap gap-2">
                              {priced.map((v: MenuVariant, i: number) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-sand-400 px-2.5 py-1 text-[0.82rem] whitespace-nowrap"
                                >
                                  {v.label ? (
                                    <span className="text-ink-700">{v.label}</span>
                                  ) : null}
                                  <span className="font-semibold text-chili-500 tabular-nums">
                                    {fmtPrice(v.price, currency)}
                                  </span>
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        {item.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.photoUrl}
                            alt=""
                            loading="lazy"
                            className="shrink-0 w-20 h-20 rounded-lg object-cover bg-paper-100"
                          />
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
