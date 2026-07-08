-- Owner claim flow (2026-07-08). Additive: nothing in deployed code reads these
-- until the claim feature ships, so applying ahead of the code push is safe.
-- claims = the request + audit trail; restaurant_owners (pre-existing) = the
-- grant. UNIQUE(restaurant_id) enforces the v1 rule: one owner per restaurant
-- (one owner may hold many restaurants).

CREATE TABLE IF NOT EXISTS claims (
  id bigserial PRIMARY KEY,
  restaurant_id bigint NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'owner',        -- owner | manager
  phone text,
  email text,
  note text,
  email_match boolean NOT NULL DEFAULT false, -- claimant's VERIFIED email == restaurants.email at submit
  status text NOT NULL DEFAULT 'pending',     -- pending | approved | rejected
  reason text,                                -- verification / rejection note
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);
CREATE INDEX IF NOT EXISTS claims_status_idx ON claims (status, created_at DESC);
CREATE INDEX IF NOT EXISTS claims_restaurant_idx ON claims (restaurant_id);

CREATE UNIQUE INDEX IF NOT EXISTS restaurant_owners_one_owner
  ON restaurant_owners (restaurant_id);
