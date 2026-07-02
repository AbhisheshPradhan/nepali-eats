"use client";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
	NavigationArrow,
	Clock,
	CaretDown,
	Rows,
	MapTrifold,
	CookingPot,
	CircleNotch,
	SlidersHorizontal,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/shadcn/select";
import { PlaceCard } from "@/components/PlaceCard";
import { SearchBox } from "@/components/SearchBox";
import type { Restaurant, RestaurantPin, Bbox } from "@/lib/types";
import { isOpenNow } from "@/lib/format";
import { reverseGeocodeSuburb } from "@/lib/geocode";
import { cn } from "@/lib/cn";

// Attribute chips shown behind the "Filters" toggle. Tokens must match FLAG_COLS
// in lib/queries.ts; labels are AU-facing. Ordered by usefulness for eating out.
const FLAG_OPTIONS: [string, string][] = [
	["veg", "Vegetarian"],
	["takeout", "Takeaway"],
	["delivery", "Delivery"],
	["dinein", "Dine-in"],
	["alcohol", "Licensed"],
	["outdoor", "Outdoor seating"],
	["kid", "Kid-friendly"],
	["groups", "Good for groups"],
	["reservable", "Takes bookings"],
	["cocktails", "Cocktails"],
	["music", "Live music"],
	["dogs", "Dog-friendly"],
	["wheelchair", "Wheelchair access"],
];

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
						value === val
							? "bg-chili-500 text-white"
							: "bg-transparent text-ink-700 hover:bg-paper-100",
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
	defaultUserLoc,
	autoLocate = false,
	viewKey,
	initialQuery = "",
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
	defaultUserLoc: [number, number];
	autoLocate?: boolean;
	// viewKey = signature of the server-resolved view; changes on a soft navigation
	// to a new suburb/restaurant/area so the client can re-apply the new camera.
	viewKey: string;
	// initialQuery = what the search box shows (suburb, state / focused name)
	initialQuery?: string;
}) {
	const [items, setItems] = useState<Restaurant[]>(initialItems);
	const [pins, setPins] = useState<RestaurantPin[]>(initialPins);
	const [total, setTotal] = useState(initialTotal);
	const [loading, setLoading] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	// false until the client's first viewport fetch resolves. The list/pins/count
	// are client-owned, so until then we show a loading state, not a "0 spots" /
	// empty flash. (The focused restaurant is the one thing rendered server-side.)
	const [hasLoaded, setHasLoaded] = useState(false);

	// The search box is uncontrolled (SearchBox owns its text). To override it from
	// "Near me", we bump boxKey to remount it with a fresh defaultValue.
	const [boxValue, setBoxValue] = useState(initialQuery);
	const [boxKey, setBoxKey] = useState(0);
	const [openOnly, setOpenOnly] = useState(false);
	const [minRating, setMinRating] = useState(0);
	const [sort, setSort] = useState("featured");
	// selected attribute-flag tokens (see FLAG_OPTIONS / FLAG_COLS)
	const [flags, setFlags] = useState<string[]>([]);
	// whether the attribute-chip panel is expanded
	const [showFilters, setShowFilters] = useState(false);
	const toggleFlag = (token: string) =>
		setFlags((f) =>
			f.includes(token) ? f.filter((t) => t !== token) : [...f, token],
		);

	const [hovered, setHovered] = useState<number | null>(null);
	const [selected, setSelected] = useState<number | null>(focusId ?? null);
	const [viewMode, setViewMode] = useState<"map" | "list">("list");
	const [center, setCenter] = useState(initialCenter);
	const [zoom, setZoom] = useState(initialZoom);
	const [userLoc, setUserLoc] = useState<[number, number] | null>(
		initialUserLoc ?? null,
	);
	// the map's live viewport. The fetched list can be scoped to a wider bbox than
	// what's actually on screen (SSR seed box, or a pending zoom before refetch), so
	// we clip the rendered list to this so it always matches the visible pins.
	const [viewBbox, setViewBbox] = useState<Bbox | null>(null);

	// The URL (suburb/state/lat-lng/focus) only SEEDS the view. Once the visitor
	// pans/zooms the map (or hits "Near me"), we drop that scope and list
	// everything in the bounds, relabelling the view as "in the map area".
	const [areaScoped, setAreaScoped] = useState(false);
	const areaScopedRef = useRef(false);
	const enterAreaMode = (label?: string) => {
		if (!areaScopedRef.current) {
			areaScopedRef.current = true;
			setAreaScoped(true);
		}
		if (label !== undefined) {
			setBoxValue(label);
			setBoxKey((k) => k + 1);
		}
	};

	const bboxRef = useRef<Bbox | null>(null);
	const firstBoundsRef = useRef(true); // first viewport fetch fires immediately
	const pageRef = useRef(1);
	const abortRef = useRef<AbortController | null>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const fetchRef = useRef<(reset: boolean) => void>(() => {});
	// the view this client last applied; starts at the mount value so the resync
	// effect is a no-op on first render and only fires on later soft navigations.
	const appliedViewKey = useRef(viewKey);

	const buildParams = (page: number) => {
		const b = bboxRef.current!;
		const p = new URLSearchParams();
		p.set("bbox", `${b.w},${b.s},${b.e},${b.n}`);
		p.set("page", String(page));
		p.set("sort", sort);
		if (minRating) p.set("rating", String(minRating));
		// Attribute flags: true-only AND filters, allowlisted in queries.ts FLAG_COLS.
		if (flags.length) p.set("flags", flags.join(","));
		if (fixed.tag) p.set("tag", fixed.tag);
		if (fixed.venue) p.set("venue", fixed.venue);
		// geographic scope is seed-only: drop it the moment we're in map-area mode so
		// the bbox is the sole geo filter (read the ref so fetch-time is authoritative).
		if (!areaScopedRef.current) {
			if (fixed.state) p.set("state", fixed.state);
			if (fixed.suburb) p.set("suburb", fixed.suburb);
		}
		return p;
	};

	const run = (reset: boolean) => {
		if (!bboxRef.current) return;
		const page = reset ? 1 : pageRef.current + 1;
		abortRef.current?.abort();
		const ctrl = new AbortController();
		abortRef.current = ctrl;
		if (reset) setLoading(true);
		else setLoadingMore(true);
		fetch(`/api/restaurants?${buildParams(page)}`, { signal: ctrl.signal })
			.then((r) => r.json())
			.then((data) => {
				if (reset) {
					setItems(data.items);
					setPins(data.pins || []);
					setTotal(data.total ?? 0);
					setHasLoaded(true);
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
	// Latest-ref pattern: keep the ref pointing at this render's `run` (which
	// closes over the current filters) without writing a ref during render.
	useEffect(() => {
		fetchRef.current = run;
	});

	// map bounds change → auto-refresh the list (debounced). The first event
	// refetches the actual visible bounds; SSR data shows meanwhile (no flash).
	const onBounds = useCallback((b: Bbox, userMoved: boolean) => {
		bboxRef.current = b;
		setViewBbox(b); // clip the list to the visible area immediately, before refetch
		// any real pan/zoom away from the seeded view (suburb/state, a lat/lng search,
		// "Near me", or the default camera) → switch to map-area mode. Clear the box
		// (don't show "Map area" as text — it's not a real query); the "in the map
		// area" context lives in the list heading below.
		if (userMoved) enterAreaMode("");
		if (debounceRef.current) clearTimeout(debounceRef.current);
		const delay = firstBoundsRef.current ? 0 : 400;
		firstBoundsRef.current = false;
		debounceRef.current = setTimeout(() => fetchRef.current(true), delay);
	}, []);

	// refilter when controls change
	useEffect(() => {
		if (!bboxRef.current) return;
		const t = setTimeout(() => fetchRef.current(true), 0);
		return () => clearTimeout(t);
	}, [minRating, sort, flags]);

	// Default view: if the visitor already granted location, recentre on them
	// ("near me" by default). Otherwise keep the SSR state-capital / Sydney centre.
	useEffect(() => {
		if (
			!autoLocate ||
			typeof navigator === "undefined" ||
			!navigator.geolocation
		)
			return;
		const locate = () =>
			navigator.geolocation.getCurrentPosition(
				(p) => {
					setUserLoc([p.coords.latitude, p.coords.longitude]);
					setCenter([p.coords.latitude, p.coords.longitude]);
					setZoom(13);
				},
				() => {},
				{ timeout: 6000 },
			);
		if (navigator.permissions?.query) {
			navigator.permissions
				.query({ name: "geolocation" as PermissionName })
				.then((res) => {
					if (res.state === "granted") locate();
				})
				.catch(() => {});
		}
	}, [autoLocate]);

	// Searching from the Explore page navigates to /explore?suburb=… which is a SOFT
	// navigation: the server re-renders with a new camera but React keeps this client
	// instance, so center/zoom/scope (seeded only at mount) would otherwise go stale
	// and the map never moves. When the server-resolved viewKey changes, re-apply the
	// new view: recentre (MapView flyTo → onBounds refetch), re-seed the geo scope so
	// the new suburb/state filter applies, and resync the search box.
	useEffect(() => {
		if (appliedViewKey.current === viewKey) return;
		appliedViewKey.current = viewKey;
		setCenter(initialCenter);
		setZoom(initialZoom);
		areaScopedRef.current = false;
		setAreaScoped(false);
		setSelected(focusId ?? null);
		setBoxValue(initialQuery);
		setBoxKey((k) => k + 1);
		// let the post-flyTo bounds emit fetch immediately rather than debounced.
		firstBoundsRef.current = true;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [viewKey]);

	const onSelect = useCallback((id: number | null) => {
		setSelected(id);
		if (id == null) return; // deselect (popup closed) -> shrink the pin back
		const el = document.getElementById(`row-${id}`);
		if (el && listRef.current)
			listRef.current.scrollTo({
				top: el.offsetTop - 12,
				behavior: "smooth",
			});
	}, []);

	const nearMe = () => {
		if (!navigator.geolocation) return;
		navigator.geolocation.getCurrentPosition(
			async (p) => {
				const lat = p.coords.latitude;
				const lng = p.coords.longitude;
				setUserLoc([lat, lng]);
				setCenter([lat, lng]);
				setZoom(13);
				enterAreaMode(); // relocating: drop any seeded suburb scope, bbox takes over
				// reflect the detected suburb in the search box
				const label =
					(await reverseGeocodeSuburb(lat, lng)) ?? "Near you";
				setBoxValue(label);
				setBoxKey((k) => k + 1);
			},
			() => {},
			{ timeout: 6000 },
		);
	};

	// "View on map" from a list card: recentre + zoom in on the spot and highlight
	// its pin. On mobile this also flips to the map view so the move is visible.
	const viewOnMap = (r: Restaurant) => {
		if (r.lat == null || r.lng == null) return;
		setSelected(r.id);
		setCenter([r.lat, r.lng]);
		setZoom(16);
		setViewMode("map");
	};

	// Distance origin: the visitor's shared location if we have it, otherwise the
	// default "you are here" = their state's capital CBD (Sydney 2000 for NSW).
	// Independent of the map camera/focus, so the search view doesn't measure
	// distances from the focused restaurant.
	const distOrigin = userLoc ?? defaultUserLoc;

	// only list spots whose pin is in the current viewport (matches what's on the map)
	const inView = (r: Restaurant) =>
		!viewBbox ||
		r.lat == null ||
		r.lng == null ||
		(r.lng >= viewBbox.w &&
			r.lng <= viewBbox.e &&
			r.lat >= viewBbox.s &&
			r.lat <= viewBbox.n);

	const base = items.filter(
		(r) =>
			inView(r) &&
			(!openOnly || isOpenNow(r.openingHours, r.state) !== false),
	);
	// keep the searched (focused) restaurant pinned to the top
	const shown =
		focusId != null && base.some((r) => r.id === focusId)
			? [
					...base.filter((r) => r.id === focusId),
					...base.filter((r) => r.id !== focusId),
				]
			: base;
	// focus view = the searched restaurant sits at the top (shown as the result).
	// "You may also like" only renders when the viewport fetch adds more (length > 1).
	const isFocusView = focusId != null && shown[0]?.id === focusId;

	// Count every active filter the "Filters" button stands for. On mobile Open
	// now + Rating live inside its panel; on desktop they sit in the bar but still
	// count as active filters, so the badge is a consistent total either way.
	const activeFilterCount =
		flags.length + (openOnly ? 1 : 0) + (minRating > 0 ? 1 : 0);
	const clearAllFilters = () => {
		setFlags([]);
		setOpenOnly(false);
		setMinRating(0);
	};

	return (
		<div className="flex flex-col h-[calc(100dvh-57px)]">
			{/* top bar */}
			<div className="px-4 sm:px-6 py-3 border-b border-paper-300 bg-paper-100 relative z-[1200]">
				<div className="flex items-center gap-3">
					{/* flex-1 + min-w-0 lets the box shrink so "Near me" stays on the
					    same line on narrow phones (instead of wrapping to a 2nd row). */}
					<div className="flex-1 min-w-0 max-w-[560px]">
						{/* Same component as the homepage hero. Pure navigation: pick a
                suburb (recenters, shows all its spots) or a restaurant (focus).
                Pre-filled with the current area; empty state clears, not redirects. */}
						<SearchBox
							key={boxKey}
							variant="bar"
							embedded
							defaultValue={boxValue}
						/>
					</div>
					{/* Desktop: Near me sits beside the search box. On mobile it moves
					    into the Filters panel so the search input owns the whole row. */}
					<Button
						size="sm"
						onClick={nearMe}
						iconLeft={
							<NavigationArrow
								weight="fill"
								size={16}
							/>
						}
						className="shrink-0 whitespace-nowrap h-11 max-md:hidden"
					>
						Near me
					</Button>
				</div>

				{/* Filter bar: primary controls always visible; attribute chips live
				    behind the Filters toggle. Open now is computed client-side. */}
				<div className="mt-3">
					{/* Mobile: one horizontally-scrollable row (bleeds to the screen
					    edges) so the controls stay on a single thumb-swipeable line
					    instead of eating two rows above the map. Desktop: plain wrap. */}
					<div className="flex items-center gap-2.5 flex-nowrap overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:gap-x-4 md:gap-y-2 md:overflow-visible">
						<button
							onClick={() => setOpenOnly((o) => !o)}
							className={cn(
								"max-md:hidden shrink-0 inline-flex items-center gap-2 border-2 rounded-full px-4 py-[5px] cursor-pointer font-display font-bold text-[0.9rem] transition-colors",
								openOnly
									? "bg-coriander-500 border-coriander-500 text-white"
									: "bg-white border-sand-400 text-ink-700",
							)}
						>
							<Clock weight="fill" size={16} />
							Open now
						</button>

						<label className="max-md:hidden flex items-center gap-2 shrink-0">
							<span className="font-display font-bold text-ink-700 text-[0.9rem]">
								Rating
							</span>
							<Seg
								value={minRating}
								onChange={setMinRating}
								options={[
									[0, "Any"],
									[4, "★ 4.0+"],
									[4.5, "★ 4.5+"],
								]}
							/>
						</label>

						<div className="flex items-center gap-2 shrink-0">
							<span className="font-display font-bold text-ink-700 text-[0.9rem]">
								Sort
							</span>
							<Select value={sort} onValueChange={setSort}>
								<SelectTrigger className="rounded-full border-2 border-sand-400 bg-white px-3.5 font-display font-bold text-[0.9rem] text-ink-900 shadow-none">
									<SelectValue />
								</SelectTrigger>
								<SelectContent
									position="popper"
									sideOffset={6}
									align="start"
									className="rounded-lg"
								>
									<SelectItem value="featured">Featured</SelectItem>
									<SelectItem value="rating">Highest rated</SelectItem>
									<SelectItem value="newest">Newest</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<button
							onClick={() => setShowFilters((s) => !s)}
							className={cn(
								"shrink-0 inline-flex items-center gap-2 border-2 rounded-full px-4 py-[5px] cursor-pointer font-display font-bold text-[0.9rem] transition-colors",
								activeFilterCount > 0 || showFilters
									? "bg-coriander-500 border-coriander-500 text-white"
									: "bg-white border-sand-400 text-ink-700",
							)}
						>
							<SlidersHorizontal size={16} />
							Filters
							{activeFilterCount > 0 && (
								<span className="inline-grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-white/90 text-coriander-600 text-[0.72rem] leading-none">
									{activeFilterCount}
								</span>
							)}
							<CaretDown
								className={cn(
									"transition-transform",
									showFilters && "rotate-180",
								)}
								size={14}
							/>
						</button>
					</div>

					{showFilters && (
						<div className="mt-2.5">
							{/* Mobile only: Near me + Open now + Rating live in the panel
							    (desktop keeps them in the bar above). */}
							<div className="md:hidden flex flex-wrap items-center gap-2 pb-3 mb-3 border-b border-paper-300">
								<Button
									size="sm"
									onClick={nearMe}
									iconLeft={
										<NavigationArrow weight="fill" size={16} />
									}
									className="shrink-0"
								>
									Near me
								</Button>
								<button
									onClick={() => setOpenOnly((o) => !o)}
									className={cn(
										"inline-flex items-center gap-2 border-2 rounded-full px-4 py-[5px] cursor-pointer font-display font-bold text-[0.9rem] transition-colors",
										openOnly
											? "bg-coriander-500 border-coriander-500 text-white"
											: "bg-white border-sand-400 text-ink-700",
									)}
								>
									<Clock weight="fill" size={16} />
									Open now
								</button>
								<label className="flex items-center gap-2">
									<span className="font-display font-bold text-ink-700 text-[0.9rem]">
										Rating
									</span>
									<Seg
										value={minRating}
										onChange={setMinRating}
										options={[
											[0, "Any"],
											[4, "★ 4.0+"],
											[4.5, "★ 4.5+"],
										]}
									/>
								</label>
							</div>

							<div className="flex flex-wrap gap-2 items-center">
								{FLAG_OPTIONS.map(([token, label]) => (
									<button
										key={token}
										onClick={() => toggleFlag(token)}
										className={cn(
											"border-2 rounded-full px-3.5 py-1 cursor-pointer font-display font-bold text-[0.85rem] transition-colors",
											flags.includes(token)
												? "bg-coriander-500 border-coriander-500 text-white"
												: "bg-white border-sand-400 text-ink-700 hover:bg-paper-100",
										)}
									>
										{label}
									</button>
								))}
								{activeFilterCount > 0 && (
									<button
										onClick={clearAllFilters}
										className="px-2 font-display font-bold text-[0.85rem] text-chili-600 cursor-pointer hover:underline"
									>
										Clear all
									</button>
								)}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* body */}
			<div className="flex-1 min-h-0 relative flex">
				<div
					ref={listRef}
					className={cn(
						"w-full md:w-[540px] md:flex-none overflow-y-auto p-4 bg-paper-50 md:border-r md:border-paper-300",
						viewMode === "map" ? "hidden md:block" : "block",
					)}
				>
					<div className="flex items-center justify-between px-0.5 pb-3">
						<span className="font-display font-bold text-ink-700">
							{isFocusView
								? areaLabel
								: !hasLoaded
									? "Finding spots…"
									: `${total} ${total === 1 ? "spot" : "spots"} ${areaScoped ? "in the map area" : areaLabel}`}
						</span>
						{loading && (
							<CircleNotch
								className="animate-spin text-chili-500"
								size={18}
							/>
						)}
					</div>

					{shown.length === 0 && !hasLoaded ? (
						<div className="text-center py-12 text-ink-500">
							<CircleNotch
								size={28}
								className="mx-auto mb-2 animate-spin text-chili-500"
							/>
							Finding spots in view…
						</div>
					) : shown.length === 0 ? (
						<div className="text-center py-12 text-ink-500">
							<CookingPot
								size={36}
								className="mx-auto mb-2"
							/>
							<p>
								No spots in this area. Open the map to find
								some nearby.
							</p>
							<button
								onClick={() => setViewMode("map")}
								className="md:hidden mt-4 inline-flex items-center gap-2 bg-chili-500 text-white rounded-full px-6 py-3 cursor-pointer font-display font-bold shadow-lg"
							>
								<MapTrifold size={20} />
								Open map
							</button>
						</div>
					) : (
						<div className="grid grid-cols-1 gap-3">
							{shown.map((r, i) => (
								<Fragment key={r.id}>
									{isFocusView && i === 1 && (
										<h2 className="font-display font-bold text-ink-700 pt-2 pb-0.5">
											You may also like
										</h2>
									)}
									<div id={`row-${r.id}`}>
										<PlaceCard
											r={r}
											variant="row"
											hovered={hovered === r.id}
											selected={selected === r.id}
											onHover={setHovered}
											fallbackOrigin={distOrigin}
											onViewMap={() => viewOnMap(r)}
										/>
									</div>
								</Fragment>
							))}
						</div>
					)}

					{items.length < total && !openOnly && (
						<div className="pt-4 text-center">
							<Button
								variant="outline"
								onClick={() => run(false)}
								disabled={loadingMore}
							>
								{loadingMore
									? "Loading…"
									: `Load more (${total - items.length} left)`}
							</Button>
						</div>
					)}
				</div>

				<div
					className={cn(
						"flex-1 relative min-w-0",
						viewMode === "list" ? "hidden md:block" : "block",
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
						active={viewMode === "map"}
					/>
				</div>

				{/* Hide the floating toggle while the list is empty — the empty
				    state shows its own "Open map" button right under the copy. */}
				<div
					className={cn(
						"absolute bottom-6 left-1/2 -translate-x-1/2 z-[1100] md:hidden",
						viewMode === "list" && hasLoaded && shown.length === 0 && "hidden",
					)}
				>
					<button
						onClick={() =>
							setViewMode(viewMode === "map" ? "list" : "map")
						}
						className="inline-flex items-center gap-2 bg-chili-500 text-white rounded-full px-6 py-3.5 cursor-pointer font-display font-bold text-[1.02rem] shadow-lg"
					>
						{viewMode === "map" ? (
							<Rows size={20} />
						) : (
							<MapTrifold size={20} />
						)}
						{viewMode === "map" ? "List" : "Map"}
					</button>
				</div>
			</div>
		</div>
	);
}
