# Advisor Review — NepaliEats

*Strategic review, dated 2026-07-04. Author: Claude (acting as founding advisor).
Grounded in the planning docs (`LAUNCH.md`, `ROADMAP.md`, `MENU-PLAN.md`) and live
Neon numbers pulled the same day.*

**One-line summary:** the data work is excellent and nearly done; the company work
hasn't started. You've built a genuinely defensible asset. Stop polishing it in
private, launch it properly, put it in front of the community, and make ten owner
phone calls before writing another feature.

---

## The live picture (2026-07-04)

- 437 visible restaurants (1017 scraped → cleaned to Nepali-only + closures hidden).
- 159 with full menus, 10,010 hand-transcribed dish items in a normalized taxonomy.
- 311 with websites, 33 with real descriptions, 28 flagged `catering`, 36 `popular`,
  **0 with `featured_rank`** (so the homepage "featured" row renders empty).
- Menu coverage is skewed the wrong way: NSW (biggest market) 26%, QLD 59%.
- Live on nepali-eats.vercel.app, but no custom domain, canonicals still point at
  localhost, and Search Console / GA4 aren't connected.
- Dish Search: now built (addresses the "moat isn't surfaced" gap below).

---

## What's going right (genuinely)

1. **The menu dataset is the moat, and you found it early.** 10,010 dish-level items,
   owner-source-only, normalized (momo preparation subtree, protein as a cross-cutting
   facet). Google Maps doesn't have this. Uber Eats has a marked-up subset. It's the
   one asset that's expensive to replicate and it enables the queries a Nepali diner
   actually types ("jhol momo near me", "gundruk in Melbourne").
2. **Editorial integrity is unusually good.** Hiding permanently-closed venues
   everywhere, null-means-unknown booleans never bulk-guessed, treating gluten-free as
   a medical claim, refusing to reuse a chain sibling's menu. That's the trust posture
   of a serious directory, and trust is the whole product.
3. **The SEO plan is better than most funded startups write.** Wave-based indexation
   gated on a completeness score, internal-linking diagnosis, thin-content awareness on
   a new domain.
4. **Cost discipline.** A national data product running at ~$0/month is infinite
   runway to be patient with SEO.

## What's wrong (be honest)

1. **You've talked to zero restaurants.** Biggest problem, dwarfs the rest. 437
   potential customers whose phone numbers are in your DB, and every monetization idea
   (featured, catering, jobs, QR menus) is an untested hypothesis. Ten owner calls in
   July would rank the whole monetization list with more confidence than six more
   months of building. Menu seeding is comfortable work; sales calls are uncomfortable
   work. The project is optimizing for comfort.
2. **You've soft-launched into a void.** Deployed but Google can't see it correctly:
   wrong canonicals, no domain, no GSC, no sitemap submitted, no distribution started.
   Domain trust compounds with age; every week of delay is lost. Meanwhile the flagship
   "featured" homepage row is empty because no venue has a `featured_rank`.
3. **Menu seeding has hit diminishing returns.** 159 menus covers most searched venues.
   Menu #300 for a Launceston takeaway adds almost nothing; the first feature built ON
   the 10k items adds a lot. If you keep seeding, seed Sydney (NSW is under-covered).
4. **The moat data was barely surfaced** — now partly fixed by Dish Search. Keep going:
   dish×city pages ("Momo in Sydney") are the SEO expression of the same asset.
5. **A directory has no retention loop.** The strongest wedge sits in the backlog
   unscoped: the festivals / What's On layer. Dashain/Tihar info lives in unindexed
   Facebook groups. Owning it = seasonal traffic cannon + a reason to return + becoming
   a community institution. Dashain ≈ October; content needs to exist by early
   September. Real deadline, decide now.
6. **Freshness is an unpriced liability.** Menus/hours/closures go stale; no refresh
   cadence. A directory dies on its first confidently-wrong "Open now." Even a quarterly
   re-check of the top 100 + the due Places API re-run keeps it honest.

## The identity question

