-- Jamui Farm Machinery Rental — initial schema (PostgreSQL 16 + PostGIS)
-- Single-district MVP: everything is implicitly scoped to Jamui district, Bihar.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------- enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('FARMER', 'CHC_PROVIDER', 'OPERATOR', 'AGENT', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------- administrative units
CREATE TABLE IF NOT EXISTS admin_block (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  code        TEXT UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_block_name_uniq UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS admin_panchayat (
  id          BIGSERIAL PRIMARY KEY,
  block_id    BIGINT NOT NULL REFERENCES admin_block(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  code        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_panchayat_uniq UNIQUE (block_id, name)
);
CREATE INDEX IF NOT EXISTS idx_panchayat_block ON admin_panchayat(block_id);

CREATE TABLE IF NOT EXISTS admin_village (
  id            BIGSERIAL PRIMARY KEY,
  panchayat_id  BIGINT NOT NULL REFERENCES admin_panchayat(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  ward          TEXT,
  tola          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS admin_village_uniq
  ON admin_village (panchayat_id, name, COALESCE(ward, ''), COALESCE(tola, ''));
CREATE INDEX IF NOT EXISTS idx_village_panchayat ON admin_village(panchayat_id);

-- ------------------------------------------------------------- identity
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone          VARCHAR(10) NOT NULL UNIQUE CHECK (phone ~ '^[6-9][0-9]{9}$'),
  password_hash  TEXT NOT NULL,
  mpin_hash      TEXT,
  full_name      TEXT NOT NULL,
  role           user_role NOT NULL DEFAULT 'FARMER',
  village_id     BIGINT REFERENCES admin_village(id) ON DELETE SET NULL,
  coordinates    GEOMETRY(Point, 4326),
  trust_score    NUMERIC(5,2) NOT NULL DEFAULT 50.00 CHECK (trust_score BETWEEN 0 AND 100),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_village ON users(village_id);
CREATE INDEX IF NOT EXISTS idx_users_coords ON users USING GIST (coordinates);

-- ------------------------------------------------------ CHC enterprises
CREATE TABLE IF NOT EXISTS chc_enterprise (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name        TEXT NOT NULL,
  registration_number  TEXT UNIQUE,
  gst_number           TEXT,
  center_location      GEOMETRY(Point, 4326),
  village_id           BIGINT REFERENCES admin_village(id) ON DELETE SET NULL,
  verification_status  verification_status NOT NULL DEFAULT 'PENDING',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chc_owner ON chc_enterprise(owner_id);
CREATE INDEX IF NOT EXISTS idx_chc_location ON chc_enterprise USING GIST (center_location);

-- ------------------------------------------------------------ equipment
CREATE TABLE IF NOT EXISTS equipment (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chc_id            UUID REFERENCES chc_enterprise(id) ON DELETE SET NULL,
  category          TEXT NOT NULL,
  sub_category      TEXT,
  make_model        TEXT,
  hp_rating         NUMERIC(6,2),
  base_hourly_rate  NUMERIC(10,2) CHECK (base_hourly_rate >= 0),
  base_acre_rate    NUMERIC(10,2) CHECK (base_acre_rate >= 0),
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  photos            JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_equipment_owner ON equipment(owner_id);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category, sub_category);

-- ------------------------------------------------------------ operators
CREATE TABLE IF NOT EXISTS operators (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  driving_license_no        TEXT,
  experience_years          INTEGER CHECK (experience_years >= 0),
  preferred_equipment_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  daily_wage                NUMERIC(10,2) CHECK (daily_wage >= 0),
  verification_status       verification_status NOT NULL DEFAULT 'PENDING',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------- land records
CREATE TABLE IF NOT EXISTS land_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plot_name       TEXT,
  land_area_bigha NUMERIC(10,3) CHECK (land_area_bigha >= 0),
  land_area_katha NUMERIC(10,3) CHECK (land_area_katha >= 0),
  soil_type       TEXT,
  coordinates     GEOMETRY(Point, 4326),
  village_id      BIGINT REFERENCES admin_village(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_land_user ON land_records(user_id);
CREATE INDEX IF NOT EXISTS idx_land_coords ON land_records USING GIST (coordinates);
