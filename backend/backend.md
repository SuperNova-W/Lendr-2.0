# Lendr Backend

TypeScript + **Express** REST API talking to **Supabase Postgres** through the
raw [`pg`](https://node-postgres.com) driver (no ORM — hand-written SQL in
`src/routes/*`). Validation is via [`zod`](https://zod.dev) (`src/schemas.ts`),
auth via `@supabase/supabase-js`. Deployed to **AWS Lambda + API Gateway** with
the Serverless Framework (`serverless.yml`); `src/lambda.ts` wraps the Express
app for Lambda, `src/index.ts` runs it as a plain server locally.

```
npm install     # install backend dependencies
npm run dev     # local Express server (ts-node-dev) on $PORT
npm run build   # tsc → dist/
npx serverless deploy   # bundle dist/ + bake backend/.env into the Lambda
```

> **DB connection:** use the Supabase **transaction pooler** (Supavisor) host —
> `aws-<n>-<region>.pooler.supabase.com:6543`. The direct `db.<ref>.supabase.co`
> host is IPv6-only and unreachable from Lambda.

---

## Agent Quick Context

This file is the backend reference doc. Keep it updated when changing routes,
schemas, deployment, or database shape.

### Source map

| File | Purpose |
| ---- | ------- |
| `src/app.ts` | Creates the Express app, mounts routers, and installs the error handler. |
| `src/index.ts` | Local/non-Lambda entrypoint. Starts Express on `PORT` or `3000`. |
| `src/lambda.ts` | AWS Lambda entrypoint. Wraps Express with `@vendia/serverless-express`. |
| `src/db/pool.ts` | Shared `pg` Pool using `DATABASE_URL`; should point at Supabase transaction pooler. |
| `src/lib/supabase.ts` | Server-only Supabase service-role client for Auth admin and Storage. |
| `src/lib/eduEmail.ts` | College-email gate used during auth sync. |
| `src/middleware/auth.ts` | Verifies Supabase JWT bearer tokens and sets `req.userId`. |
| `src/middleware/error.ts` | Converts Zod/AppError/unknown errors into JSON responses. |
| `src/schemas.ts` | Zod request-body validation schemas. |
| `src/routes/*` | Hand-written SQL route handlers. No ORM. |

### Required environment

Set these in `backend/.env` locally and in Lambda via `serverless.yml`:

```env
DATABASE_URL=postgresql://...             # Supabase transaction pooler URL
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...             # server-side only; never expose to frontend
EDU_EMAIL_SUFFIXES=                       # optional comma-separated extras
PORT=3000                                 # optional local server port
```

`SUPABASE_SERVICE_ROLE_KEY` is intentionally powerful. It is used only by the
backend for Auth admin calls, account deletion, and Storage uploads.

### Current API surface

All responses are JSON unless noted. Auth-required routes expect:

```http
Authorization: Bearer <supabase_access_token>
```

| Method | Route | Auth | Purpose |
| ------ | ----- | ---- | ------- |
| `GET` | `/health` | No | Health check. |
| `POST` | `/auth/sync` | Yes | After Supabase sign-in, upsert the user into `users`; rejects non-college email. |
| `GET` | `/items` | No | List items with optional `campus`, `category`, `available`, `owner`, `lat`, `lng`, `radius` filters. |
| `GET` | `/items/:id` | No | Get one item plus owner summary fields. |
| `POST` | `/items` | Yes | Create item owned by current user. |
| `PATCH` | `/items/:id` | Yes | Update item; current user must own it. |
| `DELETE` | `/items/:id` | Yes | Delete item; current user must own it. |
| `GET` | `/users/me` | Yes | Get current user's profile row. |
| `PATCH` | `/users/me` | Yes | Update current user's profile/onboarding fields. |
| `DELETE` | `/users/me` | Yes | Delete Supabase Auth user; FK cascades remove app data. |
| `POST` | `/requests` | Yes | Borrower creates request for an available item; backend computes total price. |
| `GET` | `/requests/mine` | Yes | Requests sent by current user as borrower. |
| `GET` | `/requests/incoming` | Yes | Requests on items owned by current user. |
| `PATCH` | `/requests/:id` | Yes | Owner approves/declines/returns; borrower cancels. Updates item availability. |
| `POST` | `/upload` | Yes | Upload one image field named `photo`; returns public Supabase Storage URL. |
| `GET` | `/stats` | No | Homepage stats, optionally filtered by `campus`. |

There is currently no ratings API route. The `ratings` table exists in the
schema for the intended post-borrow review flow, but the backend does not expose
create/list/update endpoints for ratings yet.

### Auth and onboarding flow

1. The client signs in with Supabase Auth.
2. Supabase returns a session/access token.
3. The client calls `POST /auth/sync` with `Authorization: Bearer <token>`.
4. `requireAuth` verifies the token with Supabase and attaches `req.userId`.
5. `/auth/sync` fetches the Auth user, checks `isCollegeEmail(email)`, and
   inserts/updates the matching `users` row.
6. The response includes `onboarded: Boolean(user.campus)`. The frontend should
   require onboarding until `campus` is set.

### Request lifecycle

The DB enum includes:

```
pending, approved, active, returned, declined, cancelled
```

The current route logic only accepts updates to:

```
approved, declined, returned, cancelled
```

`active` exists in the enum but is not currently transitioned to by the backend.
When a request is approved, `items.is_available` is set to `false`. When it is
returned, declined, or cancelled, `items.is_available` is set back to `true`.

### Uploads

`POST /upload` uses `multer.memoryStorage()` with a 5 MB limit and only accepts
image MIME types. It uploads to Supabase Storage bucket `photos` under:

```
items/<random-uuid>.<original-extension>
```

Before uploads work, create a public Supabase Storage bucket:

```
name: photos
public: on
```

The returned public URL is meant to be stored in `items.photos`.

### Validation and errors

Routes call Zod `.parse(req.body)` using schemas in `src/schemas.ts`. Validation
errors are handled centrally by `src/middleware/error.ts` and returned as:

```json
{ "error": "Validation failed", "issues": { } }
```

Intentional route errors should use `AppError(status, message)` when practical.
Unexpected errors are logged server-side and returned as a generic 500.

### Seed scripts

These are local/demo helpers, not production runtime code:

```
npx tsx src/db/seed.ts
npx tsx src/db/seed-lender.ts
```

`seed.ts` assumes the hard-coded user already exists in Supabase Auth, then
upserts their `users` profile and replaces their demo items. `seed-lender.ts`
creates/finds a second demo Auth user with the service-role key, upserts their
profile, and reassigns about half the items to them so borrow flows can be
tested between two users.

### Deployment notes

The supported deployment path is Serverless Framework to AWS Lambda:

```
npm run build
npx serverless deploy
```

`Dockerfile` and `.dockerignore` are optional container-deployment artifacts.
They are not used by `serverless.yml`, and `serverless.yml` explicitly excludes
them from the Lambda package.

---

## Database Schema

Postgres (Supabase). Four tables plus two enums. `users.id` is shared with
Supabase Auth (`auth.users.id`), so deleting the auth user cascades through the
entire graph.

### Relationships

```
auth.users
   │ 1:1 (id)
   ▼
 users ──1:N──▶ items ──1:N──▶ requests ──1:N──▶ ratings
   │                              ▲   ▲              ▲
   └── borrower_id / owner_id ────┘   │   rater_id / ratee_id
                                       └──────────────┘
```

Every foreign key is `ON DELETE CASCADE`, so removing a user cleanly removes
their items, the requests they're party to, and the ratings they gave/received.

### `users`

Profile, identity, and reputation. `id` references `auth.users(id)`.

| Column         | Type            | Notes                                           |
| -------------- | --------------- | ----------------------------------------------- |
| `id`           | `uuid` PK       | = `auth.users.id` (Supabase Auth)               |
| `google_id`    | `text`          | Kept for reference, not used for auth            |
| `email`        | `varchar(255)`  | `UNIQUE NOT NULL`                                |
| `name`         | `varchar(128)`  | `NOT NULL`                                       |
| `avatar_url`   | `text`          |                                                 |
| `campus`       | `varchar(128)`  | Onboarding sets this; gates the main app         |
| `grad_year`    | `int`           |                                                 |
| `major`        | `varchar(128)`  |                                                 |
| `bio`          | `text`          |                                                 |
| `interests`    | `text[]`        | Default `{}`                                     |
| `dorm`         | `varchar(128)`  |                                                 |
| `phone`        | `varchar(32)`   |                                                 |
| `rating_avg`   | `numeric(3,2)`  | Default `0` (wire format: string)               |
| `rating_count` | `int`           | Default `0`                                      |
| `created_at`   | `timestamptz`   | Default `now()`                                  |
| `updated_at`   | `timestamptz`   | Default `now()`                                  |

### `items`

Listings. Coordinates are optional; when present, the generated `geog` point
enables nearest-first sorting and radius search.

| Column          | Type                     | Notes                                          |
| --------------- | ------------------------ | ---------------------------------------------- |
| `id`            | `uuid` PK                | `gen_random_uuid()`                            |
| `owner_id`      | `uuid` FK→`users`        | `NOT NULL`, cascade                            |
| `title`         | `varchar(160)`           | `NOT NULL`                                     |
| `description`   | `text`                   |                                                |
| `category`      | `item_category` enum     | `NOT NULL`                                     |
| `price_per_day` | `numeric(8,2)`           | `NOT NULL` (wire format: string)               |
| `photos`        | `text[]`                 | Default `{}` — public URLs                     |
| `campus`        | `varchar(128)`           | `NOT NULL`                                     |
| `is_available`  | `boolean`                | Default `true`                                 |
| `latitude`      | `double precision`       |                                                |
| `longitude`     | `double precision`       |                                                |
| `geog`          | `geography(Point,4326)`  | **Generated** from lng/lat; meters on WGS84    |
| `created_at`    | `timestamptz`            | Default `now()`                                |
| `updated_at`    | `timestamptz`            | Default `now()`                                |

Indexes: `owner_id`, `campus`, `category`, `is_available`, and a GIST index on
`geog` for spatial queries.

### `requests`

A borrow request between a borrower and an item's owner. `total_price` is
computed server-side (item price × days).

| Column        | Type                  | Notes                                            |
| ------------- | --------------------- | ------------------------------------------------ |
| `id`          | `uuid` PK             | `gen_random_uuid()`                              |
| `item_id`     | `uuid` FK→`items`     | `NOT NULL`, cascade                              |
| `borrower_id` | `uuid` FK→`users`     | `NOT NULL`, cascade                              |
| `owner_id`    | `uuid` FK→`users`     | `NOT NULL`, cascade (denormalized for queries)   |
| `status`      | `request_status` enum | `NOT NULL` default `pending`                     |
| `start_date`  | `date`                | `NOT NULL`                                       |
| `end_date`    | `date`                | `NOT NULL`                                       |
| `total_price` | `numeric(8,2)`        | `NOT NULL`                                       |
| `message`     | `text`                | Optional note to the lender                      |
| `created_at`  | `timestamptz`         | Default `now()`                                  |
| `updated_at`  | `timestamptz`         | Default `now()`                                  |

Indexes: `borrower_id`, `owner_id`, `item_id`, `status`.

### `ratings`

A star rating tied to a completed request. One rating per `(request, rater)`.
The table exists in the canonical schema, but the current Express app does not
yet expose ratings routes.

| Column       | Type                | Notes                                  |
| ------------ | ------------------- | -------------------------------------- |
| `id`         | `uuid` PK           | `gen_random_uuid()`                    |
| `request_id` | `uuid` FK→`requests`| `NOT NULL`, cascade                    |
| `rater_id`   | `uuid` FK→`users`   | `NOT NULL`, cascade                    |
| `ratee_id`   | `uuid` FK→`users`   | `NOT NULL`, cascade                    |
| `stars`      | `smallint`          | `NOT NULL`, `CHECK (1..5)`             |
| `comment`    | `text`              |                                        |
| `created_at` | `timestamptz`       | Default `now()`                        |
|              |                     | `UNIQUE (request_id, rater_id)`        |

Index: `ratee_id`.

### Enums

- `item_category` — `Textbooks`, `Tech`, `Dorm`, `Formal`, `Sports`, `Outdoors`, `Other`
- `request_status` — `pending`, `approved`, `active`, `returned`, `declined`, `cancelled`

Note: `active` is available at the database layer but is not currently used by
`src/routes/requests.ts`.

---

## Canonical DDL

This is the single source of truth for the schema. Run it in the
**Supabase Dashboard → SQL Editor**. It's idempotent (every statement guards
with `IF [NOT] EXISTS` / duplicate handling), so it's safe against a fresh or an
already-populated database.

