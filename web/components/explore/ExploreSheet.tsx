"use client";
import {
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { Drawer } from "vaul";
import { X } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

// useLayoutEffect warns during SSR; the header is only measured on the client, so
// fall back to useEffect on the server to keep the console clean.
const useIsoLayoutEffect =
	typeof window === "undefined" ? useEffect : useLayoutEffect;

// The mobile Explore bottom drawer. Owns the snap position so a drag-settle
// re-renders ONLY this small component — when the snap state lived in
// ExploreClient, every release re-rendered the whole tree (Mapbox + the card
// list) mid-animation, which made closing the sheet feel jerky.
//
// Uniform structure for BOTH states: a measured `peekHeader` (the always-visible
// block) + a scrollable `body`. In LIST state the header is the count + controls
// (2 rows); in DETAIL state it's the spot title + rating + venue/open + the
// Directions/Call CTA. PEEK is sized to whichever header is showing, so the
// collapsed sheet always shows something useful.
//
// Snap points:
//  - PEEK: a pixel snap measured at runtime from the real header height, so the
//    header is NEVER clipped, on any screen / font size / state. A hardcoded px
//    repeatedly proved too short; a fraction shrank on tall phones. Measuring is
//    the only version that self-corrects. See `peekPx`.
//  - HALF: a bit past the middle (map on top, list/detail below).
//  - FULL: the whole area under the search bar.
const SNAP_HALF = 0.62;
const SNAP_FULL = 1;
// px used before the header is measured (SSR / first paint), then replaced.
const PEEK_FALLBACK = 220;
// the grip block above the header: mt-2.5 (10) + h-1.5 (6) + mb-1.5 (6).
const GRIP_BLOCK = 22;
// a sliver of the body left peeking under the header so it reads as scrollable,
// plus a little breathing room so the last header row never sits flush at the fold.
const PEEK_REVEAL = 22;

export function ExploreSheet({
	title,
	resetKey,
	peekHeader,
	body,
	isDetail = false,
	topInset,
	collapseSignal = 0,
	showClear = false,
	onClearAll,
}: {
	title: string;
	// Identity of the current body content (spot id in detail, "list" otherwise).
	// Scroll resets on THIS, not `title`, so tapping between two same-named
	// branches (Momo Central Glenroy/Brunswick, the 8848 chain) still resets.
	resetKey: string | number;
	// the always-visible block; PEEK is sized to this. LIST: count + controls.
	// DETAIL: spot title + details + CTA.
	peekHeader: ReactNode;
	// the scrollable rest (LIST: the cards; DETAIL: photos + full-page link).
	body: ReactNode;
	isDetail?: boolean;
	// px from the viewport top to the bottom of the search bar; the sheet's full
	// height stops here so its controls never clip behind the (higher z) bar.
	topInset: number;
	// bumped on any real map gesture; a half-open sheet collapses to peek so the
	// map is visible (Google style). Ignored when at peek/full.
	collapseSignal?: number;
	// LIST state: show the clear-all X (there are active filters / a dish).
	showClear?: boolean;
	onClearAll?: () => void;
}) {
	const [snap, setSnap] = useState<number | string | null>(SNAP_HALF);
	const scrollRef = useRef<HTMLDivElement>(null);
	const headerRef = useRef<HTMLDivElement>(null);

	// PEEK = the real height of the always-visible header, measured from the DOM
	// so it's never clipped. Recomputed on content/viewport/state change.
	const [peekPx, setPeekPx] = useState(PEEK_FALLBACK);
	const snapPoints = useMemo(
		() => [`${peekPx}px`, SNAP_HALF, SNAP_FULL],
		[peekPx],
	);
	const SNAP_PEEK = snapPoints[0];

	// Google-Maps scroll rule: the sheet body only scrolls when the sheet is
	// FULLY expanded; below that, a swipe anywhere drags the sheet (no gesture
	// fight between body scroll and sheet drag).
	const scrollable = snap === SNAP_FULL;

	// Opening a spot: make sure the sheet is at least half-open so the photos are
	// visible (a peeked sheet would stay peeked otherwise). The peek snap is the
	// only string snap, so `typeof s === "string"` means "at peek".
	useEffect(() => {
		if (isDetail)
			setSnap((s) =>
				typeof s === "string" ||
				(typeof s === "number" && s < SNAP_HALF)
					? SNAP_HALF
					: s,
			);
	}, [isDetail]);

	// Size PEEK to the always-visible header (+ grip + a sliver of the body). A
	// ResizeObserver attached ONCE is the source of truth: it fires on ANY header
	// height change — the list<->detail content swap, the Filters panel
	// expanding, late-mounting rows (the open-status badge), font loads — so peek
	// is always correct without racing a dependency at one fragile moment. (The
	// earlier [isDetail, title] version measured before those rows laid out, which
	// showed only the title in detail and clipped the controls in the list.)
	useIsoLayoutEffect(() => {
		const el = headerRef.current;
		if (!el) return;
		const measure = () =>
			setPeekPx(
				Math.ceil(el.getBoundingClientRect().height) +
					GRIP_BLOCK +
					PEEK_REVEAL,
			);
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		window.addEventListener("resize", measure);
		return () => {
			ro.disconnect();
			window.removeEventListener("resize", measure);
		};
	}, []);

	// Keep the controlled snap valid when the measured peek changes (e.g. the
	// Filters panel expands, or list<->detail swap changes the header height):
	// the old peek string is no longer in snapPoints, so swap it. Numbers untouched.
	useEffect(() => {
		setSnap((s) => (typeof s === "string" ? snapPoints[0] : s));
	}, [snapPoints]);

	// Map gesture: collapse a half-open sheet to peek so the map is visible.
	// Only acts from HALF — a peeked/full sheet is left as the user put it.
	useEffect(() => {
		if (!collapseSignal) return; // 0 = initial mount, not a gesture
		setSnap((s) => (s === SNAP_HALF ? `${peekPx}px` : s));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [collapseSignal]);

	// New content (spot opened/closed or a different spot) -> back to the top.
	// Keyed on resetKey (spot id), not the display title, so same-named spots
	// still reset scroll on switch.
	useEffect(() => {
		scrollRef.current?.scrollTo({ top: 0 });
	}, [resetKey]);

	const bodyClass = cn(
		"flex-1 min-h-0 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]",
		// overscroll-none (not -contain): `contain` blocks scroll-chaining to the
		// map but on iOS still keeps the local rubber-band bounce, which eats a
		// drag-down at scrollTop 0 so the sheet won't collapse. `none` kills the
		// bounce too, handing that gesture to vaul's drag-to-collapse.
		scrollable ? "overflow-y-auto overscroll-none" : "overflow-hidden",
	);

	return (
		<Drawer.Root
			open
			modal={false}
			dismissible={false}
			snapPoints={snapPoints}
			activeSnapPoint={snap}
			setActiveSnapPoint={setSnap}
		>
			<Drawer.Portal>
				<Drawer.Content
					aria-describedby={undefined}
					style={{ height: `calc(100dvh - ${topInset}px)` }}
					className="md:hidden fixed inset-x-0 bottom-0 z-[1150] flex flex-col rounded-t-2xl border-t border-paper-300 bg-paper-50 outline-none shadow-[0_-10px_30px_rgba(43,26,18,0.18)]"
				>
					<Drawer.Title className="sr-only">{title}</Drawer.Title>
					<div
						className="mx-auto mt-2.5 mb-1.5 h-1.5 w-10 shrink-0 rounded-full bg-sand-400"
						aria-hidden
					/>
					{/* Clear-all + collapse (list state only; detail has its own X) */}
					{!isDetail && showClear && (
						<button
							type="button"
							aria-label="Clear filters"
							onClick={() => {
								onClearAll?.();
								setSnap(SNAP_PEEK);
							}}
							className="absolute top-2.5 right-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-paper-200 text-ink-700 hover:bg-paper-300 cursor-pointer"
						>
							<X size={16} weight="bold" />
						</button>
					)}
					<div ref={headerRef} className="px-4 shrink-0">
						{peekHeader}
					</div>
					<div ref={scrollRef} className={bodyClass}>
						{body}
					</div>
				</Drawer.Content>
			</Drawer.Portal>
		</Drawer.Root>
	);
}
