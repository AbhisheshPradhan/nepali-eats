# Editing a restaurant from its detail page — plan

Goal: let an admin edit a restaurant **from its own detail page**
(`/restaurant/[slug]`), instead of navigating to the separate `/admin/[slug]`
form. Admin-only for v1 (no auth changes). Owners come later with the claim flow.

## Decision: a tabbed "Edit Details" drawer (not in-place)

We prototyped in-place ✓/✕ field editing (Elementor-style) and decided against it
as the editing surface: structured fields (selects, tags, contact icons, hours)
don't map to click-to-edit text, so in-place needed a dozen bespoke widgets. The
existing `RestaurantEditor` already has every field and saves through proven
endpoints. So the chosen surface is a **slide-over drawer** opened by the Edit
Details toggle, with **3 tabs** and **one global Save**:

- **General** — every batched field (name, blurb, venue, halal, tags, price,
  popular, hours, phone/website/email, menu link, socials) behind **one Save** =
  a single PATCH to `/api/admin/restaurants/[slug]`.
- **Photos** — cover (crop), gallery (upload/reorder/primary/delete), logo.
  **Instant** (file uploads commit immediately; no Save needed).
- **Menu** — menu file uploads. **Instant.**

Save lives in a persistent footer with a dirty indicator; it warns on close if
there are unsaved changes. No delete button in the drawer (stays on `/admin`).

**Built:**
- `components/edit/EditModeProvider.tsx` — context + `canEdit` fetch; `editMode`
  now means "drawer open".
- `components/edit/EditToggle.tsx` — the cover "Edit Details" button.
- `components/edit/EditPanelMount.tsx` — connects the toggle to the drawer.
- `components/edit/RestaurantEditPanel.tsx` — the drawer (tabs + one Save +
  instant media), reusing the hours parser, crop modal, and `/api/admin/...`
  endpoints from `RestaurantEditor`.
- `app/api/admin/restaurants/[slug]/editor/route.ts` — GET photos+menu files for
  the drawer (auth + admin gated, like all `/api/admin/*`).
- `app/api/admin/restaurants/[slug]/route.ts` — PATCH now `revalidatePath`s the
  detail page.
- `app/api/admin/media/route.ts` — same-origin admin media proxy
  (`GET ?key=…` → `getMedia()` in `lib/admin/storage.ts`). Re-framing an existing
  photo/cover loads through this, NOT the cross-origin R2 public URL, so the
  canvas export isn't CORS-blocked ("Couldn't load the image"). Reuses the
  server-side `R2_*` creds; no new env.

**Refinements (later pass):**
- Menu tab: uploaded files are clickable view links with an "On page" badge; the
  menu_url helper explains it holds an external link OR an uploaded file's key.
- Photos tab: logo moved to the top (with a "desktop view only" hint), shorter
  cover preview, larger gallery thumbnails.
- Cover gained a re-frame **Crop** button (16:9) alongside upload, sharing one
  `uploadCoverBlob` and the media proxy.

`components/edit/EditableText.tsx` is the (now unused) in-place prototype, kept
for reference / a possible future in-place layer.

---

## Original in-place plan (superseded by the drawer above)

## Interaction model

- The floating **Edit** pencil on the cover becomes an **edit-mode toggle** (no
  navigation). Click → enter edit mode; click again (now an ✕/Done) → exit.
- Edit mode is **client-side state** in an `EditModeProvider` context wrapping the
  page body. The provider also owns the `canEdit` check (`/api/me?restaurantId`),
  so edit mode can only ever be `true` for an admin/owner. Anonymous traffic gets
  the provider with `canEdit=false` and never sees a control.
- **No global Save bar.** Each field saves itself with an inline **✓ / ✕** pair:
  - The ✓/✕ appear only when the field is **dirty** (value differs from saved).
  - **✓** PATCHes just that field, then refreshes; baseline updates; buttons hide.
  - **✕** resets the field to its last saved value (stays in edit mode).
  - Keyboard: **Enter = ✓**, **Esc = ✕** on single-line inputs; multiline blurb
    uses **Cmd/Ctrl+Enter = ✓** (Enter is a newline).
