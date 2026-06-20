"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  MagnifyingGlass,
  NavigationArrow,
  Clock,
  CaretDown,
  Rows,
  MapTrifold,
  CookingPot,
  CircleNotch,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { CompactRow } from "./CompactRow";
import type { Restaurant, RestaurantPin, Bbox } from "@/lib/types";
import { isOpenNow, haversineKm, formatDistance } from "@/lib/format";
import { cn } from "@/lib/cn";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center bg-paper-100 text-ink-500">
      Loading map…
    </div>
  ),
});

function Seg<T extends string | number>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
}) {
  return (
    <div className="flex border-2 border-sand-400 rounded-full overflow-hidden shrink-0">
      {options.map(([val, label]) => (
        <button
          key={String(val)}
          onClick={() => onChange(val)}
          className={cn(
            "px-3.5 py-[5px] font-display font-bold text-[0.9rem] cursor-pointer transition-colors",
            value === val ? "bg-chili-500 text-white" : "bg-transparent text-ink-700 hover:bg-paper-100"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function ExploreClient({
  fixed,
  initialItems,
  initialPins,
  initialTotal,
  initialCenter,
  initialZoom,
  areaLabel,
  focusId,
  initialUserLoc,
}: {
  fixed: { tag?: string; state?: string; suburb?: string; venue?: string };
  initialItems: Restaurant[];
  initialPins: RestaurantPin[];
  initialTotal: number;
  initialCenter: [number, number];
  initialZoom: number;
  areaLabel: string;
  focusId?: number;
  initialUserLoc?: [number, number];
}) {
  const [items, setItems] = useState<Restaurant[]>(initialItems);
  const [pins, setPins] = useState<RestaurantPin[]>(initialPins);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [q, setQ] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [price, setPrice] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState("featured");

  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(focusId ?? null);
  const [viewMode, setViewMode] = useState<"map" | "list">("list");
  const [center, setCenter] = useState(initialCenter);
  const [zoom, setZoom] = useState(initialZoom);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(initialUserLoc ?? null);

  const bboxRef = useRef<Bbox | null>(null);
  const pageRef = useRef(1);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fetchRef = useRef<(reset: boolean) => void>(() => {});
  const firstBounds = useRef(true);

  const buildParams = (page: number) => {
    const b = bboxRef.current!;
    const p = new URLSearchParams();
    p.set("bbox", `${b.w},${b.s},${b.e},${b.n}`);
    p.set("page", String(page));
    p.set("sort", sort);
    if (q.trim()) p.set("q", q.trim());
    if (price) p.set("price", String(price));
    if (minRating) p.set("rating", String(minRating));
    if (fixed.tag) p.set("tag", fixed.tag);
    if (fixed.state) p.set("state", fixed.state);
    if (fixed.suburb) p.set("suburb", fixed.suburb);
    if (fixed.venue) p.set("venue", fixed.venue);
    return p;
  };

  const run = (reset: boolean) => {
    if (!bboxRef.current) return;
    const page = reset ? 1 : pageRef.current + 1;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    reset ? setLoading(true) : setLoadingMore(true);
    fetch(`/api/restaurants?${buildParams(page)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => {
        if (reset) {
          setItems(data.items);
          setPins(data.pins || []);
          setTotal(data.total ?? 0);
          pageRef.current = 1;
        } else {
          setItems((prev) => [...prev, ...data.items]);
          pageRef.current = page;
        }
      })
      .catch((e) => {
        if (e.name !== "AbortError") console.error(e);
      })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  };
  fetchRef.current = run;

  // map bounds change (auto-refresh on move; skip the very first ready event
  // because SSR already provided that view's data)
  const onBounds = useCallback((b: Bbox) => {
    bboxRef.current = b;
    if (firstBounds.current) {
      firstBounds.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchRef.current(true), 400);
  }, []);

  // refilter when controls change (debounce text)
  useEffect(() => {
    if (!bboxRef.current) return;
    const t = setTimeout(() => fetchRef.current(true), q ? 350 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, price, minRating, sort]);

  const onSelect = useCallback((id: number) => {
    setSelected(id);
    const el = document.getElementById(`row-${id}`);
    if (el && listRef.current)
      listRef.current.scrollTo({ top: el.offsetTop - 12, behavior: "smooth" });
  }, []);

  const nearMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setUserLoc([p.coords.latitude, p.coords.longitude]);
        setCenter([p.coords.latitude, p.coords.longitude]);
        setZoom(13);
      },
      () => {},
      { timeout: 6000 }
    );
  };

  const base = openOnly
    ? items.filter((r) => isOpenNow(r.openingHours) !== false)
    : items;
  // keep the searched (focused) restaurant pinned to the top
  const shown =
    focusId != null && base.some((r) => r.id === focusId)
      ? [...base.filter((r) => r.id === focusId), ...base.filter((r) => r.id !== focusId)]
      : base;

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      {/* top bar */}
      <div className="px-4 sm:px-6 py-3 border-b border-paper-300 bg-paper-100 relative z-[1200]">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white border-2 border-sand-400 rounded-full pl-4 pr-1.5 py-1 flex-[1_1_360px] max-w-[560px] focus-within:border-marigold-500">
            <MagnifyingGlass className="text-ink-500 shrink-0" size={18} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a restaurant, suburb or postcode"
              aria-label="Search"
              className="flex-1 bg-transparent outline-none font-body text-base text-ink-900 min-w-0 placeholder:text-ink-500"
            />
          </div>
          <Button
            size="sm"
            onClick={nearMe}
            iconLeft={<NavigationArrow weight="fill" size={16} />}
            className="shrink-0 whitespace-nowrap"
          >
            Near me
          </Button>
        </div>

        <div className="flex gap-x-5 gap-y-2.5 items-center mt-3 flex-wrap">
          <button
            onClick={() => setOpenOnly((o) => !o)}
            className={cn(
              "inline-flex items-center gap-2 border-2 rounded-full px-4 py-[5px] cursor-pointer font-display font-bold text-[0.9rem] transition-colors",
              openOnly
                ? "bg-coriander-500 border-coriander-500 text-white"
                : "bg-white border-sand-400 text-ink-700"
            )}
          >
            <Clock weight="fill" size={16} />
            Open now
          </button>

          <label className="flex items-center gap-2">
            <span className="font-display font-bold text-ink-700 text-[0.9rem]">Sort</span>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none border-2 border-sand-400 rounded-full bg-white pl-3.5 pr-8 py-[5px] font-display font-bold text-[0.9rem] text-ink-900 cursor-pointer outline-none"
              >
                <option value="featured">Featured</option>
                <option value="rating">Highest rated</option>
                <option value="newest">Newest</option>
              </select>
              <CaretDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-700" size={14} />
            </div>
          </label>

          <label className="flex items-center gap-2">
            <span className="font-display font-bold text-ink-700 text-[0.9rem]">Price</span>
            <Seg value={price} onChange={setPrice} options={[[0, "Any"], [1, "$"], [2, "$$"], [3, "$$$"]]} />
          </label>

          <label className="flex items-center gap-2">
            <span className="font-display font-bold text-ink-700 text-[0.9rem]">Rating</span>
            <Seg value={minRating} onChange={setMinRating} options={[[0, "Any"], [4, "★ 4.0+"], [4.5, "★ 4.5+"]]} />
          </label>
        </div>
      </div>

      {/* body */}
      <div className="flex-1 min-h-0 relative flex">
        <div
          ref={listRef}
          className={cn(
            "w-full md:w-[540px] md:flex-none overflow-y-auto p-4 bg-paper-50 md:border-r md:border-paper-300",
            viewMode === "map" ? "hidden md:block" : "block"
          )}
        >
          <div className="flex items-center justify-between px-0.5 pb-3">
            <span className="font-display font-bold text-ink-700">
              {total} {total === 1 ? "spot" : "spots"} {areaLabel}
            </span>
            {loading && <CircleNotch className="animate-spin text-chili-500" size={18} />}
          </div>

          {shown.length === 0 && !loading ? (
            <div className="text-center py-12 text-ink-500">
              <CookingPot size={36} className="mx-auto mb-2" />
              No spots in view. Pan the map or zoom out.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {shown.map((r) => (
                <div key={r.id} id={`row-${r.id}`}>
                  <CompactRow
                    r={r}
                    hovered={hovered === r.id}
                    selected={selected === r.id}
                    onHover={setHovered}
                    distance={
                      userLoc && r.lat != null && r.lng != null
                        ? formatDistance(haversineKm(userLoc, r.lat, r.lng))
                        : undefined
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {items.length < total && !openOnly && (
            <div className="pt-4 text-center">
              <Button variant="outline" onClick={() => run(false)} disabled={loadingMore}>
                {loadingMore ? "Loading…" : `Load more (${total - items.length} left)`}
              </Button>
            </div>
          )}
        </div>

        <div
          className={cn(
            "flex-1 relative min-w-0",
            viewMode === "list" ? "hidden md:block" : "block"
          )}
        >
          <MapView
            pins={pins}
            hoveredId={hovered}
            selectedId={selected}
            onHover={setHovered}
            onSelect={onSelect}
            onBounds={onBounds}
            center={center}
            zoom={zoom}
          />
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1100] md:hidden">
          <button
            onClick={() => setViewMode(viewMode === "map" ? "list" : "map")}
            className="inline-flex items-center gap-2 bg-ink-900 text-white rounded-full px-6 py-3.5 cursor-pointer font-display font-bold text-[1.02rem] shadow-lg"
          >
            {viewMode === "map" ? <Rows size={20} /> : <MapTrifold size={20} />}
            {viewMode === "map" ? "List" : "Map"}
          </button>
        </div>
      </div>
    </div>
  );
}
