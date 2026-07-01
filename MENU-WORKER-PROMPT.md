# Menu-seeding worker prompt (copy-paste into each parallel Claude window)

You are a menu-seeding worker for the **nepali-eats** project. Multiple Claude windows
run this in parallel on the SAME repo, so follow the coordination + safety rules exactly.

## Read first
- `MENU-PLAN.md` (schema + JSON contract + rules), `MENU-SEEDING-PLAN.md` (worklist),
  `web/lib/menu/taxonomy.ts` (the controlled dish vocabulary), and an existing example
  like `scraper/menu-data/chomolungma-nepalese-cuisine-griffith.json`.
- The seeder is `scraper/seed-menu.js <slug>` (dry-run) / `--commit` (writes to Neon).
- Progress/truth: `node scraper/menu-progress.js` (done = `menu_item_count > 0`, from the DB).

## Coordination (pick ONE restaurant, no collisions)
1. `node scraper/menu-progress.js` to see what's already seeded (skip those).
2. From `MENU-SEEDING-PLAN.md` section A (PDFs) top-down, pick the highest unseeded one.
3. **Claim it atomically:** `mkdir scraper/menu-data/.claims/<slug>`
   - exit 0 → you own it, proceed.
   - non-zero (already exists) → another window has it; try the next restaurant.
   - a lock dir older than ~90 min is stale; you may `rm -rf` it and re-claim.
4. Get its `id` + `menu_url` from the DB: query `restaurants WHERE slug=$1`.
   **Use the real `id` for the local file `media/menus/<id>.pdf`** (NOT the review count).

## Do the menu
5. **Fetch the source — RESTAURANT'S OWN MENU ONLY.**
   - **⛔ NEVER transcribe from an online ordering / delivery platform.** Those menus are
     NOT the real restaurant menu (marked-up prices, subset of items, platform-only combos).
     This excludes aggregators (Uber Eats, DoorDash, Menulog, Deliveroo, HungryPanda,
     order.store) AND third-party ordering/menu hosts (**yumbojumbo, tuckerfox, tapnorder,
     grubbio, ordereats, bopple, mryum, tuckerfox**, any `*.<platform>.com/menu`). Only use
     the restaurant's **own website** (its own domain) PDF/menu page, or physical-menu photos.
   - If `media/menus/<id>.pdf` exists use it; else use `menu_url` **only if it's the
     restaurant's own domain**. If the only source is an ordering platform, **SKIP** the
     restaurant (leave the `.claims` lock, note it) — do not seed marked-up data.
   - PDF → `pdftoppm -jpeg -r 140 <file> <out>/p` then **Read** each page image.
   - Dense/tri-fold → render at `-r 300` and crop panels with pdftoppm `-x -y -W -H`.
   - Own-site page (no PDF) → render with Playwright (`web/node_modules/playwright`), grab
     menu images or HTML text. Skip junk `menu_url`s (CSS files, `http://menu/`, logos).
   - **⚠️ Verify the branch.** Multi-branch chains often have DIFFERENT menus/prices per
     location. Check the address printed on the menu matches this restaurant's suburb. If
     the `menu_url` is a placeholder/sample or wrong branch, find the right file or skip.
6. **Transcribe** to `scraper/menu-data/<slug>.json` per the contract:
   - Preparation = separate items; size/protein = variants; consolidate protein-only items.
   - Momo grids: one item per prep, protein as variants. "Choice of X/Y/Z" → variants.
   - Tags = controlled slugs from `taxonomy.ts` ONLY (dish/style/momo-prep). Protein lives on
     `variant.protein`. Descriptions are transcribed **verbatim** (no rewriting).
   - Include drinks/desserts as categories (tag `drinks`/`dessert`).
7. **Dry-run:** `node scraper/seed-menu.js <slug>` — fix until no HARD ERROR.
8. **Commit:** `node scraper/seed-menu.js <slug> --commit`. Verify it rendered:
   `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/restaurant/<slug>` (3001 or 3000).
9. If the menu advertises catering, `UPDATE restaurants SET catering=true WHERE slug=...`.
   If `menu_url` was wrong/placeholder, `UPDATE ... SET menu_url=<real url>`.
10. Loop back to step 1 for the next restaurant.

## Hard rules (so parallel windows don't clash)
- **DO NOT `git push` or `git commit`.** Only seed the DB + write your `<slug>.json`. The
  main window / human pushes all JSONs together (they're separate files, no conflict).
- **DO NOT edit `web/lib/menu/taxonomy.ts`.** If a dish/protein has no existing slug, append
  a line to `MENU-TAXONOMY-TODO.md` (e.g. `- wings (dish) — Funky Momo`), tag that dish `[]`
  for now, and note it. The main window batches taxonomy adds + reseeds. This keeps taxonomy
  single-writer.
- **Never re-run `load-db.js`.** Postgres is the source of truth.
- Seeding different restaurants concurrently is safe (different rows). Only shared FILES
  (taxonomy.ts, git) are the hazard — hence the two rules above.

## Done criteria per restaurant
`menu_item_count > 0` in the DB, page renders 200, `<slug>.json` written, catering/menu_url
fixed if needed, and any new-tag needs logged to `MENU-TAXONOMY-TODO.md`.
