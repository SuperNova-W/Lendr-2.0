-- Run this in: Supabase Dashboard → SQL Editor → New query
-- Safe to re-run — all statements use IF NOT EXISTS / IF EXISTS.

-- ── users ────────────────────────────────────────────────────
-- id matches auth.users.id from Supabase Auth — no uuid_generate_v4() needed.
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  google_id    TEXT,                         -- kept for reference, not used for auth
  email        VARCHAR(255) UNIQUE NOT NULL,
  name         VARCHAR(128) NOT NULL,
  avatar_url   TEXT,
  campus       VARCHAR(128),
  grad_year    INT,
  major        VARCHAR(128),
  bio          TEXT,
  rating_avg   NUMERIC(3,2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ── items ────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE item_category AS ENUM (
    'Textbooks','Tech','Dorm','Formal','Sports','Outdoors','Other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(160) NOT NULL,
  description   TEXT,
  category      item_category NOT NULL,
  price_per_day NUMERIC(8,2) NOT NULL,
  photos        TEXT[] DEFAULT '{}',
  campus        VARCHAR(128) NOT NULL,
  is_available  BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_items_owner    ON items (owner_id);
CREATE INDEX IF NOT EXISTS idx_items_campus   ON items (campus);
CREATE INDEX IF NOT EXISTS idx_items_category ON items (category);
CREATE INDEX IF NOT EXISTS idx_items_avail    ON items (is_available);

-- ── requests ─────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE request_status AS ENUM (
    'pending','approved','active','returned','declined','cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id      UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  borrower_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       request_status NOT NULL DEFAULT 'pending',
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  total_price  NUMERIC(8,2) NOT NULL,
  message      TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_req_borrower ON requests (borrower_id);
CREATE INDEX IF NOT EXISTS idx_req_owner    ON requests (owner_id);
CREATE INDEX IF NOT EXISTS idx_req_item     ON requests (item_id);
CREATE INDEX IF NOT EXISTS idx_req_status   ON requests (status);

-- ── ratings ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ratings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  rater_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ratee_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stars      SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (request_id, rater_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_ratee ON ratings (ratee_id);
