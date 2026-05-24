CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── users ────────────────────────────────────────────────────
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_id    VARCHAR(128) UNIQUE NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  name         VARCHAR(128) NOT NULL,
  avatar_url   TEXT,
  campus       VARCHAR(128),
  bio          TEXT,
  rating_avg   NUMERIC(3,2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ── items ────────────────────────────────────────────────────
CREATE TYPE item_category AS ENUM (
  'Textbooks','Tech','Dorm','Formal','Sports','Outdoors','Other'
);

CREATE TABLE items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE INDEX idx_items_owner    ON items (owner_id);
CREATE INDEX idx_items_campus   ON items (campus);
CREATE INDEX idx_items_category ON items (category);
CREATE INDEX idx_items_avail    ON items (is_available);

-- ── requests ─────────────────────────────────────────────────
CREATE TYPE request_status AS ENUM (
  'pending','approved','active','returned','declined','cancelled'
);

CREATE TABLE requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id      UUID NOT NULL REFERENCES items(id),
  borrower_id  UUID NOT NULL REFERENCES users(id),
  owner_id     UUID NOT NULL REFERENCES users(id),
  status       request_status NOT NULL DEFAULT 'pending',
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  total_price  NUMERIC(8,2) NOT NULL,
  message      TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_req_borrower ON requests (borrower_id);
CREATE INDEX idx_req_owner    ON requests (owner_id);
CREATE INDEX idx_req_item     ON requests (item_id);
CREATE INDEX idx_req_status   ON requests (status);

-- ── ratings ──────────────────────────────────────────────────
CREATE TABLE ratings (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES requests(id),
  rater_id   UUID NOT NULL REFERENCES users(id),
  ratee_id   UUID NOT NULL REFERENCES users(id),
  stars      SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (request_id, rater_id)
);

CREATE INDEX idx_ratings_ratee ON ratings (ratee_id);
