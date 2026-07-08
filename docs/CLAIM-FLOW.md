# Owner claim flow — AS BUILT (Fable, 2026-07-08)

Built autonomously on Abhishesh's instruction; he reviews these decisions with
Opus/Albert and revises as needed. Everything compiles (tsc + build) but has
NOT been click-tested in a browser: run the test plan at the bottom before
pushing.

## The flow, end to end

1. **Entry.** Every UNCLAIMED detail page shows a quiet footer link in the
   info column: "Run this kitchen? Claim it, free." -> `/claim/[slug]`.
   Claimed pages drop the link.
2. **Pitch (public, no auth wall).** `/claim/[slug]` sells it first: keep your
   menu current, own your photos, fix hours in seconds, and "QR menu for your
   tables, coming soon, free" (the FoodHub on-ramp). A marigold callout tells
   them the instant-verification trick: sign up with the email address the
   restaurant lists publicly. Value before commitment: auth happens on the
   button, not before the pitch.
3. **Auth + form.** Signed out -> Clerk modal (`openSignIn`). Signed in -> a
   short form: name + email shown DISABLED from the account (name editable only when an email signup never set one), role (owner/manager), optional note. The claimant-phone field was CUT (2026-07-08): the listed number is the verification anchor and the account email is the follow-up channel; a third contact field was pure friction. Post-review (2026-07-08) the server stopped accepting/storing phone + email from the body entirely (the columns stay in `claims`, unwritten) and lib/phone.ts was deleted — if we ever need a call, we dial the number Google lists, which is already on the restaurant row.
   POST `/api/claims`.
