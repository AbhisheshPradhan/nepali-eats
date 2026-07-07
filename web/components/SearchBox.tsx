"use client";
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
	MagnifyingGlass,
	CircleNotch,
	ArrowRight,
	MapPin,
	ForkKnife,
	CookingPot,
	X,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import type { Suggestion } from "@/lib/queries";
import type { DishSuggestion } from "@/lib/types";
import { withDish, withLocation, type ExploreParams } from "@/lib/explore-url";
import { cn } from "@/lib/cn";

const EMPTY: Suggestion = { dishes: [], restaurants: [], locations: [] };

// useLayoutEffect warns when run during SSR; the dropdown only ever measures on
// the client, so fall back to useEffect on the server to keep the console clean.
const useIsoLayoutEffect =
	typeof window === "undefined" ? useEffect : useLayoutEffect;

export function SearchBox({
	variant = "hero",
	placeholder = "Search a dish, restaurant, or suburb",
	defaultValue = "",
	embedded = false,
	current,
}: {
	variant?: "hero" | "bar";
	placeholder?: string;
	defaultValue?: string;
	// embedded = the box lives on the Explore page, so the empty state clears the
	// search instead of redirecting to /explore.
	embedded?: boolean;
	// Explore only: the current URL params, so a pick MERGES (keeps the other
	// dimension — a location pick keeps the dish, a dish pick keeps the location)
	// instead of replacing the whole query. Omitted elsewhere = plain fresh nav.
	current?: ExploreParams;
}) {
	const router = useRouter();
	// Navigation feedback: picks wrap router.push in a transition so the box can
	// show a spinner while the target page's server render is in flight. Without
	// it a pick gives zero acknowledgement until the page swaps (the "dead
	// pause" after choosing a suggestion).
	const [navPending, startNav] = useTransition();
	const nav = (href: string) => startNav(() => router.push(href));
	const [value, setValue] = useState(defaultValue);
	const [selected, setSelected] = useState<
		| { type: "restaurant"; slug: string }
		| { type: "location"; suburb: string; state: string }
		| { type: "dish"; dish: DishSuggestion }
		| null
	>(null);
	const [sugg, setSugg] = useState<Suggestion>(EMPTY);
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const abortRef = useRef<AbortController | null>(null);
	// true once the user actually types; a URL-prefilled defaultValue (Explore's
	// dish/suburb chips) must NOT trigger a suggestion fetch on mount.
	const touchedRef = useRef(false);
	const prefetchedRef = useRef(false);
	const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const rootRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [dropTop, setDropTop] = useState<number | null>(null);
	// index of the keyboard-highlighted option in the flattened list (-1 = none)
	const [activeIndex, setActiveIndex] = useState(-1);

	// fetch suggestions after 3 chars (debounced)
	useEffect(() => {
		if (!touchedRef.current) return;
		const q = value.trim();
		if (q.length < 3) {
			setSugg(EMPTY);
			setLoading(false);
			return;
		}
		// a deliberate pick already resolved intent; don't re-search its own
		// formatted label ("Auburn, NSW") and flash a no-results state.
		if (selected) {
			setLoading(false);
			return;
		}
		// show loading immediately so the empty-state line doesn't flash during the
		// debounce window before the fetch starts.
		setLoading(true);
		const t = setTimeout(() => {
			abortRef.current?.abort();
			const ctrl = new AbortController();
			abortRef.current = ctrl;
			setLoading(true);
			// normalize the query so case/whitespace variants share one CDN cache
			// entry (the SQL match is case-insensitive anyway)
			const norm = q.toLowerCase().replace(/\s+/g, " ");
			fetch(`/api/search?q=${encodeURIComponent(norm)}`, {
				signal: ctrl.signal,
			})
				.then((r) => r.json())
				.then((d: Suggestion) => setSugg(d))
				.catch((e) => {
					if (e.name !== "AbortError") setSugg(EMPTY);
				})
				.finally(() => setLoading(false));
		}, 220);
		return () => clearTimeout(t);
	}, [value, selected]);

	// Every pick MERGES onto the current Explore params (see lib/explore-url):
	// a location keeps the active dish, a dish keeps the location. `current` is
	// only set on the Explore bar; elsewhere it's undefined -> a plain fresh nav.
	const base = current ?? {};
	// carry the state so "Auburn, NSW" doesn't collide with Auburn VIC/SA
	const gotoSuburb = (s: { suburb: string; state: string }) =>
		nav(withLocation(base, { suburb: s.suburb, state: s.state }));
	const gotoRestaurant = (slug: string) =>
		nav(withLocation(base, { focus: slug }));
	// a compound pick ("Paneer Momo") carries the protein as a pre-set filter
	const gotoDish = (d: DishSuggestion) =>
		nav(withDish(base, { dish: d.slug, protein: d.protein }));

	// typing clears any prior selection (back to free-text)
	const change = (v: string) => {
		touchedRef.current = true;
		setValue(v);
		setSelected(null);
		setOpen(true);
		setActiveIndex(-1); // typing resets the keyboard highlight
	};

	// Explore bar: the clear (X) button empties the input and refocuses it so the
	// keyboard stays up for a fresh query. Text-only clear; the dish/area chips on
	// Explore have their own clear controls.
	const clearInput = () => {
		setValue("");
		setSelected(null);
		setSugg(EMPTY);
		setActiveIndex(-1);
		setOpen(false);
		inputRef.current?.focus();
	};

	// Enter / Search button. Priority: an explicit pick > the top live suggestion
	// (so typing "auburn" + Enter just works) > the map. The empty/no-match case
	// drops the user on /explore (or clears the filter when embedded there).
	const submit = (e?: React.FormEvent) => {
		e?.preventDefault();
		setOpen(false);
		// empty the box on submit too (it's a transient entry point); the closure
		// still reads the pre-clear `value`/`sugg` below to decide where to go.
		setValue("");
		if (selected) {
			if (selected.type === "restaurant") gotoRestaurant(selected.slug);
			else if (selected.type === "dish") gotoDish(selected.dish);
			else gotoSuburb(selected);
			return;
		}
		if (value.trim().length >= 3) {
			// dropdown order wins: dishes first, then locations, then names
			if (sugg.dishes[0]) return gotoDish(sugg.dishes[0]);
			if (sugg.locations[0]) return gotoSuburb(sugg.locations[0]);
			if (sugg.restaurants[0])
				return gotoRestaurant(sugg.restaurants[0].slug);
		}
		if (embedded) change("");
		else nav("/explore");
	};

	// Picking an option resolves intent immediately (navigate) and EMPTIES the box:
	// the search bar is a transient entry point, not a state display. The picked
	// dish lands in the filters and the picked location moves the map, so leaving
	// the box empty lets the user immediately search the other dimension.
	const pickLocation = (loc: { suburb: string; state: string }) => {
		setValue("");
		setSelected(null);
		setOpen(false);
		gotoSuburb(loc);
	};
	const pickRestaurant = (r: { slug: string; name: string }) => {
		setValue("");
		setSelected(null);
		setOpen(false);
		gotoRestaurant(r.slug);
	};
	const pickDish = (d: DishSuggestion) => {
		setValue("");
		setSelected(null);
		setOpen(false);
		gotoDish(d);
	};

	const hero = variant === "hero";
	// show whenever there's a real query, so a no-results state still gets a
	// dropdown (with the "explore instead" fallback), not silence.
	const showDropdown = open && value.trim().length >= 3;
	const noResults =
		!loading &&
		!selected &&
		sugg.dishes.length === 0 &&
		sugg.restaurants.length === 0 &&
		sugg.locations.length === 0;
	const trimmed = value.trim();
	const isPostcode = /^\d{4}$/.test(trimmed);

	// Flattened, in-render-order list of options the arrow keys walk through:
	// dishes, then locations, then restaurants, then the no-results fallback row.
	// The index of each item here is its keyboard position (and
	// aria-activedescendant target).
	type Opt =
		| { kind: "dish"; d: DishSuggestion }
		| { kind: "location"; loc: (typeof sugg.locations)[number] }
		| { kind: "restaurant"; r: (typeof sugg.restaurants)[number] }
		| { kind: "noResults" };
	const flatOptions: Opt[] = [
		...sugg.dishes.map((d) => ({ kind: "dish", d }) as const),
		...sugg.locations.map((loc) => ({ kind: "location", loc }) as const),
		...sugg.restaurants.map((r) => ({ kind: "restaurant", r }) as const),
		...(noResults ? [{ kind: "noResults" } as const] : []),
	];
	// index offsets for the rendered sections below
	const locOffset = sugg.dishes.length;
	const restOffset = locOffset + sugg.locations.length;

	const pickOption = (opt: Opt) => {
		if (opt.kind === "dish") pickDish(opt.d);
		else if (opt.kind === "location") pickLocation(opt.loc);
		else if (opt.kind === "restaurant") pickRestaurant(opt.r);
		else if (embedded) change(""); // no-results row: clear the filter in place
		else {
			setOpen(false);
			nav("/explore");
		}
	};

	const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "ArrowDown") {
			if (!showDropdown) return setOpen(true);
			if (flatOptions.length === 0) return;
			e.preventDefault();
			setActiveIndex((i) => Math.min(i + 1, flatOptions.length - 1));
		} else if (e.key === "ArrowUp") {
			if (!showDropdown || flatOptions.length === 0) return;
			e.preventDefault();
			setActiveIndex((i) => Math.max(i - 1, 0));
		} else if (e.key === "Enter") {
			// a highlighted option wins over the form's default submit
			if (showDropdown && flatOptions[activeIndex]) {
				e.preventDefault();
				pickOption(flatOptions[activeIndex]);
			}
		} else if (e.key === "Escape") {
			setOpen(false);
			setActiveIndex(-1);
		}
	};

	// keep the highlight in range as results change (and clear it when they do)
	useEffect(() => {
		setActiveIndex(-1);
	}, [sugg]);

	// scroll the highlighted row into view inside the (scrollable) dropdown
	useEffect(() => {
		if (activeIndex < 0) return;
		rootRef.current
			?.querySelector(`[data-opt-index="${activeIndex}"]`)
			?.scrollIntoView({ block: "nearest" });
	}, [activeIndex]);

	// Anchor the dropdown to the bottom of the INPUT, not the whole form. On mobile
	// the Search button wraps onto its own full-width line, so the form is taller
	// than the input; pinning to the input keeps the menu directly under the field
	// (floating over the button + page content below it).
	useIsoLayoutEffect(() => {
		if (!showDropdown) return;
		const measure = () => {
			const root = rootRef.current;
			const input = inputRef.current;
			if (!root || !input) return;
			setDropTop(
				input.getBoundingClientRect().bottom -
					root.getBoundingClientRect().top +
					6,
			);
		};
		measure();
		window.addEventListener("resize", measure);
		return () => window.removeEventListener("resize", measure);
	}, [showDropdown]);

	return (
		<div ref={rootRef} className="relative w-full">
			<form
				onSubmit={submit}
				className={cn(
					"input-group flex items-center gap-2 bg-white border-2 border-sand-400 rounded-4xl sm:rounded-full shadow-md transition-[box-shadow,border-color] duration-150 hover:border-sand-500 hover:shadow-lg focus-within:border-sand-500 focus-within:shadow-lg",
					hero
						? "flex-wrap pl-2 sm:pl-5 pr-2 py-2"
						: "h-11 pl-4 pr-1.5 shadow-sm",
				)}
			>
				{navPending ? (
					<CircleNotch
						className="text-chili-500 shrink-0 animate-spin"
						size={hero ? 22 : 18}
					/>
				) : (
					<MagnifyingGlass
						className="text-ink-500 shrink-0"
						size={hero ? 22 : 18}
					/>
				)}
				<input
					ref={inputRef}
					value={value}
					onChange={(e) => change(e.target.value)}
					onFocus={() => {
							setOpen(true);
							// warm /explore (RSC payload + JS chunks) while they type;
							// programmatic router.push never prefetches on its own
							if (!embedded && !prefetchedRef.current) {
								prefetchedRef.current = true;
								router.prefetch("/explore");
							}
						}}
					onBlur={() => {
						blurTimer.current = setTimeout(
							() => setOpen(false),
							160,
						);
					}}
					placeholder={placeholder}
					onKeyDown={onKeyDown}
						aria-label="Search Nepali food"
						role="combobox"
						aria-expanded={showDropdown}
						aria-controls="searchbox-listbox"
						aria-autocomplete="list"
						aria-activedescendant={
							showDropdown && activeIndex >= 0
								? `searchbox-opt-${activeIndex}`
								: undefined
						}
					className={cn(
						"flex-1 bg-transparent outline-none focus-visible:shadow-none font-body text-ink-900 min-w-0 placeholder:text-ink-500",
						hero ? "text-[1.1rem] py-2.5" : "text-base",
					)}
				/>
				{/* Explore bar: clear the input (X) when there's text. */}
				{embedded && value.length > 0 && (
					<button
						type="button"
						aria-label="Clear search"
						onClick={clearInput}
						className="shrink-0 grid h-7 w-7 place-items-center rounded-full text-ink-500 hover:bg-paper-100 cursor-pointer"
					>
						<X size={16} weight="bold" />
					</button>
				)}
				{/* Bar variant (Explore): the Search button is dead weight. It's
				    gated on `selected`, but picking a row navigates immediately, so
				    it's never clickable, and Enter already submits via the form's
				    onSubmit. Near Me is the visible action beside the input there.
				    Keep it only on the hero, where there's no Near Me. */}
				{hero && (
					<Button
						type="submit"
						// gated: only a real pick from the dropdown enables Search
						disabled={!selected}
						size="md"
						iconRight={
							<ArrowRight
								size={18}
								weight="bold"
							/>
						}
						className="max-sm:basis-full max-sm:w-full"
					>
						Search
					</Button>
				)}
			</form>

			{showDropdown && (loading || flatOptions.length > 0) && (
				<div
					id="searchbox-listbox"
					role="listbox"
					style={{ top: dropTop ?? undefined }}
					className="absolute left-0 right-0 bg-white rounded-lg shadow-lg border border-paper-300 overflow-hidden z-[2000] max-h-[400px] overflow-y-auto text-left"
					onMouseDown={(e) => {
						// keep focus so click registers before blur closes
						e.preventDefault();
						if (blurTimer.current) clearTimeout(blurTimer.current);
					}}
				>
					{loading && flatOptions.length === 0 && (
						<div className="flex items-center gap-2.5 px-4 py-3 text-ink-500">
							<MagnifyingGlass
								className="shrink-0 animate-pulse"
								size={18}
							/>
							<span>Searching…</span>
						</div>
					)}
					{sugg.dishes.length > 0 && (
						<div className="eyebrow text-ink-500 px-4 pt-2 pb-1 bg-paper-50">
							Dishes
						</div>
					)}
					{sugg.dishes.map((d, i) => (
						<button
							type="button"
							key={`${d.slug}-${d.protein ?? ""}`}
							id={`searchbox-opt-${i}`}
							role="option"
							aria-selected={activeIndex === i}
							data-opt-index={i}
							onMouseMove={() => setActiveIndex(i)}
							onClick={() => pickDish(d)}
							className={cn(
								"flex items-center gap-2.5 w-full text-left px-4 py-2.5 cursor-pointer",
								activeIndex === i ? "bg-paper-100" : "hover:bg-paper-100",
							)}
						>
							<CookingPot
								className="text-marigold-700 shrink-0"
								size={18}
								weight="fill"
							/>
							<span className="min-w-0">
								<span className="block font-semibold text-ink-900 truncate">
									{d.name}
								</span>
								<span className="block text-[0.82rem] text-ink-500">
									{d.kind === "style"
										? "Cuisine · see spots that serve it"
										: d.kind === "diet"
											? "Dietary · see spots with marked dishes"
											: "Dish · see spots that serve it"}
								</span>
							</span>
						</button>
					))}

					{sugg.locations.length > 0 && (
						<div className="eyebrow text-ink-500 px-4 pt-2 pb-1 bg-paper-50">
							Locations
						</div>
					)}
					{sugg.locations.map((l, li) => {
						const i = locOffset + li;
						return (
						<button
							type="button"
							key={`${l.suburb}-${l.state}`}
							id={`searchbox-opt-${i}`}
							role="option"
							aria-selected={activeIndex === i}
							data-opt-index={i}
							onMouseMove={() => setActiveIndex(i)}
							onClick={() => pickLocation(l)}
							className={cn(
								"flex items-center gap-2.5 w-full text-left px-4 py-2.5 cursor-pointer",
								activeIndex === i ? "bg-paper-100" : "hover:bg-paper-100",
							)}
						>
							<MapPin
								className="text-chili-500 shrink-0"
								size={18}
								weight="fill"
							/>
							<span className="min-w-0">
								<span className="block font-semibold text-ink-900 truncate">
									{l.suburb}, {l.state}
								</span>
								<span className="block text-[0.82rem] text-ink-500">
									{l.count} {l.count === 1 ? "spot" : "spots"}
									{l.postcode ? ` · ${l.postcode}` : ""}
								</span>
							</span>
						</button>
						);
					})}

					{sugg.restaurants.length > 0 && (
						<div className="eyebrow text-ink-500 px-4 pt-2 pb-1 bg-paper-50">
							Restaurants
						</div>
					)}
					{sugg.restaurants.map((r, i) => {
						const idx = restOffset + i;
						return (
						<button
							type="button"
							key={r.slug}
							id={`searchbox-opt-${idx}`}
							role="option"
							aria-selected={activeIndex === idx}
							data-opt-index={idx}
							onMouseMove={() => setActiveIndex(idx)}
							onClick={() => pickRestaurant(r)}
							className={cn(
								"flex items-center gap-2.5 w-full text-left px-4 py-2.5 cursor-pointer",
								activeIndex === idx ? "bg-paper-100" : "hover:bg-paper-100",
							)}
						>
							<ForkKnife
								className="text-chili-500 shrink-0"
								size={18}
							/>
							<span className="min-w-0">
								<span className="block font-semibold text-ink-900 truncate">
									{r.name}
								</span>
								<span className="block text-[0.82rem] text-ink-500 truncate">
									{[r.suburb, r.state]
										.filter(Boolean)
										.join(", ")}
								</span>
							</span>
						</button>
						);
					})}

					{noResults && (
						<button
							type="button"
							id={`searchbox-opt-${restOffset + sugg.restaurants.length}`}
							role="option"
							aria-selected={
								activeIndex ===
								restOffset + sugg.restaurants.length
							}
							data-opt-index={
								restOffset + sugg.restaurants.length
							}
							onMouseMove={() =>
								setActiveIndex(
									restOffset + sugg.restaurants.length,
								)
							}
							onClick={() => {
								if (embedded) {
									change(""); // already on the map; just reset the filter
								} else {
									setOpen(false);
									nav("/explore");
								}
							}}
							className={cn(
								"flex items-center gap-2.5 w-full text-left px-4 py-3 cursor-pointer",
								activeIndex ===
									restOffset + sugg.restaurants.length
									? "bg-paper-100"
									: "hover:bg-paper-100",
							)}
						>
							<MapPin
								className="text-chili-500 shrink-0"
								size={18}
								weight="fill"
							/>
							<span className="min-w-0">
								<span className="block text-ink-700">
									{isPostcode ? (
										<>No food spots found in {trimmed}.</>
									) : (
										<>
											No spots or dishes match &ldquo;{trimmed}
											&rdquo; yet.
										</>
									)}
								</span>
								<span className="block font-semibold text-chili-600">
									{embedded
										? "Clear search"
										: isPostcode
											? "Check out a nearby suburb on the map →"
											: "Explore the map instead →"}
								</span>
							</span>
						</button>
					)}
				</div>
			)}
		</div>
	);
}
