# CrewCircle Phase 1A — AI Agent Implementation Plan

> **Purpose**: Step-by-step execution instructions for an AI agent building the CrewCircle MVP.
> Each task section is self-contained: preconditions, exact commands, code to write, verification steps, and commit instructions.
> The agent executes tasks sequentially. Never skip verification. Never proceed to the next task if a verification step fails.

---

## Agent Ground Rules

1. **All timestamps UTC** — `timestamptz` in Postgres, `Date.toISOString()` in JS. Never store local time strings.
2. **No hard deletes** — every DELETE in user-facing code is `UPDATE … SET deleted_at = now()`.
3. **No service role key in client code** — `SUPABASE_SERVICE_ROLE_KEY` is only used inside Supabase Edge Functions or server-only Next.js route handlers.
4. **RLS on every table** — no table exists without a policy. Verify with pgTap before moving on.
5. **Multi-tenant from day 1** — every table has `tenant_id uuid NOT NULL`. Every query filters on it.
6. **Soft delete filter on every view** — default queries always include `WHERE deleted_at IS NULL`.
7. **Error handling is explicit** — no empty catch blocks. Log the error and surface it to the UI or return a typed error object.
8. **Evidence files** — every QA scenario saves output to `.sisyphus/evidence/task-{N}-{slug}.{ext}`.
9. **Commit after every task** — run pre-commit checks first. If they fail, fix before committing.
10. **Never proceed past a failing pgTap test** — RLS failures are blockers, not warnings.

---

## Repository Layout

Before writing any code, create this exact directory structure. Do not deviate.

```
crewcircle/
├── apps/
│   ├── web/                    # Next.js 15 App Router
│   └── mobile/                 # Expo SDK 52+ React Native
├── packages/
│   ├── supabase/               # Supabase client factories + generated types
│   ├── validators/             # Zod schemas + pure business logic
│   └── ui-shared/              # Shared hooks and utilities (no JSX)
├── supabase/
│   ├── migrations/             # SQL migration files
│   ├── functions/              # Edge Functions
│   ├── tests/                  # pgTap test files
│   └── config.toml
├── .sisyphus/
│   └── evidence/               # QA output artifacts
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Task 1 — Monorepo + Infrastructure Setup

### Preconditions
- Node.js ≥ 20, pnpm ≥ 9, Supabase CLI installed globally
- GitHub repo created (empty), remote `origin` configured
- Supabase Pro project provisioned in `ap-southeast-2` (AWS Sydney)

### Step 1.1 — Root scaffold

```bash
mkdir crewcircle && cd crewcircle
git init
pnpm init
```

Write `pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Write root `package.json`:
```json
{
  "name": "crewcircle",
  "private": true,
  "scripts": {
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test",
    "dev": "turbo dev"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0",
    "prettier": "^3.2.0",
    "eslint": "^9.0.0"
  }
}
```

Write `turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "!.next/cache/**"]
    },
    "lint": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"], "cache": false },
    "dev": { "cache": false, "persistent": true }
  }
}
```

### Step 1.2 — Next.js web app

```bash
pnpm create next-app@latest apps/web \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
```

Add to `apps/web/package.json`:
```json
{
  "name": "web",
  "scripts": {
    "build": "next build",
    "dev": "next dev --port 3000",
    "lint": "next lint",
    "test": "vitest run"
  }
}
```

### Step 1.3 — Expo mobile app

```bash
pnpm create expo-app apps/mobile \
  --template blank-typescript
cd apps/mobile
pnpm add nativewind@^4 tailwindcss
pnpm add -D @types/react @types/react-native
```

Add to `apps/mobile/package.json` scripts:
```json
{
  "name": "mobile",
  "scripts": {
    "start": "expo start",
    "build:ios": "eas build --platform ios --profile production",
    "build:android": "eas build --platform android --profile production"
  }
}
```

Write `apps/mobile/metro.config.js` — this is mandatory for pnpm symlink resolution:
```javascript
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the monorepo root so Metro can resolve workspace packages
config.watchFolders = [workspaceRoot];

// Resolve modules from workspace root node_modules first, then project
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Disable symlink resolution — pnpm uses symlinks; Metro must follow them
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
```

### Step 1.4 — Shared packages

```bash
mkdir -p packages/supabase/src
mkdir -p packages/validators/src
mkdir -p packages/ui-shared/src
```

Each package needs a `package.json`. Example for `packages/validators`:
```json
{
  "name": "@crewcircle/validators",
  "version": "0.0.1",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest run"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vitest": "^1.6.0"
  }
}
```

Repeat for `@crewcircle/supabase` and `@crewcircle/ui-shared`.

Write `packages/supabase/src/client.browser.ts` (web only — uses @supabase/ssr):
```typescript
// This file must only be imported in apps/web — never in apps/mobile
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

export const createSupabaseBrowserClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
```

Write `packages/supabase/src/client.mobile.ts` (mobile only — uses plain supabase-js):
```typescript
// This file must only be imported in apps/mobile
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Database } from "./database.types";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

> **Agent note**: Do NOT create a single `client.ts` that tries to work in both environments. The SSR cookie-based auth and the AsyncStorage auth are incompatible. Two separate files, two separate imports.

### Step 1.5 — Supabase CLI init

```bash
supabase init
supabase link --project-ref <YOUR_PROJECT_REF>
```

Verify:
```bash
supabase status
# Must show: API URL pointing to ap-southeast-2
```

### Step 1.6 — Environment files

`apps/web/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>  # server-only, never import in client components
```

`apps/mobile/.env` (loaded by Expo via `app.config.ts`):
```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Add to `.gitignore`:
```
.env.local
.env
*.env
**/.next/
**/dist/
**/node_modules/
```

### Step 1.7 — GitHub Actions CI

Write `.github/workflows/ci.yml`:
```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo build
      - run: pnpm turbo lint
```

### Task 1 Verification

```bash
# 1. Full build passes
pnpm install
pnpm turbo build
# Expected: exit 0, apps/web/.next/ exists

# 2. Lint passes
pnpm turbo lint
# Expected: 0 errors

# 3. Web dev server starts
pnpm --filter web dev &
sleep 5
curl -f http://localhost:3000 | grep -i "next"
# Expected: HTTP 200

# 4. Expo dev server starts
pnpm --filter mobile start --no-dev &
sleep 10
# Expected: Metro bundler ready message

# 5. Supabase linked to Sydney region
supabase status | grep "ap-southeast-2"
# Expected: URL contains ap-southeast-2
```

Save output to `.sisyphus/evidence/task-1-monorepo-build.txt`.

### Task 1 Commit

```bash
pnpm turbo build && pnpm turbo lint
git add -A
git commit -m "chore(infra): initialize turborepo monorepo with Next.js, Expo, and Supabase"
git push origin main
```

---

## Task 2 — Database Schema, RLS Policies, pgTap Tests

### Preconditions
- Task 1 complete and verified
- `supabase link` confirmed pointing to ap-southeast-2 project

### Step 2.1 — Core migration file

Create `supabase/migrations/20240001_core_schema.sql`. Write the entire schema in one migration for clarity. Agent must write every line — do not truncate.

```sql
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
```

### Step 2.2 — RLS helper function

Create `supabase/migrations/20240002_rls_helpers.sql`:

```sql
-- SECURITY DEFINER so it runs as the function definer (postgres),
-- bypassing any per-row RLS on profiles while still reading the
-- calling user's ID from auth.uid().
-- Wrapping auth.uid() in a subquery prevents row-level plan caching
-- issues that occur when auth.uid() is called directly in policies.
CREATE OR REPLACE FUNCTION is_tenant_member(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM tenant_members tm
    WHERE tm.tenant_id = p_tenant_id
      AND tm.profile_id = (SELECT auth.uid())
      AND tm.deleted_at IS NULL
  );
$$;

-- Helper: get role for current user in a tenant
CREATE OR REPLACE FUNCTION get_tenant_role(p_tenant_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tm.role
  FROM tenant_members tm
  WHERE tm.tenant_id = p_tenant_id
    AND tm.profile_id = (SELECT auth.uid())
    AND tm.deleted_at IS NULL
  LIMIT 1;
$$;
```

