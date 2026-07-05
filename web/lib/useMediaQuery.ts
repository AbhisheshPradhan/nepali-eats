"use client";

import { useSyncExternalStore } from "react";

// Viewport media-query hook with ONE matchMedia subscription per query string,
// shared by every component that asks (the Explore list renders ~30 cards; they
// shouldn't each own a listener). The server snapshot is false, so SSR and the
// first client render agree (mobile default) and the real value lands right
// after hydration.
const queries = new Map<string, MediaQueryList>();
const mql = (q: string): MediaQueryList => {
	let m = queries.get(q);
	if (!m) {
		m = window.matchMedia(q);
		queries.set(q, m);
	}
	return m;
};

// Stable subscribe function per query (useSyncExternalStore resubscribes when
// the function identity changes, so it must be cached, not inline).
const subscribers = new Map<string, (cb: () => void) => () => void>();
const subscribe = (q: string) => {
	let s = subscribers.get(q);
	if (!s) {
		s = (cb) => {
			const m = mql(q);
			m.addEventListener("change", cb);
			return () => m.removeEventListener("change", cb);
		};
		subscribers.set(q, s);
	}
	return s;
};

export function useMediaQuery(query: string): boolean {
	return useSyncExternalStore(
		subscribe(query),
		() => mql(query).matches,
		() => false,
	);
}
