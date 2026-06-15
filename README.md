# Lendr

**Lendr** is a peer-to-peer rental marketplace for college students. Students
list things they own — textbooks, tech, dorm gear, formalwear, sports and
outdoors equipment — and borrow what they need from classmates on the same
campus for a per-day price. The app handles browsing and search, borrow
requests with an approval/return lifecycle, in-app messaging tied to each
request, and sharing a meetup spot over chat.

Access is gated to students via a college-email check at sign-in (currently
opened up temporarily — see [Notable behaviors](#notable-behaviors)).

The app runs natively on **iOS and Android** and as a **responsive web app**
from the same Expo/React Native codebase.

---

## Repository layout

This is a two-package monorepo:

| Path        | What it is                                                                 |
| ----------- | -------------------------------------------------------------------------- |
| `frontend/` | Expo (React Native) app — iOS, Android, and web. TypeScript.               |
| `backend/`  | Express REST API on AWS Lambda, backed by Supabase Postgres. TypeScript.   |

Each package has its own deep-dive doc:

- **`backend/backend.md`** — full API surface, request/messaging lifecycles,
  the canonical database DDL, and deployment notes. This is the source of truth
  for the backend and schema.
- **`frontend/AGENTS.md`** — Expo version pinning note (read the versioned Expo
  docs before changing client code).

---

## Tech stack

**Frontend**
- [Expo](https://expo.dev) SDK 54 / React Native 0.81, React 19, TypeScript
- React Navigation (native stack)
- `react-native-web` for the web build; deployed to **Netlify** (`netlify.toml`)
- `@supabase/supabase-js` for auth (Google OAuth) and session management
- `expo-image-picker` (listing photos) and `expo-location` (distance filtering
  + sharing a meetup spot in chat)

**Backend**
- TypeScript + **Express** REST API
- **Supabase Postgres** accessed through the raw [`pg`](https://node-postgres.com)
  driver — hand-written SQL, no ORM
- **PostGIS** for nearest-first sorting and radius search on listings
- [`zod`](https://zod.dev) for request validation
- Supabase Auth (JWT bearer tokens) for authentication; Supabase Storage for
  uploaded photos
- Deployed to **AWS Lambda + API Gateway** via the Serverless Framework
  (`serverless.yml`); runs as a plain Express server locally

**Data** — Supabase Postgres, seven tables (`users`, `items`, `requests`,
`ratings`, `conversations`, `messages`, `device_push_tokens`) plus two enums.
`users.id` is shared with Supabase Auth and every foreign key cascades on
delete, so removing an auth user cleanly removes all of their app data. See
`backend/backend.md` for the canonical DDL.

---

## How it fits together

```
  ┌─────────────────────────┐         ┌──────────────────────────┐
  │  Expo app (frontend/)   │         │  Supabase                │
  │  iOS · Android · Web     │         │  • Auth (Google OAuth)   │
  │                          │ ──auth──▶  • Postgres + PostGIS    │
  │  supabase-js (auth)      │         │  • Storage (photos)      │
  │  fetch → REST API        │         └──────────────────────────┘
  └───────────┬──────────────┘                    ▲
              │ Authorization: Bearer <jwt>        │ pg (SQL) + service role
              ▼                                    │
  ┌─────────────────────────────────────┐         │
  │  Express API (backend/)             │ ────────┘
  │  AWS Lambda + API Gateway            │
  │  Zod validation · hand-written SQL   │
  └─────────────────────────────────────┘
```

The client signs in directly with Supabase Auth, then calls the Express API
with the Supabase access token as a bearer token. The backend verifies the
token, runs the college-email gate, and owns all reads/writes to Postgres.

---

## Core features

- **Auth & onboarding** — Google sign-in via Supabase; a college-email gate
  restricts access to students. New users complete a profile (campus, etc.)
  before reaching the main app.
- **Listings** — create items with photos (uploaded to Supabase Storage),
  a category, and a per-day price. Optional location enables distance-based
  search.
- **Discovery** — browse and search listings filtered by campus, category,
  availability, and distance (nearest-first via PostGIS).
- **Borrow requests** — borrowers request an item for a date range; the backend
  computes the total price. Requests move through
  `pending → approved → returned / declined / cancelled`, toggling item
  availability as they go.
- **Messaging** — each borrow request has exactly one conversation between
  borrower and owner, with unread counts and read receipts.
- **Location sharing** — share a meetup spot in chat, backed by a Google Places
  proxy, rendered as a map card. (Encoded into a normal message body, so no
  schema change.)
- **Push notifications** — device tokens are collected now; delivery is a
  ready-to-wire seam (`backend/src/lib/push.ts`), not yet live.
- **Ratings** — schema exists for post-borrow reviews; no API routes yet.

---

## Getting started

### Prerequisites
- Node.js 20+
- A Supabase project (Postgres + Auth + a public Storage bucket named `photos`)
- The schema applied from `backend/backend.md` → *Canonical DDL* (run it in the
  Supabase SQL editor)

### Backend

```bash
cd backend
npm install
# create backend/.env (see below)
npm run dev      # local Express server on $PORT (default 3000)
```

`backend/.env`:

```env
DATABASE_URL=postgresql://...             # Supabase transaction pooler URL (port 6543)
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...             # server-side only — never ship to the client
EDU_EMAIL_SUFFIXES=                       # optional comma-separated extra email domains
EMAIL_ALLOWLIST=                          # optional comma-separated exact addresses
EMAIL_GATE_OPEN=true                      # TEMP: 'true' lets any email sign in; '' re-enables the gate
GOOGLE_PLACES_API_KEY=                    # optional; enables GET /places/nearby for chat location sharing
PORT=3000                                 # optional
```

> **DB host:** use the Supabase **transaction pooler** (Supavisor) host
> (`aws-<n>-<region>.pooler.supabase.com:6543`). The direct
> `db.<ref>.supabase.co` host is IPv6-only and unreachable from Lambda.

### Frontend

```bash
cd frontend
npm install
npm start        # Expo dev server — press i / a, or w for web
```

The API base URL and Supabase public URL/anon key are configured in
`frontend/src/lib/api.ts` and `frontend/src/lib/supabase.ts`. The anon key is
public by design — Supabase Row-Level Security protects the data.

---

## Deployment

**Backend → AWS Lambda** (Serverless Framework):

```bash
cd backend
npm run build              # tsc → dist/
npx serverless deploy      # bundles dist/ and bakes backend/.env into the Lambda
```

**Frontend (web) → Netlify** — configured in `netlify.toml` (base `frontend/`,
build `npx expo export -p web`, publish `dist/`, with an SPA fallback so deep
links work on refresh).

Native iOS/Android builds use the standard Expo/EAS workflow.

---

## Notable behaviors

- **Students-only gate is temporarily open.** `EMAIL_GATE_OPEN=true` (set in
  `serverless.yml` / `.env`) currently allows any email to sign in. Set it to
  `''` to re-enable the college-email requirement before production, and review
  `EDU_EMAIL_SUFFIXES` / `EMAIL_ALLOWLIST` for non-academic domains.
- **Postgres NUMERIC columns arrive as strings** on the wire (e.g.
  `price_per_day: "12.00"`). Wrap with `Number(...)` before doing math.
- **No ORM** — all SQL is hand-written in `backend/src/routes/*`. Keep
  `backend/backend.md` updated when changing routes, schemas, or deployment.