- **Media** (cover / photos / logo) is action-based: the upload/crop/reorder *is*
  the commit, no ✓/✕. Reuses the existing endpoints + crop modal.
- **Booleans** (e.g. `popular`) are a checkbox/toggle: toggling *is* the commit
  (optimistic, revert on error), no ✓/✕.

## Save + cache

- All scalar/text PATCHes hit the existing `PATCH /api/admin/restaurants/[slug]`
  (field allowlist = `EDITABLE` in `lib/admin/queries.ts`). No new endpoint for
  phase 1 — every phase-1 field is already allowlisted.
- The detail page is ISR (`export const revalidate = 3600`). After a successful
  write the route handler calls `revalidatePath('/restaurant/<slug>')` so the
  public cache refreshes; the client calls `router.refresh()` for read-your-own-
  writes. (Old caching model, not Cache Components — confirmed against
  `node_modules/next/dist/docs/.../09-revalidating.md`.)

## Required fields / validation

- **`name` is the only hard requirement** (`NOT NULL`, no default). The PATCH
  layer turns `""` → `null`, which would 500 on `name`. So the name field
  **disables ✓ when empty/whitespace** and trims on save.
- `halal_status`, `popular` are `NOT NULL` but have defaults + constrained inputs,
  so they can't reach `""`. Everything else is nullable → freely clearable.
- Soft (non-blocking) checks: URL-ish format on website/menu/socials; rating 0–5.

## Phases

### Phase 1 — text/scalar inline fields (this is what we build first)
All already in `EDITABLE`; pure frontend.

1. **Edit-mode shell** — `EditModeProvider` (context + `canEdit` fetch), flip the
   Edit pencil to a toggle, wire **name** end-to-end (✓/✕ + empty guard +
   revalidate) as the proof of the pattern.
2. **Remaining text/scalar fields** via one reusable field component:
   - Blurb (`description`, multiline)
   - Details: `price_range`, `tags`, `venue_type` (select), `halal_status`
     (select), `rating`, `review_count`
   - Contact: `phone`, `email`, `website`, `menu_url`, `facebook`, `instagram`,
     `tiktok`, `whatsapp`
3. **Popular** toggle (checkbox, saves on toggle).
4. **Hours** (`opening_hours`) week grid — heaviest control; reuses the parser +
   paste logic from `RestaurantEditor`. Last in phase 1.

### Phase 1.5 — media
Cover (with crop), photo carousel (upload/reorder/primary/delete), logo. Reuses
existing `/cover`, `/photos`, `/logo` endpoints + `CropModal`.

### Phase 2 — location (address + geo) via Mapbox
Address edited as a unit with the pin so text + coordinates never drift:
- Mapbox geocoding **autocomplete** → fills `full_address`/`street`/`suburb`/
  `state`/`postcode` **and** `lat`/`lng` together.
- **Draggable pin** on `DetailMap` to fine-tune `lat`/`lng` only.
- `geom` auto-syncs from `lat`/`lng` via the `trg_set_restaurant_geom` trigger —
  nothing to do there. **Needs `lat`/`lng` added to `EDITABLE`** (floats).
- Rule: `lat`/`lng` change **only** via autocomplete pick or pin drag, never as a
  side effect of editing the display address text.

### Phase 3 — featured
`featured_rank` (number input; blank = not featured; lower = higher in the
state's featured list). Deferred; lives in an "Advanced" affordance, edits one
rank blind so a proper featured-manager view may supersede it.

## Files (phase 1)

- `components/edit/EditModeProvider.tsx` — context + `canEdit` fetch (new).
- `components/edit/EditToggle.tsx` — repurposed Edit pencil → edit-mode toggle (new).
- `components/edit/EditableText.tsx` — reusable inline field w/ ✓/✕ (new).
- `app/restaurant/[slug]/page.tsx` — wrap body in provider, swap display nodes for
  editable ones.
- `app/api/admin/restaurants/[slug]/route.ts` — add `revalidatePath` after PATCH.
