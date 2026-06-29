-- ============================================================================
-- Menu schema — SHARED canonical content + tag/search model.
-- (See CLAUDE.md "DESIGN CONSTRAINT": these tables also back FoodHub later — a
--  QR-menu / ordering upsell — so keep menu CONTENT normalised + SQL-queryable
--  and keep ordering concerns (availability, carts, orders) OUT of this core.)
--
-- Content:  menu_categories -> menu_items -> menu_item_variants (priced)
-- Tags:     dish_categories (controlled hierarchical vocab) <- menu_item_tags (M2M)
-- Images:   menu_item_photos (DEFERRED; table shaped now, populated later)
-- Rollup:   restaurants.tags is REUSED as the coarse (dish+style) rollup; per-menu
--           facets (price_min/max, counts) added below.
--
-- Items are transcribed in-session (no file storage) and written by
-- scraper/seed-menu.js. Apply with:  psql "$DATABASE_URL" -f scraper/schema-menu.sql
-- Idempotent (IF NOT EXISTS). Additive EXCEPT for how restaurants.tags is
-- *populated* (the column itself is unchanged, so live reads keep working).
-- ============================================================================

-- 1. Controlled, hierarchical tag vocabulary — the search-dropdown source.
--    `kind` = the facet distinguishing a tag from its parent (or its base type
--    when top-level): dish (momo, bara), preparation (jhol-momo, steamed-momo),
--    protein (chicken-momo, veg-momo), style (newari, thakali). `parent_id`
--    gives the hierarchy (jhol-momo -> momo) so picking a parent tag matches all
--    descendants. Admin-curated only (seeded from web/lib/menu/taxonomy.ts); the
--    curated list is the single source of searchable dishes.
CREATE TABLE IF NOT EXISTS dish_categories (
  id            BIGSERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,            -- momo, jhol-momo, chicken-momo, newari, bara…
  name          TEXT NOT NULL,                   -- "Momo", "Jhol Momo", "Chicken Momo"
  kind          TEXT NOT NULL CHECK (kind IN ('dish','preparation','protein','style')),
  parent_id     BIGINT REFERENCES dish_categories(id) ON DELETE SET NULL,
  -- Alternate names the search dropdown matches on, so "dumpling" surfaces Momo,
  -- "c-momo" surfaces Chilli Momo, "kothey" surfaces Kothey Momo. Seeded from the
  -- taxonomy.ts `synonyms`. Aliases only FIND an existing tag (dropdown filter:
  -- name ILIKE q OR an alias ILIKE q) — they never create a tag, so the controlled
  -- vocab is untouched. Distinct from transcription-time synonym canonicalisation.
  search_aliases TEXT[],
  description   TEXT,                            -- for /dish/[slug] landing pages
  is_featured   BOOLEAN NOT NULL DEFAULT false,  -- surface on landing / hub pages
  display_order INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dish_categories_parent ON dish_categories(parent_id);

-- 2. Per-restaurant menu sections (= FoodHub "Category").
CREATE TABLE IF NOT EXISTS menu_categories (
  id            BIGSERIAL PRIMARY KEY,
  restaurant_id BIGINT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,                   -- "Momo", "Mains", "Drinks" (as printed)
  description   TEXT,
  position      INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant ON menu_categories(restaurant_id, position);

-- 3. Menu items (the dish line). restaurant_id denormalised so dish search /
--    matched-items queries never join through categories. PREPARATION (steamed /
--    fried / jhol) is a SEPARATE item — mirrors how menus are printed; protein
--    and size are variants (below).
CREATE TABLE IF NOT EXISTS menu_items (
  id            BIGSERIAL PRIMARY KEY,
  category_id   BIGINT NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  restaurant_id BIGINT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,                   -- "Steamed Momo", "Chicken Sekuwa"
  description   TEXT,
  is_vegetarian BOOLEAN,                          -- 3-state item default (a variant may override)
  spice_level   SMALLINT,                         -- 0–3 when the menu marks it, else NULL
  -- Provenance: which write path produced the row. 'admin' = transcribed in-session
  -- (the only value during manual seeding); 'owner_upload' / 'llm_extracted' arrive
  -- with UGC. Also the seeder's ownership signal: once a menu is owner-owned in
  -- FoodHub the directory seeder must STOP reseeding it (in-place edits + soft-delete
  -- take over). Directory-reseedable = source IN ('admin','llm_extracted').
  source        TEXT NOT NULL DEFAULT 'admin'
                  CHECK (source IN ('admin','owner_upload','llm_extracted')),
  -- Visibility flag (NOT a tombstone — removal is a real DELETE on reseed since the
  -- JSON is source of truth). Pull a bad item from public view without deleting it.
  -- Public reads add `WHERE NOT is_hidden`. UGC moderation ('pending') is a separate
  -- axis that lands with the upload/batch table, not here.
  is_hidden     BOOLEAN NOT NULL DEFAULT false,
  position      INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category   ON menu_items(category_id, position);

-- 4. Priced variants (size / protein). A single-price item gets ONE row with
--    label = NULL, so price always lives here (one uniform read path).
CREATE TABLE IF NOT EXISTS menu_item_variants (
  id            BIGSERIAL PRIMARY KEY,
  item_id       BIGINT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  label         TEXT,                            -- "Veg" / "Chicken" / "Large"; NULL = single price
  price         NUMERIC(8,2),                    -- NULL when illegible / market price
  currency      TEXT NOT NULL DEFAULT 'AUD',     -- AUD-only today; column so the FoodHub-shared core isn't AU-locked
  is_vegetarian BOOLEAN,                          -- overrides the item default when set
  position      INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_menu_item_variants_item ON menu_item_variants(item_id);

-- 5. Item <-> tag (M2M). The seeder attaches each item's leaf tag(s) PLUS all
--    ancestors (materialised closure), so a single-tag-id search flat-matches a
--    parent: pick "Momo" -> finds jhol / steamed / chicken momo items. Search is
--    strict + deterministic — the user picks one tag from the dropdown and we
--    match `dish_category_id = :id`.
CREATE TABLE IF NOT EXISTS menu_item_tags (
  menu_item_id     BIGINT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  dish_category_id BIGINT NOT NULL REFERENCES dish_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (menu_item_id, dish_category_id)
);
CREATE INDEX IF NOT EXISTS idx_menu_item_tags_category ON menu_item_tags(dish_category_id);

-- 6. Item photos (DEFERRED — table shaped now, populated when images land).
--    Mirrors restaurant_photos; powers the per-item photo carousel on the search
--    result card + detail page. storage_key resolves via mediaUrl() (R2 in prod).
CREATE TABLE IF NOT EXISTS menu_item_photos (
  id           BIGSERIAL PRIMARY KEY,
  menu_item_id BIGINT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  storage_key  TEXT NOT NULL,
  position     INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_menu_item_photos_item ON menu_item_photos(menu_item_id, position);

-- NOTE: source menu files (the actual menu image(s)/PDF we transcribe FROM, for the
-- "view official menu" feature) are NOT a table here. They're uploaded via the admin
-- editor's Menu tab → R2 `menus/<id>/`, and read back with listMenuFiles() (no DB
-- table, to avoid drift with the R2-listing the editor already uses). Add a table
-- later only if display needs ordering/captions/querying R2-listing can't provide.

-- 7. Per-restaurant menu facets (rebuilt by the seeder on every parse).
--    NOTE: restaurants.tags (existing column) is REUSED as the coarse (dish +
--    style) tag rollup — the seeder unions menu-derived tags into it, keeping the
--    name-derived values as a baseline so /tag pages + the Explore filter never
--    regress. No new dish_tags column. price_band ($ / $$ / $$$) is derived from
--    min/max at read time, never stored.
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS price_min       NUMERIC(8,2);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS price_max       NUMERIC(8,2);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS menu_item_count INT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS menu_parsed_at  TIMESTAMPTZ;