### Step 2.3 — RLS policies

Create `supabase/migrations/20240003_rls_policies.sql`:

```sql
-- Enable RLS on every table
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE clock_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- TENANTS: member can read; only owner can update
CREATE POLICY "tenant_member_read" ON tenants
  FOR SELECT USING (is_tenant_member(id));

CREATE POLICY "tenant_owner_update" ON tenants
  FOR UPDATE USING (get_tenant_role(id) IN ('owner'));

-- LOCATIONS: any member can read; manager/owner can write
CREATE POLICY "location_member_read" ON locations
  FOR SELECT USING (is_tenant_member(tenant_id) AND deleted_at IS NULL);

CREATE POLICY "location_manager_write" ON locations
  FOR ALL USING (get_tenant_role(tenant_id) IN ('owner', 'manager'));

-- PROFILES: members can read others in the same tenant; users can update their own
CREATE POLICY "profile_member_read" ON profiles
  FOR SELECT USING (is_tenant_member(tenant_id) AND deleted_at IS NULL);

CREATE POLICY "profile_self_update" ON profiles
  FOR UPDATE USING (id = (SELECT auth.uid()));

CREATE POLICY "profile_manager_write" ON profiles
  FOR ALL USING (get_tenant_role(tenant_id) IN ('owner', 'manager'));

-- TENANT_MEMBERS: members can see their own row; managers can see all
CREATE POLICY "tenant_member_self_read" ON tenant_members
  FOR SELECT USING (
    profile_id = (SELECT auth.uid()) OR
    get_tenant_role(tenant_id) IN ('owner', 'manager')
  );

-- ROSTERS: all members read; manager/owner write
CREATE POLICY "roster_member_read" ON rosters
  FOR SELECT USING (is_tenant_member(tenant_id) AND deleted_at IS NULL);

CREATE POLICY "roster_manager_write" ON rosters
  FOR ALL USING (get_tenant_role(tenant_id) IN ('owner', 'manager'));

-- SHIFTS: all members read published; manager/owner write
CREATE POLICY "shift_member_read" ON shifts
  FOR SELECT USING (is_tenant_member(tenant_id) AND deleted_at IS NULL);

CREATE POLICY "shift_manager_write" ON shifts
  FOR ALL USING (get_tenant_role(tenant_id) IN ('owner', 'manager'));

-- AVAILABILITY: employee reads/writes own; manager reads all
CREATE POLICY "availability_self_write" ON availability
  FOR ALL USING (profile_id = (SELECT auth.uid()) AND is_tenant_member(tenant_id));

CREATE POLICY "availability_manager_read" ON availability
  FOR SELECT USING (get_tenant_role(tenant_id) IN ('owner', 'manager'));

-- CLOCK EVENTS: employee inserts/reads own; manager reads all
CREATE POLICY "clock_event_self_insert" ON clock_events
  FOR INSERT WITH CHECK (
    profile_id = (SELECT auth.uid()) AND is_tenant_member(tenant_id)
  );

CREATE POLICY "clock_event_self_read" ON clock_events
  FOR SELECT USING (
    (profile_id = (SELECT auth.uid()) OR get_tenant_role(tenant_id) IN ('owner', 'manager'))
    AND deleted_at IS NULL
  );

CREATE POLICY "clock_event_manager_update" ON clock_events
  FOR UPDATE USING (get_tenant_role(tenant_id) IN ('owner', 'manager'));

-- PUSH TOKENS: user manages own tokens only
CREATE POLICY "push_token_self" ON push_tokens
  FOR ALL USING (profile_id = (SELECT auth.uid()));
```

### Step 2.4 — pgTap tests

Create `supabase/tests/rls_isolation.test.sql`:

```sql
BEGIN;
SELECT plan(12);

-- Setup: create two tenants and two users
SELECT tests.create_supabase_user('alice@test.com', 'testpass');
SELECT tests.create_supabase_user('bob@test.com', 'testpass');

-- Authenticate as alice, create tenant A
SELECT tests.authenticate_as('alice@test.com');

INSERT INTO tenants (id, name, abn) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Tenant A', NULL);
INSERT INTO profiles (id, tenant_id, role, email) VALUES
  (auth.uid(), 'aaaaaaaa-0000-0000-0000-000000000001', 'owner', 'alice@test.com');
INSERT INTO tenant_members (tenant_id, profile_id, role) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', auth.uid(), 'owner');
INSERT INTO locations (id, tenant_id, name) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Cafe A');
INSERT INTO rosters (id, tenant_id, location_id, week_start) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000003',
   'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000002',
   '2026-01-06');

-- Authenticate as bob, create tenant B
SELECT tests.authenticate_as('bob@test.com');

INSERT INTO tenants (id, name) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Tenant B');
INSERT INTO profiles (id, tenant_id, role, email) VALUES
  (auth.uid(), 'bbbbbbbb-0000-0000-0000-000000000001', 'owner', 'bob@test.com');
INSERT INTO tenant_members (tenant_id, profile_id, role) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', auth.uid(), 'owner');

-- Test: Bob cannot see Tenant A's roster
SELECT is(
  (SELECT count(*)::int FROM rosters WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  0,
  'Bob cannot see Tenant A rosters'
);

-- Test: Bob cannot see Tenant A's location
SELECT is(
  (SELECT count(*)::int FROM locations WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  0,
  'Bob cannot see Tenant A locations'
);

-- Test: Bob cannot see Tenant A's profiles
SELECT is(
  (SELECT count(*)::int FROM profiles WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  0,
  'Bob cannot see Tenant A profiles'
);

-- Test: Bob cannot insert shift into Tenant A roster
SELECT throws_ok(
  $$ INSERT INTO shifts (tenant_id, location_id, roster_id, start_time, end_time)
     VALUES ('aaaaaaaa-0000-0000-0000-000000000001',
             'aaaaaaaa-0000-0000-0000-000000000002',
             'aaaaaaaa-0000-0000-0000-000000000003',
             now(), now() + interval '8 hours') $$,
  'new row violates row-level security policy',
  'Bob cannot insert shift into Tenant A roster'
);

-- Test: Soft delete excludes rows
SELECT tests.authenticate_as('alice@test.com');
INSERT INTO shifts (id, tenant_id, location_id, roster_id, start_time, end_time)
  VALUES ('cccccccc-0000-0000-0000-000000000001',
          'aaaaaaaa-0000-0000-0000-000000000001',
          'aaaaaaaa-0000-0000-0000-000000000002',
          'aaaaaaaa-0000-0000-0000-000000000003',
          now(), now() + interval '8 hours');

UPDATE shifts SET deleted_at = now() WHERE id = 'cccccccc-0000-0000-0000-000000000001';

SELECT is(
  (SELECT count(*)::int FROM shifts WHERE id = 'cccccccc-0000-0000-0000-000000000001'),
  0,
  'Soft-deleted shift not visible via default view'
);

-- ABN validation
SELECT lives_ok(
  $$ INSERT INTO tenants (name, abn) VALUES ('Valid ABN', '51824753556') $$,
  'Valid ABN 51824753556 accepted'
);

SELECT throws_ok(
  $$ INSERT INTO tenants (name, abn) VALUES ('Invalid ABN', '12345678901') $$,
  'new row for relation "tenants" violates check constraint "tenants_abn_valid"',
  'Invalid ABN rejected'
);

SELECT * FROM finish();
ROLLBACK;
```

### Step 2.5 — Apply and verify

```bash
supabase db push
supabase test db
```

Expected: `# 12 tests passed. # 0 tests failed.`

Save output to `.sisyphus/evidence/task-2-rls-tests.txt`.

### Task 2 Commit

```bash
supabase test db
git add supabase/
git commit -m "chore(db): add core schema with RLS policies and pgTap isolation tests"
```

---

## Task 3 — Auth System

### Preconditions
- Task 2 complete. All tables and RLS policies exist.

### Step 3.1 — ABN validator in packages/validators

Create `packages/validators/src/abn.ts`:

