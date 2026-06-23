"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass, ArrowRight, MapPin, ForkKnife } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import type { Suggestion } from "@/lib/queries";
import { cn } from "@/lib/cn";

const EMPTY: Suggestion = { restaurants: [], locations: [] };

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
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
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

  // typing clears any prior selection (back to free-text)
  const change = (v: string) => {
    setValue(v);
    setSelected(null);
    setOpen(true);
  };

  // Strict dropdown: a query is only valid once a suggestion is picked. Free text
  // never resolves, so Enter/Search are no-ops until `selected` is set.
  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selected) return;
    setOpen(false);
    if (selected.type === "restaurant") router.push(`/explore?focus=${selected.slug}`);
    else gotoSuburb(selected);
  };

  // picking an option only fills the box + remembers the choice (no search yet)
  const pickLocation = (loc: { suburb: string; state: string }) => {
    setValue(`${loc.suburb}, ${loc.state}`);
    setSelected({ type: "location", suburb: loc.suburb, state: loc.state });
    setOpen(false);
  };
  const pickRestaurant = (r: { slug: string; name: string }) => {
    setValue(r.name);
    setSelected({ type: "restaurant", slug: r.slug });
    setOpen(false);
  };

  const hero = variant === "hero";
  // show whenever there's a real query, so a no-results state still gets a
  // dropdown (with the "explore instead" fallback), not silence.
  const showDropdown = open && value.trim().length >= 3;
  const noResults =
    !loading && !selected && sugg.restaurants.length === 0 && sugg.locations.length === 0;
  const trimmed = value.trim();
  const isPostcode = /^\d{4}$/.test(trimmed);

  return (
    <div className="relative w-full">
      <form
        onSubmit={submit}
        className={cn(
          "flex items-center gap-2 bg-white border-2 border-sand-400 rounded-full shadow-md",
          hero ? "pl-5 pr-1.5 py-1.5" : "pl-4 pr-1.5 py-1 shadow-sm"
        )}
      >
        <MagnifyingGlass className="text-ink-500 shrink-0" size={hero ? 22 : 18} />
        <input
          value={value}
          onChange={(e) => change(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 160);
          }}
          placeholder={placeholder}
          aria-label="Search Nepali food"
          className={cn(
            "flex-1 bg-transparent outline-none focus-visible:shadow-none font-body text-ink-900 min-w-0 placeholder:text-ink-500",
            hero ? "text-[1.1rem]" : "text-base"
          )}
        />
        <Button
          type="submit"
          size={hero ? "md" : "sm"}
          disabled={!selected}
          iconRight={hero ? <ArrowRight size={18} weight="bold" /> : undefined}
        >
          Search
        </Button>
      </form>

      {showDropdown && (
        <div
          className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white rounded-lg shadow-lg border border-paper-300 overflow-hidden z-[2000] max-h-[400px] overflow-y-auto text-left"
          onMouseDown={(e) => {
            // keep focus so click registers before blur closes
            e.preventDefault();
            if (blurTimer.current) clearTimeout(blurTimer.current);
          }}
        >
          {sugg.locations.length > 0 && (
            <div className="eyebrow text-ink-500 px-4 pt-2 pb-1 bg-paper-50">Locations</div>
          )}
          {sugg.locations.map((l) => (
            <button
              type="button"
              key={`${l.suburb}-${l.state}`}
              onClick={() => pickLocation(l)}
              className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 hover:bg-paper-100 cursor-pointer"
            >
              <MapPin className="text-chili-500 shrink-0" size={18} weight="fill" />
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
            <div className="eyebrow text-ink-500 px-4 pt-2 pb-1 bg-paper-50">Restaurants</div>
          )}
          {sugg.restaurants.map((r) => (
            <button
              type="button"
              key={r.slug}
              onClick={() => pickRestaurant(r)}
              className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 hover:bg-paper-100 cursor-pointer"
            >
              <ForkKnife className="text-chili-500 shrink-0" size={18} />
              <span className="min-w-0">
                <span className="block font-semibold text-ink-900 truncate">{r.name}</span>
                <span className="block text-[0.82rem] text-ink-500 truncate">
                  {[r.suburb, r.state].filter(Boolean).join(", ")}
                </span>
              </span>
            </button>
          ))}

          {noResults && (
            <button
              type="button"
              onClick={() => {
                if (embedded) {
                  change(""); // already on the map; just reset the filter
                } else {
                  setOpen(false);
                  router.push("/explore");
                }
              }}
              className="flex items-center gap-2.5 w-full text-left px-4 py-3 hover:bg-paper-100 cursor-pointer"
            >
              <MapPin className="text-chili-500 shrink-0" size={18} weight="fill" />
              <span className="min-w-0">
                <span className="block text-ink-700">
                  {isPostcode ? (
                    <>No food spots found in {trimmed}.</>
                  ) : (
                    <>No spots match &ldquo;{trimmed}&rdquo;.</>
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
