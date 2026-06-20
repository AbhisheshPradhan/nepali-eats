-- Main directory table for Nepali restaurants in Australia.
CREATE TABLE IF NOT EXISTS restaurants (
  id                BIGSERIAL PRIMARY KEY,
  google_feature_id TEXT UNIQUE NOT NULL,   -- "0x..:0x.." natural key (100% present)
  google_place_id   TEXT,                   -- "ChIJ.." (Places API key, when available)
  slug              TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  cuisine           TEXT NOT NULL DEFAULT 'Nepalese',
  venue_type        TEXT,                   -- Restaurant | Café | Takeaway | Food Truck | Caterer | Dessert | Bar
  tags              TEXT[],                 -- specialty: momo, thakali, newari, tibetan, vegetarian, indian-nepali
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
  facebook          TEXT,
  instagram         TEXT,
  tiktok            TEXT,
  whatsapp          TEXT,
  google_maps_url   TEXT,
  source_query      TEXT,
  address_source    TEXT,                   -- 'google' | 'osm' | 'manual' | null
  is_nepali         BOOLEAN,                -- true=keep, false=excluded, null=review_needed
  relevance         TEXT,                   -- nepali | review_needed | indian_likely | other_cuisine | grocery_retail | other_venue | manual_excluded
  enriched_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restaurants_state    ON restaurants (state);
CREATE INDEX IF NOT EXISTS idx_restaurants_suburb   ON restaurants (suburb);
CREATE INDEX IF NOT EXISTS idx_restaurants_postcode ON restaurants (postcode);
CREATE INDEX IF NOT EXISTS idx_restaurants_geo      ON restaurants (lat, lng);

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
