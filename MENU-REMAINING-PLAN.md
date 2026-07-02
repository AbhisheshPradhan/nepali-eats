# Plan: covering the remaining un-menued restaurants

Status at 2026-07-02: **135 / ~440 visible restaurants have menus** (8,756 items). The
easily-seedable pool (own-site PDFs, own-site HTML menu pages, own-domain ordering menus
with *published* prices) is **exhausted**. This doc is the plan for the ~300 that remain.

## The remaining pool (visible, `menu_item_count IS NULL`) ≈ 304

| Bucket | Count | What it is |
|--------|-------|-----------|
| **No source** | ~125 | No `website` and no `menu_url` on record at all |
| **Own domain, not a clean menu** | ~115 | Has an own domain, but it's an ordering-widget (prices load only after picking location/time), a marketing teaser, a Wix/social page with no menu, or the long tail we haven't hand-probed |
| **Own white-label ordering platform** | ~25 | `yumbojumbo` / `tuckerfox` / `square.site` / `foodhub` / `posapt` etc. on their own account |
| **Aggregator only** | ~24 | Uber Eats / DoorDash / Menulog is the only source (marked-up, bot-walled) |
| **Facebook-only** | ~15 | Only web presence is a Facebook page |

These are ordered below by **value-per-effort**. Each needs a capability we don't have in
the current text/render pipeline; that's why they're left.

---

## Approach 1 — LLM vision on menu IMAGES (unlocks the most, esp. "no source")

The biggest bucket (125 no-source + many own-domain) fails because there is no
*machine-readable* menu, but there almost always is a **menu photo**: on the Google
Business Profile, on Facebook, or as an image/PDF on their own site. We already OCR
image-only PDFs via `menu-fetch.js` (pdftoppm → read). Extend that to arbitrary images.

- **Google Places Photos API** — pull the photos for each place (we already store
  `google_place_id`). Many businesses upload a menu board / printed-menu photo. Filter to
  likely-menu images (aspect ratio, lots of text via a cheap OCR pass), then transcribe
  with the same vision flow we use for scanned PDFs. ⚠️ Places Photos is a **paid per-fetch
  SKU** — budget it, and it has display/caching licensing limits (see CLAUDE.md), but
  fetching for one-off transcription (not redisplay) is the lower-risk use.
- **Facebook page photos** (the 15 FB-only + others) — the "Menu" album or timeline photos
  are usually the menu. Manual/download + vision transcribe.
- **Owner-supplied** — the `/add-a-spot` + claim flow (post-launch) should let owners upload
  a menu photo/PDF that routes straight into this vision pipeline.

Value: **high** (only realistic path for the 125 no-source). Effort: medium (build the
image-fetch + vision-extract step; wire a review/dry-run like `seed-menu.js`).

## Approach 2 — Drive the ordering widgets (own white-label + own-domain widget)

~25 own-platform + a chunk of the 115 own-domain are white-label ordering apps
(foodbooking, posapt, nextorder, tapnorder, restaurantongo, Square) where prices only
appear **after** selecting a pickup location/time in the cart. Our render bailed at <20
price tokens.

- Extend the Playwright step to **complete the location/pickup selection** (click the store,
  choose "Pickup", dismiss modals) before scraping — then the full priced menu renders.
  Per-vendor selectors, but there are only ~6 vendors, so ~6 small handlers cover most.
- Skepticism rule still applies: these are online-order prices. Seed them but consider a
  `price_source='ordering'` (already used) so we can caveat "online-order pricing" in the UI.

Value: medium-high (recovers many 300-review spots: taste-of-the-himalayas, the-everest-spice,
thamel-chowk, kantipur, aaku-momo, etc.). Effort: medium (per-vendor Playwright handlers).

## Approach 3 — Aggregator scrape, clearly flagged (24 aggregator-only)

For spots whose ONLY source is Uber/DoorDash/Menulog. Currently skipped because (a) prices
are marked up and (b) bot-walled.

- Scrape via Playwright + the existing Webshare proxies + asset-blocking (same trick that
  works for Google). Uber Eats returns JSON in the page state; parse that rather than DOM.
- Store with a distinct `menu_source='aggregator'` and a **markup caveat** so the UI can
  label prices "via delivery app (may be higher than dine-in)". This is a product decision:
  approximate prices + full dish coverage vs. no menu at all.

Value: medium (fills a real gap for delivery-only brands). Effort: medium; **needs your
call** on whether marked-up prices are acceptable to display with a caveat.

## Approach 4 — Discover a source for the "no source" rows (125)

Many no-source rows just never got a website scraped. Before vision (Approach 1), try to
*find* a source:

- **Places API `websiteUri`** — re-pull; some now have a site since the original scrape.
- **Google search** `"<name> <suburb> menu"` → often surfaces an own site / ordering page /
  a menu PDF we can then run through the normal pipeline.
- Cross-check socials (IG/FB linktree) for an ordering link.
- What's left after that is genuinely "call them / wait for the claim flow."

Value: medium (feeds Approaches 1-2). Effort: low-medium (mostly re-running enrichment).

## Approach 5 — Partial-seed completion (small, already-seeded)

A few seeded rows are **partial** because the ordering platform lazy-loaded and some
sections didn't render: `the-momos-more`, `mountain-gate`, `nepa-kitchen` (momo section
missing), `everest-tea-house`. Approach 2's location-selection fix would let us re-render
and complete these. Low volume, quick wins once Approach 2 exists.

---

## Recommended sequence

1. **Approach 2** first (highest yield for lowest new capability — 6 vendor handlers on the
   render we already have; recovers ~30-50 mid/high-review spots + completes the partials).
2. **Approach 4** (cheap re-enrichment) to refresh `websiteUri` and find sources, feeding 1 & 2.
3. **Approach 1** (vision on images) — the strategic unlock for the 125 no-source; also the
   engine the claim/owner-upload flow will reuse.
4. **Approach 3** (aggregator, flagged) — only if you decide marked-up prices are OK to show.

## Explicitly leave alone
- Non-Nepali leaks (pizza/Thai/Korean/Vietnamese/South-Indian) — see `MENU-SKIPPED-SOURCES.md`
  sections L & O; reclassify/hide, don't seed.
- Dead / parked / cert-broken domains — recheck only if the business relaunches.
- Catering-only sites — `catering=true` is set; no à-la-carte menu to seed.
