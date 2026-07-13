"use client";
import { useEffect } from "react";
import { POSTHOG_ACTIVE } from "@/lib/posthog";

// Custom product events (the event catalogue lives in docs/ARCHITECTURE.md
// §Analytics). Two ways to emit:
//
//   1. trackEvent("search_picked", { ... })  — from client components.
//   2. data-ph-event="contact_clicked" data-ph-kind="call" data-ph-slug={slug}
//      on ANY element (server components included) — one delegated listener
//      (<AnalyticsClicks/>, mounted once in the root layout) picks the click
//      up, no client boundary needed at the call site. Property names must be
//      single words: the DOM dataset camel-cases hyphens, so data-ph-kind ->
//      "kind" survives but data-ph-dish-slug would come out as "dishslug".
//
// Both no-op unless POSTHOG_ACTIVE (prod deploys only) and lazy-import the
// same slim posthog-js module instrumentation-client.ts initialised, so this
// file adds no analytics bytes to pages when PostHog is off.

export function trackEvent(
	event: string,
	properties?: Record<string, string | number | boolean | null | undefined>,
) {
	if (!POSTHOG_ACTIVE) return;
	void import("posthog-js/dist/module.slim").then(({ default: posthog }) => {
		// __loaded = init finished. Only false in the first instants of the
		// page load (init starts pre-hydration); dropping is better than the
		// SDK's console warning on an uninitialised capture.
		if (posthog.__loaded) posthog.capture(event, properties);
	});
}

export function AnalyticsClicks() {
	useEffect(() => {
		if (!POSTHOG_ACTIVE) return;
		const onClick = (e: MouseEvent) => {
			const el = (e.target as Element | null)?.closest?.(
				"[data-ph-event]",
			);
			if (!(el instanceof HTMLElement)) return;
			const { phEvent, ...data } = el.dataset;
			if (!phEvent) return;
			const props: Record<string, string> = {};
			for (const [k, v] of Object.entries(data)) {
				// dataset key "phKind" -> property "kind"
				if (k.startsWith("ph") && v != null)
					props[k.slice(2).toLowerCase()] = v;
			}
			trackEvent(phEvent, props);
		};
		// capture phase so the event is recorded even when React handlers
		// navigate away or stop propagation.
		document.addEventListener("click", onClick, { capture: true });
		return () =>
			document.removeEventListener("click", onClick, { capture: true });
	}, []);
	return null;
}