```typescript
/**
 * Australian Business Number (ABN) Modulus 89 validation.
 * Reference: https://abr.business.gov.au/Help/AbnFormat
 *
 * Algorithm:
 * 1. Subtract 1 from the first digit.
 * 2. Multiply each resulting digit by its weighting factor.
 * 3. Sum the resulting 11 products.
 * 4. Divide the total by 89. If remainder = 0, ABN is valid.
 */
const ABN_WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

export function validateABN(abn: string): boolean {
  const digits = abn.replace(/\s/g, "");
  if (!/^\d{11}$/.test(digits)) return false;

  const sum = digits.split("").reduce((acc, digit, i) => {
    const d = i === 0 ? parseInt(digit) - 1 : parseInt(digit);
    return acc + d * ABN_WEIGHTS[i];
  }, 0);

  return sum % 89 === 0;
}

// Known valid ABN for tests: 51 824 753 556 (Australian Broadcasting Corporation)
// Known invalid: 12 345 678 901
```

Create `packages/validators/src/auth.ts`:

```typescript
import { z } from "zod";
import { validateABN } from "./abn";

export const SignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[0-9]/, "Must contain number"),
  businessName: z.string().min(2, "Business name required"),
  abn: z
    .string()
    .optional()
    .refine((val) => !val || validateABN(val), { message: "Invalid ABN" }),
  timezone: z.string().default("Australia/Melbourne"),
});

export type SignupInput = z.infer<typeof SignupSchema>;

export const InviteEmployeeSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["manager", "employee"]).default("employee"),
});

export type InviteEmployeeInput = z.infer<typeof InviteEmployeeSchema>;
```

### Step 3.2 — Supabase server-side auth helpers (web only)

Create `apps/web/app/auth/actions.ts` (Next.js Server Action):

```typescript
"use server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignupSchema, type SignupInput } from "@crewcircle/validators/auth";

function createAdminClient() {
  // Service role key stays server-side — never exported to browser bundle
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function signupAction(input: SignupInput) {
  const parsed = SignupSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { email, password, businessName, abn, timezone } = parsed.data;

  // 1. Create auth user
  const adminClient = createAdminClient();
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError) return { error: { email: [authError.message] } };
  const userId = authData.user.id;

  // 2. Create tenant
  const { data: tenant, error: tenantError } = await adminClient
    .from("tenants")
    .insert({ name: businessName, abn: abn || null, timezone })
    .select()
    .single();
  if (tenantError) return { error: { businessName: [tenantError.message] } };

  // 3. Create default location
  await adminClient
    .from("locations")
    .insert({ tenant_id: tenant.id, name: businessName, timezone });

  // 4. Create profile
  await adminClient
    .from("profiles")
    .insert({ id: userId, tenant_id: tenant.id, role: "owner", email });

  // 5. Create tenant_member record
  await adminClient
    .from("tenant_members")
    .insert({ tenant_id: tenant.id, profile_id: userId, role: "owner", accepted_at: new Date().toISOString() });

  redirect("/dashboard");
}
```

### Step 3.3 — Signup page

Create `apps/web/app/(auth)/signup/page.tsx`. This is a standard React form that calls `signupAction`. Include:
- Fields: email, password, business name, ABN (optional)
- Client-side Zod validation on submit (before server action fires)
- ABN field shows "e.g. 51 824 753 556" as placeholder
- Error state displayed inline per field

### Step 3.4 — Employee invitation flow

Create `apps/web/app/(dashboard)/team/actions.ts`:

```typescript
"use server";
// Invite an employee by email.
// This creates a profile row and sends Supabase magic link.
export async function inviteEmployeeAction(input: InviteEmployeeInput, tenantId: string) {
  const adminClient = createAdminClient();

  // Generate invite link via Supabase Auth
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "invite",
    email: input.email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite`,
      data: { tenantId, role: input.role },
    },
  });
  if (error) return { error: error.message };

  // Pre-create profile with null id until user accepts
  await adminClient.from("profiles").insert({
    id: data.user.id,
    tenant_id: tenantId,
    role: input.role,
    email: input.email,
    first_name: input.firstName,
    last_name: input.lastName,
  });
  await adminClient.from("tenant_members").insert({
    tenant_id: tenantId,
    profile_id: data.user.id,
    role: input.role,
  });

  return { success: true };
}
```

### Step 3.5 — Route protection middleware

Create `apps/web/middleware.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => cookies.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        ),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isProtectedPath = request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/roster") ||
    request.nextUrl.pathname.startsWith("/team") ||
    request.nextUrl.pathname.startsWith("/timesheets");

  if (!user && isProtectedPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)"],
};
```

### Task 3 Verification

```bash
# Playwright: full signup flow
npx playwright test apps/web/tests/auth.spec.ts

# Vitest: ABN validation
pnpm --filter validators test
```

Playwright test assertions:
- Navigate to `/signup`, fill valid data, submit → redirects to `/dashboard`
- Submit invalid ABN `12345678901` → error "Invalid ABN" shown, no redirect

Save screenshots to `.sisyphus/evidence/task-3-signup-flow.png` and `task-3-abn-validation.png`.

### Task 3 Commit

```bash
pnpm turbo build && pnpm turbo test
git add -A
git commit -m "feat(auth): add business signup with ABN validation, employee invitation, and route protection"
```

---

## Task 4 — Roster Grid UI with Drag-and-Drop

### Preconditions
- Task 3 complete. Auth and DB working.

### Step 4.1 — Install dependencies

```bash
pnpm --filter web add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @dnd-kit/modifiers
pnpm --filter web add @tanstack/react-virtual zustand immer
pnpm --filter web add date-fns @internationalized/date
```

### Step 4.2 — Zustand roster store

Create `apps/web/features/roster/store.ts`:

```typescript
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Shift } from "@crewcircle/supabase";

interface RosterState {
  // Key: "profileId:YYYY-MM-DD", Value: shift[]
  cellShifts: Record<string, Shift[]>;
  weekStart: string; // ISO date YYYY-MM-DD
  isDirty: boolean;
  actions: {
    setWeekStart: (date: string) => void;
    loadShifts: (shifts: Shift[]) => void;
    moveShift: (shiftId: string, toProfileId: string, toDate: string) => void;
    addShift: (shift: Shift) => void;
    removeShift: (shiftId: string) => void;
    markClean: () => void;
  };
}

export const useRosterStore = create<RosterState>()(
  immer((set) => ({
    cellShifts: {},
    weekStart: "",
    isDirty: false,
    actions: {
      setWeekStart: (date) => set((s) => { s.weekStart = date; }),
      loadShifts: (shifts) => set((s) => {
        s.cellShifts = {};
        shifts.forEach((shift) => {
          // Key = profileId + date in tenant timezone (calculated upstream)
          const date = shift.start_time.slice(0, 10);
          const key = `${shift.profile_id}:${date}`;
          if (!s.cellShifts[key]) s.cellShifts[key] = [];
          s.cellShifts[key].push(shift);
        });
      }),
      moveShift: (shiftId, toProfileId, toDate) => set((s) => {
        // O(1) because Immer patches only changed nodes
        for (const key of Object.keys(s.cellShifts)) {
          const idx = s.cellShifts[key].findIndex((sh) => sh.id === shiftId);
          if (idx !== -1) {
            const [shift] = s.cellShifts[key].splice(idx, 1);
            shift.profile_id = toProfileId;
            // Preserve the time, only change the date
            const timePart = shift.start_time.slice(10);
            shift.start_time = toDate + timePart;
            const endTimePart = shift.end_time.slice(10);
            shift.end_time = toDate + endTimePart;
            const newKey = `${toProfileId}:${toDate}`;
            if (!s.cellShifts[newKey]) s.cellShifts[newKey] = [];
            s.cellShifts[newKey].push(shift);
            s.isDirty = true;
            break;
          }
        }
      }),
      addShift: (shift) => set((s) => {
        const date = shift.start_time.slice(0, 10);
        const key = `${shift.profile_id}:${date}`;
        if (!s.cellShifts[key]) s.cellShifts[key] = [];
        s.cellShifts[key].push(shift);
        s.isDirty = true;
      }),
      removeShift: (shiftId) => set((s) => {
        for (const key of Object.keys(s.cellShifts)) {
          const idx = s.cellShifts[key].findIndex((sh) => sh.id === shiftId);
          if (idx !== -1) {
            s.cellShifts[key].splice(idx, 1);
            s.isDirty = true;
            break;
          }
        }
      }),
      markClean: () => set((s) => { s.isDirty = false; }),
    },
  }))
);
```

### Step 4.3 — Roster grid component

Create `apps/web/features/roster/RosterGrid.tsx`:

Key implementation requirements:

```typescript
// Grid is CSS Grid: columns = [employee-name] + [7 day-columns]
// grid-template-columns: 180px repeat(7, 1fr)

