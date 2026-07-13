"use client";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
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
	GlobeHemisphereWest,
	BowlSteam,
	BowlFood,
	ForkKnife,
	Flame,
	Pepper,
	ArrowsDownUp,
	Check,
	type Icon,
} from "@phosphor-icons/react";
import { Button, pressable } from "@/components/ui/Button";
import { Popover } from "radix-ui";
import { SearchBox } from "@/components/SearchBox";
import { ExploreCard } from "@/components/explore/ExploreCard";
import {
	FilterTrigger,
	FilterPanel,
	MenuRow,
	SingleSelectMenu,
	FilterSheet,
	SheetChip,
	SheetSection,
	SheetShowButton,
	SheetTextButton,
} from "@/components/explore/FilterControls";
import type {
	Restaurant,
	ExploreSpot,
	Bbox,
	DishSearchResult,
	DishFacet,
	DishPill,
} from "@/lib/types";
import { isOpenNow, tagLabel, haversineKm, formatDistance } from "@/lib/format";
import { withDish, withoutDish, type ExploreParams } from "@/lib/explore-url";
import { EXPLORE_CATEGORIES, FACET_KIND_ORDER } from "@/lib/menu/categories";
import { cn } from "@/lib/cn";
import { Z } from "@/lib/z";

// Our-food category chips on the primary bar: one-tap entry points into the
// dish search (identical to picking the tag in the SearchBox). Clicking one
// lists the dishes we actually matched inside it via the facet dropdowns
// (Newari -> choila, bara, chatamari…; Momo -> its preparations). The list
// itself is shared with the facet catalog: lib/menu/categories.ts.
const CATEGORY_CHIPS = EXPLORE_CATEGORIES;

// One icon per cuisine for the Category dropdown rows (desktop).
const CUISINE_ICON: Record<string, Icon> = {
	momo: BowlSteam,
	newari: ForkKnife,
	sekuwa: Flame,
	tibetan: BowlFood,
	thakali: CookingPot,
	"nepali-indian": Pepper,
};

// Attribute flags for the Features dropdown, grouped. Tokens must match the
// flags emitted by exploreSpots() in lib/queries.ts ("menu" + the FLAG_COLS
// keys); labels are AU-facing. Every flag appears in exactly one group.
const FLAG_GROUPS: { label: string; items: [string, string][] }[] = [
	{
		label: "Service",
		items: [
			["menu", "Menu on here"],
			["takeout", "Takeaway"],
			["delivery", "Delivery"],
			["dinein", "Dine-in"],
		],
	},
	{
		label: "Good to know",
		items: [
			["veg", "Vegetarian"],
			["alcohol", "Licensed"],
			["cocktails", "Cocktails"],
			["outdoor", "Outdoor seating"],
			["kid", "Kid-friendly"],
			["groups", "Good for groups"],
			["reservable", "Takes bookings"],
			["music", "Live music"],
		],
	},
	{
		label: "Access",
		items: [
			["dogs", "Dog-friendly"],
			["wheelchair", "Wheelchair access"],
		],
	},
];

// Dish-refine dropdowns: one per facet kind present, labelled here; the kind
// ORDER is the shared FACET_KIND_ORDER (lib/menu/categories, same source the
// SQL facet sort uses).
const FACET_KIND_LABEL: Record<DishFacet["kind"], string> = {
	preparation: "Dish type",
	dish: "Dish",
	protein: "Protein",
	diet: "Dietary",
};

const SORT_ENTRIES: [string, string][] = [
	["popular", "Popular"],
	["rating", "Highest rated"],
	["nearest", "Nearest"],
];
const SORT_LABELS: Record<string, string> = Object.fromEntries(SORT_ENTRIES);

// Shown when a dietary facet (vegan, gluten-free) is selected: those tags come
// from menu wording only, and for a coeliac or strict vegan that isn't enough.
// One string, rendered in the desktop bar AND the mobile dish sheet.
const DIETARY_NOTE =
	"Tagged from each restaurant's own menu. Menus change, so check with the venue before you order.";

const PAGE_SIZE = 30;

const MapView = dynamic(() => import("./MapView"), {
	ssr: false,
	loading: () => (
		<div className="absolute inset-0 grid place-items-center bg-paper-100 text-ink-500">
			Loading map…
		</div>
	),
});

// Client-side equivalents of the old SQL ORDER BY clauses. `popular` leads
// with the hand-set popular flag, then floats spots with a card image (logo
// or photo) above photoless ones; the explicit Rating sort stays pure so a
// top pick isn't buried for lacking a photo. `nearest` needs the distance
// origin, so it's built in the component.
const hasImage = (s: ExploreSpot) => !!(s.logoKey || s.primaryPhoto);
const desc = (a: number | null, b: number | null) => (b ?? -1) - (a ?? -1);
const SORTS: Record<string, (a: ExploreSpot, b: ExploreSpot) => number> = {
	popular: (a, b) =>
		Number(b.popular) - Number(a.popular) ||
		Number(hasImage(b)) - Number(hasImage(a)) ||
		desc(a.reviewCount, b.reviewCount) ||
		desc(a.rating, b.rating),
	rating: (a, b) => desc(a.rating, b.rating) || desc(a.reviewCount, b.reviewCount),
};