4. **Verification — FINAL (Abhishesh, 2026-07-08):**
   - **Instant lane:** a Clerk-VERIFIED email exactly matching the
     restaurant's listed address = proof of inbox control -> ownership on the
     spot (approved claims row, `email_match=true`, owner + admin emails).
   - **Everyone else:** claim lands `pending`; the admin verifies through the
     restaurant's SOCIALS (channel we independently verified, found-and-saved
     if not on file) and sends a user-bound INVITE LINK (v1.1 below; until
     it's built, the DM conversation + the Approve button do the same job).
     Fallback ladder when no social is findable: listed email -> listed phone
     -> in person.
   - NO "preferred platform" field on the form: any question about where to
     contact the restaurant invites the claimant to steer the channel, which
     is the exact attack this design prevents.
5. **Admin queue** (`/admin/claims`, replaces the stub): table of claims,
   pending first. The "Verify via" column leads with the restaurant's SOCIAL
   links (or a "find + save first" nudge when none are on file), listed phone
   as fallback. The `?claim=` deep link highlights + scrolls to that row. Approve
   -> ownership granted + approval email. Reject -> status only, and the UI
   reminds you: NO automated rejection email, write the personal note
   yourself (Abhishesh's explicit choice).
6. **The payoff.** Ownership = a `restaurant_owners` row. The detail page's
   existing Edit pencil + `RestaurantEditPanel` light up for the owner
   (`/api/me?restaurantId` already reported admin-or-owner; that plumbing was
   pre-built). "My restaurants" appears in the user menu (desktop UserButton +
   mobile header) -> `/my-restaurants`, listing their spots with Open & edit.
   Verified pages show the **Owner-verified badge** (soft coriander SealCheck
   pill beside Featured/Popular on the detail header; tooltip "The owner
   keeps this page's details current"): a trust mark for diners, quiet FOMO
   for the unclaimed spot next door.

## Decisions taken (and why)

- **One sign-in, no separate owner accounts.** Ownership is a RELATIONSHIP
  (restaurant_owners rows), not an account type; a user is eater and owner at
  once. Separate business logins double the auth surface for zero value at
  this scale.
- **One owner per restaurant** (unique index restaurant_owners_one_owner);
  one owner may hold many restaurants. Brand ≠ ownership stays intact
  (claiming one 8848 branch grants nothing else).
- **No documents.** Control of a listed channel (social DM, listed email,
  listed phone) is stronger proof than uploadable paperwork, with none of
  the friction or privacy liability. If a dispute ever needs more: an
  optional ABN *field*, never uploads — or Google's trick, a video from
  inside the kitchen, as the last-resort dispute lane.
- **Editor routes moved to a SHARED surface `/api/editor/...`** instead of
  duplicating them for owners. `/api/admin/...` is hard edge-gated to the
  admin allowlist in proxy.ts, so owners could never reach it. The per-
  restaurant editor handlers (PATCH fields, editor media GET, photo upload/
  reorder/replace/primary/delete, cover, logo, menu files, crop media proxy)
  now live under `/api/editor`, guarded per-route by `requireEditorBySlug`/
  `ByPhotoId` (web/lib/editor/guard.ts): admin OR verified owner OF THAT
  RESTAURANT, always scoped. The old `/api/admin/...` URLs are re-export
  shims so triage/review/old-form admin tools work unchanged behind the edge
  gate. The crop proxy twin (`/api/editor/media`) scopes by the restaurant id
  embedded in every media key (photos|covers|logos|menus/<id>/...).
- **Owner field policy** (OWNER_FIELDS in lib/editor/guard.ts, enforced
  SERVER-side; the UI also hides what it can): owners may edit name,
  description, venue type, halal status, price, hours, menu URL,
  phone/website/socials, photos, cover, logo, menu files. They may NOT
  touch: **email** (removed from OWNER_FIELDS post-review 2026-07-08: it is
  the Lane-A instant-claim anchor, so only an admin may move it; the panel
  hides the field for owners), tags (SEO vocabulary, seeder-owned; field
  hidden in their panel), featured/popular/rating/reviewCount
  (editorial/derived), address fields (drive geo + landing pages; admin-only
  for now); restaurant DELETE stays strictly admin. **Name edits allowed** —
  judgement call: it is their identity, it is revocable, and blocking it
  creates support load. Revisit if abused.
- **Link fields are validated server-side (post-review 2026-07-08):**
  website/menuUrl/facebook/instagram/tiktok/whatsapp must start with
  `http(s)://` (`invalidLinkField` in lib/editor/guard.ts, applied to admins
  too). They render as raw `<a href>` on the public detail page, so a stored
  `javascript:` link would otherwise execute in every diner's browser.
- **Email HTML is escaped (post-review 2026-07-08):** every claimant-typed
  string (name, note) and account email interpolated into a claim email body
  goes through `escapeHtml` (lib/email.ts) — the form's disabled fields don't
  bind a hand-rolled POST, so unescaped values were live HTML (phishing
  links) in the admin inbox.
- **Site URL comes from NEXT_PUBLIC_SITE_URL only** (lib/site.ts, decided
  2026-07-08): no hostname is hardcoded anywhere; moving domains is a
  one-line env change in Vercel. The env var MUST be set in the Vercel
  project (https://nepali-eats.vercel.app until the real domain) or
  canonicals/email links fall back to localhost.
- **No owner item-level menu editing (v1).** The panel's menu tab for owners
  reads "upload your latest menu... we update the dishes on your page from
  it within a few days", and an owner upload EMAILS THE ADMIN (the reseed trigger).
- **Owner menu model (final, 2026-07-08): CONCIERGE by default.** Owners
  hand us the menu (panel upload, or hello@ with the file when urgent) and
  we update it for them — menus change rarely, and most owners won't touch a
  self-serve editor anyway. The panel's owner menu tab says editing is
  "coming soon". Self-serve structured editing ships AFTER LAUNCH, with the
  QR feature, per the design below.
- **QR-menu era REQUIRES structured self-serve editing (agreed 2026-07-08).**
  Once an owner's QR menu renders from the structured menu, "we update it in
  a few days" is untenable: a price change must be live at the table TODAY.
  Design for that build (ships WITH the QR feature; it IS the FoodHub
  editor): owners own CONTENT (item names, descriptions, prices, variants,
  category grouping, hiding sold-out items); the SYSTEM owns TAGS (the
  taxonomy hard-errors on unknown slugs; owners never see them). Content
  edits to existing items flow live instantly (tags unaffected). NEW
  owner-added items go live on the menu page immediately but stay invisible
  to dish search until tagged — graceful degradation, no gate. Tagging pass:
  AI-proposed (the OpenAI vision menu-parsing route fits here) -> admin
  confirm, mirroring the seeder's review discipline.
- **Emails** (web/lib/email.ts, Resend REST API, console-noop without a key):
  submit -> owner "24 hours" note (unless instant) · new pending claim ->
  admin deep link · approve -> owner "yours to edit" · auto-approve -> admin
  audit note · owner menu upload -> admin reseed nudge · reject -> NOTHING
  automated (personal note; the UI reminds you). All sends are AWAITED before
  the response returns (post-review 2026-07-08): Vercel can freeze the
  function once the response is out, silently dropping a fire-and-forget
  send. sendEmail never throws, so a failed email still never fails the flow.
- **Every mutation busts the detail page's ISR cache** (post-review
  2026-07-08): field PATCH already did; now cover/logo/photo/menu uploads,
  photo re-crop/primary/delete, and BOTH ownership-grant paths call
  `revalidatePath(/restaurant/[slug])`, so an owner's change (and the
  verified badge / claim CTA swap) is live immediately, not in up to 1h.
- **Support address is hello@nepalieats.com.au everywhere** (2026-07-08):
  the disclaimer page's stray support@ was aligned.
- **Copy** is written in Aasha's voice and she completed her review pass
  2026-07-08 (7 findings, all resolved: contractions in emails, "dishes on
  your page" not "listed", owner-facing email close, mailto
  hello@nepalieats.com.au in the disputed-claim block, dynamic tab title).

## Schema (APPLIED to Neon 2026-07-08; scraper/schema-claims.sql)

`claims` (id, restaurant_id, user_id, name, role, phone, email, note,
email_match, status pending|approved|rejected, reason, created_at,
decided_at) + status/restaurant indexes + the `restaurant_owners_one_owner`
unique index. (`phone` and `email` are no longer written as of 2026-07-08 —
kept in the table because dropping columns needs a coordinated deploy and
they're harmless nullable columns.) Additive: nothing DEPLOYED reads these until this code ships,
so the early apply is safe; deploy code + keep them together per the
shared-Neon rule.

## Files (N new / M modified)

- N scraper/schema-claims.sql · N web/lib/email.ts · N web/lib/editor/guard.ts
- N web/app/claim/[slug]/page.tsx · N web/components/claim/ClaimForm.tsx
- N web/app/api/claims/route.ts · N web/app/api/admin/claims/[id]/route.ts
- M web/app/admin/claims/page.tsx (stub -> queue) ·
  N web/components/admin/ClaimsTable.tsx
- MOVED web/app/api/admin/{restaurants/[slug]/**, photos/[id]} ->
  web/app/api/editor/... (+ admin re-export shims) ·
  N web/app/api/editor/media/route.ts
- M web/components/edit/EditModeProvider.tsx + RestaurantEditPanel.tsx
  (isAdmin in context; /api/editor base URLs; Tags admin-only; owner menu-tab
  copy)
- M web/app/api/me/route.ts (`owned` flag) · M web/components/AppUserButton.tsx
  + web/components/Header.tsx (My restaurants item) ·
  N web/app/my-restaurants/page.tsx
- M web/app/restaurant/[slug]/page.tsx (claimed check + claim link)

## NEEDS ABHISHESH

1. **hello@nepalieats.com.au must exist** once the domain lands: the
   disputed-claim block on the pitch page links it (added to the CLAUDE.md
   deploy checklist).
1. **RESEND_API_KEY** (+ optional ADMIN_EMAIL, EMAIL_FROM) in web/.env.
   Without it every email is a console log (flows still work). Resend sandbox
   only delivers to YOUR OWN address until a sending domain is verified:
   admin notifications work day one, owner-facing mail needs the launch
   domain. Placeholder already sits in web/.env.example.
2. **Click-test the whole flow in dev** (plan below): built blind, compiles
   clean, never rendered.
3. **Aasha pass** over the pitch page, form microcopy and all five emails.
4. **Revocation is SQL for now**: `DELETE FROM restaurant_owners WHERE
   restaurant_id = <id>;` — an admin revoke button is the natural follow-up.
5. Open calls I decided (revise freely): managers may claim (role recorded on
   the claim); owner name-edits allowed; no rate limit on POST /api/claims
   yet (dup-pending check per user+restaurant exists; Cloudflare covers the
   rest at launch).

## v1.1: OWNER INVITE LINKS (decided 2026-07-08, for Albert to build)

**REFINED 2026-07-08 (final shape): confirmation links, not bearer invites.**
The message to the restaurant's verified channel (email or DM) is a CHALLENGE
naming the claimant: "{name}, who says they're the {role} of {restaurant},
asked to manage your page" with two links — **Approve** (completes the pending
claim for the account that filed it; claimant gets the you're-in email) and
**Block** (rejects + flags). No link forwarding, no redeem-as-the-right-account
gymnastics; the restaurant's click on its own channel IS the verification, and
the happy path (claimant reads the inbox themselves) is the same single click.
Third-party/fraud case: the restaurant either blocks or ignores — links are
single-use, expire in 48h (regenerable one-click), silence = default deny, and
approvals stay revocable from the queue. Tokens live in `owner_invites`
(claim_id-bound); everything else in this section (channel policy, ladder,
Prepare DM helper, save-back rule) unchanged.

Inverts the flow for OUTBOUND: instead of inbound claim -> queue -> call,
Abhishesh initiates (or has already verified by phone/DM/email) and sends a
single-use invite. Possession of the link IS the verification, because it was
delivered to a channel the restaurant controls (their listed email, their
Instagram DM, or read out to the owner on the phone) — the same
proof-of-control principle as Lane A, extended to every channel.

- **One table, three invite shapes** (`owner_invites`: token uuid default
  gen_random_uuid, restaurant_id, claim_id NULL, bound_user_id NULL, channel,
  created_by, created_at, expires_at, redeemed_by, redeemed_at, revoked_at;
  one active per restaurant, restaurant must be unclaimed at redemption):
  1. **COLD invite (outreach, decided 2026-07-08):** no claim, no account
     exists. BEARER token — whoever holds it signs up and gets the
     restaurant, because delivery to the verified channel IS the proof.
     Generated via POST /api/admin/invites {slug}; surfaced as an admin-only
     "Copy invite link" button on the restaurant detail page (you're already
     there grabbing the handle to DM). Redemption = pitch + Clerk sign-up +
     one confirm -> grant + approved claims row (reason "invite") + owner
     email + ADMIN REDEMPTION NOTIFICATION. Expiry: 7 days (cold DMs sit in
     Message Requests), regenerable one-click.
  2. **Claim-initiated challenge:** pending claim exists -> Approve/Block
     links to the restaurant's channel (see REFINED note above). claim_id
     set; Approve completes that claim for its account. 48h expiry.
  3. **Bound invite:** bound_user_id set; only that account can redeem
     (belt-and-braces variant of 2 when delivering a raw link instead of
     Approve/Block buttons).
- Admin: a "Copy invite link" action per restaurant (claims table + admin
  restaurant pages). Link: `/claim/invite/[token]`.
- **Channel policy (the iron rule):** the invite goes ONLY to a channel WE
  independently verified the restaurant controls — the on-file social/email
  (scraped from their own site), or one the admin FINDS during the claim and
  cross-checks (profile address/phone/website matches our Google data). NEVER
  a handle the claimant supplies. When a lookup succeeds, SAVE the handle to
  the restaurant row (edit panel social fields) so the dataset improves with
  every claim — the 43% on-file social coverage is a floor of the scrape
  (own-website links only), not of reality; proven live with Everest Function
  Centre's Facebook, found + saved 2026-07-08.
- Channel ladder when no social is findable: on-file email; else phone the
  listed number (the call is the verification, then send the link wherever
  they say on that call). 9 spots have no channel at all: in-person only.
- Redemption page: shows the restaurant + the same pitch perks -> Clerk auth
  -> one button -> grantOwnership + approved claims row (reason "invite"),
  same emails as approval. Expired/used/claimed -> friendly dead-end with
  the normal /claim/[slug] path offered.
- The outreach templates below then swap {claim link} for {invite link} in
  the DM + email: one tap from DM to owner, zero forms, zero queue.
- Inbound /claim/[slug] stays for organic discovery (someone finds their
  page without being contacted).

## Owner outreach playbook (POST-LAUNCH; Aasha, 2026-07-08)

Community-first, campaign-second: these owners delete "grow your business"
directory spam weekly, so trust is the product. Sequence: (1) Abhishesh claims
his 5-10 regular spots IN PERSON (show them their page over a plate of momo:
word of mouth in the Harris Park/Auburn circles beats any campaign), (2)
Instagram DMs with a SCREENSHOT of their own page (the DM is this audience's
real business channel), (3) email to the 171 on-file addresses from hello@
(each with a direct /claim/[slug] link — replying to the on-file inbox means
Lane A verifies them instantly; the campaign IS the verification). Name the
catch honestly (free, stays free, paid things later will be announced, nothing
gets taken away). Time waves to the calendar: pre-Dashain/Tihar or momo
festival season, framed as "get your page right before the rush." Track with
?src=email / ?src=dm on the links. Once the first wave lands: Owner-verified
badges + a "joined by …" line on the pitch page start the FOMO loop.

### Templates (ready to send once hello@ exists)

**In person (the seed round, for Abhishesh):**
> "Have you seen your page on NepaliEats? [show phone] That's your whole
> menu, your hours, your photos. I run the site. Claim it and it's yours to
> edit, free. And when our QR table menus land, you get those free too."

**Instagram DM (3 sentences on purpose; attach a screenshot of THEIR page):**
> Namaste! We put {restaurant} on NepaliEats, the map of every Nepali kitchen
> in Australia, and your menu's already on your page (screenshot attached).
> If you want the keys, claim it free here: {claim link}. No catch, it stays
> free; we built it so more people find real Nepali food.

**Email (from hello@nepalieats.com.au, subject: "Your kitchen is on
NepaliEats. Want the keys?"):**
> Namaste {name or restaurant},
>
> We're NepaliEats, a map of every Nepali restaurant in Australia, built by
> people who eat this food. {Restaurant} is already on it, menu and all:
> {page link}.
>
> If it's your kitchen, claim it here: {claim link}. Because we're writing to
> the email address your restaurant lists, signing up with this address
> verifies you instantly. Then your menu, photos and hours are yours to edit
> whenever they change.
>
> It's free and stays free. When we build paid extras later you'll hear it
> from us first, and nothing you have gets taken away. First one coming: a QR
> menu for your tables, also free.
>
> {Abhishesh, NepaliEats}

## Test plan (dev)

1. Unclaimed detail page -> "Run this kitchen? Claim it, free." -> pitch.
2. Signed out -> button opens the Clerk modal; sign in -> form appears.
3. Submit with a non-matching email -> pending state; server console shows
   the two email logs; /admin/claims lists it; the emailed
   `?claim=<id>` link highlights the row.
4. Approve -> row flips to approved; the page header gains the coriander
   Owner-verified badge; as that user the detail page now shows
   the Edit pencil, the user menu gains "My restaurants", /my-restaurants
   lists the spot.
5. As owner: edit blurb/hours (saves via /api/editor), Tags field absent,
   menu upload logs the admin nudge; `curl -X PATCH .../api/editor/...` with
   `{"tags": ...}` silently drops it; DELETE on the restaurant returns 403.
6. Lane A: set a test restaurant's `email` to a second account's verified
   address -> claim -> instant approval screen.
7. Reject path: new claim, reject -> no email logged, UI reminder shows.
8. Admin regression: triage + review pages still work (their /api/admin URLs
   are shims onto the moved handlers).
