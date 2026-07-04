"use client";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
	NavigationArrow,
	Clock,
	CaretDown,
	Rows,
	MapTrifold,
	CookingPot,
	CircleNotch,
	SlidersHorizontal,
	X,
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
import { ExploreListCard } from "@/components/explore/ExploreListCard";
import type { Restaurant, ExploreSpot, Bbox, DishSearchResult } from "@/lib/types";
import { isOpenNow, tagLabel, haversineKm, formatDistance } from "@/lib/format";
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

const PAGE_SIZE = 30;

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
					aria-pressed={value === val}
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

// Client-side equivalents of the old SQL ORDER BY clauses. `featured` also
// floats spots with a card image (logo or photo) above photoless ones; the
// explicit Rating sort stays pure so a top pick isn't buried for lacking a
// photo. `nearest` needs the distance origin, so it's built in the component.
const hasImage = (s: ExploreSpot) => !!(s.logoKey || s.primaryPhoto);
const desc = (a: number | null, b: number | null) => (b ?? -1) - (a ?? -1);
const SORTS: Record<string, (a: ExploreSpot, b: ExploreSpot) => number> = {
	featured: (a, b) =>
		Number(hasImage(b)) - Number(hasImage(a)) ||
		(a.featuredRank ?? Infinity) - (b.featuredRank ?? Infinity) ||
		desc(a.reviewCount, b.reviewCount) ||
		desc(a.rating, b.rating),
	rating: (a, b) => desc(a.rating, b.rating) || desc(a.reviewCount, b.reviewCount),
};

