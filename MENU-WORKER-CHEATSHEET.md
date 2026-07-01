# Menu-seeding cheat sheet (read THIS, not the full plan docs)

Everything a worker needs on one page. Only open `MENU-PLAN.md` / `MENU-SEEDING-PLAN.md`
if something here is ambiguous. Don't read `taxonomy.ts` — get slugs from `--list-tags`.

## Loop (one restaurant at a time)

1. `node scraper/menu-progress.js` — see what's seeded (done = `menu_item_count > 0`). Skip those.
2. Pick the highest-review unseeded row from `MENU-SEEDING-PLAN.md` §A (PDFs) then §B (own pages).
3. Claim it: `mkdir scraper/menu-data/.claims/<slug>` (exit 0 = yours; non-zero = taken, try next;
   a lock dir older than ~90 min is stale, `rm -rf` and re-claim).
4. **`node scraper/menu-fetch.js <slug>`** — this resolves id/menu_url/website, picks the
   own-site source, and prints EITHER the menu text (cheap) OR the page-image paths to Read.
   It ignores ordering-platform urls automatically. Verify the branch/suburb it prints.
5. Transcribe to `scraper/menu-data/<slug>.json` (contract below).
6. `node scraper/seed-menu.js <slug>` (dry-run) → fix until no HARD ERROR → `--commit`.
7. Verify: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/restaurant/<slug>` (3001/3000).
8. If the menu advertises catering: `UPDATE restaurants SET catering=true WHERE slug='<slug>'`.
   If `menu_url` was a platform/placeholder: `UPDATE ... SET menu_url='<real own-site url>'`.

## Source rules (menu-fetch handles most of this)

- **Restaurant's OWN website menu ONLY.** Priority: local `media/menus/<id>.pdf` > `menu_url`
  on the own domain > find the menu on `website`.
- **⛔ Never seed from ordering/delivery platforms** (Uber Eats, DoorDash, Menulog, Deliveroo,
  order.store, HungryPanda, yumbojumbo, tuckerfox, tapnorder, grubbio, ordereats, bopple, mryum).
  Marked-up, subset, platform combos — not the real menu. If that's the only source, **SKIP** +
  log in `MENU-TAXONOMY-TODO.md` (keep the claim lock).
- **Branch check:** chains (Falcha, Aagaman, Khukuri, Momo Central, Little Magic Momo…) have a
  DIFFERENT menu/prices per location. Confirm the source's address matches this suburb.
- If menu-fetch says "JS-rendered / empty", render `website`'s menu page with Playwright
  (`web/node_modules/playwright`) and read the menu container's innerText.

## Still do the LLM judgement pass (the point of this, not just OCR)

menu-fetch only makes GETTING the menu cheap. On the text/images it prints, you still:
- **Sanity-check prices:** flag obvious typos against siblings (a $35 tea, a $8.95 set among
  $18.95 sets = a dropped digit). Correct + note it in your session log. Don't seed absurd prices.
- **⚠️ If menu-fetch warns MULTI-COLUMN**, `-layout` can attach the wrong column's price to an
  item — verify those prices against the page image before trusting them.
- **Map to OUR schema thoughtfully:** does this dish fit an existing slug? Does splitting it into
  prep-items + protein-variants make sense? (rules below).

## JSON contract (full example: `scraper/menu-data/sample-menu.json`)

Top: `{ slug, source:"admin", price_source:"print"|"website", currency:"AUD", categories:[…] }`.
Category: `{ name, description?, items:[…] }`. Item:
`{ name, description?, is_vegetarian?, spice_level?, tags:[slug…], variants:[…] }`
Variant: `{ label:null|"Chicken"|"Small", price:12.5, protein?:slug, is_vegetarian?, currency? }`.
Single-price item = one variant with `label:null`.

Modelling (locked):
- **Preparation = separate items; size/protein = variants.** A momo grid → one item per prep
  (Steamed/Jhol/Kothey/Fried/Chilli/Sandheko), protein as variants.
- **Consolidate protein-only items:** "Chicken Curry / Goat Curry / Lamb Curry" → ONE `curry`
  item with three variants. "Choice of X/Y/Z" → variants.
- **tags = controlled slugs ONLY** (dish/style/momo-prep). `node scraper/seed-menu.js --list-tags`.
  **Protein is NOT a tag** — it lives on `variant.protein` (chicken momo → `tags:["momo"]` +
  `variant.protein:"chicken"`). A momo prep tag rolls up to `momo` automatically.
- **Descriptions VERBATIM** from the menu (no rewriting — human-copy standard does NOT apply here).
- Include drinks/desserts as categories (`tags:["drinks"]` / `["dessert"]`, item-level only).
- Unknown dish with no slug → tag `[]`, append a line to `MENU-TAXONOMY-TODO.md`
  (e.g. `- bhutuwa (dish) — Himali Gurkha`). **Do NOT edit `taxonomy.ts`** (single-writer; the
  coordinator batches adds + reseeds). The seeder prints valid slugs on a HARD ERROR.

## Hard rules (parallel-safe)

- **No `git commit` / `git push`.** Seed the DB + write your `<slug>.json` only. The main window
  pushes all JSONs together (separate files, no conflict).
- **Don't edit `web/lib/menu/taxonomy.ts`.** Log new-tag needs to `MENU-TAXONOMY-TODO.md`.
- **Never re-run `load-db.js`.** Postgres is the source of truth.
- Seeding different restaurants concurrently is safe; only shared FILES (taxonomy.ts, git) clash.

## Done criteria
`menu_item_count > 0`, page renders 200, `<slug>.json` written, catering/menu_url fixed if needed,
new-tag needs logged, price typos flagged in the session log.
