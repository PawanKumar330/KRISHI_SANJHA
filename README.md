# Jamui Farm Connect

# 🧑‍💻 AI Coding Agent Prompt — Day 1: Domain Modeling, PostGIS & Registration Architecture

## Role

You are a **Principal Database Architect & Backend Engineer**. Decide the tech stack yourself (FastAPI/Python or Express/TypeScript — pick whichever you can build cleanest) and briefly justify the choice before coding.

## Project

A hyperlocal **P2P farm machinery rental platform** scoped to **Jamui District, Bihar only** (single-district MVP — do not build multi-district/multi-state generalization). Password/MPIN based auth — no OTP. Registration should follow a govt-portal style cascading location flow.

## Location Data

I will provide the exact Jamui block → panchayat → village list as a reference doc/seed file. Do not invent or hardcode this data yourself — just:

- Design normalized tables: `admin_block`, `admin_panchayat`, `admin_village` (all scoped under Jamui district, so no need for a `state`/`district` table hierarchy — just Block → Panchayat → Village → optional Ward/Tola)

- Build a seed-loader that ingests my data file (I'll share as CSV/JSON) into these tables

- Cascading dropdown API endpoints reading from these tables

## Database (PostgreSQL + PostGIS)

- `admin_block` (id, name)

- `admin_panchayat` (id, block_id FK, name)

- `admin_village` (id, panchayat_id FK, name, ward/tola nullable)

- `users` (id, phone, password_hash, mpin_hash, full_name, role, village_id FK, coordinates GEOMETRY, trust_score, created_at)

- `chc_enterprise` (id, owner_id, business_name, registration_number, gst_number, center_location GEOMETRY, verification_status)

- `equipment` (id, owner_id, chc_id, category, sub_category, make_model, hp_rating, base_hourly_rate, base_acre_rate, is_active, photos JSONB)

- `operators` (id, user_id, driving_license_no, experience_years, preferred_equipment_types JSONB, daily_wage, verification_status)

- `land_records` (id, user_id, plot_name, land_area_bigha, land_area_katha, soil_type, coordinates GEOMETRY, village_id FK)

Roles: `FARMER, CHC_PROVIDER, OPERATOR, AGENT, ADMIN`

## Backend Boilerplate

- Docker Compose: Postgres 16 + PostGIS, Redis, API service

- Auth: password + MPIN, JWT/session issuance

- Endpoints:

  - `POST /api/v1/auth/register` — multi-role signup, cascading Block→Panchayat→Village selection, password/MPIN

  - `POST /api/v1/auth/login` — phone + password/MPIN

  - `POST /api/v1/users/profile` — profile completion incl. Bigha/Katha land + enterprise details

  - `GET /api/v1/locations/blocks|panchayats|villages` — cascading dropdown data (panchayats filtered by block_id, villages filtered by panchayat_id)

## Tests

Unit tests for: password/MPIN hashing, multi-role registration, location-hierarchy validation (reject a panchayat/village that doesn't belong to the selected parent).

## Deliverables

1. SQL migration files (PostGIS-enabled)

2. A seed-loader script (expects my CSV/JSON — leave a placeholder sample format, don't invent real data)

3. Docker Compose + API boilerplate

4. Auth/registration/profile route implementations

5. Unit test suite

6. Short `README.md` with setup steps + stack-choice reasoning

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://farm-share-jamui.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7ecbd99b-dd75-40fb-a557-af21d6ebef58).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
