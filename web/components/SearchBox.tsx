"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
	MagnifyingGlass,
	ArrowRight,
	MapPin,
	ForkKnife,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import type { Suggestion } from "@/lib/queries";
import { cn } from "@/lib/cn";

const EMPTY: Suggestion = { restaurants: [], locations: [] };

// useLayoutEffect warns when run during SSR; the dropdown only ever measures on
// the client, so fall back to useEffect on the server to keep the console clean.
const useIsoLayoutEffect =
	typeof window === "undefined" ? useEffect : useLayoutEffect;

export function SearchBox({
	variant = "hero",
	placeholder = "Search a restaurant, suburb or postcode",
	defaultValue = "",
	embedded = false,
}: {
	variant?: "hero" | "bar";
	placeholder?: string;
	defaultValue?: string;
	// embedded = the box lives on the Explore page, so the empty state clears the
	// search instead of redirecting to /explore.
	embedded?: boolean;
}) {
	const router = useRouter();
	const [value, setValue] = useState(defaultValue);
	const [selected, setSelected] = useState<
		| { type: "restaurant"; slug: string }
		| { type: "location"; suburb: string; state: string }
		| null
	>(null);
	const [sugg, setSugg] = useState<Suggestion>(EMPTY);
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const abortRef = useRef<AbortController | null>(null);
	const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const rootRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [dropTop, setDropTop] = useState<number | null>(null);
	// index of the keyboard-highlighted option in the flattened list (-1 = none)
	const [activeIndex, setActiveIndex] = useState(-1);

	// fetch suggestions after 3 chars (debounced)
	useEffect(() => {
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
			fetch(`/api/search?q=${encodeURIComponent(q)}`, {
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

	const enc = encodeURIComponent;
	// carry the state so "Auburn, NSW" doesn't collide with Auburn VIC/SA
	const gotoSuburb = (s: { suburb: string; state: string }) =>
		router.push(`/explore?suburb=${enc(s.suburb)}&state=${enc(s.state)}`);
	const gotoRestaurant = (slug: string) =>
		router.push(`/explore?focus=${slug}`);

	// typing clears any prior selection (back to free-text)
	const change = (v: string) => {
		setValue(v);
		setSelected(null);
		setOpen(true);
		setActiveIndex(-1); // typing resets the keyboard highlight
	};

	// Enter / Search button. Priority: an explicit pick > the top live suggestion
	// (so typing "auburn" + Enter just works) > the map. The empty/no-match case
	// drops the user on /explore (or clears the filter when embedded there).
	const submit = (e?: React.FormEvent) => {
		e?.preventDefault();
		setOpen(false);
		if (selected) {
			if (selected.type === "restaurant") gotoRestaurant(selected.slug);
			else gotoSuburb(selected);
			return;
		}
		if (value.trim().length >= 3) {
			// dropdown lists locations first, so the top location wins, then names
			if (sugg.locations[0]) return gotoSuburb(sugg.locations[0]);
			if (sugg.restaurants[0])
				return gotoRestaurant(sugg.restaurants[0].slug);
		}
		if (embedded) change("");
		else router.push("/explore");
	};

	// picking an option resolves intent immediately (fill the box + navigate),
	// so the user never has to click Search after choosing a row.
	const pickLocation = (loc: { suburb: string; state: string }) => {
		setValue(`${loc.suburb}, ${loc.state}`);
		setSelected({ type: "location", suburb: loc.suburb, state: loc.state });
		setOpen(false);
		gotoSuburb(loc);
	};
	const pickRestaurant = (r: { slug: string; name: string }) => {
		setValue(r.name);
		setSelected({ type: "restaurant", slug: r.slug });
		setOpen(false);
		gotoRestaurant(r.slug);
	};

	const hero = variant === "hero";
	// show whenever there's a real query, so a no-results state still gets a
	// dropdown (with the "explore instead" fallback), not silence.
	const showDropdown = open && value.trim().length >= 3;
	const noResults =
		!loading &&
		!selected &&
		sugg.restaurants.length === 0 &&
		sugg.locations.length === 0;
	const trimmed = value.trim();
	const isPostcode = /^\d{4}$/.test(trimmed);

	// Flattened, in-render-order list of options the arrow keys walk through:
	// locations, then restaurants, then the no-results fallback row. The index of
	// each item here is its keyboard position (and aria-activedescendant target).
	type Opt =
		| { kind: "location"; loc: (typeof sugg.locations)[number] }
		| { kind: "restaurant"; r: (typeof sugg.restaurants)[number] }
		| { kind: "noResults" };
	const flatOptions: Opt[] = [
		...sugg.locations.map((loc) => ({ kind: "location", loc }) as const),
		...sugg.restaurants.map((r) => ({ kind: "restaurant", r }) as const),
		...(noResults ? [{ kind: "noResults" } as const] : []),
	];

	const pickOption = (opt: Opt) => {
		if (opt.kind === "location") pickLocation(opt.loc);
		else if (opt.kind === "restaurant") pickRestaurant(opt.r);
		else if (embedded) change(""); // no-results row: clear the filter in place
		else {
			setOpen(false);
			router.push("/explore");
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
					"flex items-center gap-2 bg-white border-2 border-sand-400 rounded-4xl sm:rounded-full shadow-md",
					hero
						? "flex-wrap pl-2 sm:pl-5 pr-2 py-2"
						: "pl-4 pr-1.5 py-1 shadow-sm",
				)}
			>
				<MagnifyingGlass
					className="text-ink-500 shrink-0"
					size={hero ? 22 : 18}
				/>
				<input
					ref={inputRef}
					value={value}
					onChange={(e) => change(e.target.value)}
					onFocus={() => setOpen(true)}
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
				<Button
					type="submit"
					// gated: only a real pick from the dropdown enables Search
					disabled={!selected}
					size={hero ? "md" : "sm"}
					iconRight={
						hero ? (
							<ArrowRight
								size={18}
								weight="bold"
							/>
						) : undefined
					}
					className={
						hero ? "max-sm:basis-full max-sm:w-full" : undefined
					}
				>
					Search
				</Button>
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
					{sugg.locations.length > 0 && (
						<div className="eyebrow text-ink-500 px-4 pt-2 pb-1 bg-paper-50">
							Locations
						</div>
					)}
					{sugg.locations.map((l, i) => (
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
					))}

					{sugg.restaurants.length > 0 && (
						<div className="eyebrow text-ink-500 px-4 pt-2 pb-1 bg-paper-50">
							Restaurants
						</div>
					)}
					{sugg.restaurants.map((r, i) => {
						const idx = sugg.locations.length + i;
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
							id={`searchbox-opt-${sugg.locations.length + sugg.restaurants.length}`}
							role="option"
							aria-selected={
								activeIndex ===
								sugg.locations.length + sugg.restaurants.length
							}
							data-opt-index={
								sugg.locations.length + sugg.restaurants.length
							}
							onMouseMove={() =>
								setActiveIndex(
									sugg.locations.length +
										sugg.restaurants.length,
								)
							}
							onClick={() => {
								if (embedded) {
									change(""); // already on the map; just reset the filter
								} else {
									setOpen(false);
									router.push("/explore");
								}
							}}
							className={cn(
								"flex items-center gap-2.5 w-full text-left px-4 py-3 cursor-pointer",
								activeIndex ===
									sugg.locations.length + sugg.restaurants.length
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
											No spots match &ldquo;{trimmed}
											&rdquo;.
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