> `CREATE EXTENSION` needs elevated privileges — run from the dashboard, not the
> connection pooler.

```sql
-- ── Extensions ───────────────────────────────────────────────────────────────
-- PostGIS powers item distance filtering. Must be enabled before the
-- items.geog generated column below can be created.
CREATE EXTENSION IF NOT EXISTS postgis;

-- ── Enums ────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE item_category AS ENUM (
    'Textbooks','Tech','Dorm','Formal','Sports','Outdoors','Other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE request_status AS ENUM (
    'pending','approved','active','returned','declined','cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── users ────────────────────────────────────────────────────────────────────
-- id matches auth.users.id from Supabase Auth. Deleting the auth user cascades
-- here (and onward to items/requests/ratings).
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  google_id    TEXT,
  email        VARCHAR(255) UNIQUE NOT NULL,
  name         VARCHAR(128) NOT NULL,
  avatar_url   TEXT,
  campus       VARCHAR(128),
  grad_year    INT,
  major        VARCHAR(128),
  bio          TEXT,
  interests    TEXT[] DEFAULT '{}',
  dorm         VARCHAR(128),
  phone        VARCHAR(32),
  rating_avg   NUMERIC(3,2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ── items ────────────────────────────────────────────────────────────────────
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
  latitude      double precision,
  longitude     double precision,
  -- Generated geography point (lng, lat order), kept in sync automatically.
  geog          geography(Point, 4326) GENERATED ALWAYS AS (
                  CASE
                    WHEN latitude IS NOT NULL AND longitude IS NOT NULL
                    THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
                    ELSE NULL
                  END
                ) STORED,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_items_owner    ON items (owner_id);
CREATE INDEX IF NOT EXISTS idx_items_campus   ON items (campus);
CREATE INDEX IF NOT EXISTS idx_items_category ON items (category);
CREATE INDEX IF NOT EXISTS idx_items_avail    ON items (is_available);
CREATE INDEX IF NOT EXISTS idx_items_geog     ON items USING GIST (geog);

-- ── requests ─────────────────────────────────────────────────────────────────
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

-- ── ratings ──────────────────────────────────────────────────────────────────
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
```

### Reconciling an older database

`CREATE TABLE IF NOT EXISTS` is a no-op on tables that already exist, so the
inline `ON DELETE CASCADE` is **not** retroactively applied to a database whose
`requests`/`ratings` were created without it. If account deletion fails with
*"Database error deleting user"*, rebuild the foreign keys once:

```sql
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_borrower_id_fkey;
ALTER TABLE requests ADD  CONSTRAINT requests_borrower_id_fkey
  FOREIGN KEY (borrower_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_owner_id_fkey;
ALTER TABLE requests ADD  CONSTRAINT requests_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_item_id_fkey;
ALTER TABLE requests ADD  CONSTRAINT requests_item_id_fkey
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;

ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_request_id_fkey;
ALTER TABLE ratings ADD  CONSTRAINT ratings_request_id_fkey
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE;
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_rater_id_fkey;
ALTER TABLE ratings ADD  CONSTRAINT ratings_rater_id_fkey
  FOREIGN KEY (rater_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_ratee_id_fkey;
ALTER TABLE ratings ADD  CONSTRAINT ratings_ratee_id_fkey
  FOREIGN KEY (ratee_id) REFERENCES users(id) ON DELETE CASCADE;
```
