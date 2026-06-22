-- Auth / RBAC schema (owner accounts + restaurant ownership).
-- Identity lives in Clerk; these tables link a Clerk user to our data, hold the
-- role, and model "an owner owns many restaurants". Apply with:
--   psql nepali_eats -f scraper/schema-auth.sql
-- Idempotent (IF NOT EXISTS), safe to re-run.

-- One row per signed-up Clerk user. Provisioned on sign-up by the Clerk webhook
-- (app/api/webhooks/clerk), and lazily by ensureCurrentUser() as a fallback.
CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL,
  email         TEXT,
  first_name    TEXT,
  last_name     TEXT,
  image_url     TEXT,
  role          TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Upgrade installs created before image_url existed.
ALTER TABLE users ADD COLUMN IF NOT EXISTS image_url TEXT;

-- RBAC ownership (M:N): an owner can own many restaurants; a restaurant can have
-- many owners (e.g. co-owners). Rows are granted at claim approval and checked
-- on every owner write. restaurants.id is BIGINT.
CREATE TABLE IF NOT EXISTS restaurant_owners (
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id BIGINT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, restaurant_id)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_owners_restaurant
  ON restaurant_owners (restaurant_id);

-- Saved / bookmarked restaurants (M:N). A signed-in user can save many spots.
CREATE TABLE IF NOT EXISTS saved_restaurants (
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id BIGINT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, restaurant_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_restaurants_user
  ON saved_restaurants (user_id);
