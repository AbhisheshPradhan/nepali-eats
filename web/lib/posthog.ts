// Single source of PostHog's host topology. NEXT_PUBLIC_POSTHOG_HOST holds
// the INGESTION host (https://eu.i.posthog.com); the assets host (lazy SDK
// bundles) and app host (toolbar/debug links) are fixed derivations of it.
// Consumed by next.config.ts (the /ingest rewrites, so a bad value fails the
// BUILD via this module's throw) and instrumentation-client.ts. Validated
// because every failure mode here is silent: a trailing slash or the app host
// pasted instead of the ingest host would drop 100% of events with no error
// anywhere (same class of bug as the NEXT_PUBLIC_SITE_URL launch-day
// double-slash, see lib/site.ts).
const rawHost = process.env.NEXT_PUBLIC_POSTHOG_HOST?.replace(/\/+$/, "");

if (rawHost && !/^https:\/\/(eu|us)\.i\.posthog\.com$/.test(rawHost)) {
	throw new Error(
		`NEXT_PUBLIC_POSTHOG_HOST must be a PostHog ingestion host like https://eu.i.posthog.com, got "${process.env.NEXT_PUBLIC_POSTHOG_HOST}". If PostHog is ever self-hosted, update the shape check in lib/posthog.ts.`,
	);
}

export const POSTHOG_TOKEN = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
export const POSTHOG_INGEST_HOST = rawHost;
export const POSTHOG_ASSETS_HOST = rawHost?.replace(
	".i.posthog.com",
	"-assets.i.posthog.com",
);
export const POSTHOG_UI_HOST = rawHost?.replace(".i.posthog.com", ".posthog.com");

// Analytics is configured only when both halves are present; everything that
// exists solely for PostHog (the rewrites, skipTrailingSlashRedirect) keys off
// this so a build without the env vars behaves like stock Next.
export const POSTHOG_ENABLED = Boolean(POSTHOG_TOKEN && rawHost);

// Should this RUNTIME actually capture? Configured + a real production
// deployment: dev is excluded so local browsing never lands in the shared
// PostHog project, and Vercel PREVIEW deploys are excluded too (they build
// with NODE_ENV=production; NEXT_PUBLIC_VERCEL_ENV tells them apart). A local
// `next build && next start` still captures (VERCEL_ENV absent), which is the
// supported way to test events without deploying. Shared by
// instrumentation-client.ts (init) and lib/analytics.tsx (capture) so the two
// guards can't drift.
export const POSTHOG_ACTIVE =
	POSTHOG_ENABLED &&
	process.env.NODE_ENV === "production" &&
	(process.env.NEXT_PUBLIC_VERCEL_ENV ?? "production") === "production";
