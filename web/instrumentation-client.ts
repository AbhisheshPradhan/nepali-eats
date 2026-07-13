import {
	POSTHOG_ACTIVE,
	POSTHOG_TOKEN,
	POSTHOG_UI_HOST,
} from "@/lib/posthog";

// PostHog boots here (Next's instrumentation-client convention: runs once per
// page load, before hydration). Events go through the /ingest rewrite in
// next.config.ts so ad blockers don't drop them. The SDK is the SLIM build
// (39KB gzip vs 74KB full) loaded via dynamic import inside the guard, so it
// never blocks hydration and costs 0 bytes when analytics is off; features the
// slim build excludes (surveys, dead-clicks, web-vitals) lazy-load through the
// /ingest/static rewrite if ever enabled in the PostHog project. The
// 2026-06-25 defaults snapshot captures SPA pageviews on history changes, so
// App Router navigations need no extra wiring. Custom events: lib/analytics.
const token = POSTHOG_TOKEN;
const uiHost = POSTHOG_UI_HOST;

if (POSTHOG_ACTIVE && token && uiHost) {
	import("posthog-js/dist/module.slim").then(({ default: posthog }) => {
		posthog.init(token, {
			api_host: "/ingest",
			ui_host: uiHost,
			defaults: "2026-06-25",
			// Pageviews + our named events only. Autocapture would proxy every
			// click through Vercel (5-10x the request volume) for data nothing
			// consumes yet, and the recording flag makes session replay a
			// deliberate code change instead of a PostHog dashboard toggle
			// that silently pushes MBs/session through the /ingest proxy.
			autocapture: false,
			disable_session_recording: true,
		});
	});
}