NepaliEats is not a restaurant directory. It's **the infrastructure layer for Nepali
food culture in Australia**, serving three constituencies: the diaspora (find your
people's food, festivals, jobs), curious Australians (decode an unfamiliar cuisine —
your taxonomy literally does this), and the restaurants (customers, leads, staff,
tools). The listing count is not the moat. The structured dish-level data plus
community trust is. Judge every future product by: *does this deepen the data or the
trust?*

## Monetization, ranked

**Tier 1 (do these):**

1. **Catering & event leads.** Highest transaction value, clearest gap vs Google, and
   the diaspora has constant bhoj/birthday/office-order demand. Concierge v0 (form → you
   broker by phone) validates it with zero code. The 28 `catering=true` venues are the
   call list.
2. **Jobs board — stronger than it's being treated.** No formal training pipeline for
   Nepali cuisine, hiring is word-of-mouth/Facebook, workforce (students, 482/485 visa)
   is invisible to Seek. Structural fit is beautiful: every employer is already a row,
   listings are fresh crawlable content, "Nepali chef jobs Sydney" has volume and zero
   competition, posting a job is an on-ramp to claiming a listing. Launch free for
   liquidity, charge per post later. **Caution:** underpayment is a documented problem in
   this sector; require award-rate acknowledgment and moderate, and that stance becomes a
   brand asset.
3. **Featured / verified listings.** Fine as the first dollar (sells hardest in festival
   season), but sober ceiling: ~5–10% of 437 at $30–100/mo is a few thousand/month. Funds
   the project; isn't the business. First paid dollar → Vercel Pro.

**Tier 2 (the real business, later):**

4. **FoodHub (QR menu / direct ordering SaaS).** The big swing the menu schema was built
   for. Pitch: "your menu is already digitized on the biggest Nepali food site in AU —
   want it as a QR menu + direct ordering without Uber Eats' 30%?" Needs an owner sales
   motion + support you don't have yet. Sequence after 20–30 warm owner relationships.
5. **Diaspora audience sponsorship.** Remittance (IME, WorldRemit), telcos, education/
   migration agents pay to reach AU-Nepali and have no targeted channel. Once you have
   traffic + a newsletter, you're that channel. Monetizes the audience without taxing
   restaurants.

**Tier 3 (skip / park):** reservations (OpenTable owns it; venues are walk-in),
paid membership (weak; a "momo passport" as a *marketing* device is fine), first-party
reviews (brutal cold-start — use editorial "our picks" instead).

## What to do next, in order

1. **This week: actually launch.** Domain, `NEXT_PUBLIC_SITE_URL`, GSC + GA4, submit the
   wave-1 sitemap, hand-pick 15–20 `featured_rank` venues so the homepage isn't empty.
2. **This month: 10 owner phone calls.** Script: verify the listing, mention the claim
   flow, then ask — do you get catering enquiries, is hiring hard, would you pay to stand
   out. That's your monetization research.
3. **Cap menu seeding** at top venues by popularity (Sydney-weighted); reallocate hours
   to distribution (cornerstone blogs, Facebook groups, student associations, directory
   submissions).
4. **Build dish search + dish×city pages.** (Dish search now done — city pages next.)
5. **Ship What's On editorially before Dashain** (~September). Festival season is also
   when featured listings sell hardest.
6. **Money sequence:** featured/verified → catering concierge → jobs board (validated by
   the calls) → FoodHub.

## Note on the claim flow (asked 2026-07-04)

Do **not** build it before launch — matches `LAUNCH.md` §8. Nobody's waiting to claim
until they know the site exists and see it sending customers. Manual approval handles
launch volume (eyeball email/website, `grantOwnership` by hand — the plumbing exists).
There's a known authz-mismatch bug in that path (edit UI shows for owners, write routes
still `requireAdmin()` → 403), so "just turn it on" isn't trivial anyway. Ship only the
claim *pathway* at launch: a "Own this restaurant? Claim it" link → short form/mailto
(an afternoon, an E-E-A-T trust signal, a warm-lead inbox). Build the real self-serve
flow + owner dashboard post-launch, once you've processed 10–20 claims by hand.