export function ExploreClient({
	fixed,
	dish,
	dishProtein,
	initialItems,
	initialCenter,
	initialZoom,
	areaLabel,
	focusId,
	initialUserLoc,
	defaultUserLoc,
	autoLocate = false,
	viewKey,
	cameraKey,
	initialQuery = "",
}: {
	fixed: { tag?: string; state?: string; suburb?: string; venue?: string };
	// dish search (menu-level): the picked dish/style/preparation tag slug, plus
	// an optional protein facet pre-applied by a compound pick ("Paneer Momo").
	dish?: string;
	dishProtein?: string;
	// SSR seed: just the focused restaurant (when any) so a ?focus= landing paints
	// its result instantly; everything else renders from the spots payload.
	initialItems: Restaurant[];
	initialCenter: [number, number];
	initialZoom: number;
	areaLabel: string;
	focusId?: number;
	initialUserLoc?: [number, number];
	defaultUserLoc: [number, number];
	autoLocate?: boolean;
	// viewKey = signature of the server-resolved view; changes on a soft navigation
	// so the client can resync the box/chips. cameraKey is its LOCATION part:
	// only when THAT changes does the camera re-apply, so a dish-only search
	// filters in place instead of recentring the map.
	viewKey: string;
	cameraKey: string;
	// initialQuery = what the search box shows (suburb, state / focused name)
	initialQuery?: string;
}) {
	const router = useRouter();
	// THE data: every visible spot, fetched once (CDN-cached). All filtering,
	// sorting and pagination happen in memory — map pans never refetch.
	const [spots, setSpots] = useState<ExploreSpot[] | null>(null);
	// Bumped by the Retry button; re-runs the fetch. `spotsError` shows a retry
	// state instead of an eternal "Finding spots…" spinner when the fetch fails.
	const [spotsError, setSpotsError] = useState(false);
	const [reloadSpots, setReloadSpots] = useState(0);

	useEffect(() => {
		const ctrl = new AbortController();
		setSpotsError(false);
		fetch("/api/explore/spots", { signal: ctrl.signal })
			.then((r) => {
				if (!r.ok) throw new Error(`spots ${r.status}`);
				return r.json();
			})
			.then((d: { spots?: ExploreSpot[] }) => setSpots(d.spots ?? []))
			.catch((e) => {
				if (e.name === "AbortError") return;
				console.error(e);
				setSpotsError(true);
			});
		return () => ctrl.abort();
	}, [reloadSpots]);

	// Dish search matches: per-restaurant menu items tagged with the picked dish
	// (viewport-independent, CDN-cached per dish). An unknown slug resolves to an
	// empty result so the coarse restaurants.tags tier below still works.
	const [dishData, setDishData] = useState<DishSearchResult | null>(null);
	// One selection per facet kind: a momo preparation and/or a protein (dish
	// search), or a member dish (style search, e.g. Newari -> Choila).
	const [prepSel, setPrepSel] = useState<string | null>(null);
	const [proteinSel, setProteinSel] = useState<string | null>(
		dishProtein ?? null,
	);
	const [dishRefineSel, setDishRefineSel] = useState<string | null>(null);

	// "No {dish} nearby, showing the closest" banner (auto-resolve on untouched
	// maps); cleared when the user takes the map over or the dish changes.
	const [autoBanner, setAutoBanner] = useState<ExploreSpot | null>(null);
	const autoResolvedRef = useRef<string | null>(null);

	useEffect(() => {
		setDishData(null);
		setAutoBanner(null);
		autoResolvedRef.current = null;
		if (!dish) return;
		const ctrl = new AbortController();
		fetch(`/api/explore/dishes?tag=${encodeURIComponent(dish)}`, {
			signal: ctrl.signal,
		})
			.then((r) => (r.ok ? r.json() : null))
			.then((d: DishSearchResult | null) =>
				setDishData(
					d ?? { slug: dish, name: tagLabel(dish), facets: [], restaurants: [] },
				),
			)
			.catch((e) => {
				if (e.name !== "AbortError") console.error(e);
			});
		return () => ctrl.abort();
	}, [dish]);

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
	// the map's live viewport — the sole geographic filter for the list.
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

	const listRef = useRef<HTMLDivElement>(null);
	// the view this client last applied; starts at the mount value so the resync
	// effect is a no-op on first render and only fires on later soft navigations.
	const appliedViewKey = useRef(viewKey);
	const appliedCameraKey = useRef(cameraKey);

	// map bounds change (moveEND) → refilter the in-memory list (no fetch, no
	// debounce).
	const onBounds = useCallback((b: Bbox, userMoved: boolean) => {
		setViewBbox(b);
		// any real pan/zoom away from the seeded view (suburb/state, a lat/lng
		// search, "Near me", or the default camera) → switch to map-area mode.
		// Clear the box (don't show "Map area" as text); the "in the map area"
		// context lives in the list heading below. Taking the map over also
		// retires the "showing the closest" banner — the user is driving now.
		if (userMoved) {
			enterAreaMode("");
			setAutoBanner(null);
		}
	}, []);

	// Pagination window, keyed to the current filter/viewport signature so any
	// change resets it to one page (mirrors the old fetch-per-move behaviour)
	// without a reset effect. "Load more" grows the count under the same key.
	const pageKey = JSON.stringify([sort, flags, minRating, openOnly, areaScoped, viewBbox, dish, prepSel, proteinSel, dishRefineSel]);
	const [page, setPage] = useState({ key: pageKey, count: PAGE_SIZE });
	const shownCount = page.key === pageKey ? page.count : PAGE_SIZE;
	const showMore = () =>
		setPage({ key: pageKey, count: shownCount + PAGE_SIZE });

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
	// new view: recentre (MapView flyTo → onBounds refilter), re-seed the geo scope so
	// the new suburb/state filter applies, and resync the search box.
	useEffect(() => {
		if (appliedViewKey.current === viewKey) return;
		appliedViewKey.current = viewKey;
		// the camera (and the seeded geo scope) re-apply ONLY when the location
		// part changed — a dish-only search keeps the map where the user put it.
		if (appliedCameraKey.current !== cameraKey) {
			appliedCameraKey.current = cameraKey;
			setCenter(initialCenter);
			setZoom(initialZoom);
			areaScopedRef.current = false;
			setAreaScoped(false);
		}
		setSelected(focusId ?? null);
		setBoxValue(initialQuery);
		setBoxKey((k) => k + 1);
		// a new dish (or none) resets the facet chips to the URL's protein
		setPrepSel(null);
		setProteinSel(dishProtein ?? null);
		setDishRefineSel(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [viewKey]);

	const onSelect = useCallback((id: number | null) => {
		setSelected(id);
		if (id == null) return; // deselect -> shrink the pin back
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
	const viewOnMap = (r: { id: number; lat: number | null; lng: number | null }) => {
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

	// ---- the in-memory pipeline: scope -> filter -> sort -> paginate ---------

	// Dish mode: restaurantId -> matched item names (the card pills), narrowed by
	// the selected preparation/protein chips. Items are the verified tier.
	const dishItems = useMemo(() => {
		if (!dish || !dishData) return null;
		const m = new Map<number, string[]>();
		for (const r of dishData.restaurants) {
			const names = r.items
				.filter(
					(it) =>
						(!prepSel || it.slugs.includes(prepSel)) &&
						(!proteinSel || it.slugs.includes(proteinSel)) &&
						(!dishRefineSel || it.slugs.includes(dishRefineSel)),
				)
				.map((it) => it.name);
			if (names.length) m.set(r.id, [...new Set(names)]);
		}
		return m;
	}, [dish, dishData, prepSel, proteinSel, dishRefineSel]);

	// Attribute/quality filters + the URL-seeded scope. tag/venue always apply;
	// suburb/state are seed-only and drop once the visitor takes over the map.
	// Dish mode is two-tier: menu-verified matches (with pills) plus, when no
	// facet chip narrows it, spots whose coarse tag rollup carries the dish
	// ("known for momo" but menu not seeded yet — no pills). A prep/protein chip
	// needs item-level truth, so the coarse tier drops out while one is active.
	const matches = useMemo(() => {
		if (!spots) return [];
		const suburb = fixed.suburb?.toLowerCase();
		return spots.filter(
			(s) =>
				(!dish ||
					dishItems?.has(s.id) ||
					(!prepSel && !proteinSel && !dishRefineSel && s.tags.includes(dish))) &&
				(!fixed.tag || s.tags.includes(fixed.tag)) &&
				(!fixed.venue || s.venueType === fixed.venue) &&
				(areaScoped ||
					((!fixed.state || s.state === fixed.state) &&
						(!suburb || s.suburb?.toLowerCase() === suburb))) &&
				flags.every((f) => s.flags.includes(f)) &&
				(!minRating || (s.rating ?? 0) >= minRating) &&
				(!openOnly || isOpenNow(s.openingHours, s.state) !== false),
		);
	}, [spots, dish, dishItems, prepSel, proteinSel, dishRefineSel, fixed.tag, fixed.venue, fixed.state, fixed.suburb, flags, minRating, openOnly, areaScoped]);

	// only list spots whose pin is in the current viewport (matches what's on the map)
	const inView = useMemo(() => {
		if (!viewBbox) return matches;
		return matches.filter(
			(s) =>
				s.lng >= viewBbox.w &&
				s.lng <= viewBbox.e &&
				s.lat >= viewBbox.s &&
				s.lat <= viewBbox.n,
		);
	}, [matches, viewBbox]);

	const sorted = useMemo(() => {
		// "nearest" sorts by distance from the visitor's location (shared, else
		// the state capital) — the same origin the card distance labels use.
		const cmp =
			sort === "nearest"
				? (a: ExploreSpot, b: ExploreSpot) =>
						haversineKm(distOrigin, a.lat, a.lng) -
						haversineKm(distOrigin, b.lat, b.lng)
				: (SORTS[sort] ?? SORTS.featured);
		// dish mode: menu-verified spots (they get pills) rank above coarse-tag
		// matches, then the chosen sort applies within each tier.
		const tier = (s: ExploreSpot) => (dishItems?.has(s.id) ? 0 : 1);
		return [...inView].sort((a, b) =>
			dish ? tier(a) - tier(b) || cmp(a, b) : cmp(a, b),
		);
	}, [inView, sort, dish, dishItems, distOrigin]);

	// keep the searched (focused) restaurant pinned to the top
	const ordered = useMemo(() => {
		if (focusId == null) return sorted;
		const focus = sorted.filter((s) => s.id === focusId);
		return focus.length
			? [...focus, ...sorted.filter((s) => s.id !== focusId)]
			: sorted;
	}, [sorted, focusId]);

	// Ready = the payload landed AND the map reported its real viewport (and, in
	// dish mode, the dish matches too), so the list never flashes a wrong set.
	const ready =
		spots !== null && viewBbox !== null && (!dish || dishData !== null);
	const total = ordered.length;
	const dishName = dish ? (dishData?.name ?? tagLabel(dish)) : null;
	const clearDish = () => router.push("/explore");

	// Dish mode, nothing in view: the closest match measured from what the user
	// is looking at (the viewport centre). Powers the auto-resolve banner and
	// the "Take me there" empty state.
	const nearest = useMemo(() => {
		if (!dish || !viewBbox || inView.length > 0 || matches.length === 0)
			return null;
		const centre: [number, number] = [
			(viewBbox.s + viewBbox.n) / 2,
			(viewBbox.w + viewBbox.e) / 2,
		];
		let best: ExploreSpot | null = null;
		let bestKm = Infinity;
		for (const s of matches) {
			const km = haversineKm(centre, s.lat, s.lng);
			if (km < bestKm) {
				bestKm = km;
				best = s;
			}
		}
		return best ? { spot: best, km: bestKm } : null;
	}, [dish, viewBbox, inView.length, matches]);

	// Auto-resolve, once per dish, ONLY while the map is untouched: a fresh dish
	// landing with zero local matches flies to the closest spot and explains
	// itself with a banner. Once the user pans (areaScoped) the map is theirs and
	// the empty state's "Take me there" button takes over.
	useEffect(() => {
		if (!dish || !ready || areaScoped) return;
		if (autoResolvedRef.current === dish) return;
		if (inView.length > 0) {
			autoResolvedRef.current = dish; // local matches exist; never auto-move
			return;
		}
		if (!nearest) return;
		autoResolvedRef.current = dish;
		setAutoBanner(nearest.spot);
		setCenter([nearest.spot.lat, nearest.spot.lng]);
		setZoom(13);
	}, [dish, ready, areaScoped, inView.length, nearest]);
	// Until then, the SSR-seeded focused restaurant is the list.
	const shown: (ExploreSpot | Restaurant)[] = ready
		? ordered.slice(0, shownCount)
		: initialItems;
	// focus view = the searched restaurant sits at the top (shown as the result).
	// "You may also like" only renders when the viewport adds more (length > 1).
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

	// ---- list pieces (heading, banner, body). Plain render helpers, not
	// components — no hooks inside.
	const headingRow = (
		<div className="flex items-center justify-between px-0.5 pb-3">
			<span className="font-display font-bold text-ink-700">
				{spotsError
					? "Couldn't load spots"
					: isFocusView
						? areaLabel
						: !ready
							? "Finding spots…"
							: `${total} ${total === 1 ? "spot" : "spots"}${dishName ? ` serving ${dishName}` : ""} ${areaScoped ? "in the map area" : areaLabel}`}
			</span>
			{spotsError ? (
				<button
					type="button"
					onClick={() => setReloadSpots((n) => n + 1)}
					className="shrink-0 font-display font-bold text-[0.85rem] text-chili-600 hover:underline cursor-pointer"
				>
					Retry
				</button>
			) : (
				!ready && (
					<CircleNotch
						className="animate-spin text-chili-500"
						size={18}
					/>
				)
			)}
		</div>
	);

	const listBanner = autoBanner ? (
		<div className="mb-3 flex items-start gap-2.5 rounded-lg bg-marigold-100 px-3.5 py-2.5 text-[0.95rem] text-ink-700">
			<CookingPot
				weight="fill"
				size={18}
				className="text-marigold-700 shrink-0 mt-0.5"
			/>
			<span className="min-w-0">
				No {dishName} spots near you. Showing the closest:{" "}
				<strong className="text-ink-900">{autoBanner.name}</strong>
				{autoBanner.suburb
					? ` in ${autoBanner.suburb}${autoBanner.state ? `, ${autoBanner.state}` : ""}`
					: ""}
				.
			</span>
			<button
				type="button"
				aria-label="Dismiss"
				onClick={() => setAutoBanner(null)}
				className="ml-auto shrink-0 text-ink-500 hover:text-ink-900 cursor-pointer"
			>
				<X size={15} weight="bold" />
			</button>
		</div>
	) : null;

	const listBody = (
		<>
			{shown.length === 0 && spotsError ? (
				<div className="text-center py-12 text-ink-500">
					<CookingPot size={36} className="mx-auto mb-2" />
					<p>Couldn&apos;t load spots. Check your connection.</p>
					<button
						onClick={() => setReloadSpots((n) => n + 1)}
						className="mt-4 inline-flex items-center gap-2 bg-chili-500 text-white rounded-full px-6 py-3 cursor-pointer font-display font-bold shadow-lg"
					>
						Retry
					</button>
				</div>
			) : shown.length === 0 && !ready ? (
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
					{dish && nearest ? (
						<>
							<p>
								No {dishName} spots in this area. The closest
								is{" "}
								<strong className="text-ink-700">
									{nearest.spot.name}
								</strong>
								{nearest.spot.suburb
									? ` in ${nearest.spot.suburb}${nearest.spot.state ? `, ${nearest.spot.state}` : ""}`
									: ""}
								, {formatDistance(nearest.km)} away.
							</p>
							<button
								onClick={() => viewOnMap(nearest.spot)}
								className="mt-4 inline-flex items-center gap-2 bg-chili-500 text-white rounded-full px-6 py-3 cursor-pointer font-display font-bold shadow-lg"
							>
								<NavigationArrow weight="fill" size={18} />
								Take me there
							</button>
						</>
					) : dish ? (
						<p>
							No spots serving {dishName} yet. Try another dish
							or clear the search.
						</p>
					) : (
						<>
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
						</>
					)}
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
								{/* Mobile: compact card (whole card links to detail;
								    "View on map" jumps to the map). Desktop side panel:
								    the bigger PlaceCard row. */}
								<div className="md:hidden">
									<ExploreListCard
										r={r}
										pills={dishItems?.get(r.id)}
										fallbackOrigin={distOrigin}
										onViewMap={() => viewOnMap(r)}
									/>
								</div>
								<div className="hidden md:block">
									<PlaceCard
										r={r}
										variant="row"
										hovered={hovered === r.id}
										selected={selected === r.id}
										onHover={setHovered}
										fallbackOrigin={distOrigin}
										onViewMap={() => viewOnMap(r)}
										pills={dishItems?.get(r.id)}
									/>
								</div>
							</div>
						</Fragment>
					))}
				</div>
			)}

			{ready && shownCount < total && (
				<div className="pt-4 text-center">
					<Button variant="outline" onClick={showMore}>
						{`Load more (${total - shownCount} left)`}
					</Button>
				</div>
			)}
		</>
	);

	// Dish refine chips: the searched dish (x clears) + preparation/protein
	// facets. Rendered in the top bar (desktop) and the sheet header (mobile).
	const dishBar = (
		<div className="flex items-center gap-2 flex-nowrap overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
			<button
				onClick={clearDish}
				title="Clear dish search"
				className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-chili-500 border-2 border-chili-500 text-white px-3.5 py-[5px] cursor-pointer font-display font-bold text-[0.9rem]"
			>
				<CookingPot weight="fill" size={15} />
				{dishName}
				<X size={13} weight="bold" />
			</button>
			{(dishData?.facets ?? []).map((f) => {
				const active =
					f.kind === "preparation"
						? prepSel === f.slug
						: f.kind === "dish"
							? dishRefineSel === f.slug
							: proteinSel === f.slug;
				const toggle = () =>
					f.kind === "preparation"
						? setPrepSel(active ? null : f.slug)
						: f.kind === "dish"
							? setDishRefineSel(active ? null : f.slug)
							: setProteinSel(active ? null : f.slug);
				return (
					<button
						key={f.slug}
						onClick={toggle}
						aria-pressed={active}
						className={cn(
							"shrink-0 border-2 rounded-full px-3.5 py-[5px] cursor-pointer font-display font-bold text-[0.85rem] transition-colors",
							active
								? "bg-coriander-500 border-coriander-500 text-white"
								: "bg-white border-sand-400 text-ink-700 hover:bg-paper-100",
						)}
					>
						{f.name}
					</button>
				);
			})}
		</div>
	);

	// Attribute-flag chips + Clear all (the expanded "Filters" panel), shared by
	// the top bar (desktop) and the sheet header (mobile).
	const flagsWrap = (
		<div className="flex flex-wrap gap-2 items-center">
			{FLAG_OPTIONS.map(([token, label]) => (
				<button
					key={token}
					onClick={() => toggleFlag(token)}
					aria-pressed={flags.includes(token)}
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
	);

	return (
		<div className="flex flex-col h-[calc(100dvh-57px)]">
			{/* top bar: search band + the filter/sort controls above the map. */}
			<div className="relative z-[1200] px-4 sm:px-6 py-3 border-b border-paper-300 bg-paper-100">
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
				    behind the Filters toggle. Everything filters in memory, instantly. */}
				<div className="mt-3">
					{/* Mobile: one horizontally-scrollable row (bleeds to the screen
					    edges) so the controls stay on a single thumb-swipeable line
					    instead of eating two rows above the map. Desktop: plain wrap. */}
					<div className="flex items-center gap-2.5 flex-nowrap overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:gap-x-4 md:gap-y-2 md:overflow-visible">
						<button
							onClick={() => setOpenOnly((o) => !o)}
							aria-pressed={openOnly}
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
									<SelectItem value="nearest">Nearest</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<button
							onClick={() => setShowFilters((s) => !s)}
							aria-pressed={showFilters}
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

					{/* Dish refine bar (see dishBar above): one pick per kind. */}
					{dish && <div className="mt-2.5">{dishBar}</div>}

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
									aria-pressed={openOnly}
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

							{flagsWrap}
						</div>
					)}
				</div>
			</div>

			{/* body */}
			<div className="flex-1 min-h-0 relative flex">
				{/* list panel: the desktop side panel (always), and the mobile
				    list when the toggle is on List. */}
				<div
					ref={listRef}
					className={cn(
						"w-full md:w-[540px] md:flex-none overflow-y-auto p-4 bg-paper-50 md:border-r md:border-paper-300",
						viewMode === "map" ? "hidden md:block" : "block",
					)}
				>
					{listBanner}
					{headingRow}
					{listBody}
				</div>

				<div
					className={cn(
						"flex-1 relative min-w-0",
						viewMode === "map" ? "block" : "hidden md:block",
					)}
				>
					<MapView
						pins={ready ? matches : []}
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

				{/* Floating List/Map toggle (mobile). Hidden while the list is
				    empty (the empty state has its own button) and while a spot
				    card is open on the map (the docked card owns the bottom). */}
				<div
					className={cn(
						"absolute bottom-6 left-1/2 -translate-x-1/2 z-[1100] md:hidden",
						viewMode === "list" && ready && shown.length === 0 && "hidden",
						viewMode === "map" && selected != null && "hidden",
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
