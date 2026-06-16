# Lendr

Location-based peer-to-peer item lending marketplace. Users list items, browse
nearby inventory, request date ranges, get owner approval, coordinate over
in-app messages, and return the item.

## Resume Bullets

- Built a 24-endpoint TypeScript/Express REST API deployed as a serverless
  backend on AWS Lambda behind API Gateway; `serverless.yml` routes `/` and
  `/{proxy+}` into `dist/lambda.handler`, and `@vendia/serverless-express`
  adapts the normal Express app to Lambda events.
- Configured the Lambda API for Node.js 22.x, 256 MB memory, and API Gateway's
  29s request cap; the compiled backend artifact is 104 KB across 22 JS files.
- Connected AWS Lambda to Supabase Postgres through the Supavisor transaction
  pooler using raw `pg` SQL, with the app pool capped at 2 DB connections per
  Lambda instance to reduce connection pressure during horizontal scaling.
- Built one Expo/React Native client for iOS, Android, and web with 15 screens
  covering auth, onboarding, listing creation, search, requests, profiles, and
  request-scoped messaging.
- Implemented location-based marketplace search with PostGIS generated
  geography points, GIST indexing, nearest-first sorting, and meter-based radius
  filtering.
- Modeled a 7-table Supabase Postgres schema with cascaded account deletion,
  request lifecycles, 1:1 request conversations, read receipts, and rating
  storage.
- Added production-oriented backend constraints: 20 JWT-protected endpoints,
  owner-only item mutations, participant-only messaging, server-computed request
  totals, image MIME filtering, and a 5 MB upload cap.

## Quantitative Snapshot

| Metric | Value |
| --- | ---: |
| Product targets | iOS, Android, web from 1 Expo codebase |
| Frontend surface | 15 screens, 7 reusable component modules |
| Backend API | 24 REST endpoints across 9 route modules |
| Auth-protected endpoints | 20 / 24 |
| Database model | 7 Postgres tables, 2 enums |
| Source size | 10,329 lines of TypeScript / TSX |
| Serverless runtime | AWS Lambda, API Gateway, Node.js 22.x |
| Lambda config | 256 MB memory, 29s timeout, max 2 DB conns per instance |
| Image uploads | Supabase Storage, image-only, 5 MB max file size |
| Web export | 12 MB, 53 files |
| Main web JS bundle | 2,442,434 bytes raw, 607,686 bytes gzip |
| Backend build output | 104 KB, 22 compiled JS files |
| Backend TypeScript build | 0.76s local build time |
| Expo web export | 10.6s local export time |
| Local API health latency | p50 0.23 ms, p95 0.83 ms over 100 requests |

Benchmarks were collected locally on 2026-06-16. The `/health` benchmark does
not hit Postgres; production Lambda latency depends on AWS cold starts, network,
and Supabase region.

## Tech Stack

| Layer | Stack |
| --- | --- |
| Mobile/web client | Expo SDK 54, React Native 0.81, React 19, TypeScript |
| Navigation/UI | React Navigation native stack, React Native Web, Inter fonts |
| Auth | Supabase Auth with Google sign-in and JWT bearer tokens |
| API | Express 4, TypeScript, Zod validation |
| Serverless backend | AWS Lambda + API Gateway via Serverless Framework |
| Database | Supabase Postgres through Supavisor transaction pooler, raw `pg` SQL, PostGIS geography queries |
| Storage | Supabase Storage public `photos` bucket |
| Deployments | Netlify for web, AWS Lambda for API, Expo/EAS-ready native app |

## Architecture

```text
Expo / React Native app
  |-- Supabase Auth: Google OAuth session + JWT
  |-- REST calls with Authorization: Bearer <token>
  v
Express API on AWS Lambda + API Gateway
  |-- verifies Supabase JWTs
  |-- validates request bodies with Zod
  |-- executes hand-written SQL through pg
  |-- uses Supavisor transaction pooler, max 2 pg conns per Lambda instance
  |-- uploads item photos through Supabase service-role Storage client
  v
Supabase Postgres + PostGIS + Storage
```

## API Surface

| Domain | Endpoints | Auth | Quantitative details |
| --- | ---: | --- | --- |
| Health | 1 | Public | JSON liveness check |
| Auth | 1 | Required | Syncs Supabase Auth user into app `users` table |
| Items | 5 | 2 public, 3 owner-only | List, detail, create, update, delete |
| Requests | 4 | Required | Create, sent list, incoming list, status update |
| Messages | 5 | Required | Conversation list/detail/create, send, mark read |
| Users | 3 | Required | Profile read/update/delete |
| Upload | 1 | Required | Multipart `photo`, image MIME only, 5 MB cap |
| Stats | 1 | Public | Students, listings, average daily listing price |
| Push tokens | 2 | Required | Register/delete per-device tokens |
| Places | 1 | Required | Server-side Google Places proxy for meetup search |

