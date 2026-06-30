-- Main directory table for Nepali restaurants in Australia.
CREATE TABLE IF NOT EXISTS restaurants (
  id                BIGSERIAL PRIMARY KEY,
  google_feature_id TEXT UNIQUE NOT NULL,   -- "0x..:0x.." natural key (100% present)
  google_place_id   TEXT,                   -- "ChIJ.." (Places API key, when available)
  slug              TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  cuisine           TEXT NOT NULL DEFAULT 'Nepalese',
  venue_type        TEXT,                   -- Restaurant | Café | Takeaway | Food Truck | Caterer | Dessert | Bar
  tags              TEXT[],                 -- specialty: momo, thakali, newari, tibetan, vegetarian, nepali-indian
  halal_status      TEXT NOT NULL DEFAULT 'unknown', -- certified | options | not_halal | unknown
  rating            NUMERIC(2,1),
  review_count      INTEGER,
  street            TEXT,
  suburb            TEXT,
  state             TEXT,
  postcode          TEXT,
  full_address      TEXT,
  lat               DOUBLE PRECISION,
  lng               DOUBLE PRECISION,
  phone             TEXT,
  email             TEXT,
  website           TEXT,
  logo_key          TEXT,                   -- self-hosted brand logo (storage_key), shown on the detail page
  cover_key         TEXT,                   -- self-hosted cover/hero photo (storage_key); standalone like logo_key. Used for the card (4:3) + detail hero (16:9), falls back to the first gallery photo.
  cover_source      TEXT,                   -- cover provenance: 'website' | 'google' | 'upload'
  cover_attribution TEXT,                   -- cover display/licensing credit
  facebook          TEXT,
  instagram         TEXT,
  tiktok            TEXT,
  whatsapp          TEXT,
  google_maps_url   TEXT,
  source_query      TEXT,
  address_source    TEXT,                   -- 'google' | 'osm' | 'manual' | null
  is_nepali         BOOLEAN,                -- true=keep, false=excluded, null=review_needed
  relevance         TEXT,                   -- nepali | review_needed | indian_likely | other_cuisine | grocery_retail | other_venue | manual_excluded
  featured_rank     INT,                    -- editorial homepage pick + manual order within a state's featured list (asc, nulls last); NOT NULL = featured
  popular           BOOLEAN NOT NULL DEFAULT FALSE, -- editorial "Popular" flag; true shows a Popular tag on the card
  description       TEXT,                   -- editorial blurb; falls back to an auto-generated line when empty
  enriched_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restaurants_state    ON restaurants (state);
CREATE INDEX IF NOT EXISTS idx_restaurants_suburb   ON restaurants (suburb);
CREATE INDEX IF NOT EXISTS idx_restaurants_postcode ON restaurants (postcode);
CREATE INDEX IF NOT EXISTS idx_restaurants_geo      ON restaurants (lat, lng);

-- Homepage featured pick (idempotent for existing DBs). A restaurant belongs to
-- one state, so a non-null featured_rank features it for that state's homepage
-- list, in ascending rank order. NULL = not featured.
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS featured_rank INT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS logo_key TEXT;
-- Standalone cover/hero photo, mirrors logo_key (own field + own admin upload slot),
-- kept out of the gallery. cover_source/attribution preserve provenance because a
-- cover may be a Google photo (unlike logos, which are own-site assets).
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS cover_key TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS cover_source TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS cover_attribution TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS popular BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE restaurants DROP COLUMN IF EXISTS is_featured;
CREATE INDEX IF NOT EXISTS idx_restaurants_featured ON restaurants (state) WHERE featured_rank IS NOT NULL;

-- Opening hours: two-field design. `opening_hours_raw` holds the per-day strings
-- exactly as scraped from Google ("11 am to 10:30 pm", "Closed", split shifts),
-- accumulated one weekday per daily run (headless Maps only exposes today's row).
-- `opening_hours` holds the canonical parsed shape the frontend consumes:
--   { "mon": [[600,1230]], "tue": [], ... }  minutes-from-midnight, [] = closed,
-- absent key = unknown, close > 1440 means the slot runs past midnight. It is
-- rebuilt from `_raw` on every pass, so re-parsing never needs a re-scrape.
-- `hours_scraped_at` is the per-day-run resumability key (re-scrape once per day).
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS opening_hours_raw jsonb;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS hours_scraped_at  TIMESTAMPTZ;

-- Media triage: timestamp of the last manual photo review pass (the "Mark
-- reviewed" action in /admin/triage). NULL = not yet triaged; lets the triage
-- queue hide spots whose photos have already been eyeballed.
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS photos_reviewed_at TIMESTAMPTZ;

-- Planned Explore filters (forward-compat). No free source yet: the Google "About"
-- panel is empty in headless renders, so these stay NULL until a Places API key
-- backfills them. Default unknown = NULL.
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS kid_friendly BOOLEAN;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS live_music   BOOLEAN;

-- Google Places API (New) staging + reconciled attributes.
-- `places_api_raw` holds the full Place Details JSON (one call per restaurant,
-- see scraper/enrich-places.js); the columns below are mapped from it by the
-- reviewable scraper/reconcile-places.js step (NULL = unknown). The headless
-- About panel can't source these, so they stay NULL until the API pass runs.
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS places_api_raw        jsonb;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS places_api_at         TIMESTAMPTZ;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS serves_vegetarian     BOOLEAN;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS takeout               BOOLEAN;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS delivery              BOOLEAN;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS dine_in               BOOLEAN;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS outdoor_seating       BOOLEAN;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS reservable            BOOLEAN;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS good_for_groups       BOOLEAN;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS serves_alcohol        BOOLEAN;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS serves_cocktails      BOOLEAN;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS allows_dogs           BOOLEAN;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS wheelchair_accessible BOOLEAN;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS editorial_summary     TEXT;
-- Parking: friendly label derived from Google parkingOptions in reconcile
-- ('Free parking' when any free lot/street/garage option, else 'Paid parking').
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS parking               TEXT;

-- One-time migration: move any legacy messy opening_hours strings into _raw so the
-- parser becomes the only writer of canonical opening_hours.
UPDATE restaurants SET opening_hours_raw = opening_hours
  WHERE opening_hours IS NOT NULL AND opening_hours_raw IS NULL
    AND opening_hours ?| array['Monday','Tuesday','Wednesday','Thursday',
                               'Friday','Saturday','Sunday'];  -- legacy full-day keys

-- PostGIS: geometry point kept in sync with lat/lng via trigger; GiST index
-- powers map bounds queries (geom && ST_MakeEnvelope(...)) and radius search.
CREATE EXTENSION IF NOT EXISTS postgis;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326);
UPDATE restaurants SET geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
  WHERE lat IS NOT NULL AND lng IS NOT NULL AND geom IS NULL;
CREATE INDEX IF NOT EXISTS idx_restaurants_geom ON restaurants USING GIST (geom);

CREATE OR REPLACE FUNCTION set_restaurant_geom() RETURNS trigger AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_restaurant_geom ON restaurants;
CREATE TRIGGER trg_set_restaurant_geom
  BEFORE INSERT OR UPDATE OF lat, lng ON restaurants
  FOR EACH ROW EXECUTE FUNCTION set_restaurant_geom();
