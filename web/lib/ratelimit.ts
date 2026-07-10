// Fixed-window rate limiter on Upstash Redis' REST API (no SDK, mirroring
// lib/email's no-dependency pattern). Serverless instances can't share
// in-memory counters, so the count lives in Redis: INCR + EXPIRE NX is one
// pipelined round-trip.
//
// FAIL-OPEN by design: missing env vars (dev, previews), Upstash outages, or
// slow responses (>2s) all allow the request. The limiter is abuse control,
// not a security boundary — it must never be the reason the API is down.
//
// Env: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (Upstash dashboard)
// or the KV_REST_API_* names Vercel's marketplace integration injects.

const REST_URL =
	process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const REST_TOKEN =
	process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

// The client's best-known IP. Order matters behind Cloudflare's proxy:
// Vercel's x-real-ip / x-forwarded-for report Cloudflare's EDGE IP for
// proxied traffic; the actual client is in cf-connecting-ip, which Cloudflare
// overwrites on every request it proxies. ACCEPTED LIMIT: a client that
// reaches the Vercel origin directly (SNI to Vercel's IP; the vercel.app host
// itself edge-redirects before functions run) can spoof cf-connecting-ip and
// rotate per-IP buckets. Per-IP limiting is a speed bump for casual abuse,
// not a security boundary — the claims route's per-ACCOUNT limit and the
// Cloudflare layer carry the real weight.
export function clientIp(request: Request): string {
	const h = request.headers;
	const ip =
		h.get("cf-connecting-ip") ??
		h.get("x-real-ip") ??
		h.get("x-forwarded-for")?.split(",")[0]?.trim();
	// `||` not `??`: an empty or leading-comma header must not become a
	// shared "" bucket for every such client.
	return ip || "unknown";
}

// Count a hit against `key` and report whether it stays within `limit` per
// `windowSecs`. Fixed window (coarse but one round-trip): the first hit
// creates the key with a TTL, EXPIRE's NX flag keeps later hits from
// extending the window.
export async function rateLimit(
	key: string,
	limit: number,
	windowSecs: number,
): Promise<{ ok: boolean; retryAfterSecs: number }> {
	const open = { ok: true, retryAfterSecs: 0 };
	if (!REST_URL || !REST_TOKEN) return open;
	try {
		const res = await fetch(`${REST_URL}/pipeline`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${REST_TOKEN}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify([
				["INCR", `rl:${key}`],
				["EXPIRE", `rl:${key}`, String(windowSecs), "NX"],
			]),
			signal: AbortSignal.timeout(2000),
		});
		if (!res.ok) {
			// 401 = bad/rotated token: limiter silently dead without this line
			console.warn(`[ratelimit] Upstash HTTP ${res.status}; failing open`);
			return open;
		}
		// Per-command failures arrive INSIDE a 200 as {error} slots. If EXPIRE
		// failed, the counter has no TTL and would never reset — enforcing it
		// would be a PERMANENT block, so that case must fail open too.
		const slots = (await res.json()) as { result?: unknown; error?: string }[];
		if (slots[0]?.error || slots[1]?.error) {
			console.warn(
				"[ratelimit] command error; failing open:",
				slots[0]?.error ?? slots[1]?.error,
			);
			return open;
		}
		const count = Number(slots[0]?.result);
		if (!Number.isFinite(count) || count <= limit) return open;
		return { ok: false, retryAfterSecs: windowSecs };
	} catch (e) {
		console.warn("[ratelimit] failing open:", (e as Error).message);
		return open;
	}
}