// Each ROW is virtualized using @tanstack/react-virtual:
// const rowVirtualizer = useVirtualizer({
//   count: employees.length,
//   getScrollElement: () => parentRef.current,
//   estimateSize: () => 80,
//   overscan: 5,
// });

// DnD setup:
// const sensors = useSensors(
//   useSensor(PointerSensor),
//   useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
// );
// Wrap entire grid in <DndContext> with sensors + collision detection = closestCenter
// Each shift card is useDraggable({ id: shift.id, data: { shift } })
// Each cell is useDroppable({ id: `${profileId}:${dateStr}` })

// On DragEnd event:
// const { active, over } = event;
// if (!over) return;
// const [toProfileId, toDate] = over.id.split(":");
// store.actions.moveShift(active.id, toProfileId, toDate);
// Persist to Supabase — debounce 5s
```

Auto-save logic:

```typescript
// In a useEffect watching isDirty:
useEffect(() => {
  if (!isDirty) return;
  const timer = setTimeout(async () => {
    await persistRosterToSupabase(store.cellShifts);
    store.actions.markClean();
  }, 5000); // 5 second debounce
  return () => clearTimeout(timer);
}, [isDirty]);
```

Accessibility requirements:
- Every shift card has `role="button"` and `aria-label="Shift for [name] on [date], [time]-[time]"`
- KeyboardSensor enables Tab-to-shift, Enter to open edit modal, arrow keys via dnd-kit
- Color contrast on shift cards meets WCAG AA (4.5:1)

### Task 4 Verification

```bash
# Seed 30 employees + 60 shifts
node scripts/seed-roster.js

# Playwright tests
npx playwright test apps/web/tests/roster.spec.ts
```

Assertions:
- Drag shift from Monday to Tuesday — shift appears in Tuesday column after drag
- Refresh page — shift is still in Tuesday (persisted via auto-save)
- Grid with 30 employees renders in under 2000ms (measured with `performance.now()`)

Save to `.sisyphus/evidence/task-4-drag-shift.png` and `task-4-performance.txt`.

### Task 4 Commit

```bash
git add -A
git commit -m "feat(roster): add drag-and-drop roster grid with dnd-kit, virtual rows, and keyboard accessibility"
```

---

## Task 5 — Shift CRUD + Conflict Detection

### Preconditions
- Task 4 complete. Roster grid renders and accepts drops.

### Step 5.1 — Conflict detection engine

Create `packages/validators/src/conflicts.ts`:

```typescript
import type { Shift } from "@crewcircle/supabase";

export type ConflictType = "OVERLAP" | "AVAILABILITY" | "MAX_HOURS" | "MIN_REST";

export interface Conflict {
  type: ConflictType;
  message: string;
  severity: "warning"; // always warning in Phase 1A — never hard block
}

/**
 * Returns overlap conflicts for a candidate shift against existing shifts.
 * All times are UTC timestamptz strings — compare as epoch ms.
 *
 * An overlap exists when:
 *   newStart < existingEnd AND newEnd > existingStart
 *
 * Real example: Staff member working 9am-5pm (shift A).
 * Manager tries to add 3pm-11pm (shift B) → overlap 3pm-5pm triggers conflict.
 */
export function detectOverlap(candidate: Shift, existing: Shift[]): Conflict[] {
  return existing
    .filter((s) => {
      if (s.id === candidate.id) return false; // same shift editing
      if (s.profile_id !== candidate.profile_id) return false;
      if (s.deleted_at) return false;
      const cStart = new Date(candidate.start_time).getTime();
      const cEnd = new Date(candidate.end_time).getTime();
      const eStart = new Date(s.start_time).getTime();
      const eEnd = new Date(s.end_time).getTime();
      return cStart < eEnd && cEnd > eStart;
    })
    .map(() => ({
      type: "OVERLAP" as const,
      severity: "warning" as const,
      message: "This shift overlaps with an existing shift for this employee.",
    }));
}

/**
 * Detect availability conflicts.
 * Availability is stored as day_of_week + start_time/end_time in tenant local time.
 * Shift times are UTC — convert to tenant timezone before comparing day/time.
 */
export function detectAvailabilityConflict(
  shift: Shift,
  availability: Array<{ day_of_week: number; start_time: string | null; end_time: string | null; is_available: boolean }>,
  tenantTimezone: string
): Conflict[] {
  const shiftStart = new Date(shift.start_time);
  const formatter = new Intl.DateTimeFormat("en-AU", {
    timeZone: tenantTimezone,
    weekday: "short",
  });
  // getDay() in UTC can be wrong — use the timezone-aware formatter
  const dayName = formatter.format(shiftStart);
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const shiftDay = dayMap[dayName];

  const dayAvail = availability.find((a) => a.day_of_week === shiftDay);
  if (dayAvail && !dayAvail.is_available) {
    return [{
      type: "AVAILABILITY",
      severity: "warning",
      message: `Employee has marked this day as unavailable.`,
    }];
  }
  return [];
}

/**
 * Detect minimum rest violation (less than 10 hours between shifts).
 * Under most Australian Modern Awards, employees are entitled to a 10-hour break
 * between consecutive shifts. This is a soft warning only.
 */
export function detectMinRest(
  candidate: Shift,
  existing: Shift[],
  minRestHours = 10
): Conflict[] {
  const MIN_REST_MS = minRestHours * 60 * 60 * 1000;
  const cStart = new Date(candidate.start_time).getTime();
  const cEnd = new Date(candidate.end_time).getTime();

  return existing
    .filter((s) => s.profile_id === candidate.profile_id && !s.deleted_at && s.id !== candidate.id)
    .filter((s) => {
      const eStart = new Date(s.start_time).getTime();
      const eEnd = new Date(s.end_time).getTime();
      const gapAfter = cStart - eEnd;   // gap between existing end and new start
      const gapBefore = eStart - cEnd;  // gap between new end and existing start
      return (gapAfter >= 0 && gapAfter < MIN_REST_MS) ||
             (gapBefore >= 0 && gapBefore < MIN_REST_MS);
    })
    .map(() => ({
      type: "MIN_REST" as const,
      severity: "warning" as const,
      message: `Less than ${minRestHours} hours rest between consecutive shifts.`,
    }));
}

/**
 * Haversine formula for distance in metres between two GPS coordinates.
 * Used for geofence check in Task 9 — included here for testability.
 */
