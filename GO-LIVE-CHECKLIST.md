# NepaliEats — Frontend Go-Live Checklist

A focused punch list for getting the frontend (the "client") ready to launch.
The master plan lives in `LAUNCH.md`; this is the working frontend checklist.

## ✅ Done

- [x] Homepage stat is computed live, rounded down to the nearest 50
      (`web/app/page.tsx`); with 522 visible it now renders **500+**.
- [x] Static `<title>`/description in `web/app/layout.tsx` now say **500+**,
      matching the live homepage stat.

## 📐 Photo aspect-ratio standard (DECIDED)

Mirrors how UberEats/DoorDash handle photos: squarer tiles in lists, wide banners
for heroes, everything `object-cover` center-cropped to a fixed box (no re-encoding
of source files needed).

- **Cards / tiles / thumbnails → 4:3** (`aspect-[4/3]`). Matches ~64% of our photos
  (least cropping), food-friendly. Applies to: PlaceCard, craving tiles, story
  list cards, gallery thumbs.
- **Full-bleed heroes → 16:9** (`aspect-[16/9]`). Applies to: restaurant detail
  hero, blog hero (featured + detail), OG image.
- Always `object-cover` so any source shape conforms via crop. Reversible (display
  box only).
- **Cover photo (DONE):** a dedicated standalone field, like the logo. `cover_key`
  (+ `cover_source`, `cover_attribution`) on `restaurants`, with its own `/admin`
  upload slot, stored under `media/covers/<id>/`. Serves both the 4:3 card and the
  16:9 hero; the read path resolves `COALESCE(cover_key, first gallery photo)` and
  the gallery excludes the cover (no duplicate). Backfilled from each restaurant's
  former primary photo; the redundant gallery rows were hard-deleted and the files
  moved into `covers/`. New uploads set `cover_source='upload'`.

Recommended image sizes (guidance, NOT enforced):

- **Craving tile** — 4:3, **640×480** (JPG or WebP). Small homepage tiles only.
- **Restaurant photo** — 4:3, **1600×1200** (one photo feeds the 4:3 card and the
  16:9 hero crop; keep the subject centred). Min ~1200×900 before the hero softens.
- **Cover/hero photo** — 16:9 framing, **~1600×900** (landscape works best).
- These are recommendations shown as hints in `/admin`, not validated/blocked.
  `object-cover` makes any size render; smaller just looks softer.

Conformance audit:

- [x] PlaceCard grid cards — already `aspect-[4/3]`
- [x] Restaurant-detail gallery thumbs — already `aspect-[4/3]`
- [ ] Craving tiles — set explicit `aspect-[4/3]` when real photos go in
- [ ] Story list thumbs — switch `h-[170px]` → `aspect-[4/3]`
- [ ] Restaurant-detail hero — switch `h-[280px]` → `aspect-[16/9]`
- [ ] Story featured + detail hero — switch fixed height → `aspect-[16/9]`

## 🎨 Brand assets (Abhishesh)

- [x] **App icon** — custom `app/icon.png` added (default `favicon.ico` removed).
- [ ] **Apple touch icon** — add `app/apple-icon.png` for iOS home-screen.
- [x] **OG image** — programmatic OG cards live for home, restaurant, and
      location pages (`app/opengraph-image.tsx` + per-route variants)

## 🛠 Build items

- [ ] **Food images on craving tiles** — swap the single generic `Cookie` icon for
      real DB photos per category (`web/components/CravingCarousel.tsx`).
      momo / Newari / Tibetan / veg / Nepali-Indian have photos; Thakali keeps the
      gradient fallback
- [ ] **Blog hero images** — all 3 posts fall back to a fork icon; assign real
      photos via `heroImage` (`web/lib/stories.ts`)
- [ ] **Blog copy review** — run each post through copy-editing + the human-copy standard
- [ ] **Blog layout/readability** — tighten the `/stories/[slug]` template typography/spacing
- [ ] **More blog posts** — write 1–2 additional stories before launch
- [ ] **Mobile responsive audit** — full code review of every page against
      responsive / web-interface guidelines; fix tap targets, overflow, breakpoints, nav

## 🔎 Pre-flight (before deploy)

- [ ] `npx tsc --noEmit` clean
- [ ] `npm run build` clean
- [ ] Click through Home, Explore, a restaurant, a city/suburb, /momo, a tag, Stories
      on a phone viewport

## 🚀 Config to go live (frontend-facing parts of LAUNCH.md §3)

- [x] **Env vars on Vercel:** `DATABASE_URL` (Neon), `NEXT_PUBLIC_MAPBOX_TOKEN`,
      Clerk keys, `NEXT_PUBLIC_MEDIA_BASE` (R2), `ADMIN_USER_IDS` set. ⚠️
      `NEXT_PUBLIC_SITE_URL` still `localhost` — set it when the custom domain lands.
- [x] **Media on R2** uploaded + `NEXT_PUBLIC_MEDIA_BASE` set (public reads serve 200)
- [ ] **Canonical host** decided (apex vs www) + 301 redirect (still on `.vercel.app`)
- [ ] **Sitemap/robots** verified live; submit to Search Console + Bing; GA4 installed

## 🔒 Security (before public launch)

- [ ] **Rate-limit the public, unauthenticated DB routes** — `/api/search` and
      `/api/restaurants` are open and each fire Postgres queries (the latter runs
      up to 3 incl. a 3000-row PostGIS pin scan), with no throttle anywhere. That's
      a cheap DoS / Neon-cost amplification vector. Cloudflare bot protection +
      rate rules in front cover most of it, BUT the `.vercel.app` URL bypasses
      Cloudflare entirely, so either (a) confirm Cloudflare rate rules are live and
      the apex is the only reachable host, or (b) add an app-level limiter
      (e.g. Upstash ratelimit) on those two routes. Do before the custom domain
      goes public.

## ⚖️ Optional pre-launch polish (non-blocking)

- [ ] ~237 visible listings are `review_needed` (may not all be Nepali) — spot-check
- [ ] Photos at ~76% — roughly 1 in 4 listings has no image
