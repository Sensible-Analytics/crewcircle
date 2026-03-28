-- CrewCircle NeonDB Schema Migration
-- Generated: 2026-03-28

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'manager', 'employee');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE roster_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE clock_event_type AS ENUM ('clock_in', 'clock_out');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE clock_source AS ENUM ('mobile', 'kiosk', 'manual');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE plan_type AS ENUM ('free', 'starter');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS tenants (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    text NOT NULL,
  abn                     char(11),
  timezone                text NOT NULL DEFAULT 'Australia/Melbourne',
  plan                    plan_type NOT NULL DEFAULT 'free',
  stripe_customer_id      text,
  stripe_subscription_id  text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  deleted_at              timestamptz
);

CREATE TABLE IF NOT EXISTS locations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES tenants(id),
  name                  text NOT NULL,
  address               text,
  latitude              double precision,
  longitude             double precision,
  geofence_radius_m     integer NOT NULL DEFAULT 150,
  timezone              text NOT NULL DEFAULT 'Australia/Melbourne',
  created_at            timestamptz NOT NULL DEFAULT now(),
  deleted_at            timestamptz
);

CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY,
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  role        user_role NOT NULL DEFAULT 'employee',
  first_name  text,
  last_name   text,
  email       text NOT NULL,
  phone       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);

CREATE TABLE IF NOT EXISTS rosters (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id),
  location_id   uuid NOT NULL REFERENCES locations(id),
  week_start    date NOT NULL,
  status        roster_status NOT NULL DEFAULT 'draft',
  published_at  timestamptz,
  published_by  uuid REFERENCES profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

CREATE TABLE IF NOT EXISTS shifts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id),
  location_id   uuid NOT NULL REFERENCES locations(id),
  roster_id     uuid NOT NULL REFERENCES rosters(id),
  profile_id    uuid NOT NULL REFERENCES profiles(id),
  start_time    timestamptz NOT NULL,
  end_time      timestamptz NOT NULL,
  role_label    text,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz,
  CONSTRAINT shifts_start_before_end CHECK (start_time < end_time)
);

CREATE TABLE IF NOT EXISTS availability (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id),
  profile_id    uuid NOT NULL REFERENCES profiles(id),
  day_of_week   smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    time,
  end_time      time,
  is_available  boolean NOT NULL DEFAULT true,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, profile_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS clock_events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id),
  profile_id          uuid NOT NULL REFERENCES profiles(id),
  location_id         uuid NOT NULL REFERENCES locations(id),
  shift_id            uuid REFERENCES shifts(id),
  type                clock_event_type NOT NULL,
  recorded_at         timestamptz NOT NULL DEFAULT now(),
  latitude            double precision,
  longitude           double precision,
  accuracy_m          double precision,
  is_within_geofence  boolean,
  source              clock_source NOT NULL DEFAULT 'mobile',
  idempotency_key     uuid NOT NULL,
  approved_at         timestamptz,
  approved_by         uuid REFERENCES profiles(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz,
  UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_tenants_deleted ON tenants (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_locations_tenant ON locations (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON profiles (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rosters_tenant_week ON rosters (tenant_id, week_start) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_shifts_roster ON shifts (roster_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_shifts_profile ON shifts (profile_id, start_time) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clock_events_profile_recorded ON clock_events (profile_id, recorded_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_availability_profile ON availability (profile_id);