## Backend Engineering

| Area | Implementation |
| --- | --- |
| Authorization | 20 endpoints require Supabase JWT verification before route logic |
| Ownership checks | Item mutations require `owner_id === authenticated user` |
| Participant checks | Message routes reject non-borrower/non-owner callers |
| Server-side pricing | Request totals are computed from item price x requested days |
| Transactional workflow | Request creation and conversation creation run in the same DB transaction |
| Geospatial search | Optional lat/lng sorts by `ST_Distance`; radius filter uses `ST_DWithin` |
| Database pooler | Supabase Supavisor transaction pooler; app-level `pg` Pool max is 2 connections per Lambda instance |
| Query safety | Parameterized SQL throughout route handlers |
| Input validation | Zod schemas for items, requests, messages, places, push tokens, profile updates |
| Upload safety | In-memory multer upload, image-only filter, 5 MB max |
| Account deletion | Supabase Auth delete cascades through app tables via foreign keys |

## Data Model

| Table | Purpose |
| --- | --- |
| `users` | App profile, campus, onboarding fields, reputation aggregate |
| `items` | Listings, price/day, category, photos, availability, optional coordinates |
| `requests` | Borrow request lifecycle, date range, owner, borrower, computed total |
| `ratings` | Post-borrow review schema, one rating per request/rater |
| `conversations` | One messaging thread per request via unique `request_id` |
| `messages` | Thread messages with sender and `read_at` receipt |
| `device_push_tokens` | Per-user device tokens for push delivery |

Enums:

- `item_category`: `Textbooks`, `Tech`, `Dorm`, `Formal`, `Sports`, `Outdoors`, `Other`
- `request_status`: `pending`, `approved`, `active`, `returned`, `declined`, `cancelled`

PostGIS details:

- `items.geog` is a generated `geography(Point, 4326)` column.
- `idx_items_geog` is a GIST index for distance and radius queries.
- Item listing queries cap results at 50 rows and sort nearest-first when
  coordinates are provided.

## Frontend Surface

| Area | Count / implementation |
| --- | --- |
| Screens | 15 |
| Shared component modules | 7 |
| Runtime targets | iOS, Android, responsive web |
| Auth flow | Splash -> onboarding/sign-in -> profile setup -> main app |
| Marketplace flow | Home/search -> item detail -> request -> owner approval |
| Messaging flow | Conversation list, thread view, unread counts, read receipts |
| Location flow | Device location, nearby item filtering, meetup place search |

Screen modules:

```text
AddItem, CreateAccount, Home, ItemDetail, Legal, MessageThread, Messages,
Notifications, Onboarding, Profile, Requests, Search, Settings, SetupProfile,
Splash
```

## Measured Build And Latency Metrics

| Measurement | Result | Command |
| --- | ---: | --- |
| Backend TypeScript build | 0.76s | `cd backend && time npm run build` |
| Expo web export | 10.6s | `cd frontend && time npx expo export -p web` |
| Frontend `dist/` size | 12 MB, 53 files | `du -sh frontend/dist` |
| Backend `dist/` size | 104 KB, 22 files | `du -sh backend/dist` |
| Main web JS bundle | 2.44 MB raw | `stat` on exported bundle |
| Main web JS gzip size | 607.7 KB | `gzip -c <bundle> \| wc -c` |
| Local `/health` latency | min 0.13 ms, p50 0.23 ms, p95 0.83 ms, avg 0.92 ms | 100 sequential local requests |

## Deployment

Backend:

```bash
cd backend
npm install
npm run build
npx serverless deploy
```

Serverless config:

- Runtime: `nodejs22.x`
- Region: `us-east-1`
- Memory: `256 MB`
- Timeout: `29s`
- Handler: `dist/lambda.handler`
- Events: API Gateway HTTP API catch-all routes for `/` and `/{proxy+}`

Frontend web:

```bash
cd frontend
npm install
npx expo export -p web
```

Netlify config:

- Base directory: `frontend`
- Build command: `npx expo export -p web`
- Publish directory: `frontend/dist`
- SPA fallback: `/* -> /index.html`