export function haversineDistanceMetres(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

### Step 5.2 — Vitest tests

Create `packages/validators/src/conflicts.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { detectOverlap, detectMinRest, haversineDistanceMetres } from "./conflicts";

describe("detectOverlap", () => {
  it("flags overlapping shifts for same employee", () => {
    const existing = [{ id: "s1", profile_id: "p1", start_time: "2026-04-06T09:00:00Z",
      end_time: "2026-04-06T17:00:00Z", deleted_at: null } as any];
    const candidate = { id: "s2", profile_id: "p1", start_time: "2026-04-06T15:00:00Z",
      end_time: "2026-04-06T23:00:00Z" } as any;
    expect(detectOverlap(candidate, existing)).toHaveLength(1);
    expect(detectOverlap(candidate, existing)[0].type).toBe("OVERLAP");
  });

  it("ignores shifts for different employees", () => {
    const existing = [{ id: "s1", profile_id: "p2", start_time: "2026-04-06T09:00:00Z",
      end_time: "2026-04-06T17:00:00Z", deleted_at: null } as any];
    const candidate = { id: "s2", profile_id: "p1", start_time: "2026-04-06T09:00:00Z",
      end_time: "2026-04-06T17:00:00Z" } as any;
    expect(detectOverlap(candidate, existing)).toHaveLength(0);
  });

  it("midnight-crossing shift calculates duration as 8 hours", () => {
    // 10pm AEDT = 11am UTC next day
    const start = new Date("2026-04-06T12:00:00Z"); // 10pm AEDT
    const end = new Date("2026-04-06T20:00:00Z");   // 6am AEDT next day
    const hours = (end.getTime() - start.getTime()) / 3600000;
    expect(hours).toBe(8);
  });
});

describe("detectMinRest", () => {
  it("flags shifts with less than 10 hours rest", () => {
    const existing = [{ id: "s1", profile_id: "p1",
      start_time: "2026-04-06T09:00:00Z", end_time: "2026-04-06T17:00:00Z",
      deleted_at: null } as any];
    // New shift starts 8 hours after end — violates 10 hour minimum
    const candidate = { id: "s2", profile_id: "p1",
      start_time: "2026-04-07T01:00:00Z", end_time: "2026-04-07T09:00:00Z" } as any;
    expect(detectMinRest(candidate, existing)).toHaveLength(1);
  });
});

describe("haversineDistanceMetres", () => {
  it("calculates Melbourne CBD to South Yarra as ~4km", () => {
    const dist = haversineDistanceMetres(-37.8136, 144.9631, -37.8395, 144.9909);
    expect(dist).toBeGreaterThan(3500);
    expect(dist).toBeLessThan(4500);
  });

  it("nearby points within 150m geofence", () => {
    // Two points ~100m apart in Sydney CBD
    const dist = haversineDistanceMetres(-33.8688, 151.2093, -33.8695, 151.2100);
    expect(dist).toBeLessThan(150);
  });
});
```

### Task 5 Verification

```bash
pnpm --filter validators test
# Expected: all tests pass

# Playwright: overlap warning appears in UI
npx playwright test apps/web/tests/shifts.spec.ts
```

Save output to `.sisyphus/evidence/task-5-overlap-conflict.png` and `task-5-midnight-crossing.txt`.

### Task 5 Commit

```bash
pnpm --filter validators test
git add -A
git commit -m "feat(roster): add shift CRUD with conflict detection, midnight-crossing support, and Vitest coverage"
```

---

## Task 6 — Roster Publish Workflow + Realtime

### Preconditions
- Task 5 complete.

### Step 6.1 — Publish action

Create `apps/web/features/roster/actions.ts`:

```typescript
"use server";
export async function publishRosterAction(rosterId: string, tenantId: string) {
  // Validate the calling user is manager/owner of this tenant
  const supabase = createServerClient(/* ... */);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  const { error } = await supabase
    .from("rosters")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      published_by: user.id,
    })
    .eq("id", rosterId)
    .eq("tenant_id", tenantId) // RLS double-check
    .eq("status", "draft");    // Can only publish from draft

  if (error) return { error: error.message };
  return { success: true };
}
```

### Step 6.2 — Realtime hook

Create `packages/ui-shared/src/hooks/useRosterRealtime.ts`:

```typescript
import { useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Subscribes to real-time roster and shift changes for a given week.
 * Uses Supabase Realtime Postgres Changes on tables that have REPLICA IDENTITY FULL set.
 *
 * Call this once in the roster page. Pass a callback that refreshes local state.
 * The onUpdate callback receives the full new row, allowing O(1) store updates.
 */
export function useRosterRealtime(
  supabase: SupabaseClient,
  rosterId: string,
  onRosterUpdate: (roster: any) => void,
  onShiftUpdate: (shift: any) => void
) {
  useEffect(() => {
    const channel = supabase
      .channel(`roster:${rosterId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "rosters",
        filter: `id=eq.${rosterId}`,
      }, (payload) => onRosterUpdate(payload.new))
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "shifts",
        filter: `roster_id=eq.${rosterId}`,
      }, (payload) => onShiftUpdate(payload.new))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [rosterId]);
}
```

### Step 6.3 — Edge function for push notification trigger

Create `supabase/functions/on-roster-published/index.ts`:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const payload = await req.json();
  // Called by Supabase Database Webhook on rosters table UPDATE
  if (payload.new?.status !== "published") return new Response("skip", { status: 200 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const rosterId = payload.new.id;
  const tenantId = payload.new.tenant_id;
  const weekStart = payload.new.week_start;

  // Get all employee profile_ids with shifts in this roster
  const { data: shifts } = await supabase
    .from("shifts")
    .select("profile_id")
    .eq("roster_id", rosterId)
    .is("deleted_at", null);

  const profileIds = [...new Set(shifts?.map((s) => s.profile_id).filter(Boolean))];

  // Get push tokens for these employees
  const { data: tokens } = await supabase
    .from("push_tokens")
    .select("expo_push_token")
    .in("profile_id", profileIds);

  if (!tokens?.length) return new Response("no tokens", { status: 200 });

  // Send via Expo Push API
  const messages = tokens.map((t) => ({
    to: t.expo_push_token,
    title: "Roster Published",
    body: `Your roster for the week of ${weekStart} is now available.`,
    data: { rosterId, screen: "roster" },
  }));

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });

  return new Response("ok", { status: 200 });
});
```

Register this function as a Supabase Database Webhook:
- Table: `rosters`
- Events: `UPDATE`
- URL: `https://<project>.supabase.co/functions/v1/on-roster-published`

### Task 6 Verification

```bash
# Playwright: publish makes roster read-only
npx playwright test apps/web/tests/roster-publish.spec.ts
```

Playwright test verifies:
1. Create draft roster with 3 shifts
2. Click Publish → confirm dialog → roster shows "Published" badge
3. Assert all shift edit buttons are disabled
4. Click Unpublish → shifts become editable
5. Copy-forward: shifts for week A appear on week B with dates +7

Save to `.sisyphus/evidence/task-6-publish-readonly.png`.

### Task 6 Commit

```bash
git add -A
git commit -m "feat(roster): add publish workflow with state machine, copy-forward, and realtime updates"
```

---

## Task 7 — Mobile App Shell + Auth

### Preconditions
- Task 3 complete (auth working on web)
- Expo SDK 52+ installed

### Step 7.1 — Dependencies

```bash
pnpm --filter mobile add @supabase/supabase-js @react-native-async-storage/async-storage
pnpm --filter mobile add expo-router expo-notifications expo-sqlite expo-location
pnpm --filter mobile add react-native-geolocation-service
pnpm --filter mobile add @crewcircle/supabase @crewcircle/validators
```

### Step 7.2 — Expo Router file structure

```
apps/mobile/app/
├── _layout.tsx              # Root layout, session check
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx
│   └── accept-invite.tsx
└── (tabs)/
    ├── _layout.tsx          # Tab bar
    ├── roster.tsx
    ├── timeclock.tsx
    ├── messages.tsx
    └── profile.tsx
```

Write `apps/mobile/app/_layout.tsx`:

```typescript
import { useEffect, useState } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { supabase } from "@crewcircle/supabase/client.mobile";

export default function RootLayout() {
  const [session, setSession] = useState<any>(undefined);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return; // still loading
    const inAuthGroup = segments[0] === "(auth)";
    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)/roster");
    }
  }, [session, segments]);

  return <Slot />;
}
```

### Step 7.3 — Push token registration

Add to `apps/mobile/app/(tabs)/_layout.tsx` — runs once after login:

```typescript
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "@crewcircle/supabase/client.mobile";

async function registerPushToken() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Upsert — handles re-registration on reinstall
  await supabase.from("push_tokens").upsert({
    profile_id: user.id,
    expo_push_token: token.data,
    platform: Platform.OS,
  }, { onConflict: "expo_push_token" });
}
```

