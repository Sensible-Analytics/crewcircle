-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pgtap";

-- ============================================================
-- CUSTOM TYPES
-- ============================================================
CREATE TYPE user_role AS ENUM ('owner', 'manager', 'employee');
CREATE TYPE roster_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE clock_event_type AS ENUM ('clock_in', 'clock_out');
CREATE TYPE clock_source AS ENUM ('mobile', 'kiosk', 'manual');
CREATE TYPE channel_type AS ENUM ('team', 'direct');
CREATE TYPE plan_type AS ENUM ('free', 'starter');

-- ============================================================
-- TENANTS
-- ============================================================
CREATE TABLE tenants (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name          text NOT NULL,
    abn           char(11),
    timezone      text NOT NULL DEFAULT 'Australia/Melbourne',
    plan          plan_type NOT NULL DEFAULT 'free',
    stripe_customer_id text,
    stripe_subscription_id text,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    deleted_at    timestamptz
);

-- ABN Modulus 89 check constraint
-- The algorithm: multiply each digit (except first) by weights [3,5,7,9,11,13,15,17,19],
-- subtract 1 from first digit, sum all products, divide by 89, remainder must be 0.
ALTER TABLE tenants ADD CONSTRAINT tenants_abn_valid CHECK (
    abn IS NULL OR (
        length(abn) = 11 AND abn ~ '^\d{11}$' AND (
            (
                ((abn::text::int8 / 10000000000) % 10 - 1) * 10 +
                ((abn::text::int8 / 1000000000) % 10) * 1 +
                ((abn::text::int8 / 100000000) % 10) * 3 +
                ((abn::text::int8 / 10000000) % 10) * 5 +
                ((abn::text::int8 / 1000000) % 10) * 7 +
                ((abn::text::int8 / 100000) % 10) * 9 +
                ((abn::text::int8 / 10000) % 10) * 11 +
                ((abn::text::int8 / 1000) % 10) * 13 +
                ((abn::text::int8 / 100) % 10) * 15 +
                ((abn::text::int8 / 10) % 10) * 17 +
                (abn::text::int8 % 10) * 19
            ) % 89 = 0
        )
    )
);

-- ============================================================
-- LOCATIONS
-- ============================================================
CREATE TABLE locations (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           uuid NOT NULL REFERENCES tenants(id),
    name                text NOT NULL,
    address             text,
    latitude            double precision,
    longitude           double precision,
    geofence_radius_m   integer NOT NULL DEFAULT 150,
    timezone            text NOT NULL DEFAULT 'Australia/Melbourne',
    created_at          timestamptz NOT NULL DEFAULT now(),
    deleted_at          timestamptz
);

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE profiles (
    id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id   uuid NOT NULL REFERENCES tenants(id),
    role        user_role NOT NULL DEFAULT 'employee',
    first_name  text,
    last_name   text,
    email       text NOT NULL,
    phone       text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    deleted_at  timestamptz
);

-- ============================================================
-- TENANT_MEMBERS (invitation tracking)
-- ============================================================
CREATE TABLE tenant_members (
    tenant_id   uuid NOT NULL REFERENCES tenants(id),
    profile_id  uuid NOT NULL REFERENCES profiles(id),
    role        user_role NOT NULL DEFAULT 'employee',
    invited_at  timestamptz NOT NULL DEFAULT now(),
    accepted_at timestamptz,
    deleted_at  timestamptz,
    PRIMARY KEY (tenant_id, profile_id)
);

-- ============================================================
-- ROSTERS
-- ============================================================
CREATE TABLE rosters (
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

-- ============================================================
-- SHIFTS
-- ============================================================
CREATE TABLE shifts (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     uuid NOT NULL REFERENCES tenants(id),
    location_id   uuid NOT NULL REFERENCES locations(id),
    roster_id     uuid NOT NULL REFERENCES rosters(id),
    profile_id    uuid REFERENCES profiles(id),
    start_time    timestamptz NOT NULL,
    end_time      timestamptz NOT NULL,
    role_label    text,
    notes         text,
    created_at    timestamptz NOT NULL DEFAULT now(),
    deleted_at    timestamptz,
    CONSTRAINT shifts_start_before_end CHECK (start_time < end_time),
    CONSTRAINT shifts_max_duration CHECK (end_time - start_time <= interval '16 hours')
);

-- ============================================================
-- AVAILABILITY
-- ============================================================
CREATE TABLE availability (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     uuid NOT NULL REFERENCES tenants(id),
    profile_id    uuid NOT NULL REFERENCES profiles(id),
    day_of_week   smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
    start_time    time,
    end_time      time,
    is_available  boolean NOT NULL DEFAULT true,
    updated_at    timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, profile_id, day_of_week)
);

-- ============================================================
-- CLOCK EVENTS
-- ============================================================
CREATE TABLE clock_events (
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

-- ============================================================
-- PUSH TOKENS
-- ============================================================
CREATE TABLE push_tokens (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id        uuid NOT NULL REFERENCES profiles(id),
    expo_push_token   text NOT NULL,
    platform          text NOT NULL CHECK (platform IN ('ios', 'android')),
    created_at        timestamptz NOT NULL DEFAULT now(),
    deleted_at        timestamptz,
    UNIQUE (expo_push_token)
);

-- ============================================================
-- MESSAGES (Phase 1B schema pre-built for multi-tenant safety)
-- ============================================================
CREATE TABLE channels (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id),
    type        channel_type NOT NULL DEFAULT 'team',
    name        text,
    member_ids  uuid[] NOT NULL DEFAULT '{}',
    created_at  timestamptz NOT NULL DEFAULT now(),
    deleted_at  timestamptz
);

CREATE TABLE messages (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id),
    channel_id  uuid NOT NULL REFERENCES channels(id),
    sender_id   uuid NOT NULL REFERENCES profiles(id),
    content     text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    deleted_at  timestamptz
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX ON tenants (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX ON locations (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX ON profiles (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX ON rosters (tenant_id, week_start) WHERE deleted_at IS NULL;
CREATE INDEX ON shifts (tenant_id, roster_id) WHERE deleted_at IS NULL;
CREATE INDEX ON shifts (profile_id, start_time) WHERE deleted_at IS NULL;
CREATE INDEX ON clock_events (tenant_id, profile_id, recorded_at) WHERE deleted_at IS NULL;
CREATE INDEX ON availability (tenant_id, profile_id);

-- ============================================================
-- REALTIME (must set REPLICA IDENTITY FULL before enabling)
-- ============================================================
ALTER TABLE rosters REPLICA IDENTITY FULL;
ALTER TABLE shifts REPLICA IDENTITY FULL;
ALTER TABLE clock_events REPLICA IDENTITY FULL;
ALTER TABLE messages REPLICA IDENTITY FULL;
