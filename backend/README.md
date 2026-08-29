# Jamui Agri-Rental API

Backend for the P2P farm machinery rental platform serving **Jamui district, Bihar**.
Express + TypeScript + PostgreSQL/PostGIS + Redis.

## Stack choice

- **Express + TypeScript** — `pg` gives raw SQL control for PostGIS geometry
  columns, spatial indexes and the cascading Block → Panchayat → Village joins;
  `zod` mirrors the govt-portal style field validation; same language as the
  rest of this repo.
- **PostGIS** — user/plot/CHC coordinates as `GEOGRAPHY(Point, 4326)` so
  "equipment near me" queries are index-backed (`ST_DWithin`).
- **Redis** — JWT session allowlist so logout/admin actions can revoke tokens.
- **bcrypt + JWT** — passwords and 6-digit MPINs are both bcrypt-hashed; login
  accepts either.

## Data model

Single-district MVP, so the hierarchy starts at Block (no state/district
tables):

```
admin_block ──< admin_panchayat ──< admin_village (optional ward/tola)
users ──< land_records (multi-plot, Bigha/Katha normalized, PostGIS geometry)
users ──< chc_enterprise
users ──1 operators
equipment (HP rating, hourly/daily rates, verification_status)
```

Regional land units: **1 Bigha = 20 Katha** (normalized in
`src/lib/location.ts`).

## Setup

```sh
cp .env.example .env

# Everything (Postgres+PostGIS, Redis, API):
docker compose up --build

# Or local dev:
npm install
docker compose up -d db redis
npm run migrate
npm run dev          # http://localhost:8000, GET /health
```

## Seeding the Jamui location hierarchy

No location data is bundled — drop your official list into `./seed` as CSV or
JSON and run the idempotent loader:

```sh
npm run seed:locations -- ./seed/jamui_locations.csv
npm run seed:locations -- ./seed/jamui_locations.json
```

- CSV header: `block,panchayat,village,ward,tola` (see
  `seed/jamui_locations.sample.csv`)
- JSON: `[{ "block": "...", "panchayat": "...", "village": "...", "ward": null, "tola": null }]`
  (see `seed/jamui_locations.sample.json`)

Re-running with an updated file only inserts new rows
(`ON CONFLICT DO NOTHING`).

## API overview

| Method | Path                                   | Notes                                        |
| ------ | -------------------------------------- | -------------------------------------------- |
| GET    | `/health`                              | Liveness                                     |
| GET    | `/api/v1/locations/blocks`             | All Jamui blocks                             |
| GET    | `/api/v1/locations/blocks/:id/panchayats` | Cascading dropdown                        |
| GET    | `/api/v1/locations/panchayats/:id/villages` | Cascading dropdown                      |
| POST   | `/api/v1/auth/register`                | phone + password (+ optional MPIN), role, hierarchy-validated village |
| POST   | `/api/v1/auth/login`                   | phone + password **or** phone + MPIN         |
| GET    | `/api/v1/users/me`                     | Authenticated profile                        |
| POST   | `/api/v1/users/profile`                | Land records / enterprise / operator profile |

Roles: `FARMER`, `CHC_PROVIDER`, `OPERATOR`, `AGENT`, `ADMIN`.
`OPERATOR` signups also get an `operators` row. JWT is required for
`/api/v1/users/*` (`Authorization: Bearer <token>`).

## Tests

```sh
npm test
```

Covers crypto/JWT/MPIN rules, hierarchy rejection and land-area math, and
multi-role registration (hashing, duplicate phone, operator side-effect).