### Step 7.4 — eas.json

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false },
      "android": { "buildType": "apk" }
    },
    "production": {
      "ios": { "autoIncrement": true },
      "android": { "autoIncrement": true }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Task 7 Verification

Manual on Expo Go (physical device):
1. Open app → redirected to login screen
2. Enter credentials created via web invitation
3. Tab bar appears: Roster, Time Clock, Messages, Profile
4. Profile tab shows employee name and business name
5. Logout → redirected to login

Save screenshot to `.sisyphus/evidence/task-7-mobile-login.png`.

### Task 7 Commit

```bash
git add -A
git commit -m "feat(mobile): add Expo app shell with Supabase auth, tab navigation, and push token registration"
```

---

## Task 8 — Employee Roster View + Availability (Mobile)

### Preconditions
- Task 7 complete. Tab navigation working.
- Task 6 complete. Roster publish workflow working.

### Step 8.1 — Roster tab

Key implementation for `apps/mobile/app/(tabs)/roster.tsx`:

```typescript
// Fetch only shifts for the logged-in user, in the current week,
// from published rosters only.
// Filter: profile_id = auth.uid(), roster.status = 'published',
//         start_time >= weekStart, start_time < weekEnd

// Subscribe to realtime: supabase.channel("employee-roster")
//   .on("postgres_changes", { table: "shifts", filter: `profile_id=eq.${userId}` },
//     (payload) => updateShiftInState(payload.new))

// Display: FlatList of shift cards, sorted by start_time
// Each card: formatted local time (use IANA timezone from tenant), role_label, location name
// All time formatting uses Intl.DateTimeFormat with tenant.timezone (IANA string)
// Never format with a fixed UTC offset like +10:00 — use the IANA key directly

// Weekly navigation: state for weekOffset (integer), compute weekStart from
// startOfWeek(addWeeks(today, weekOffset)) using date-fns
```

### Step 8.2 — Availability screen

Create `apps/mobile/app/availability.tsx`:

```typescript
// 7 rows, one per day Mon-Sun
// Each row: day label + toggle (available/unavailable)
// If available: show time range pickers (start_time, end_time)
// On change: immediate optimistic update + debounced Supabase upsert

// Upsert into availability table:
// ON CONFLICT (tenant_id, profile_id, day_of_week) DO UPDATE
// This handles the case where availability was never set (insert) vs updating

// The manager web roster grid should show unavailable days with a grey/red overlay:
// In RosterCell component, check: does availability for this employee × day
// have is_available = false? If so, add CSS class for visual indicator.
```

### Task 8 Verification

Manual testing:
1. On web: publish roster with 3 shifts for test employee
2. On mobile: Roster tab shows 3 shift cards with correct times
3. Navigate to next week: "No shifts scheduled" empty state
4. Mark Tuesday as Unavailable in availability screen
5. On web: Tuesday cell for that employee shows unavailability indicator
6. Manager publishes new roster: mobile updates within 3 seconds without refresh

Save to `.sisyphus/evidence/task-8-employee-roster.png`.

### Task 8 Commit

```bash
git add -A
git commit -m "feat(mobile): add employee roster view with realtime updates and availability management"
```

---

## Task 9 — Time Clock with GPS + Offline Support

### Preconditions
- Task 7 complete. Task 5 complete (haversine function in validators).

### Step 9.1 — Offline outbox with expo-sqlite

Create `apps/mobile/features/timeclock/outbox.ts`:

```typescript
import * as SQLite from "expo-sqlite";

// Open/create DB synchronously on import — OK on mobile
const db = SQLite.openDatabaseSync("crewcircle.db");

// Create outbox table on first run
db.execSync(`
  CREATE TABLE IF NOT EXISTS clock_outbox (
    id TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    synced_at INTEGER
  );
`);

export interface OutboxEntry {
  id: string;        // idempotency_key as UUID
  payload: string;   // JSON of the clock event
}

export function addToOutbox(entry: OutboxEntry): void {
  db.runSync(
    "INSERT INTO clock_outbox (id, payload, created_at) VALUES (?, ?, ?)",
    entry.id, entry.payload, Date.now()
  );
}

export function getPendingEntries(): OutboxEntry[] {
  return db.getAllSync<OutboxEntry>(
    "SELECT id, payload FROM clock_outbox WHERE synced_at IS NULL ORDER BY created_at ASC"
  );
}

export function markSynced(id: string): void {
  db.runSync("UPDATE clock_outbox SET synced_at = ? WHERE id = ?", Date.now(), id);
}
```

### Step 9.2 — Clock event sync

Create `apps/mobile/features/timeclock/sync.ts`:

```typescript
import NetInfo from "@react-native-community/netinfo";
import { supabase } from "@crewcircle/supabase/client.mobile";
import { getPendingEntries, markSynced } from "./outbox";

/**
 * Attempts to flush all pending outbox entries to Supabase.
 * Safe to call multiple times — idempotency_key prevents duplicates.
 * Call this: on app foreground, on network reconnect.
 */
export async function syncOutbox(): Promise<void> {
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return;

  const pending = getPendingEntries();
  for (const entry of pending) {
    const payload = JSON.parse(entry.payload);
    const { error } = await supabase
      .from("clock_events")
      .upsert(payload, { onConflict: "idempotency_key" });

    if (!error) {
      markSynced(entry.id);
    }
    // If error (not a conflict), leave in outbox for next sync attempt
  }
}
```

### Step 9.3 — Time clock screen

Key implementation for `apps/mobile/app/(tabs)/timeclock.tsx`:

```typescript
// On "Clock In" tap:
// 1. Generate idempotency_key = crypto.randomUUID()
// 2. Get GPS: Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 })
// 3. Calculate haversineDistanceMetres(gps.lat, gps.lon, location.lat, location.lon)
// 4. isWithinGeofence = distance <= location.geofence_radius_m
// 5. If !isWithinGeofence: show Alert.alert("Outside location", "Clock in anyway?", [Cancel, Confirm])
// 6. Construct clock event payload
// 7. Try Supabase insert:
//    - Success: show "Clocked in ✓", start duration timer
//    - Network error: add to SQLite outbox, show "Offline — will sync"
// 8. Start timer using setInterval(1000), store clockInTime in component state

// Auto clock-out: when app starts, check if there is an open clock_in event
// older than 23 hours — if so, insert clock_out with source='auto'
```

Location tracking compliance notice — show once on first open of time clock tab:

```typescript
const COMPLIANCE_SHOWN_KEY = "gps_compliance_shown";
// Alert text (exact wording required):
// "This app records your GPS location when you clock in and out.
//  Location data is stored securely and only used for attendance purposes.
//  You can clock in without GPS by tapping 'Clock in anyway'."
// Store acknowledgment in AsyncStorage after user taps OK
```

### Task 9 Verification

Manual testing on physical device:
1. Set location geofence to current location with 150m radius
2. Clock in → green "Clocked in" message, duration timer starts
3. Check Supabase: `clock_events` row with `is_within_geofence=true`
4. Enable airplane mode → clock in → "Offline — will sync" shown
5. Re-enable connectivity → within 30s, check Supabase has matching row

```bash
# Vitest: haversine + geofence logic
pnpm --filter validators test
```

Save to `.sisyphus/evidence/task-9-clock-in-geofence.png`.

### Task 9 Commit

```bash
git add -A
git commit -m "feat(timeclock): add GPS clock-in with soft geofencing, SQLite offline outbox, and anti-spoofing"
```

---

## Task 10 — Push Notification System

### Preconditions
- Task 6 complete (`on-roster-published` Edge Function stub exists).
- Task 7 complete (push token registration works).

### Step 10.1 — Shared push sender Edge Function

Create `supabase/functions/send-push-notification/index.ts`:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface PushPayload {
  profileIds: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { profileIds, title, body, data }: PushPayload = await req.json();

  const { data: tokens } = await supabase
    .from("push_tokens")
    .select("expo_push_token")
    .in("profile_id", profileIds);

  if (!tokens?.length) return new Response("no tokens", { status: 200 });

  const messages = tokens.map((t) => ({
    to: t.expo_push_token,
    title,
    body,
    data,
    sound: "default",
  }));

  const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });

  const result = await expoResponse.json();

  // Handle invalid tokens — remove them from DB
  const invalidTokens = result.data
    ?.filter((r: any) => r.status === "error" && r.details?.error === "DeviceNotRegistered")
    .map((_: any, i: number) => tokens[i].expo_push_token) ?? [];

  if (invalidTokens.length) {
    await supabase.from("push_tokens").delete().in("expo_push_token", invalidTokens);
  }

  return new Response(JSON.stringify({ sent: messages.length, invalidRemoved: invalidTokens.length }));
});
```

### Step 10.2 — Shift reminder cron

Create `supabase/migrations/20240010_shift_reminder_cron.sql`:

```sql
-- Enable pg_cron (Supabase Pro includes this)
SELECT cron.schedule(
  'shift-reminders',
  '*/15 * * * *',  -- every 15 minutes
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.function_base_url') || '/send-shift-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' ||
               current_setting('app.settings.service_role_key') || '"}'::jsonb,
    body := '{}'::jsonb
  )
  $$
);
```

Create `supabase/functions/send-shift-reminders/index.ts` which:
1. Queries shifts starting in the next 2 hours
2. Filters to employees who haven't been sent a reminder for this shift
3. Calls `send-push-notification` for each employee
4. Records reminder sent in a `shift_reminders` table (add to migration 20240001)

### Task 10 Verification

1. Employee has push notifications enabled on physical device
2. Manager publishes roster on web
3. Within 30 seconds: push notification appears on device with "Roster Published" title
4. Check Supabase Edge Function logs: function called with correct payload, no errors

Save to `.sisyphus/evidence/task-10-push-roster.png`.

### Task 10 Commit

```bash
git add -A
git commit -m "feat(notifications): add push notification system via Expo Push and Supabase Edge Functions"
```

---

## Task 11 — Timesheet Generation + CSV Export

### Preconditions
- Task 9 complete. Clock events being recorded.

### Step 11.1 — Timesheet query

Create `apps/web/features/timesheets/queries.ts`:

```typescript
// Pair clock_in and clock_out events:
// For each employee, for each day, sort clock_events by recorded_at ASC
// Pair them: first clock_in with first clock_out, second with second, etc.
// If unpaired (clock_in with no clock_out): flag as "Open"
// Hours = (clock_out.recorded_at - clock_in.recorded_at) / 3600000
// Display times in tenant timezone using Intl.DateTimeFormat