export function ExploreClient({
	fixed,
	dish,
	dishProtein,
	dishDiet,
	dishFacet,
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
}: {
	fixed: { tag?: string; state?: string; suburb?: string; venue?: string };
	// dish search (menu-level): the cuisine-normalized dish/style tag slug, plus
	// an optional protein facet pre-applied by a compound pick ("Paneer Momo").
	dish?: string;
	dishProtein?: string;
	// diet facet from ?diet= (vegan, gluten-free), same URL contract as protein
	dishDiet?: string;
	// A facet pre-selected by normalizing a leaf-tag search server-side: a momo
	// preparation ("steamed momo" → dish momo + preparation steamed-momo) or a
	// styled member dish ("choila" → dish newari + dish choila). See page.tsx.
	dishFacet?: { kind: DishFacet["kind"]; slug: string };
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
}) {
	const router = useRouter();
	// Current URL params, so every filter change MERGES (keeps the other
	// dimension) instead of replacing the whole query — a dish pick keeps the
	// location, a location pick keeps the dish. See lib/explore-url.
	const searchParams = useSearchParams();
	const currentParams: ExploreParams = useMemo(
		() => Object.fromEntries(searchParams.entries()),
		[searchParams],
	);
	// THE data: every visible spot, fetched once (CDN-cached). All filtering,
	// sorting and pagination happen in memory — map pans never refetch.
	const [spots, setSpots] = useState<ExploreSpot[] | null>(null);
	// Bumped by the Retry button; re-runs the fetch. `spotsError` shows a retry
	// state instead of an eternal "Finding spots…" spinner when the fetch fails.
	const [spotsError, setSpotsError] = useState(false);
	const [reloadSpots, setReloadSpots] = useState(0);

	useEffect(() => {
		// Stale flag, NOT AbortController: aborting saves nothing (tiny CDN-cached
		// payload) and the AbortError trips Next's dev unhandled-rejection
		// forwarding on every strict-mode remount / Fast Refresh even though our
		// own chain catches it. Letting it settle and ignoring is quieter.
		let stale = false;
		setSpotsError(false);
		fetch("/api/explore/spots")
			.then((r) => {
				if (!r.ok) throw new Error(`spots ${r.status}`);
				return r.json();
			})
			.then((d: { spots?: ExploreSpot[] }) => {
				if (!stale) setSpots(d.spots ?? []);
			})
			.catch((e) => {
				if (stale) return;
				console.error(e);
				setSpotsError(true);
			});
		return () => {
			stale = true;
		};
	}, [reloadSpots]);

	// The filter catalog: every Category cuisine → its served dish-type / protein
	// facets. Fetched ONCE (location-independent, hard-cached) so the refine chips
	// render instantly from here instead of waiting on the per-dish fetch — no
	// flicker. Falls back to dishData.facets for non-catalog dishes (search box).
	const [catalog, setCatalog] = useState<Record<string, DishFacet[]> | null>(
		null,
	);
	useEffect(() => {
		let stale = false;
		fetch("/api/explore/facets")
			.then((r) => (r.ok ? r.json() : null))
			.then((d: { catalog?: Record<string, DishFacet[]> } | null) => {
				if (!stale && d?.catalog) setCatalog(d.catalog);
			})
			.catch(() => {});
		return () => {
			stale = true;
		};
	}, []);

	// Dish search matches: per-restaurant menu items tagged with the picked dish
	// (viewport-independent, CDN-cached per dish). An unknown slug resolves to an
	// empty result so the coarse restaurants.tags tier below still works.
	const [dishData, setDishData] = useState<DishSearchResult | null>(null);
	// One selection per facet kind, keyed by kind: a momo preparation and/or a
	// protein and/or a diet tag (dish search), or a member dish (style search,
	// e.g. Newari -> Choila). Separate slots per kind mean Chicken + Gluten Free
	// combine. DERIVED from the URL, never state: every facet pick navigates
	// (see setFacet below), so selections survive location changes, are
	// shareable, and the back button undoes them. The dish/preparation slot
	// arrives via the ?dish= leaf slug (normalizeDishTag splits it into the
	// bucket + this facet server-side); protein/diet have their own params.
	const facetSel = useMemo<Partial<Record<DishFacet["kind"], string | null>>>(
		() => ({
			protein: dishProtein ?? null,
			diet: dishDiet ?? null,
			...(dishFacet ? { [dishFacet.kind]: dishFacet.slug } : {}),
		}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[dishProtein, dishDiet, dishFacet?.kind, dishFacet?.slug],
	);
	const selectedFacets = useMemo(
		() => Object.values(facetSel).filter((v): v is string => !!v),
		[facetSel],
	);

	// "No {dish} nearby, showing the closest" banner (auto-resolve on untouched
	// maps); cleared when the user takes the map over or the dish changes.
	const [autoBanner, setAutoBanner] = useState<ExploreSpot | null>(null);
	const autoResolvedRef = useRef<string | null>(null);

	useEffect(() => {
		setDishData(null);
		setAutoBanner(null);
		autoResolvedRef.current = null;
		if (!dish) return;
		// stale flag over AbortController: see the spots fetch above
		let stale = false;
		fetch(`/api/explore/dishes?tag=${encodeURIComponent(dish)}`)
			.then((r) => (r.ok ? r.json() : null))
			.then((d: DishSearchResult | null) => {
				if (stale) return;
				setDishData(
					d ?? { slug: dish, name: tagLabel(dish), facets: [], restaurants: [] },
				);
			})
			.catch((e) => {
				if (!stale) console.error(e);
			});
		return () => {
			stale = true;
		};
	}, [dish]);

	// The search box is uncontrolled (SearchBox owns its text) and TRANSIENT: it
	// always starts empty (active location shows on the map + heading, active
	// dish in the filters). Bumping boxKey remounts it, wiping any half-typed
	// text on navigation / map takeover.
	const [boxKey, setBoxKey] = useState(0);
	const [openOnly, setOpenOnly] = useState(false);
	const [sort, setSort] = useState("popular");
	// selected attribute-flag tokens (see FLAG_GROUPS / FLAG_COLS)
	const [flags, setFlags] = useState<string[]>([]);
	// whether the desktop Features dropdown is open
	const [featOpen, setFeatOpen] = useState(false);
	// mobile: which bottom sheet is open, and (for the dish sheet) its stage
	const [sheet, setSheet] = useState<null | "dish" | "features" | "sort">(null);
	const [dishStage, setDishStage] = useState<"category" | "refine">("category");
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
	// Has the visitor physically panned/zoomed? Distinct from areaScoped (which
	// Near me also sets): this is the consent gate for the zero-results zoom-out
	// below — before any gesture the frame is ours to widen, after one it's
	// theirs and the empty state's "Take me there" button asks first.
	const [mapTouched, setMapTouched] = useState(false);
	// One-shot fit request for the zero-results zoom-out, [[swLng,swLat],
	// [neLng,neLat]]: Mapbox computes the zoom against the REAL viewport (a
	// hand-rolled span→zoom table underestimated and cropped both endpoints
	// out of the frame — 2026-07-08 QA).
	const [fitBounds, setFitBounds] = useState<
		[[number, number], [number, number]] | null
	>(null);
	const enterAreaMode = (clearBox = false) => {
		if (!areaScopedRef.current) {
			areaScopedRef.current = true;
			setAreaScoped(true);
		}
		if (clearBox) setBoxKey((k) => k + 1);
	};

	const listRef = useRef<HTMLDivElement>(null);
	// current dish, readable inside async callbacks (geolocation)
	const dishRef = useRef(dish);
	dishRef.current = dish;
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
			setMapTouched(true); // a gesture: the visitor owns the frame now
			enterAreaMode(true);
			setAutoBanner(null);
		}
	}, []);

	// Pagination window, keyed to the current filter/viewport signature so any
	// change resets it to one page (mirrors the old fetch-per-move behaviour)
	// without a reset effect. "Load more" grows the count under the same key.
	const pageKey = JSON.stringify([sort, flags, openOnly, areaScoped, viewBbox, dish, facetSel]);
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
					// In dish mode the results own the camera (a zero-local-match
					// search zoom-out fits visitor + closest; racing a zoom-13
					// recentre against it produced a zoom-in/out/in dance). The
					// dot + distances still come from the location above.
					if (dishRef.current) return;
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
			setMapTouched(false); // a new seeded view = a fresh, untouched frame
			setFitBounds(null);
		}
		setSelected(focusId ?? null);
		setBoxKey((k) => k + 1);
		// facet chips need no reset here: facetSel is DERIVED from the URL props,
		// so it re-syncs on every navigation by construction.
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
			(p) => {
				const lat = p.coords.latitude;
				const lng = p.coords.longitude;
				setUserLoc([lat, lng]);
				setCenter([lat, lng]);
				setZoom(13);
				// Near me only moves the map. It doesn't navigate, so the dish
				// filter (URL-owned) is untouched, and the search box stays empty.
				enterAreaMode(); // relocating: drop any seeded suburb scope, bbox takes over
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

	// Dish mode: restaurantId -> matched item pills (name + price), narrowed by
	// the selected preparation/protein chips. Items are the verified tier. Deduped
	// by label, keeping the first (menu-ordered) occurrence's price.
	const dishItems = useMemo(() => {
		if (!dish || !dishData) return null;
		const m = new Map<number, DishPill[]>();
		for (const r of dishData.restaurants) {
			const seen = new Set<string>();
			const pills: DishPill[] = [];
			for (const it of r.items) {
				if (!selectedFacets.every((s) => it.slugs.includes(s))) continue;
				if (seen.has(it.name)) continue;
				seen.add(it.name);
				pills.push({
					label: it.name,
					price: it.price,
					priceFrom: it.priceFrom,
					variants: it.variants,
				});
			}
			if (pills.length) m.set(r.id, pills);
		}
		return m;
	}, [dish, dishData, selectedFacets]);

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
				// The searched-by-name (focused) restaurant bypasses every filter:
				// picking a place from the search box means "show me this place",
				// so it must never fly the map to a spot with no pin. Only the
				// viewport clip (inView) still applies. Its card explains a dish
				// miss instead (noDishMatch on ExploreCard).
				s.id === focusId ||
				((!dish ||
					dishItems?.has(s.id) ||
					(selectedFacets.length === 0 && s.tags.includes(dish))) &&
				(!fixed.tag || s.tags.includes(fixed.tag)) &&
				(!fixed.venue || s.venueType === fixed.venue) &&
				(areaScoped ||
					((!fixed.state || s.state === fixed.state) &&
						(!suburb || s.suburb?.toLowerCase() === suburb))) &&
				flags.every((f) => s.flags.includes(f)) &&
				(!openOnly || isOpenNow(s.openingHours, s.state) !== false)),
		);
	}, [spots, focusId, dish, dishItems, selectedFacets, fixed.tag, fixed.venue, fixed.state, fixed.suburb, flags, openOnly, areaScoped]);

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
				: (SORTS[sort] ?? SORTS.popular);
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
	// clearing the dish keeps the location (map stays where it is)
	const clearDish = () => router.push(withoutDish(currentParams));
	// picking a dish keeps the location; the map holds and the dish lands in the
	// filters below. (Toggling the active one off = clear.)
	const pickDish = (slug: string) =>
		router.push(
			dish === slug ? withoutDish(currentParams) : withDish(currentParams, { dish: slug }),
		);
	// Facet picks NAVIGATE (facetSel is URL-derived, never client state): the
	// dish/preparation slot rides the ?dish= leaf slug, which the server
	// re-normalizes into bucket + facet (normalizeDishTag); protein/diet ride
	// their own params. withDish preserves the location keys, so refinements
	// survive suburb searches / Near me and the URL is shareable.
	const setFacet = (kind: DishFacet["kind"], slug: string | null) => {
		const next = { ...facetSel, [kind]: slug };
		const leaf = next.dish ?? next.preparation ?? dish;
		router.push(
			withDish(currentParams, {
				dish: leaf ?? undefined,
				protein: next.protein ?? undefined,
				diet: next.diet ?? undefined,
			}),
		);
	};
	// Is the active dish one of the 5 Category cuisines? If so the Category
	// dropdown + facet chips already represent it; if not (curry, biryani, a
	// search-box dish) it shows as its own standalone active-dish chip so EVERY
	// dish is visible in the filter row, never orphaned in the Category trigger.
	const dishIsCategory = !!dish && CATEGORY_CHIPS.some(([slug]) => slug === dish);

	// Facet options for the current dish: prefer the pre-loaded catalog (instant,
	// no flicker) for a Category cuisine, else the per-dish response (search-box
	// dishes not in the catalog). Same DishFacet[] shape either way. (Defined
	// before the list body: the empty states name facets via facetName below.)
	const facetList: DishFacet[] =
		(dish ? catalog?.[dish] : undefined) ?? dishData?.facets ?? [];
	// A facet's display name; falls back to the taxonomy label for a facet that
	// was URL-seeded (normalizeDishTag) but isn't served on any seeded menu yet.
	const facetName = (slug: string) =>
		facetList.find((f) => f.slug === slug)?.name ?? tagLabel(slug);
	// The most specific name for what the dish search is filtering by, for the
	// empty states: a dish/preparation facet REPLACES the bucket name (searching
	// "kachila" must say kachila, not Newari; "Steamed Momo" already carries the
	// dish), and diet/protein picks qualify it ("Vegan Chicken Momo").
	const dishSearchLabel = (() => {
		if (!dish) return null;
		const leaf = facetSel.dish ?? facetSel.preparation;
		const base = leaf ? facetName(leaf) : (dishName ?? tagLabel(dish));
		const quals = [facetSel.diet, facetSel.protein]
			.filter((s): s is string => !!s)
			.map(facetName);
		return [...quals, base].join(" ");
	})();

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

	// Zero local matches, once per dish, ONLY before the visitor's first map
	// gesture: ZOOM OUT so the frame holds both the visitor (their blue dot, or
	// the viewport centre) AND the closest match, and say so in the banner. The
	// camera widens around the user instead of teleporting to the match (the old
	// behaviour) so their context stays on screen. After a gesture the map is
	// theirs: the empty state's "Take me there" button asks first instead.
	useEffect(() => {
		if (!dish || !ready || mapTouched) return;
		if (autoResolvedRef.current === dish) return;
		if (inView.length > 0) {
			autoResolvedRef.current = dish; // local matches exist; never auto-move
			return;
		}
		if (!nearest || !viewBbox) return;
		autoResolvedRef.current = dish;
		setAutoBanner(nearest.spot);
		const anchor: [number, number] = userLoc ?? [
			(viewBbox.s + viewBbox.n) / 2,
			(viewBbox.w + viewBbox.e) / 2,
		];
		const t = nearest.spot;
		setFitBounds([
			[Math.min(anchor[1], t.lng), Math.min(anchor[0], t.lat)],
			[Math.max(anchor[1], t.lng), Math.max(anchor[0], t.lat)],
		]);
		// userLoc/viewBbox are read, not watched: refitting on every pan-less
		// bbox report would fight the camera we just set
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dish, ready, mapTouched, inView.length, nearest]);
	// Until then, the SSR-seeded focused restaurant is the list.
	const shown: (ExploreSpot | Restaurant)[] = ready
		? ordered.slice(0, shownCount)
		: initialItems;
	// focus view = the searched restaurant sits at the top (shown as the result).
	// "You may also like" only renders when the viewport adds more (length > 1).
	const isFocusView = focusId != null && shown[0]?.id === focusId;

	// Count every active filter the "Filters" button stands for. On mobile Open
	// lives inside its panel; on desktop it sits in the bar but still counts as
	// an active filter, so the badge is a consistent total either way.
	const activeFilterCount = flags.length + (openOnly ? 1 : 0);
	const clearAllFilters = () => {
		setFlags([]);
		setOpenOnly(false);
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
				No {dishSearchLabel} spots near you. Zoomed out to the closest:{" "}
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
								No {dishSearchLabel} spots in this area. The closest
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
						// zero matches ANYWHERE in Australia (nearest is national), so
						// name the exact thing searched, not the cuisine bucket
						<p>
							No {dishSearchLabel} on any menu here yet. Menus are
							still rolling in, so try another dish or check back
							soon.
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
				<div className="grid grid-cols-1 md:gap-3">
					{shown.map((r, i) => (
						<Fragment key={r.id}>
							{isFocusView && i === 1 && (
								<h2 className="font-display font-bold text-ink-700 pt-2 pb-0.5">
									You may also like
								</h2>
							)}
							{/* ONE card for every width: @container lets ExploreCard
							    read the row's width and render the flat list row when
							    narrow or the side-panel card when wide, instead of
							    rendering two cards and hiding one per breakpoint. */}
							<div id={`row-${r.id}`} className="@container">
								<ExploreCard
									r={r}
									surface="explore_list"
									pills={dishItems?.get(r.id)}
									// dish miss note: only the searched-by-name card, and only
									// once dishItems resolved (never while the fetch is in flight)
									noDishMatch={
										r.id === focusId &&
										dishItems !== null &&
										!dishItems.has(r.id)
									}
									dishName={dishName ?? undefined}
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

			{ready && shownCount < total && (
				<div className="pt-4 text-center">
					<Button variant="outline" onClick={showMore}>
						{`Load more (${total - shownCount} left)`}
					</Button>
				</div>
			)}
		</>
	);

	// Dish refine chips: the searched dish (x clears) + preparation/protein/diet
	// facets, one selection slot per kind. Rendered in the top bar (desktop) and
	// the sheet header (mobile). A selected dietary facet (vegan, gluten-free)
	// gets a "check with the venue" line: those tags come from menu wording
	// only, and for a coeliac or strict vegan that isn't enough.
	const dietaryNote = facetList.some(
		(f) => f.dietary && facetSel[f.kind] === f.slug,
	);
	// Facets grouped by kind, in dropdown order — one desktop dropdown per kind
	// present (momo → Dish type + Protein; Newari → Dish; a diet facet → Dietary).
	// Member-dish lists read like a menu index, so they're alphabetised; the
	// other kinds keep their curated taxonomy order (Steamed before Jhol).
	const facetGroups = FACET_KIND_ORDER.map((kind) => {
		const fs = facetList.filter((f) => f.kind === kind);
		if (kind === "dish") fs.sort((a, b) => a.name.localeCompare(b.name));
		return [kind, fs] as const;
	}).filter(([, fs]) => fs.length > 0);
	// Names of the currently-selected facets (for the mobile Dish pill label).
	const selectedFacetNames = facetList
		.filter((f) => facetSel[f.kind] === f.slug)
		.map((f) => f.name);
	// Mobile Dish pill: dish name + any active refinements (truncates if long).
	const dishPillLabel = !dish
		? "Dish"
		: selectedFacetNames.length
			? `${dishName} · ${selectedFacetNames.join(", ")}`
			: (dishName ?? "Dish");
	const DishPillIcon = (dish && CUISINE_ICON[dish]) || CookingPot;
	const closeSheet = (o: boolean) => {
		if (!o) setSheet(null);
	};
	// The three mobile bottom sheets (Dish multi-stage, Features, Sort). Rendered
	// once near the top bar; portalled, so they only show when opened on mobile.
	const dishSheet = (
		<FilterSheet
			open={sheet === "dish"}
			onOpenChange={closeSheet}
			title={dishStage === "refine" && dish ? "Dish type" : "Category"}
			subtitle={dishStage === "refine" && dish ? (dishName ?? undefined) : undefined}
			onBack={
				dishStage === "refine" && dish
					? () => setDishStage("category")
					: undefined
			}
			footer={
				<>
					<SheetTextButton disabled={!dish} onClick={() => {
						clearDish();
						setDishStage("category");
					}}>
						{dishStage === "refine" ? "Clear" : "Reset"}
					</SheetTextButton>
					<SheetShowButton n={total} onClick={() => setSheet(null)} />
				</>
			}
		>
			{dishStage === "refine" && dish ? (
				facetGroups.length ? (
					<>
						{facetGroups.map(([kind, fs]) => (
							<SheetSection key={kind} label={FACET_KIND_LABEL[kind]}>
								{fs.map((f) => {
									const active = facetSel[kind] === f.slug;
									return (
										<SheetChip
											key={f.slug}
											active={active}
											label={f.name}
											onClick={() => setFacet(kind, active ? null : f.slug)}
										/>
									);
								})}
							</SheetSection>
						))}
						{dietaryNote && (
							<p className="text-[0.82rem] text-ink-500 leading-snug">
								{DIETARY_NOTE}
							</p>
						)}
					</>
				) : (
					<p className="py-6 text-center text-ink-500 font-display">
						{(dish && catalog?.[dish]) || dishData
							? "No refinements for this one."
							: "Loading dishes…"}
					</p>
				)
			) : (
				<>
					<div className="flex flex-col gap-1.5">
						{[["", "All categories"] as [string, string], ...CATEGORY_CHIPS].map(
							([slug, label]) => {
								const selected = slug ? dish === slug : !dish;
								const IconC = slug ? (CUISINE_ICON[slug] ?? CookingPot) : GlobeHemisphereWest;
								return (
									<button
										key={slug || "all"}
										type="button"
										onClick={() => {
											// keep the location (map holds); dish lands in the filters
											router.push(
												slug
													? withDish(currentParams, { dish: slug })
													: withoutDish(currentParams),
											);
											setDishStage(slug ? "refine" : "category");
										}}
										// py-2.5 (not 3.5): all 7 rows must fit the sheet body on a
										// 390x664 phone — at py-3.5 the last row (Nepali-Indian) sat
										// exactly below the scroll fold with no visible cue that the
										// list continues (found in the 2026-07-08 mobile QA pass)
										className={cn(
											"flex items-center gap-3 rounded-2xl px-3 py-2.5 cursor-pointer text-left border-2 transition-colors active:bg-paper-200",
											selected
												? "bg-chili-50 border-chili-200"
												: "bg-transparent border-transparent hover:bg-paper-100",
										)}
									>
										<span className="text-chili-500">
											<IconC size={24} />
										</span>
										<span
											className={cn(
												"font-display font-bold text-[1.05rem]",
												selected ? "text-chili-600" : "text-ink-800",
											)}
										>
											{label}
										</span>
										<span
											className={cn(
												"ml-auto grid place-items-center w-7 h-7 rounded-full border-2 transition-colors",
												selected
													? "bg-chili-500 border-chili-500 text-white"
													: "border-sand-400 text-transparent",
											)}
										>
											<Check size={15} weight="bold" />
										</span>
									</button>
								);
							},
						)}
					</div>
					<div className="mt-4 flex items-start gap-2 rounded-xl border border-marigold-300 bg-marigold-100/60 px-3.5 py-3 text-marigold-700">
						<CookingPot weight="fill" size={16} className="mt-0.5 shrink-0" />
						<span className="font-display font-bold text-[0.95rem] leading-snug">
							Pick a category to unlock its dishes and proteins.
						</span>
					</div>
				</>
			)}
		</FilterSheet>
	);

	const featuresSheet = (
		<FilterSheet
			open={sheet === "features"}
			onOpenChange={closeSheet}
			title="Features"
			footer={
				<>
					<SheetTextButton
						disabled={activeFilterCount === 0}
						onClick={clearAllFilters}
					>
						Clear
					</SheetTextButton>
					<SheetShowButton n={total} onClick={() => setSheet(null)} />
				</>
			}
		>
			<SheetSection label="Availability">
				<SheetChip
					active={openOnly}
					label="Open now"
					onClick={() => setOpenOnly((o) => !o)}
				/>
			</SheetSection>
			{FLAG_GROUPS.map((g) => (
				<SheetSection key={g.label} label={g.label}>
					{g.items.map(([token, label]) => (
						<SheetChip
							key={token}
							active={flags.includes(token)}
							label={label}
							onClick={() => toggleFlag(token)}
						/>
					))}
				</SheetSection>
			))}
		</FilterSheet>
	);

	const sortSheet = (
		<FilterSheet
			open={sheet === "sort"}
			onOpenChange={closeSheet}
			title="Sort by"
			footer={<SheetShowButton n={total} onClick={() => setSheet(null)} />}
		>
			{/* role=menu: the rows are menuitemradio and need a menu ancestor */}
			<div role="menu" aria-orientation="vertical" className="flex flex-col gap-1">
				{SORT_ENTRIES.map(([slug, label]) => (
					<MenuRow
						key={slug}
						selected={sort === slug}
						label={label}
						onSelect={() => {
							setSort(slug);
							setSheet(null);
						}}
					/>
				))}
			</div>
		</FilterSheet>
	);

	return (
		<div className="flex flex-col h-[calc(100dvh-57px)]">
			{/* top bar: search band + the filter/sort controls above the map. */}
			<div
				className="relative px-4 sm:px-6 py-3 border-b border-paper-300 bg-paper-100"
				style={{ zIndex: Z.topBar }}
			>
				<div className="flex items-center gap-3">
					{/* flex-1 + min-w-0 lets the box shrink so "Near me" stays on the
					    same line on narrow phones (instead of wrapping to a 2nd row). */}
					<div className="flex-1 min-w-0 max-w-[560px]">
						{/* Same component as the homepage hero. Pure navigation: pick a
                suburb (recenters, shows all its spots) or a restaurant (focus).
                Transient, always starts empty (boxKey remounts to clear);
                empty-state submit clears the search, not redirects. */}
						<SearchBox
							key={boxKey}
							variant="bar"
							embedded
							current={currentParams}
						/>
					</div>
					{/* Desktop: Near me sits beside the search box with its label.
					    Mobile: an icon-only button so the search input owns the row. */}
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
					<button
						type="button"
						onClick={nearMe}
						aria-label="Near me"
						className={cn("md:hidden shrink-0 grid place-items-center w-11 h-11 rounded-full bg-chili-500 text-white cursor-pointer active:bg-chili-600", pressable)}
					>
						<NavigationArrow weight="fill" size={18} />
					</button>
				</div>

				{/* Desktop filter bar: a single row of dropdowns. Category (dish
				    search) + one refine dropdown per facet kind, then Features
				    (attributes + Open now) and Sort. Mobile keeps the chip row below. */}
				<div className="max-md:hidden mt-3 flex items-center gap-2.5 flex-wrap gap-y-2">
					<SingleSelectMenu
						eyebrow="Category"
						value={dishIsCategory ? (dishName ?? "All categories") : "All categories"}
						active={dishIsCategory}
					>
						{(close) => (
							<>
								<MenuRow
									selected={!dish}
									icon={<GlobeHemisphereWest size={19} />}
									label="All categories"
									onSelect={() => {
										clearDish();
										close();
									}}
								/>
								{CATEGORY_CHIPS.map(([slug, label]) => {
									const IconC = CUISINE_ICON[slug] ?? CookingPot;
									return (
										<MenuRow
											key={slug}
											selected={dish === slug}
											icon={<IconC size={19} />}
											label={label}
											onSelect={() => {
												pickDish(slug);
												close();
											}}
										/>
									);
								})}
							</>
						)}
					</SingleSelectMenu>

					{/* Standalone active-dish chip: any active dish that ISN'T one of
					    the 5 Category cuisines (curry, biryani, a search-box dish) shows
					    here so it's a visible, removable filter instead of an orphan in
					    the Category trigger. Category dishes are already shown by the
					    dropdown above. */}
					{dish && !dishIsCategory && (
						<div className="shrink-0 inline-flex items-center gap-2 border-2 border-chili-400 bg-white rounded-full pl-3.5 pr-1.5 py-[7px] font-display">
							<DishPillIcon size={16} className="text-chili-500 shrink-0" />
							<span className="font-bold text-[0.9rem] text-ink-900 max-w-[11rem] truncate">
								{dishName}
							</span>
							<button
								type="button"
								onClick={clearDish}
								aria-label={`Clear ${dishName}`}
								className={cn("grid place-items-center w-5 h-5 rounded-full text-ink-400 hover:bg-paper-200 hover:text-ink-900 cursor-pointer", pressable)}
							>
								<X size={13} weight="bold" />
							</button>
						</div>
					)}

					{/* One refine dropdown per facet kind present (single-select). */}
					{facetGroups.map(([kind, fs]) => {
						const sel = facetSel[kind] ?? null;
						const selName = fs.find((f) => f.slug === sel)?.name ?? "Any";
						const kindLabel = FACET_KIND_LABEL[kind];
						return (
							<SingleSelectMenu
								key={kind}
								eyebrow={kindLabel}
								value={selName}
								active={!!sel}
							>
								{(close) => (
									<>
										<MenuRow
											selected={!sel}
											label={`Any ${kindLabel.toLowerCase()}`}
											onSelect={() => {
												setFacet(kind, null);
												close();
											}}
										/>
										{fs.map((f) => (
											<MenuRow
												key={f.slug}
												selected={sel === f.slug}
												label={f.name}
												onSelect={() => {
													setFacet(kind, sel === f.slug ? null : f.slug);
													close();
												}}
											/>
										))}
									</>
								)}
							</SingleSelectMenu>
						);
					})}

					{/* Clear dish: right of the dish dropdowns, clears the dish search
					    (and its facets), not the attribute Features. Only for Category
					    dishes — non-category dishes clear via their chip's ✕ above. */}
					{dish && dishIsCategory && (
						<button
							type="button"
							onClick={clearDish}
							className={cn("shrink-0 inline-flex items-center gap-1.5 font-display font-bold text-[0.9rem] text-ink-500 px-1.5 cursor-pointer hover:text-ink-900 transition-colors", pressable)}
						>
							<X size={14} weight="bold" />
							Clear
						</button>
					)}

					{/* push Features + Sort to the right */}
					<div className="ml-auto" />

					{/* Features: grouped attributes + Open now, multi-select. */}
					<Popover.Root open={featOpen} onOpenChange={setFeatOpen}>
						<FilterTrigger
							value="Features"
							icon={<SlidersHorizontal size={16} />}
							active={activeFilterCount > 0}
							open={featOpen}
							count={activeFilterCount}
						/>
						<FilterPanel align="end">
							<div className="max-h-[320px] overflow-y-auto px-1 pt-1 min-w-[230px]">
								<div className="mb-1.5">
									<div className="eyebrow text-ink-400 text-[10px] px-2.5 pt-1.5 pb-1">
										Availability
									</div>
									<MenuRow
										selected={openOnly}
										icon={<Clock weight="fill" size={17} />}
										label="Open now"
										multi
										onSelect={() => setOpenOnly((o) => !o)}
									/>
								</div>
								{FLAG_GROUPS.map((g) => (
									<div key={g.label} className="mb-1.5">
										<div className="eyebrow text-ink-400 text-[10px] px-2.5 pt-1.5 pb-1">
											{g.label}
										</div>
										{g.items.map(([token, label]) => (
											<MenuRow
												key={token}
												selected={flags.includes(token)}
												label={label}
												multi
												onSelect={() => toggleFlag(token)}
											/>
										))}
									</div>
								))}
							</div>
							<div className="flex items-center justify-between gap-3 border-t border-paper-200 mt-1 px-2 pt-2">
								<button
									type="button"
									onClick={clearAllFilters}
									disabled={activeFilterCount === 0}
									className="font-display font-bold text-[0.85rem] text-ink-500 cursor-pointer hover:underline disabled:opacity-40"
								>
									Clear all
								</button>
								<Popover.Close asChild>
									<button
										type="button"
										className="rounded-full bg-chili-500 text-white px-5 py-1.5 font-display font-bold text-[0.85rem] cursor-pointer hover:bg-chili-600 transition-colors"
									>
										Done
										{activeFilterCount ? ` (${activeFilterCount})` : ""}
									</button>
								</Popover.Close>
							</div>
						</FilterPanel>
					</Popover.Root>

					{/* Sort */}
					<div className="shrink-0 inline-flex items-center gap-2">
						<span className="font-display font-bold text-ink-500 text-[0.9rem]">
							Sort
						</span>
						<SingleSelectMenu
							value={SORT_LABELS[sort] ?? "Popular"}
							align="end"
							active={sort !== "popular"}
						>
							{(close) =>
								SORT_ENTRIES.map(([slug, label]) => (
									<MenuRow
										key={slug}
										selected={sort === slug}
										label={label}
										onSelect={() => {
											setSort(slug);
											close();
										}}
									/>
								))
							}
						</SingleSelectMenu>
					</div>
				</div>
				{dish && dietaryNote && (
					<p className="max-md:hidden mt-1.5 text-[0.8rem] text-ink-500">
						{DIETARY_NOTE}
					</p>
				)}

				{/* Filter bar (mobile): primary controls always visible; attribute
				    chips live behind the Filters toggle. Filters in memory, instantly. */}
				{/* Mobile filter bar: Dish pill on the left; Features + Sort are
				    icon-only, grouped on the right. All 44px tall to match the
				    search input + Near me. */}
				<div className="mt-3 md:hidden flex items-center gap-2.5">
					<button
						type="button"
						onClick={() => {
							setDishStage(dish ? "refine" : "category");
							setSheet("dish");
						}}
						className={cn(
							"inline-flex items-center gap-2 border-2 rounded-full px-4 h-11 cursor-pointer font-display font-bold text-[0.9rem] transition-colors min-w-0",
						pressable,
							dish
								? "bg-white border-chili-400 text-ink-900"
								: "bg-white border-sand-400 text-ink-700",
						)}
					>
						<DishPillIcon size={17} className="text-chili-500 shrink-0" />
						<span className="truncate min-w-0">{dishPillLabel}</span>
						<CaretDown
							size={14}
							weight="bold"
							className="text-ink-400 shrink-0"
						/>
					</button>

					<button
						type="button"
						onClick={() => setSheet("features")}
						aria-label={`Features${activeFilterCount ? ` (${activeFilterCount})` : ""}`}
						className={cn(
							"relative ml-auto shrink-0 grid place-items-center w-11 h-11 rounded-full border-2 cursor-pointer transition-colors",
						pressable,
							activeFilterCount > 0
								? "bg-white border-chili-400 text-ink-900"
								: "bg-white border-sand-400 text-ink-700",
						)}
					>
						<SlidersHorizontal size={18} />
						{activeFilterCount > 0 && (
							<span className="absolute -top-1 -right-1 inline-grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-chili-500 text-white text-[0.72rem] leading-none">
								{activeFilterCount}
							</span>
						)}
					</button>

					<button
						type="button"
						onClick={() => setSheet("sort")}
						aria-label={`Sort: ${SORT_LABELS[sort] ?? "Popular"}`}
						className={cn(
							"shrink-0 grid place-items-center w-11 h-11 rounded-full border-2 cursor-pointer transition-colors",
						pressable,
							sort !== "popular"
								? "bg-white border-chili-400 text-chili-600"
								: "bg-white border-sand-400 text-ink-700",
						)}
					>
						<ArrowsDownUp size={18} weight="bold" />
					</button>
				</div>

				{/* mobile bottom sheets (portalled; only open on mobile) */}
				{dishSheet}
				{featuresSheet}
				{sortSheet}
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
						dishPills={dishItems ?? undefined}
						dishName={dishName ?? undefined}
						distOrigin={distOrigin}
						focusId={focusId}
						userLoc={userLoc}
						fitBounds={fitBounds}
					/>
				</div>

				{/* Floating List/Map toggle (mobile). Hidden while the list is
				    empty (the empty state has its own button) and while a spot
				    card is open on the map (the docked card owns the bottom). */}
				<div
					style={{ zIndex: Z.mapOverlay }}
					className={cn(
						"absolute bottom-6 left-1/2 -translate-x-1/2 md:hidden",
						viewMode === "list" && ready && shown.length === 0 && "hidden",
						viewMode === "map" && selected != null && "hidden",
					)}
				>
					<button
						onClick={() =>
							setViewMode(viewMode === "map" ? "list" : "map")
						}
						className={cn(
							"inline-flex items-center gap-2 bg-chili-500 text-white rounded-full px-6 py-3.5 cursor-pointer font-display font-bold text-[1.02rem] shadow-lg active:bg-chili-600",
							pressable,
						)}
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