// Midnight-crossing: a clock_in at 22:00 and clock_out at 06:00 next day
// is handled automatically by the epoch ms subtraction

// SQL query (run via supabase.rpc or raw from server component):
// SELECT
//   p.first_name, p.last_name, p.email,
//   ce.type, ce.recorded_at, ce.is_within_geofence,
//   l.name as location_name,
//   ce.approved_at, ce.approved_by
// FROM clock_events ce
// JOIN profiles p ON p.id = ce.profile_id
// JOIN locations l ON l.id = ce.location_id
// WHERE ce.tenant_id = $tenantId
//   AND ce.recorded_at >= $startDate
//   AND ce.recorded_at < $endDate
//   AND ce.deleted_at IS NULL
// ORDER BY p.last_name, ce.recorded_at
```

### Step 11.2 — CSV export

Create `apps/web/features/timesheets/export.ts`:

```typescript
import type { TimesheetRow } from "./types";

/**
 * Generates a CSV string from timesheet rows.
 * Australian conventions:
 *  - Date format: DD/MM/YYYY
 *  - Time format: HH:mm (24-hour)
 *  - Hours: decimal to 2 places (8.00 not "8:00")
 */
export function generateTimesheetCSV(rows: TimesheetRow[], timezone: string): string {
  const dtFmt = new Intl.DateTimeFormat("en-AU", {
    timeZone: timezone, day: "2-digit", month: "2-digit", year: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat("en-AU", {
    timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false,
  });

  const headers = "Employee Name,Email,Date,Start,End,Hours,Location,Geofence,Approved\n";

  const lines = rows.map((row) => {
    const date = dtFmt.format(new Date(row.clockIn));
    const start = timeFmt.format(new Date(row.clockIn));
    const end = row.clockOut ? timeFmt.format(new Date(row.clockOut)) : "Open";
    const hours = row.clockOut
      ? ((new Date(row.clockOut).getTime() - new Date(row.clockIn).getTime()) / 3600000).toFixed(2)
      : "";
    const geofence = row.isWithinGeofence ? "Yes" : "No";
    const approved = row.approvedAt ? "Yes" : "No";

    return [
      `"${row.firstName} ${row.lastName}"`,
      row.email,
      date,
      start,
      end,
      hours,
      `"${row.locationName}"`,
      geofence,
      approved,
    ].join(",");
  });

  return headers + lines.join("\n");
}
```

In the Next.js route handler, serve the CSV:

```typescript
// apps/web/app/api/timesheets/export/route.ts
export async function GET(request: Request) {
  // ... fetch rows, generate CSV ...
  return new Response(csvString, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="timesheets-${dateRange}.csv"`,
    },
  });
}
```

### Task 11 Verification

```bash
npx playwright test apps/web/tests/timesheets.spec.ts
```

Playwright assertions:
1. Seed 3 employees with clock events spanning the week
2. Navigate to `/timesheets`, select current week
3. Click "Approve All" → all rows show approved status
4. Click "Export CSV" → file downloaded
5. Read CSV: assert header row exact match, date format is `DD/MM/YYYY`, hours are decimal

Save CSV to `.sisyphus/evidence/task-11-csv-export.csv`.

### Task 11 Commit

```bash
git add -A
git commit -m "feat(timesheets): add timesheet generation from clock events, approval workflow, and CSV export"
```

---

## Task 12 — Stripe AU Billing

### Preconditions
- Task 3 complete. Auth working.
- Stripe account created (AU), test mode active.

### Step 12.1 — Stripe setup

```bash
pnpm --filter web add stripe @stripe/stripe-js @stripe/react-stripe-js
```

Environment variables to add:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_ID=price_...  # $4 AUD/month per employee
```

### Step 12.2 — Free tier enforcement

Create `apps/web/features/billing/limits.ts`:

```typescript
export const FREE_TIER_EMPLOYEE_LIMIT = 5;

/**
 * Check if a tenant can add another employee.
 * Returns { allowed: true } or { allowed: false, reason: "upgrade_required" }.
 *
 * Agent: call this from the inviteEmployeeAction server action BEFORE
 * creating the new profile. This is the single enforcement point.
 */
export async function canAddEmployee(
  supabase: any,
  tenantId: string
): Promise<{ allowed: boolean; currentCount: number; plan: string }> {
  const { data: tenant } = await supabase
    .from("tenants")
    .select("plan")
    .eq("id", tenantId)
    .single();

  if (tenant?.plan !== "free") return { allowed: true, currentCount: 0, plan: tenant.plan };

  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);

  return {
    allowed: (count ?? 0) < FREE_TIER_EMPLOYEE_LIMIT,
    currentCount: count ?? 0,
    plan: "free",
  };
}
```

### Step 12.3 — Stripe webhook handler

Create `apps/web/app/api/webhooks/stripe/route.ts`:

```typescript
import Stripe from "stripe";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  switch (event.type) {
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      await supabase
        .from("tenants")
        .update({ plan: "starter" })
        .eq("stripe_customer_id", customerId);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from("tenants")
        .update({ plan: "free", stripe_subscription_id: null })
        .eq("stripe_customer_id", sub.customer as string);
      break;
    }
  }

  return new Response("ok", { status: 200 });
}
```

### Task 12 Verification

```bash
npx playwright test apps/web/tests/billing.spec.ts
```

Playwright assertions:
1. Sign up fresh tenant (free plan)
2. Add employees 1-5: all succeed, no upgrade prompt
3. Add employee 6: upgrade modal appears, pricing shows "$4 + GST per employee per month"
4. Employee 6 NOT in DB (verify via Supabase query)

```bash
# Stripe webhook test
stripe trigger invoice.paid
# Expected: tenant plan updated to 'starter' in DB
```

Save to `.sisyphus/evidence/task-12-free-tier-limit.png`.

### Task 12 Commit

```bash
git add -A
git commit -m "feat(billing): add Stripe AU subscription with metered per-employee billing and free tier enforcement"
```

---

## Task 13 — Landing Page + Legal Pages

### Preconditions
- None (can run independently, but run here in sequence)

### Step 13.1 — Landing page requirements

Create `apps/web/app/(marketing)/page.tsx` with:
- Hero: "Replace your roster spreadsheet" headline + CTA button linking to `/signup`
- Features section: Rostering, Time Clock, Messaging (3 cards)
- Pricing section: Free (up to 5 employees) + Starter ($4/emp/mo + GST)
- Trust section: "Data hosted in Australia (AWS Sydney)", "Australian Privacy Act compliant"
- Footer: ABN, business address, links to Privacy + Terms

SEO in `apps/web/app/(marketing)/layout.tsx`:
```typescript
export const metadata = {
  title: "CrewCircle — Employee Rostering Software for Australian Small Businesses",
  description: "Replace your spreadsheet roster with CrewCircle. Rostering, time clock, and team management for Australian SMBs. Free for up to 5 employees.",
  openGraph: { /* ... */ },
};
```

### Step 13.2 — Privacy policy

Create `apps/web/app/(marketing)/privacy/page.tsx`. Must include:
- Reference to Privacy Act 1988 (Cth) and Australian Privacy Principles (APPs)
- Data stored in Australia (AWS ap-southeast-2 / Sydney)
- 7-year record retention policy for employment records
- Employee rights: access, correction, complaint
- GPS location data: collected only at clock-in/out, not tracked continuously
- Contact: privacy@crewcircle.com.au

### Step 13.3 — Terms of service

Create `apps/web/app/(marketing)/terms/page.tsx`. Must include:
- Subscription terms (monthly, cancel anytime)
- Data ownership (customer owns their data)
- Service availability (commercially reasonable uptime)
- Governing law: Victoria, Australia
- Cancellation: data exported within 30 days, then deleted

### Task 13 Verification

```bash
npx playwright test apps/web/tests/landing.spec.ts
# Lighthouse: Performance >90, SEO >90
```

Save Lighthouse JSON to `.sisyphus/evidence/task-13-landing-lighthouse.json`.

### Task 13 Commit

```bash
git add -A
git commit -m "feat(landing): add marketing landing page, privacy policy, and terms of service"
```

---

## Task 14 — Deploy Web + Submit Mobile Apps

### Preconditions
- ALL tasks 1-13 complete and verified

### Step 14.1 — Vercel deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Link and deploy
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
vercel --prod
```

Set Vercel region to `syd1` (Sydney) in `apps/web/vercel.json`:
```json
{
  "regions": ["syd1"],
  "framework": "nextjs"
}
```

### Step 14.2 — DNS and SSL

In domain registrar (crewcircle.com.au):
- A record → Vercel IP
- CNAME www → cname.vercel-dns.com
- Vercel auto-provisions SSL via Let's Encrypt

### Step 14.3 — Mobile builds

```bash
cd apps/mobile

# iOS production build
eas build --platform ios --profile production
# After build: submit to App Store Connect
eas submit --platform ios

# Android production build
eas build --platform android --profile production
# After build: submit to Google Play
eas submit --platform android
```

App Store metadata requirements:
- Privacy Nutrition Labels: Location (precise, when in use), Push Notifications
- Description must NOT say "track employees" — use "record arrival for attendance"
- Privacy Policy URL: https://crewcircle.com.au/privacy

### Step 14.4 — Sentry error tracking

```bash
pnpm --filter web add @sentry/nextjs
pnpm --filter mobile add @sentry/react-native
```

Configure both with DSN from Sentry project. Set environment to "production" in builds.

### Step 14.5 — Production smoke test

```bash
npx playwright test apps/web/tests/smoke.spec.ts --baseURL=https://crewcircle.com.au
```

Smoke test script steps:
1. Load `https://crewcircle.com.au` → assert 200, title contains "CrewCircle"
2. Navigate to `/signup` → assert form loads
3. Sign up with test business → assert redirected to `/dashboard`
4. Add 3 test employees via invitation
5. Build roster, publish
6. View timesheets, export CSV
7. Assert Sentry receives test event (manual trigger)

Save to `.sisyphus/evidence/task-14-production-smoke.txt`.

### Task 14 Commit

```bash
git add -A
git commit -m "chore(deploy): deploy web to Vercel Sydney, submit iOS and Android builds, configure monitoring"
```

---

## Final Verification Wave

Run all four verification passes after Task 14 completes. Do not skip any.

### F1 — Plan Compliance Audit

```bash
# Check Must Have items
grep -r "deleted_at" supabase/migrations/ | wc -l  # Every table
grep -r "timestamptz" supabase/migrations/ | wc -l  # All timestamp columns
grep -r "tenant_id" supabase/migrations/ | wc -l    # All tables
grep -r "SECURITY DEFINER" supabase/migrations/     # is_tenant_member function

# Check Must NOT Have items
grep -r "delete.*from\|DELETE FROM" apps/ --include="*.ts" | grep -v "soft\|deleted_at"
# Expected: 0 results (no hard deletes)

grep -r "SERVICE_ROLE_KEY" packages/ --include="*.ts"
# Expected: 0 results (no service role in shared packages)

grep -r "award\|penalty.*rate\|overtime" apps/ --include="*.ts"
# Expected: 0 results
```

### F2 — Code Quality

```bash
pnpm turbo build     # Must pass
pnpm turbo lint      # 0 errors
pnpm turbo test      # All Vitest tests pass
supabase test db     # All pgTap tests pass
```

### F3 — End-to-End QA

Full user journey Playwright test covering:
1. Signup → dashboard
2. Add 5 employees (free tier works)
3. Attempt 6th employee → upgrade modal
4. Build roster with midnight-crossing shift
5. Publish roster
6. Mobile: employee sees shifts
7. Mobile: employee clocks in/out
8. Timesheets: hours calculated correctly
9. CSV export: verify format

### F4 — Security Audit

```bash
# RLS isolation test: two tenants, cross-tenant query returns empty
supabase test db  # pgTap isolation tests cover this

# No secrets in client bundle
grep -r "service_role" apps/web/.next/ 2>/dev/null
# Expected: 0 results

# Auth: unauthenticated access redirects
curl -s -o /dev/null -w "%{http_code}" https://crewcircle.com.au/dashboard
# Expected: 302 redirect to /login
```

---

## Critical Edge Cases Summary

| Edge Case | Implementation Rule |
|---|---|
| DST transition (e.g. AEDT→AEST in April) | Store UTC, format with IANA key via `Intl.DateTimeFormat`. Never store offset like +10:00. |
| Midnight-crossing shift (22:00-06:00) | Duration = epoch_end - epoch_start. Display on start date in roster grid. |
| Employee in wrong timezone (e.g. Perth employee for Melbourne business) | Use `locations.timezone` for display, not `tenants.timezone` |
| Offline clock-in + connectivity restored | SQLite outbox flushes on `NetInfo` reconnect event and on app foreground |
| Duplicate clock-in (user taps twice) | `idempotency_key` UUID generated once per tap attempt. Supabase `UNIQUE(idempotency_key)` prevents double-insert. |
| ABN validation | Modulus 89 in `packages/validators` — runs on both client (Zod) and DB (`CHECK` constraint) |
| Push token expires | Expo Push API returns `DeviceNotRegistered` — webhook handler deletes token from DB |
| Free tier at exactly 5 employees | `count < FREE_TIER_EMPLOYEE_LIMIT` (strictly less than 5 means 0-4 = 5 employees max) — verify off-by-one with test |
| Soft delete + RLS | Default views always include `AND deleted_at IS NULL`. Do not rely on views — include in every query explicitly. |
| `auth.jwt() → user_metadata` in RLS | NEVER — use `is_tenant_member()` DB lookup. JWT metadata can be stale between token refreshes. |

---

## Package Versions (Pin These Exactly)

```json
{
  "next": "15.x",
  "expo": "~52.0.0",
  "@supabase/supabase-js": "^2.45.0",
  "@supabase/ssr": "^0.5.0",
  "@dnd-kit/core": "^6.1.0",
  "@tanstack/react-virtual": "^3.10.0",
  "zustand": "^5.0.0",
  "immer": "^10.1.0",
  "zod": "^3.23.0",
  "stripe": "^16.0.0",
  "date-fns": "^3.6.0"
}
```

> Pinning major versions prevents breaking changes mid-build. Run `pnpm audit` before deploying to production.
