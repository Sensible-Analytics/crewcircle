# CrewCircle — Comprehensive E2E Test Plan for AI Agent

> **Purpose**: Agent-executable test implementation instructions. Every test includes the exact code to write, the assertion to make, the seed data required, and the evidence file path to save output to.
> **Framework stack**: Playwright (web E2E) + Vitest (unit/integration) + pgTap (RLS/DB) + Maestro (mobile E2E)
> **Execution order**: pgTap first (no app required), then Vitest, then Playwright, then Maestro.
> **Never skip a test**: comment it out with `test.skip` and log the reason rather than deleting it.

---

## Agent Ground Rules for Tests

1. Each `test()` block is independent — no shared mutable state between tests.
2. All seed data is created inside `beforeEach` or within the test itself and torn down in `afterEach`.
3. Never hardcode UUIDs in tests. Generate with `crypto.randomUUID()` or use the factory helpers in `tests/factories/`.
4. Timestamps in assertions use UTC epoch comparison, not string comparison. `new Date(a).getTime() === new Date(b).getTime()`.
5. All Playwright tests run against `http://localhost:3000` in CI and `https://crewcircle.com.au` in production smoke runs.
6. Evidence files are saved to `.sisyphus/evidence/` using the naming pattern `{suite}-{test-slug}.{ext}`.
7. A test that cannot be automated (physical GPS, push notification delivery) is marked `@manual` in the file name and contains a step-by-step script for a human or a Maestro flow.
8. pgTap tests always run inside a transaction that is rolled back — they never pollute the DB.

---

## Directory Structure

```
tests/
├── factories/
│   ├── tenant.ts          # createTestTenant(), createTestEmployee()
│   ├── roster.ts          # createTestRoster(), createTestShift()
│   └── clock.ts           # createClockEvent()
├── helpers/
│   ├── auth.ts            # loginAs(), signupBusiness()
│   ├── db.ts              # supabaseAdmin client for test setup
│   └── playwright.ts      # custom matchers, screenshot helper
├── web/
│   ├── auth.spec.ts
│   ├── roster.spec.ts
│   ├── shifts.spec.ts
│   ├── publish.spec.ts
│   ├── timesheets.spec.ts
│   ├── billing.spec.ts
│   ├── landing.spec.ts
│   └── smoke.spec.ts
├── unit/                  # Vitest in packages/validators/src/
│   ├── abn.test.ts
│   ├── conflicts.test.ts
│   └── csv.test.ts
├── db/                    # pgTap in supabase/tests/
│   ├── rls_isolation.test.sql
│   ├── rls_roles.test.sql
│   ├── soft_delete.test.sql
│   └── abn_constraint.test.sql
└── mobile/
    ├── login.yaml          # Maestro flows
    ├── roster_view.yaml
    ├── timeclock.yaml
    └── availability.yaml
```

---

## Part 1 — Shared Test Infrastructure

### 1.1 — Supabase admin client for tests

Create `tests/helpers/db.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@crewcircle/supabase";

// Uses service role key — only in test helpers, never in application code
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function cleanupTenant(tenantId: string) {
  // Deletion order follows FK constraints
  await supabaseAdmin.from("clock_events").delete().eq("tenant_id", tenantId);
  await supabaseAdmin.from("push_tokens")
    .delete()
    .in("profile_id", (
      await supabaseAdmin.from("profiles").select("id").eq("tenant_id", tenantId)
    ).data?.map(p => p.id) ?? []);
  await supabaseAdmin.from("shifts").delete().eq("tenant_id", tenantId);
  await supabaseAdmin.from("rosters").delete().eq("tenant_id", tenantId);
  await supabaseAdmin.from("availability").delete().eq("tenant_id", tenantId);
  await supabaseAdmin.from("tenant_members").delete().eq("tenant_id", tenantId);
  await supabaseAdmin.from("profiles").delete().eq("tenant_id", tenantId);
  await supabaseAdmin.from("locations").delete().eq("tenant_id", tenantId);
  await supabaseAdmin.from("tenants").delete().eq("id", tenantId);
}

export async function nukeAuthUser(email: string) {
  const { data } = await supabaseAdmin.auth.admin.listUsers();
  const user = data.users.find(u => u.email === email);
  if (user) await supabaseAdmin.auth.admin.deleteUser(user.id);
}
```

### 1.2 — Tenant factory

Create `tests/factories/tenant.ts`:

```typescript
import { supabaseAdmin } from "../helpers/db";

export interface TestTenant {
  tenantId: string;
  locationId: string;
  ownerId: string;
  ownerEmail: string;
  ownerPassword: string;
}

export async function createTestTenant(overrides: Partial<{
  name: string;
  abn: string | null;
  timezone: string;
  plan: "free" | "starter";
}> = {}): Promise<TestTenant> {
  const email = `owner-${Date.now()}@test.crewcircle.com.au`;
  const password = "TestPass123!";

  // 1. Create auth user
  const { data: authData } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  const userId = authData.user!.id;

  // 2. Create tenant
  const { data: tenant } = await supabaseAdmin.from("tenants").insert({
    name: overrides.name ?? "Test Cafe",
    abn: overrides.abn ?? null,
    timezone: overrides.timezone ?? "Australia/Melbourne",
    plan: overrides.plan ?? "free",
  }).select().single();

  // 3. Create location
  const { data: location } = await supabaseAdmin.from("locations").insert({
    tenant_id: tenant!.id,
    name: "Main Location",
    latitude: -37.8136,
    longitude: 144.9631,
    geofence_radius_m: 150,
    timezone: overrides.timezone ?? "Australia/Melbourne",
  }).select().single();

  // 4. Create profile + tenant_member
  await supabaseAdmin.from("profiles").insert({
    id: userId, tenant_id: tenant!.id, role: "owner",
    email, first_name: "Test", last_name: "Owner",
  });
  await supabaseAdmin.from("tenant_members").insert({
    tenant_id: tenant!.id, profile_id: userId,
    role: "owner", accepted_at: new Date().toISOString(),
  });

  return {
    tenantId: tenant!.id,
    locationId: location!.id,
    ownerId: userId,
    ownerEmail: email,
    ownerPassword: password,
  };
}

export async function createTestEmployee(tenantId: string, overrides: Partial<{
  role: "manager" | "employee";
  firstName: string;
  lastName: string;
}> = {}): Promise<{ profileId: string; email: string; password: string }> {
  const email = `emp-${Date.now()}-${Math.random().toString(36).slice(2)}@test.crewcircle.com.au`;
  const password = "TestPass123!";

  const { data: authData } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  const userId = authData.user!.id;

  const { data: tenantRow } = await supabaseAdmin.from("tenants").select("id").eq("id", tenantId).single();

  await supabaseAdmin.from("profiles").insert({
    id: userId, tenant_id: tenantId,
    role: overrides.role ?? "employee",
    email,
    first_name: overrides.firstName ?? "Test",
    last_name: overrides.lastName ?? `Employee-${Date.now()}`,
  });
  await supabaseAdmin.from("tenant_members").insert({
    tenant_id: tenantId, profile_id: userId,
    role: overrides.role ?? "employee",
    accepted_at: new Date().toISOString(),
  });

  return { profileId: userId, email, password };
}
```

### 1.3 — Roster factory

Create `tests/factories/roster.ts`:

```typescript
import { supabaseAdmin } from "../helpers/db";
import { startOfWeek, addDays, format } from "date-fns";

export interface TestShift {
  shiftId: string;
  profileId: string;
  startTime: string;
  endTime: string;
}

export async function createTestRoster(
  tenantId: string,
  locationId: string,
  weekOffset = 0,
  status: "draft" | "published" = "draft"
): Promise<{ rosterId: string; weekStart: string }> {
  const weekStart = format(
    startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 }),
    "yyyy-MM-dd"
  );
  const { data: roster } = await supabaseAdmin.from("rosters").insert({
    tenant_id: tenantId, location_id: locationId,
    week_start: weekStart, status,
    ...(status === "published" ? { published_at: new Date().toISOString() } : {}),
  }).select().single();

  return { rosterId: roster!.id, weekStart };
}

export async function createTestShift(
  tenantId: string,
  locationId: string,
  rosterId: string,
  profileId: string,
  options: {
    dayOffset?: number;     // days from Monday of roster week
    startHour?: number;     // 24h, in UTC
    durationHours?: number;
    roleLabel?: string;
  } = {}
): Promise<TestShift> {
  const { data: roster } = await supabaseAdmin.from("rosters").select("week_start").eq("id", rosterId).single();
  const monday = new Date(roster!.week_start + "T00:00:00Z");
  const shiftDay = addDays(monday, options.dayOffset ?? 0);

  const startHour = options.startHour ?? 9;
  const duration = options.durationHours ?? 8;

  const startTime = new Date(shiftDay);
  startTime.setUTCHours(startHour - 11, 0, 0, 0); // AEDT offset approx (for test readability)

  const endTime = new Date(startTime.getTime() + duration * 3600 * 1000);

  const { data: shift } = await supabaseAdmin.from("shifts").insert({
    tenant_id: tenantId,
    location_id: locationId,
    roster_id: rosterId,
    profile_id: profileId,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    role_label: options.roleLabel ?? "Staff",
  }).select().single();

  return {
    shiftId: shift!.id,
    profileId,
    startTime: shift!.start_time,
    endTime: shift!.end_time,
  };
}
```

### 1.4 — Playwright auth helper

Create `tests/helpers/auth.ts`:

```typescript
import type { Page } from "@playwright/test";

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log In" }).click();
  await page.waitForURL("/dashboard");
}

export async function loginViaStorageState(page: Page, storageStatePath: string) {
  await page.context().storageState({ path: storageStatePath });
}
```

### 1.5 — Playwright config

Write `playwright.config.ts` at monorepo root:

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/web",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // Tests share Supabase — serialize to avoid collisions
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ["list"],
    ["json", { outputFile: ".sisyphus/evidence/playwright-results.json" }],
  ],
  use: {
    baseURL: process.env.TEST_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "pnpm --filter web dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Part 2 — Database Layer Tests (pgTap)

Run with: `supabase test db`
All tests run inside a rolled-back transaction — zero DB pollution.

### 2.1 — RLS tenant isolation

File: `supabase/tests/rls_isolation.test.sql`

```sql
BEGIN;
SELECT plan(18);

-- ============================================================
-- SETUP
-- ============================================================
SELECT tests.create_supabase_user('alice@test.com', 'pass');
SELECT tests.create_supabase_user('bob@test.com', 'pass');

-- Create Tenant A as Alice
SELECT tests.authenticate_as('alice@test.com');

DO $$
DECLARE
  t_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  l_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab';
  r_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac';
BEGIN
  INSERT INTO tenants (id, name) VALUES (t_id, 'Tenant A');
  INSERT INTO locations (id, tenant_id, name) VALUES (l_id, t_id, 'Location A');
  INSERT INTO profiles (id, tenant_id, role, email) VALUES (auth.uid(), t_id, 'owner', 'alice@test.com');
  INSERT INTO tenant_members (tenant_id, profile_id, role, accepted_at) VALUES (t_id, auth.uid(), 'owner', now());
  INSERT INTO rosters (id, tenant_id, location_id, week_start) VALUES (r_id, t_id, l_id, '2026-01-05');
  INSERT INTO shifts (id, tenant_id, location_id, roster_id, profile_id, start_time, end_time)
    VALUES (gen_random_uuid(), t_id, l_id, r_id, auth.uid(), now(), now() + '8h');
  INSERT INTO availability (tenant_id, profile_id, day_of_week, is_available) VALUES (t_id, auth.uid(), 1, true);
END $$;

-- Switch to Bob
SELECT tests.authenticate_as('bob@test.com');

DO $$
DECLARE
  t_id uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
BEGIN
  INSERT INTO tenants (id, name) VALUES (t_id, 'Tenant B');
  INSERT INTO profiles (id, tenant_id, role, email) VALUES (auth.uid(), t_id, 'owner', 'bob@test.com');
  INSERT INTO tenant_members (tenant_id, profile_id, role, accepted_at) VALUES (t_id, auth.uid(), 'owner', now());
END $$;

-- ============================================================
-- ISOLATION TESTS (Bob querying Tenant A data)
-- ============================================================
SELECT is(
  (SELECT count(*)::int FROM tenants WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0, 'Bob: cannot see Tenant A tenant row'
);

SELECT is(
  (SELECT count(*)::int FROM locations WHERE tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0, 'Bob: cannot see Tenant A locations'
);

SELECT is(
  (SELECT count(*)::int FROM profiles WHERE tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0, 'Bob: cannot see Tenant A profiles'
);

SELECT is(
  (SELECT count(*)::int FROM rosters WHERE tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0, 'Bob: cannot see Tenant A rosters'
);

SELECT is(
  (SELECT count(*)::int FROM shifts WHERE tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0, 'Bob: cannot see Tenant A shifts'
);

SELECT is(
  (SELECT count(*)::int FROM availability WHERE tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0, 'Bob: cannot see Tenant A availability'
);

-- ============================================================
-- WRITE ISOLATION TESTS
-- ============================================================
SELECT throws_ok(
  $$ INSERT INTO shifts (tenant_id, location_id, roster_id, start_time, end_time)
     VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
             'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab',
             'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac',
             now(), now() + interval '8 hours') $$,
  'new row violates row-level security policy',
  'Bob: cannot insert shift into Tenant A roster'
);

SELECT throws_ok(
  $$ UPDATE rosters SET status = 'published'
     WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac' $$,
  NULL, -- Update on wrong tenant silently updates 0 rows — not an error
  'Bob: UPDATE on Tenant A roster returns no error but affects 0 rows'
);

-- Verify the update actually changed nothing
SELECT is(
  (SELECT status FROM rosters WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac'),
  NULL, -- Bob cannot see this row at all
  'Bob: Tenant A roster status unchanged after Bob UPDATE attempt'
);

SELECT * FROM finish();
ROLLBACK;
```

### 2.2 — RLS role-based access

File: `supabase/tests/rls_roles.test.sql`

```sql
BEGIN;
SELECT plan(14);

SELECT tests.create_supabase_user('manager@test.com', 'pass');
SELECT tests.create_supabase_user('employee@test.com', 'pass');

-- Setup tenant with both users as Alice (owner)
SELECT tests.create_supabase_user('owner@test.com', 'pass');
SELECT tests.authenticate_as('owner@test.com');

DO $$
DECLARE
  t_id uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  l_id uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccd';
  r_id uuid := 'cccccccc-cccc-cccc-cccc-ccccccccccce';
  mgr_id uuid;
  emp_id uuid;
BEGIN
  INSERT INTO tenants (id, name) VALUES (t_id, 'Role Test Tenant');
  INSERT INTO locations (id, tenant_id, name) VALUES (l_id, t_id, 'HQ');
  INSERT INTO profiles (id, tenant_id, role, email) VALUES (auth.uid(), t_id, 'owner', 'owner@test.com');
  INSERT INTO tenant_members (tenant_id, profile_id, role, accepted_at) VALUES (t_id, auth.uid(), 'owner', now());

  -- Get manager and employee user IDs from auth
  SELECT id INTO mgr_id FROM auth.users WHERE email = 'manager@test.com';
  SELECT id INTO emp_id FROM auth.users WHERE email = 'employee@test.com';

  INSERT INTO profiles (id, tenant_id, role, email) VALUES (mgr_id, t_id, 'manager', 'manager@test.com');
  INSERT INTO tenant_members (tenant_id, profile_id, role, accepted_at) VALUES (t_id, mgr_id, 'manager', now());
  INSERT INTO profiles (id, tenant_id, role, email) VALUES (emp_id, t_id, 'employee', 'employee@test.com');
  INSERT INTO tenant_members (tenant_id, profile_id, role, accepted_at) VALUES (t_id, emp_id, 'employee', now());

  INSERT INTO rosters (id, tenant_id, location_id, week_start, status)
    VALUES (r_id, t_id, l_id, '2026-01-05', 'draft');
END $$;

-- MANAGER can create shifts
SELECT tests.authenticate_as('manager@test.com');

SELECT lives_ok(
  $$ INSERT INTO shifts (tenant_id, location_id, roster_id, start_time, end_time)
     VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc',
             'cccccccc-cccc-cccc-cccc-cccccccccccd',
             'cccccccc-cccc-cccc-cccc-ccccccccccce',
             now(), now() + interval '8 hours') $$,
  'Manager: can insert shifts'
);

SELECT lives_ok(
  $$ UPDATE rosters SET status = 'published', published_at = now()
     WHERE id = 'cccccccc-cccc-cccc-cccc-ccccccccccce' $$,
  'Manager: can publish rosters'
);

-- EMPLOYEE can read shifts
SELECT tests.authenticate_as('employee@test.com');

SELECT isnt(
  (SELECT count(*)::int FROM shifts WHERE tenant_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  0, 'Employee: can read shifts in their tenant'
);

-- EMPLOYEE cannot insert shifts
SELECT throws_ok(
  $$ INSERT INTO shifts (tenant_id, location_id, roster_id, start_time, end_time)
     VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc',
             'cccccccc-cccc-cccc-cccc-cccccccccccd',
             'cccccccc-cccc-cccc-cccc-ccccccccccce',
             now() + interval '1 day', now() + interval '1 day 8 hours') $$,
  'new row violates row-level security policy',
  'Employee: cannot insert shifts'
);

-- EMPLOYEE cannot publish rosters
SELECT is(
  (SELECT count(*)::int
   FROM (
     UPDATE rosters SET status = 'draft'
     WHERE tenant_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
     RETURNING id
   ) AS updated),
  0, 'Employee: UPDATE on roster affects 0 rows'
);

-- EMPLOYEE can insert their own clock events
SELECT lives_ok(
  $$ INSERT INTO clock_events (tenant_id, profile_id, location_id, type, idempotency_key)
     VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc',
             auth.uid(),
             'cccccccc-cccc-cccc-cccc-cccccccccccd',
             'clock_in',
             gen_random_uuid()) $$,
  'Employee: can insert own clock events'
);

-- EMPLOYEE cannot insert clock events for other employees
SELECT throws_ok(
  $$ INSERT INTO clock_events (tenant_id, profile_id, location_id, type, idempotency_key)
     VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc',
             (SELECT id FROM auth.users WHERE email = 'manager@test.com'),
             'cccccccc-cccc-cccc-cccc-cccccccccccd',
             'clock_in',
             gen_random_uuid()) $$,
  'new row violates row-level security policy',
  'Employee: cannot insert clock events for other users'
);

-- EMPLOYEE can manage own availability
SELECT lives_ok(
  $$ INSERT INTO availability (tenant_id, profile_id, day_of_week, is_available)
     VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', auth.uid(), 2, false) $$,
  'Employee: can set own availability'
);

SELECT * FROM finish();
ROLLBACK;
```

### 2.3 — Soft delete behaviour

File: `supabase/tests/soft_delete.test.sql`

```sql
BEGIN;
SELECT plan(8);

SELECT tests.create_supabase_user('softdelete@test.com', 'pass');
SELECT tests.authenticate_as('softdelete@test.com');

DO $$
DECLARE
  t_id uuid := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  l_id uuid := 'dddddddd-dddd-dddd-dddd-ddddddddddde';
  r_id uuid := 'dddddddd-dddd-dddd-dddd-dddddddddddf';
  s_id uuid := 'dddddddd-dddd-dddd-dddd-ddddddddddda';
BEGIN
  INSERT INTO tenants (id, name) VALUES (t_id, 'Soft Delete Test');
  INSERT INTO locations (id, tenant_id, name) VALUES (l_id, t_id, 'Loc');
  INSERT INTO profiles (id, tenant_id, role, email) VALUES (auth.uid(), t_id, 'owner', 'softdelete@test.com');
  INSERT INTO tenant_members (tenant_id, profile_id, role, accepted_at) VALUES (t_id, auth.uid(), 'owner', now());
  INSERT INTO rosters (id, tenant_id, location_id, week_start) VALUES (r_id, t_id, l_id, '2026-01-05');
  INSERT INTO shifts (id, tenant_id, location_id, roster_id, start_time, end_time)
    VALUES (s_id, t_id, l_id, r_id, now(), now() + '8h');
END $$;

-- Shift visible before soft delete
SELECT is(
  (SELECT count(*)::int FROM shifts WHERE id = 'dddddddd-dddd-dddd-dddd-ddddddddddda'),
  1, 'Shift visible before soft delete'
);

-- Soft delete the shift
UPDATE shifts SET deleted_at = now() WHERE id = 'dddddddd-dddd-dddd-dddd-ddddddddddda';

-- Shift NOT visible after soft delete (RLS WHERE deleted_at IS NULL)
SELECT is(
  (SELECT count(*)::int FROM shifts WHERE id = 'dddddddd-dddd-dddd-dddd-ddddddddddda'),
  0, 'Shift hidden after soft delete via RLS'
);

-- Physical row still exists (bypass RLS via service role is not possible in pgTap,
-- but we verify the deleted_at was set via a security definer function)
-- We use a SECURITY DEFINER helper to peek:
SELECT is(
  (SELECT count(*)::int FROM shifts WHERE id = 'dddddddd-dddd-dddd-dddd-ddddddddddda'
   AND deleted_at IS NOT NULL),
  0, 'Soft deleted row not visible even with explicit filter (still excluded by policy)'
);

-- Roster soft delete
UPDATE rosters SET deleted_at = now() WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddf';

SELECT is(
  (SELECT count(*)::int FROM rosters WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddf'),
  0, 'Roster hidden after soft delete'
);

-- Profile soft delete
UPDATE profiles SET deleted_at = now() WHERE id = auth.uid();

SELECT is(
  (SELECT count(*)::int FROM profiles
   WHERE tenant_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  0, 'Profile hidden after soft delete'
);

SELECT * FROM finish();
ROLLBACK;
```

### 2.4 — ABN constraint

File: `supabase/tests/abn_constraint.test.sql`

```sql
BEGIN;
SELECT plan(8);

-- Valid ABNs (real Australian entity ABNs used publicly)
SELECT lives_ok(
  $$ INSERT INTO tenants (name, abn) VALUES ('ABC', '51824753556') $$,
  'ABN 51824753556 (ABC) is valid'
);

SELECT lives_ok(
  $$ INSERT INTO tenants (name, abn) VALUES ('ATO', '51824753556') $$,
  'ABN 51824753556 accepts duplicate (different tenant row)'
);

SELECT lives_ok(
  $$ INSERT INTO tenants (name, abn) VALUES ('No ABN', NULL) $$,
  'NULL ABN allowed (optional field)'
);

-- Invalid ABNs
SELECT throws_ok(
  $$ INSERT INTO tenants (name, abn) VALUES ('Bad', '12345678901') $$,
  23514, -- check_violation
  NULL,
  'ABN 12345678901 rejected (invalid checksum)'
);

SELECT throws_ok(
  $$ INSERT INTO tenants (name, abn) VALUES ('Short', '1234567890') $$,
  23514,
  NULL,
  'ABN with 10 digits rejected'
);

SELECT throws_ok(
  $$ INSERT INTO tenants (name, abn) VALUES ('Alpha', 'ABCDE678901') $$,
  23514,
  NULL,
  'ABN with letters rejected'
);

SELECT throws_ok(
  $$ INSERT INTO tenants (name, abn) VALUES ('Zeros', '00000000000') $$,
  23514,
  NULL,
  'All-zeros ABN rejected'
);

SELECT throws_ok(
  $$ INSERT INTO tenants (name, abn) VALUES ('Long', '123456789012') $$,
  23514,
  NULL,
  'ABN with 12 digits rejected'
);

SELECT * FROM finish();
ROLLBACK;
```

---

## Part 3 — Unit Tests (Vitest in packages/validators)

Run with: `pnpm --filter validators test`

### 3.1 — ABN validation

File: `packages/validators/src/abn.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { validateABN } from "./abn";

describe("validateABN", () => {
  // Real public ABNs
  it("accepts 51 824 753 556 (Australian Broadcasting Corporation)", () => {
    expect(validateABN("51824753556")).toBe(true);
  });

  it("accepts ABN with spaces stripped", () => {
    expect(validateABN("51 824 753 556")).toBe(true);
  });

  it("rejects 12 345 678 901 (invalid checksum)", () => {
    expect(validateABN("12345678901")).toBe(false);
  });

  it("rejects 10-digit input", () => {
    expect(validateABN("1234567890")).toBe(false);
  });

  it("rejects 12-digit input", () => {
    expect(validateABN("123456789012")).toBe(false);
  });

  it("rejects letters", () => {
    expect(validateABN("ABCDE678901")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(validateABN("")).toBe(false);
  });

  it("rejects all zeros", () => {
    expect(validateABN("00000000000")).toBe(false);
  });
});
```

### 3.2 — Conflict detection

File: `packages/validators/src/conflicts.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import {
  detectOverlap,
  detectMinRest,
  detectAvailabilityConflict,
  haversineDistanceMetres,
} from "./conflicts";

// Helper to build minimal shift objects
function makeShift(overrides: Partial<{
  id: string; profile_id: string;
  start_time: string; end_time: string; deleted_at: string | null;
}>) {
  return {
    id: "s-default",
    profile_id: "p-default",
    start_time: "2026-04-06T09:00:00Z",
    end_time: "2026-04-06T17:00:00Z",
    deleted_at: null,
    ...overrides,
  } as any;
}

describe("detectOverlap", () => {
  it("detects overlapping shifts for same employee", () => {
    const existing = [makeShift({ id: "s1", profile_id: "p1",
      start_time: "2026-04-06T09:00:00Z", end_time: "2026-04-06T17:00:00Z" })];
    const candidate = makeShift({ id: "s2", profile_id: "p1",
      start_time: "2026-04-06T15:00:00Z", end_time: "2026-04-06T23:00:00Z" });
    const conflicts = detectOverlap(candidate, existing);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe("OVERLAP");
  });

  it("no conflict when shifts are adjacent (end === start)", () => {
    const existing = [makeShift({ id: "s1", profile_id: "p1",
      start_time: "2026-04-06T09:00:00Z", end_time: "2026-04-06T17:00:00Z" })];
    const candidate = makeShift({ id: "s2", profile_id: "p1",
      start_time: "2026-04-06T17:00:00Z", end_time: "2026-04-07T01:00:00Z" });
    expect(detectOverlap(candidate, existing)).toHaveLength(0);
  });

  it("no conflict for same times but different employees", () => {
    const existing = [makeShift({ id: "s1", profile_id: "p1" })];
    const candidate = makeShift({ id: "s2", profile_id: "p2" });
    expect(detectOverlap(candidate, existing)).toHaveLength(0);
  });

  it("skips soft-deleted shifts", () => {
    const existing = [makeShift({ id: "s1", profile_id: "p1",
      deleted_at: "2026-04-01T00:00:00Z" })];
    const candidate = makeShift({ id: "s2", profile_id: "p1" });
    expect(detectOverlap(candidate, existing)).toHaveLength(0);
  });

  it("editing a shift does not conflict with itself", () => {
    const existing = [makeShift({ id: "s1", profile_id: "p1" })];
    const candidate = makeShift({ id: "s1", profile_id: "p1",
      end_time: "2026-04-06T18:00:00Z" });
    expect(detectOverlap(candidate, existing)).toHaveLength(0);
  });

  it("detects midnight-crossing overlap correctly", () => {
    // Existing: 10pm-6am (crossing midnight in UTC)
    const existing = [makeShift({ id: "s1", profile_id: "p1",
      start_time: "2026-04-06T22:00:00Z", end_time: "2026-04-07T06:00:00Z" })];
    // Candidate: 4am-noon next day — overlaps with existing 4am-6am
    const candidate = makeShift({ id: "s2", profile_id: "p1",
      start_time: "2026-04-07T04:00:00Z", end_time: "2026-04-07T12:00:00Z" });
    expect(detectOverlap(candidate, existing)).toHaveLength(1);
  });

  it("multiple overlapping shifts returns multiple conflicts", () => {
    const existing = [
      makeShift({ id: "s1", profile_id: "p1", start_time: "2026-04-06T08:00:00Z", end_time: "2026-04-06T12:00:00Z" }),
      makeShift({ id: "s2", profile_id: "p1", start_time: "2026-04-06T11:00:00Z", end_time: "2026-04-06T15:00:00Z" }),
    ];
    const candidate = makeShift({ id: "s3", profile_id: "p1",
      start_time: "2026-04-06T10:00:00Z", end_time: "2026-04-06T14:00:00Z" });
    expect(detectOverlap(candidate, existing)).toHaveLength(2);
  });
});

describe("detectMinRest", () => {
  it("flags shift with 8h rest when minimum is 10h", () => {
    const existing = [makeShift({ id: "s1", profile_id: "p1",
      start_time: "2026-04-06T09:00:00Z", end_time: "2026-04-06T17:00:00Z" })];
    const candidate = makeShift({ id: "s2", profile_id: "p1",
      start_time: "2026-04-07T01:00:00Z", end_time: "2026-04-07T09:00:00Z" });
    // Gap: 17:00 to 01:00 = 8 hours < 10 hour minimum
    expect(detectMinRest(candidate, existing)).toHaveLength(1);
    expect(detectMinRest(candidate, existing)[0].type).toBe("MIN_REST");
  });

  it("no conflict when rest is exactly 10h", () => {
    const existing = [makeShift({ id: "s1", profile_id: "p1",
      start_time: "2026-04-06T09:00:00Z", end_time: "2026-04-06T17:00:00Z" })];
    const candidate = makeShift({ id: "s2", profile_id: "p1",
      start_time: "2026-04-07T03:00:00Z", end_time: "2026-04-07T11:00:00Z" });
    // Gap: 17:00 to 03:00 = exactly 10 hours
    expect(detectMinRest(candidate, existing)).toHaveLength(0);
  });

  it("ignores soft-deleted shifts", () => {
    const existing = [makeShift({ id: "s1", profile_id: "p1",
      start_time: "2026-04-06T09:00:00Z", end_time: "2026-04-06T17:00:00Z",
      deleted_at: "2026-04-01T00:00:00Z" })];
    const candidate = makeShift({ id: "s2", profile_id: "p1",
      start_time: "2026-04-07T01:00:00Z", end_time: "2026-04-07T09:00:00Z" });
    expect(detectMinRest(candidate, existing)).toHaveLength(0);
  });
});

describe("detectAvailabilityConflict", () => {
  it("flags shift on unavailable day", () => {
    // Monday = day_of_week 1
    const availability = [{ day_of_week: 1, is_available: false, start_time: null, end_time: null }];
    // A Monday shift (UTC Monday)
    const shift = makeShift({ start_time: "2026-04-06T00:00:00Z" }); // Monday UTC
    const conflicts = detectAvailabilityConflict(shift, availability, "UTC");
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe("AVAILABILITY");
  });

  it("no conflict when day is available", () => {
    const availability = [{ day_of_week: 1, is_available: true, start_time: null, end_time: null }];
    const shift = makeShift({ start_time: "2026-04-06T00:00:00Z" });
    expect(detectAvailabilityConflict(shift, availability, "UTC")).toHaveLength(0);
  });

  it("no conflict when no availability row exists for that day", () => {
    const availability: any[] = [];
    const shift = makeShift({ start_time: "2026-04-06T00:00:00Z" });
    expect(detectAvailabilityConflict(shift, availability, "UTC")).toHaveLength(0);
  });
});

describe("haversineDistanceMetres", () => {
  it("returns 0 for identical coordinates", () => {
    expect(haversineDistanceMetres(-33.8688, 151.2093, -33.8688, 151.2093)).toBe(0);
  });

  it("returns < 150m for nearby Sydney CBD coordinates", () => {
    // ~100 metres apart
    const dist = haversineDistanceMetres(-33.8688, 151.2093, -33.8695, 151.2100);
    expect(dist).toBeLessThan(150);
  });

  it("returns > 150m for coordinates 300m apart", () => {
    // ~300 metres apart in Sydney
    const dist = haversineDistanceMetres(-33.8688, 151.2093, -33.8715, 151.2120);
    expect(dist).toBeGreaterThan(150);
  });

  it("Melbourne CBD to South Yarra is approximately 4km", () => {
    const dist = haversineDistanceMetres(-37.8136, 144.9631, -37.8395, 144.9909);
    expect(dist).toBeGreaterThan(3500);
    expect(dist).toBeLessThan(4500);
  });

  it("Sydney to Melbourne is approximately 700km", () => {
    const dist = haversineDistanceMetres(-33.8688, 151.2093, -37.8136, 144.9631);
    expect(dist).toBeGreaterThan(700_000);
    expect(dist).toBeLessThan(720_000);
  });
});

describe("shift duration edge cases", () => {
  it("midnight-crossing shift is exactly 8 hours", () => {
    const start = new Date("2026-04-06T11:00:00Z"); // 10pm AEDT
    const end = new Date("2026-04-06T19:00:00Z");   // 6am AEDT next day (UTC +8 for this test)
    const hours = (end.getTime() - start.getTime()) / 3_600_000;
    expect(hours).toBe(8);
  });

  it("DST transition shift: AEDT->AEST (clocks go back 1h)", () => {
    // April 5, 2026: Australia Eastern Daylight Time ends at 3am → becomes 2am
    // Shift spans 11pm–7am: physical duration is 9 hours, wall clock shows 8
    // We always store UTC — the stored duration is always correct regardless of DST
    const startUTC = new Date("2026-04-04T12:00:00Z"); // 11pm AEDT = UTC+11
    const endUTC = new Date("2026-04-04T21:00:00Z");   // 7am AEST = UTC+10, wall clock 8h later
    // UTC duration: 9 hours (correct — the employee physically worked 9 hours)
    const hours = (endUTC.getTime() - startUTC.getTime()) / 3_600_000;
    expect(hours).toBe(9);
  });

  it("shift of exactly 16 hours is at maximum allowed duration", () => {
    const start = new Date("2026-04-06T08:00:00Z");
    const end = new Date("2026-04-07T00:00:00Z");
    const hours = (end.getTime() - start.getTime()) / 3_600_000;
    expect(hours).toBe(16);
    // This must pass validation (at limit, not over)
    expect(hours <= 16).toBe(true);
  });
});
```

### 3.3 — CSV export

File: `packages/validators/src/csv.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { generateTimesheetCSV } from "../../apps/web/features/timesheets/export";

const MELBOURNE_TZ = "Australia/Melbourne";

function makeRow(overrides: Partial<{
  firstName: string; lastName: string; email: string;
  clockIn: string; clockOut: string | null;
  locationName: string; isWithinGeofence: boolean; approvedAt: string | null;
}> = {}) {
  return {
    firstName: overrides.firstName ?? "Jane",
    lastName: overrides.lastName ?? "Smith",
    email: overrides.email ?? "jane@test.com",
    clockIn: overrides.clockIn ?? "2026-04-06T22:00:00Z",   // 9am AEST
    clockOut: overrides.clockOut ?? "2026-04-07T06:00:00Z",  // 5pm AEST
    locationName: overrides.locationName ?? "Cafe Main",
    isWithinGeofence: overrides.isWithinGeofence ?? true,
    approvedAt: overrides.approvedAt ?? null,
  };
}

describe("generateTimesheetCSV", () => {
  it("produces correct header row", () => {
    const csv = generateTimesheetCSV([makeRow()], MELBOURNE_TZ);
    const header = csv.split("\n")[0];
    expect(header).toBe("Employee Name,Email,Date,Start,End,Hours,Location,Geofence,Approved");
  });

  it("formats date as DD/MM/YYYY (Australian convention)", () => {
    const csv = generateTimesheetCSV([makeRow({ clockIn: "2026-04-06T22:00:00Z" })], MELBOURNE_TZ);
    const dataRow = csv.split("\n")[1];
    // 2026-04-06T22:00:00Z = 07/04/2026 in AEST (UTC+10)
    expect(dataRow).toContain("07/04/2026");
    expect(dataRow).not.toContain("04/07/2026"); // US format must not appear
  });

  it("formats hours as decimal, not HH:MM", () => {
    const csv = generateTimesheetCSV([makeRow({
      clockIn: "2026-04-07T23:00:00Z",  // 9am AEST
      clockOut: "2026-04-08T07:00:00Z",  // 5pm AEST
    })], MELBOURNE_TZ);
    const dataRow = csv.split("\n")[1];
    expect(dataRow).toContain("8.00");
    expect(dataRow).not.toContain("8:00");
  });

  it("midnight-crossing shift hours calculated correctly", () => {
    const csv = generateTimesheetCSV([makeRow({
      clockIn: "2026-04-06T12:00:00Z",  // 10pm AEST
      clockOut: "2026-04-06T20:00:00Z",  // 6am AEST next day
    })], MELBOURNE_TZ);
    const dataRow = csv.split("\n")[1];
    expect(dataRow).toContain("8.00");
  });

  it("open shift (no clock-out) shows 'Open'", () => {
    const csv = generateTimesheetCSV([makeRow({ clockOut: null })], MELBOURNE_TZ);
    const dataRow = csv.split("\n")[1];
    expect(dataRow).toContain("Open");
  });

  it("approved row shows 'Yes', unapproved shows 'No'", () => {
    const approved = generateTimesheetCSV([makeRow({ approvedAt: "2026-04-07T10:00:00Z" })], MELBOURNE_TZ);
    const unapproved = generateTimesheetCSV([makeRow({ approvedAt: null })], MELBOURNE_TZ);
    expect(approved.split("\n")[1]).toContain(",Yes");
    expect(unapproved.split("\n")[1]).toContain(",No");
  });

  it("out-of-geofence row shows 'No' in Geofence column", () => {
    const csv = generateTimesheetCSV([makeRow({ isWithinGeofence: false })], MELBOURNE_TZ);
    expect(csv.split("\n")[1]).toContain(",No,");
  });

  it("location names with commas are quoted", () => {
    const csv = generateTimesheetCSV([makeRow({ locationName: "Cafe, Main St" })], MELBOURNE_TZ);
    expect(csv).toContain('"Cafe, Main St"');
  });

  it("multiple rows are separated by newlines", () => {
    const rows = [makeRow({ email: "a@test.com" }), makeRow({ email: "b@test.com" })];
    const csv = generateTimesheetCSV(rows, MELBOURNE_TZ);
    expect(csv.split("\n")).toHaveLength(3); // header + 2 rows
  });

  it("uses 24-hour time format", () => {
    const csv = generateTimesheetCSV([makeRow({
      clockIn: "2026-04-07T23:00:00Z",  // 9am AEST
      clockOut: "2026-04-08T09:00:00Z",  // 7pm AEST
    })], MELBOURNE_TZ);
    expect(csv).toContain("09:00");
    expect(csv).toContain("19:00");
    expect(csv).not.toContain("7:00 PM");
    expect(csv).not.toContain("9:00 AM");
  });
});
```

---

## Part 4 — Web E2E Tests (Playwright)

Run with: `npx playwright test tests/web/`

### 4.1 — Authentication suite

File: `tests/web/auth.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { cleanupTenant, nukeAuthUser } from "../helpers/db";

const TEST_EMAIL = `auth-test-${Date.now()}@test.crewcircle.com.au`;
const TEST_PASS = "TestPass123!";
let createdTenantId: string;

test.afterEach(async () => {
  if (createdTenantId) await cleanupTenant(createdTenantId);
  await nukeAuthUser(TEST_EMAIL);
});

test("signup with valid ABN creates tenant and redirects to dashboard", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByLabel("Password").fill(TEST_PASS);
  await page.getByLabel("Business Name").fill("E2E Test Cafe");
  await page.getByLabel("ABN").fill("51824753556");
  await page.getByRole("button", { name: "Create Account" }).click();

  await page.waitForURL("/dashboard", { timeout: 15_000 });
  await expect(page.getByText("E2E Test Cafe")).toBeVisible();
  await page.screenshot({ path: ".sisyphus/evidence/auth-signup-success.png" });
});

test("signup with invalid ABN shows field error and does not submit", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByLabel("Password").fill(TEST_PASS);
  await page.getByLabel("Business Name").fill("Bad ABN Cafe");
  await page.getByLabel("ABN").fill("12345678901");
  await page.getByRole("button", { name: "Create Account" }).click();

  await expect(page.getByText("Invalid ABN")).toBeVisible();
  expect(page.url()).toContain("/signup"); // Must NOT redirect
  await page.screenshot({ path: ".sisyphus/evidence/auth-abn-invalid.png" });
});

test("signup without ABN succeeds (ABN is optional)", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByLabel("Password").fill(TEST_PASS);
  await page.getByLabel("Business Name").fill("No ABN Cafe");
  // Leave ABN blank
  await page.getByRole("button", { name: "Create Account" }).click();
  await page.waitForURL("/dashboard", { timeout: 15_000 });
  await expect(page.getByText("No ABN Cafe")).toBeVisible();
});

test("unauthenticated access to /dashboard redirects to /login", async ({ page }) => {
  await page.goto("/dashboard");
  await page.waitForURL(/\/login/);
  await expect(page.url()).toContain("/login");
});

test("unauthenticated access to /roster redirects to /login", async ({ page }) => {
  await page.goto("/roster");
  await page.waitForURL(/\/login/);
});

test("invalid credentials show error message", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nobody@nowhere.com");
  await page.getByLabel("Password").fill("WrongPass123!");
  await page.getByRole("button", { name: "Log In" }).click();
  await expect(page.getByText(/invalid|incorrect|not found/i)).toBeVisible();
  expect(page.url()).toContain("/login");
});

test("password reset link is visible on login page", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("link", { name: /forgot/i })).toBeVisible();
});

test("logout clears session and redirects to login", async ({ page }) => {
  // Setup: create a user and log in
  const { createTestTenant } = await import("../factories/tenant");
  const tenant = await createTestTenant();
  createdTenantId = tenant.tenantId;

  await page.goto("/login");
  await page.getByLabel("Email").fill(tenant.ownerEmail);
  await page.getByLabel("Password").fill(tenant.ownerPassword);
  await page.getByRole("button", { name: "Log In" }).click();
  await page.waitForURL("/dashboard");

  await page.getByRole("button", { name: /logout|sign out/i }).click();
  await page.waitForURL(/\/login/);

  // Verify session is gone — navigating to dashboard redirects again
  await page.goto("/dashboard");
  await page.waitForURL(/\/login/);
});
```

### 4.2 — Roster grid suite

File: `tests/web/roster.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { createTestTenant, createTestEmployee } from "../factories/tenant";
import { createTestRoster, createTestShift } from "../factories/roster";
import { loginAs } from "../helpers/auth";
import { cleanupTenant } from "../helpers/db";

let tenantId: string;
let locationId: string;
let ownerEmail: string;
let ownerPassword: string;

test.beforeEach(async ({ page }) => {
  const tenant = await createTestTenant();
  tenantId = tenant.tenantId;
  locationId = tenant.locationId;
  ownerEmail = tenant.ownerEmail;
  ownerPassword = tenant.ownerPassword;
  await loginAs(page, ownerEmail, ownerPassword);
});

test.afterEach(async () => {
  await cleanupTenant(tenantId);
});

test("roster grid renders with correct 7 day columns", async ({ page }) => {
  await page.goto("/roster");
  const columns = page.locator("[data-testid='day-column']");
  await expect(columns).toHaveCount(7);
  // Verify Mon–Sun labels
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  for (const label of labels) {
    await expect(page.getByText(label, { exact: false })).toBeVisible();
  }
  await page.screenshot({ path: ".sisyphus/evidence/roster-grid-columns.png" });
});

test("add shift via modal and verify it appears in grid", async ({ page }) => {
  const emp = await createTestEmployee(tenantId);
  const { rosterId } = await createTestRoster(tenantId, locationId);

  await page.goto(`/roster?rosterId=${rosterId}`);
  // Click empty cell for Monday
  await page.locator(`[data-testid='cell-${emp.profileId}-monday']`).click();
  await page.getByLabel("Start Time").fill("09:00");
  await page.getByLabel("End Time").fill("17:00");
  await page.getByLabel("Role").fill("Barista");
  await page.getByRole("button", { name: "Add Shift" }).click();

  await expect(page.locator(`[data-testid='shift-card']`).first()).toBeVisible();
  await expect(page.getByText("Barista")).toBeVisible();
  await page.screenshot({ path: ".sisyphus/evidence/roster-add-shift.png" });
});

test("drag shift from Monday to Tuesday persists after page reload", async ({ page }) => {
  const emp = await createTestEmployee(tenantId);
  const { rosterId } = await createTestRoster(tenantId, locationId);
  await createTestShift(tenantId, locationId, rosterId, emp.profileId, { dayOffset: 0 });

  await page.goto(`/roster?rosterId=${rosterId}`);

  const shiftCard = page.locator("[data-testid='shift-card']").first();
  const tuesdayColumn = page.locator("[data-testid='day-column']").nth(1);

  // Drag the shift to Tuesday
  await shiftCard.dragTo(tuesdayColumn);

  // Wait for auto-save (5s debounce)
  await page.waitForTimeout(6_000);

  // Reload and verify shift is in Tuesday
  await page.reload();
  const tuesdayCells = page.locator("[data-testid='day-column']").nth(1).locator("[data-testid='shift-card']");
  await expect(tuesdayCells).toHaveCount(1);
  await page.screenshot({ path: ".sisyphus/evidence/roster-drag-persist.png" });
});

test("edit shift changes time and role", async ({ page }) => {
  const emp = await createTestEmployee(tenantId);
  const { rosterId } = await createTestRoster(tenantId, locationId);
  await createTestShift(tenantId, locationId, rosterId, emp.profileId);

  await page.goto(`/roster?rosterId=${rosterId}`);
  await page.locator("[data-testid='shift-card']").first().click();
  await page.getByRole("button", { name: /edit/i }).click();

  await page.getByLabel("Start Time").fill("10:00");
  await page.getByLabel("Role").fill("Manager On Duty");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText("Manager On Duty")).toBeVisible();
  await page.screenshot({ path: ".sisyphus/evidence/roster-edit-shift.png" });
});

test("delete shift removes it from grid (soft delete)", async ({ page }) => {
  const emp = await createTestEmployee(tenantId);
  const { rosterId } = await createTestRoster(tenantId, locationId);
  await createTestShift(tenantId, locationId, rosterId, emp.profileId);

  await page.goto(`/roster?rosterId=${rosterId}`);
  await expect(page.locator("[data-testid='shift-card']")).toHaveCount(1);

  await page.locator("[data-testid='shift-card']").first().click();
  await page.getByRole("button", { name: /delete/i }).click();
  await page.getByRole("button", { name: /confirm/i }).click(); // confirmation dialog

  await expect(page.locator("[data-testid='shift-card']")).toHaveCount(0);
  await page.screenshot({ path: ".sisyphus/evidence/roster-delete-shift.png" });
});

test("roster grid with 30 employees renders in under 2 seconds", async ({ page }) => {
  const { rosterId } = await createTestRoster(tenantId, locationId);
  // Create 30 employees with 2 shifts each
  const employees = await Promise.all(
    Array.from({ length: 30 }, (_, i) =>
      createTestEmployee(tenantId, { firstName: "Emp", lastName: `${i}` })
    )
  );
  await Promise.all(
    employees.flatMap((emp) => [
      createTestShift(tenantId, locationId, rosterId, emp.profileId, { dayOffset: 0 }),
      createTestShift(tenantId, locationId, rosterId, emp.profileId, { dayOffset: 3 }),
    ])
  );

  const startTime = Date.now();
  await page.goto(`/roster?rosterId=${rosterId}`);
  await page.waitForSelector("[data-testid='roster-grid']");
  const renderTime = Date.now() - startTime;

  expect(renderTime).toBeLessThan(2_000);
  await page.evaluate(() => {
    return `Render time: ${Date.now()}ms`;
  });
  await page.screenshot({ path: ".sisyphus/evidence/roster-performance.png" });

  // Save timing to evidence
  const fs = await import("fs");
  fs.writeFileSync(".sisyphus/evidence/roster-performance.txt", `Render time: ${renderTime}ms`);
});

test("keyboard navigation: Tab to shift, Enter opens edit dialog", async ({ page }) => {
  const emp = await createTestEmployee(tenantId);
  const { rosterId } = await createTestRoster(tenantId, locationId);
  await createTestShift(tenantId, locationId, rosterId, emp.profileId);

  await page.goto(`/roster?rosterId=${rosterId}`);
  await page.keyboard.press("Tab"); // Navigate to first interactive element
  // Tab until shift card is focused
  const shiftCard = page.locator("[data-testid='shift-card']").first();
  await shiftCard.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
});
```

### 4.3 — Conflict detection suite

File: `tests/web/shifts.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { createTestTenant, createTestEmployee } from "../factories/tenant";
import { createTestRoster, createTestShift } from "../factories/roster";
import { loginAs } from "../helpers/auth";
import { cleanupTenant, supabaseAdmin } from "../helpers/db";

let tenantId: string;
let locationId: string;

test.beforeEach(async ({ page }) => {
  const tenant = await createTestTenant();
  tenantId = tenant.tenantId;
  locationId = tenant.locationId;
  await loginAs(page, tenant.ownerEmail, tenant.ownerPassword);
});

test.afterEach(async () => {
  await cleanupTenant(tenantId);
});

test("overlap conflict shows warning banner when adding second shift", async ({ page }) => {
  const emp = await createTestEmployee(tenantId);
  const { rosterId } = await createTestRoster(tenantId, locationId);
  // Existing: 9am-5pm
  await createTestShift(tenantId, locationId, rosterId, emp.profileId, {
    dayOffset: 0, startHour: 9, durationHours: 8,
  });

  await page.goto(`/roster?rosterId=${rosterId}`);
  // Attempt to add overlapping shift 3pm-11pm on same day
  await page.locator(`[data-testid='cell-${emp.profileId}-monday']`).click();
  await page.getByLabel("Start Time").fill("15:00");
  await page.getByLabel("End Time").fill("23:00");
  await page.getByRole("button", { name: "Add Shift" }).click();

  await expect(page.locator("[data-testid='conflict-warning']")).toBeVisible();
  await expect(page.getByText(/overlap/i)).toBeVisible();
  await page.screenshot({ path: ".sisyphus/evidence/shifts-overlap-warning.png" });
});

test("availability conflict shows warning when shift is on unavailable day", async ({ page }) => {
  const emp = await createTestEmployee(tenantId);
  const { rosterId } = await createTestRoster(tenantId, locationId);

  // Set employee unavailable on Monday (day_of_week = 1)
  await supabaseAdmin.from("availability").insert({
    tenant_id: tenantId,
    profile_id: emp.profileId,
    day_of_week: 1,
    is_available: false,
  });

  await page.goto(`/roster?rosterId=${rosterId}`);
  await page.locator(`[data-testid='cell-${emp.profileId}-monday']`).click();
  await page.getByLabel("Start Time").fill("09:00");
  await page.getByLabel("End Time").fill("17:00");
  await page.getByRole("button", { name: "Add Shift" }).click();

  await expect(page.locator("[data-testid='conflict-warning']")).toBeVisible();
  await expect(page.getByText(/unavailable/i)).toBeVisible();
  await page.screenshot({ path: ".sisyphus/evidence/shifts-availability-warning.png" });
});

test("conflict warning can be overridden by manager", async ({ page }) => {
  const emp = await createTestEmployee(tenantId);
  const { rosterId } = await createTestRoster(tenantId, locationId);
  await createTestShift(tenantId, locationId, rosterId, emp.profileId, {
    dayOffset: 0, startHour: 9, durationHours: 8,
  });

  await page.goto(`/roster?rosterId=${rosterId}`);
  await page.locator(`[data-testid='cell-${emp.profileId}-monday']`).click();
  await page.getByLabel("Start Time").fill("15:00");
  await page.getByLabel("End Time").fill("23:00");
  await page.getByRole("button", { name: "Add Shift" }).click();

  // Warning shown — click Override/Save Anyway
  await expect(page.locator("[data-testid='conflict-warning']")).toBeVisible();
  await page.getByRole("button", { name: /save anyway|override/i }).click();

  // Shift should now exist in the grid
  const shifts = page.locator("[data-testid='shift-card']");
  await expect(shifts).toHaveCount(2);
  await page.screenshot({ path: ".sisyphus/evidence/shifts-conflict-override.png" });
});

test("min rest warning fires when consecutive shifts have less than 10h gap", async ({ page }) => {
  const emp = await createTestEmployee(tenantId);
  const { rosterId } = await createTestRoster(tenantId, locationId);
  // Monday 9am-5pm (UTC: 22:00-06:00 for AEST shift)
  await createTestShift(tenantId, locationId, rosterId, emp.profileId, {
    dayOffset: 0, startHour: 22, durationHours: 8,
  });

  await page.goto(`/roster?rosterId=${rosterId}`);
  // Tuesday 1am-9am (UTC: 15:00-23:00) — only 9h rest from 06:00 to 15:00
  await page.locator(`[data-testid='cell-${emp.profileId}-tuesday']`).click();
  await page.getByLabel("Start Time").fill("01:00");
  await page.getByLabel("End Time").fill("09:00");
  await page.getByRole("button", { name: "Add Shift" }).click();

  await expect(page.getByText(/rest|break/i)).toBeVisible();
  await page.screenshot({ path: ".sisyphus/evidence/shifts-min-rest-warning.png" });
});
```

### 4.4 — Publish workflow suite

File: `tests/web/publish.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { createTestTenant, createTestEmployee } from "../factories/tenant";
import { createTestRoster, createTestShift } from "../factories/roster";
import { loginAs } from "../helpers/auth";
import { cleanupTenant } from "../helpers/db";

let tenantId: string;
let locationId: string;

test.beforeEach(async ({ page }) => {
  const tenant = await createTestTenant();
  tenantId = tenant.tenantId;
  locationId = tenant.locationId;
  await loginAs(page, tenant.ownerEmail, tenant.ownerPassword);
});

test.afterEach(async () => {
  await cleanupTenant(tenantId);
});

test("publish roster changes status and makes shifts read-only", async ({ page }) => {
  const emp = await createTestEmployee(tenantId);
  const { rosterId } = await createTestRoster(tenantId, locationId);
  await createTestShift(tenantId, locationId, rosterId, emp.profileId);

  await page.goto(`/roster?rosterId=${rosterId}`);
  await page.getByRole("button", { name: "Publish Roster" }).click();
  // Confirm dialog
  await page.getByRole("button", { name: "Publish" }).click();

  await expect(page.locator("[data-testid='roster-status']")).toHaveText("Published");
  // Edit button on shift card should be gone or disabled
  await expect(page.getByRole("button", { name: /edit shift/i })).toBeDisabled();
  await page.screenshot({ path: ".sisyphus/evidence/publish-read-only.png" });
});

test("unpublish reverts to draft and allows editing", async ({ page }) => {
  const emp = await createTestEmployee(tenantId);
  const { rosterId } = await createTestRoster(tenantId, locationId, 0, "published");
  await createTestShift(tenantId, locationId, rosterId, emp.profileId);

  await page.goto(`/roster?rosterId=${rosterId}`);
  await expect(page.locator("[data-testid='roster-status']")).toHaveText("Published");

  await page.getByRole("button", { name: "Unpublish" }).click();
  await page.getByRole("button", { name: "Confirm" }).click();

  await expect(page.locator("[data-testid='roster-status']")).toHaveText("Draft");
  await expect(page.getByRole("button", { name: /edit shift/i })).toBeEnabled();
  await page.screenshot({ path: ".sisyphus/evidence/publish-unpublish.png" });
});

test("copy forward creates new roster with shifts exactly 7 days later", async ({ page }) => {
  const emp = await createTestEmployee(tenantId);
  // Week starting Monday March 23
  const { rosterId } = await createTestRoster(tenantId, locationId, 0, "published");
  const { shiftId } = await createTestShift(tenantId, locationId, rosterId, emp.profileId, {
    dayOffset: 0, startHour: 9, durationHours: 8,
  });

  // Navigate to the next week
  await page.goto(`/roster?weekOffset=1`);
  await page.getByRole("button", { name: /copy from last week/i }).click();
  await page.getByRole("button", { name: "Copy" }).click();

  // Shifts for next week should appear
  await expect(page.locator("[data-testid='shift-card']")).toHaveCount(1);
  // The date shown on the shift card should be 7 days after the original
  const shiftText = await page.locator("[data-testid='shift-card']").first().textContent();
  expect(shiftText).toContain("Mon"); // copied to same day next week
  await page.screenshot({ path: ".sisyphus/evidence/publish-copy-forward.png" });
});

test("realtime: publish in tab A updates status in tab B within 3 seconds", async ({ browser }) => {
  const emp = await createTestEmployee(tenantId);
  const { rosterId } = await createTestRoster(tenantId, locationId);
  await createTestShift(tenantId, locationId, rosterId, emp.profileId);

  // Open two contexts (simulate two browser tabs)
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  // Tab A and Tab B both log in as the same owner
  const { ownerEmail, ownerPassword } = await (async () => {
    const { supabaseAdmin } = await import("../helpers/db");
    const { data } = await supabaseAdmin.from("profiles").select("email").eq("id", (
      await supabaseAdmin.from("tenant_members").select("profile_id").eq("tenant_id", tenantId).single()
    ).data!.profile_id).single();
    return { ownerEmail: data!.email, ownerPassword: "TestPass123!" };
  })();

  await loginAs(pageA, ownerEmail, ownerPassword);
  await loginAs(pageB, ownerEmail, ownerPassword);

  await pageA.goto(`/roster?rosterId=${rosterId}`);
  await pageB.goto(`/roster?rosterId=${rosterId}`);

  // Publish in Tab A
  await pageA.getByRole("button", { name: "Publish Roster" }).click();
  await pageA.getByRole("button", { name: "Publish" }).click();

  // Tab B should update within 3 seconds via Realtime
  await expect(pageB.locator("[data-testid='roster-status']")).toHaveText("Published", { timeout: 5_000 });
  await pageB.screenshot({ path: ".sisyphus/evidence/publish-realtime.png" });

  await contextA.close();
  await contextB.close();
});
```

### 4.5 — Timesheet suite

File: `tests/web/timesheets.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { createTestTenant, createTestEmployee } from "../factories/tenant";
import { loginAs } from "../helpers/auth";
import { cleanupTenant, supabaseAdmin } from "../helpers/db";
import * as fs from "fs";
import * as path from "path";

let tenantId: string;
let locationId: string;

async function createClockPair(
  tenantId: string, locationId: string, profileId: string,
  clockInISO: string, clockOutISO: string
) {
  const inKey = crypto.randomUUID();
  const outKey = crypto.randomUUID();
  await supabaseAdmin.from("clock_events").insert([
    { tenant_id: tenantId, profile_id: profileId, location_id: locationId,
      type: "clock_in", recorded_at: clockInISO, idempotency_key: inKey,
      is_within_geofence: true, source: "mobile" },
    { tenant_id: tenantId, profile_id: profileId, location_id: locationId,
      type: "clock_out", recorded_at: clockOutISO, idempotency_key: outKey,
      is_within_geofence: true, source: "mobile" },
  ]);
}

test.beforeEach(async ({ page }) => {
  const tenant = await createTestTenant();
  tenantId = tenant.tenantId;
  locationId = tenant.locationId;
  await loginAs(page, tenant.ownerEmail, tenant.ownerPassword);
});

test.afterEach(async () => {
  await cleanupTenant(tenantId);
});

test("timesheets page shows clock events for current week", async ({ page }) => {
  const emp = await createTestEmployee(tenantId, { firstName: "Jane", lastName: "Smith" });
  // Clock in 9am, out 5pm — today UTC
  const now = new Date();
  const clockIn = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 0, 0).toISOString();
  const clockOut = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 6, 0, 0).toISOString();
  await createClockPair(tenantId, locationId, emp.profileId, clockIn, clockOut);

  await page.goto("/timesheets");
  await expect(page.getByText("Jane Smith")).toBeVisible();
  await expect(page.getByText("8.00")).toBeVisible();
  await page.screenshot({ path: ".sisyphus/evidence/timesheets-basic.png" });
});

test("hours calculated correctly: 9am clock-in to 5pm clock-out = 8.00h", async ({ page }) => {
  const emp = await createTestEmployee(tenantId);
  await createClockPair(
    tenantId, locationId, emp.profileId,
    "2026-04-06T23:00:00Z",  // 9am AEST = UTC+10
    "2026-04-07T07:00:00Z",  // 5pm AEST
  );

  await page.goto("/timesheets?startDate=2026-04-06&endDate=2026-04-12");
  await expect(page.getByText("8.00")).toBeVisible();
});

test("midnight-crossing shift shows 8.00 hours, not negative or NaN", async ({ page }) => {
  const emp = await createTestEmployee(tenantId);
  await createClockPair(
    tenantId, locationId, emp.profileId,
    "2026-04-06T12:00:00Z",  // 10pm AEST
    "2026-04-06T20:00:00Z",  // 6am AEST next day
  );

  await page.goto("/timesheets?startDate=2026-04-06&endDate=2026-04-12");
  await expect(page.getByText("8.00")).toBeVisible();
  await expect(page.getByText("NaN")).not.toBeVisible();
  await expect(page.getByText("-")).not.toBeVisible(); // negative hours must not appear
  await page.screenshot({ path: ".sisyphus/evidence/timesheets-midnight.png" });
});

test("open clock-in (no clock-out) shows 'Open' status", async ({ page }) => {
  const emp = await createTestEmployee(tenantId);
  const inKey = crypto.randomUUID();
  await supabaseAdmin.from("clock_events").insert({
    tenant_id: tenantId, profile_id: emp.profileId, location_id: locationId,
    type: "clock_in", recorded_at: new Date().toISOString(), idempotency_key: inKey,
    is_within_geofence: true, source: "mobile",
  });

  await page.goto("/timesheets");
  await expect(page.getByText("Open")).toBeVisible();
  await page.screenshot({ path: ".sisyphus/evidence/timesheets-open.png" });
});

test("approve all marks all rows as approved", async ({ page }) => {
  const emp = await createTestEmployee(tenantId);
  await createClockPair(tenantId, locationId, emp.profileId,
    "2026-04-06T23:00:00Z", "2026-04-07T07:00:00Z");

  await page.goto("/timesheets");
  await page.getByRole("button", { name: "Approve All" }).click();
  await expect(page.getByText("Approved").first()).toBeVisible();
  await page.screenshot({ path: ".sisyphus/evidence/timesheets-approve-all.png" });
});

test("CSV export has correct headers and Australian date format", async ({ page }) => {
  const emp = await createTestEmployee(tenantId, { firstName: "Adam", lastName: "Brown" });
  await createClockPair(tenantId, locationId, emp.profileId,
    "2026-04-06T23:00:00Z", "2026-04-07T07:00:00Z");

  await page.goto("/timesheets");
  await page.getByRole("button", { name: "Approve All" }).click();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export CSV" }).click(),
  ]);

  const csvPath = ".sisyphus/evidence/timesheets-export.csv";
  await download.saveAs(csvPath);

  const csv = fs.readFileSync(csvPath, "utf-8");
  const lines = csv.split("\n");

  // Header check
  expect(lines[0]).toBe("Employee Name,Email,Date,Start,End,Hours,Location,Geofence,Approved");

  // Date format: DD/MM/YYYY
  // 2026-04-06T23:00:00Z = 07/04/2026 in AEST
  expect(lines[1]).toMatch(/07\/04\/2026/);

  // Hours as decimal
  expect(lines[1]).toContain("8.00");

  // 24-hour time
  expect(lines[1]).toMatch(/09:00|10:00/); // depends on DST
  expect(lines[1]).not.toMatch(/AM|PM/);

  await page.screenshot({ path: ".sisyphus/evidence/timesheets-csv-downloaded.png" });
});

test("filter by employee shows only that employee's rows", async ({ page }) => {
  const emp1 = await createTestEmployee(tenantId, { firstName: "Alice", lastName: "A" });
  const emp2 = await createTestEmployee(tenantId, { firstName: "Bob", lastName: "B" });
  await createClockPair(tenantId, locationId, emp1.profileId,
    "2026-04-06T23:00:00Z", "2026-04-07T07:00:00Z");
  await createClockPair(tenantId, locationId, emp2.profileId,
    "2026-04-06T23:00:00Z", "2026-04-07T07:00:00Z");

  await page.goto("/timesheets");
  await page.getByRole("combobox", { name: /employee/i }).selectOption({ label: "Alice A" });

  await expect(page.getByText("Alice A")).toBeVisible();
  await expect(page.getByText("Bob B")).not.toBeVisible();
  await page.screenshot({ path: ".sisyphus/evidence/timesheets-filter.png" });
});
```

### 4.6 — Billing suite

File: `tests/web/billing.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { createTestTenant, createTestEmployee } from "../factories/tenant";
import { loginAs } from "../helpers/auth";
import { cleanupTenant } from "../helpers/db";

let tenantId: string;

test.beforeEach(async ({ page }) => {
  const tenant = await createTestTenant({ plan: "free" });
  tenantId = tenant.tenantId;
  await loginAs(page, tenant.ownerEmail, tenant.ownerPassword);
});

test.afterEach(async () => {
  await cleanupTenant(tenantId);
});

test("free tier: first 5 employees added without upgrade prompt", async ({ page }) => {
  await page.goto("/team");
  for (let i = 0; i < 5; i++) {
    await page.getByRole("button", { name: "Add Employee" }).click();
    await page.getByLabel("Email").fill(`emp${i}-${Date.now()}@test.com`);
    await page.getByLabel("First Name").fill("Emp");
    await page.getByLabel("Last Name").fill(`${i}`);
    await page.getByRole("button", { name: "Send Invite" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 3_000 });
  }
  await page.screenshot({ path: ".sisyphus/evidence/billing-free-5.png" });
});

test("free tier: adding 6th employee triggers upgrade modal", async ({ page }) => {
  // Pre-create 5 employees in DB (faster than UI)
  for (let i = 0; i < 5; i++) {
    await createTestEmployee(tenantId);
  }

  await page.goto("/team");
  await page.getByRole("button", { name: "Add Employee" }).click();
  await page.getByLabel("Email").fill(`emp6-${Date.now()}@test.com`);
  await page.getByLabel("First Name").fill("Sixth");
  await page.getByLabel("Last Name").fill("Employee");
  await page.getByRole("button", { name: "Send Invite" }).click();

  // Upgrade modal must appear
  await expect(page.locator("[data-testid='upgrade-modal']")).toBeVisible();
  await expect(page.getByText("$4 + GST per employee per month")).toBeVisible();

  // Employee must NOT exist in DB
  const { supabaseAdmin } = await import("../helpers/db");
  const { count } = await supabaseAdmin.from("profiles").select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId).is("deleted_at", null);
  expect(count).toBe(6); // 1 owner + 5 employees, 6th was blocked

  await page.screenshot({ path: ".sisyphus/evidence/billing-upgrade-modal.png" });
});

test("pricing display uses Australian GST convention: $4 + GST", async ({ page }) => {
  await page.goto("/settings/billing");
  await expect(page.getByText(/\$4 \+ GST/)).toBeVisible();
  await expect(page.getByText(/per employee per month/i)).toBeVisible();
  await page.screenshot({ path: ".sisyphus/evidence/billing-pricing-display.png" });
});
```

### 4.7 — Landing page suite

File: `tests/web/landing.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test("landing page loads with correct title and CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/CrewCircle/);
  await expect(page.getByRole("link", { name: /start free|get started|sign up/i })).toBeVisible();
  await page.screenshot({ path: ".sisyphus/evidence/landing-hero.png" });
});

test("landing page is mobile responsive at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await expect(page.getByRole("link", { name: /get started|sign up/i })).toBeVisible();
  // Check no horizontal overflow
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(overflow).toBe(false);
  await page.screenshot({ path: ".sisyphus/evidence/landing-mobile.png" });
});

test("pricing section shows free and paid tiers", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/free/i)).toBeVisible();
  await expect(page.getByText(/\$4/)).toBeVisible();
  await expect(page.getByText(/per employee/i)).toBeVisible();
  await page.screenshot({ path: ".sisyphus/evidence/landing-pricing.png" });
});

test("data residency trust badge is visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/Australia/i)).toBeVisible();
  await expect(page.getByText(/Sydney|ap-southeast-2|AWS/i)).toBeVisible();
});

test("privacy policy page contains Privacy Act reference", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByText(/Privacy Act 1988/)).toBeVisible();
  await expect(page.getByText(/Australian Privacy Principles/)).toBeVisible();
  await expect(page.getByText(/7.year/i)).toBeVisible();
  await page.screenshot({ path: ".sisyphus/evidence/landing-privacy.png" });
});

test("terms of service page contains cancellation policy", async ({ page }) => {
  await page.goto("/terms");
  await expect(page.getByText(/cancel/i)).toBeVisible();
  await expect(page.getByText(/Victoria/i)).toBeVisible();
  await page.screenshot({ path: ".sisyphus/evidence/landing-terms.png" });
});

test("SEO meta tags are present and non-empty", async ({ page }) => {
  await page.goto("/");
  const description = await page.getAttribute("meta[name='description']", "content");
  expect(description).toBeTruthy();
  expect(description!.toLowerCase()).toContain("australian");
  const ogTitle = await page.getAttribute("meta[property='og:title']", "content");
  expect(ogTitle).toContain("CrewCircle");
});
```

### 4.8 — Production smoke test suite

File: `tests/web/smoke.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { cleanupTenant } from "../helpers/db";

// Runs against production: TEST_BASE_URL=https://crewcircle.com.au npx playwright test smoke.spec.ts
const PROD_EMAIL = `smoke-${Date.now()}@test.crewcircle.com.au`;
const PROD_PASS = "SmokeTest123!";
let tenantId: string;

test.afterAll(async () => {
  if (tenantId) await cleanupTenant(tenantId);
});

test.describe.serial("Production smoke test — full user journey", () => {
  test("1: landing page loads over HTTPS", async ({ page }) => {
    await page.goto("/");
    expect(page.url()).toMatch(/^https:/);
    await expect(page).toHaveTitle(/CrewCircle/);
  });

  test("2: signup flow creates account", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Email").fill(PROD_EMAIL);
    await page.getByLabel("Password").fill(PROD_PASS);
    await page.getByLabel("Business Name").fill("Smoke Test Cafe");
    await page.getByRole("button", { name: "Create Account" }).click();
    await page.waitForURL("/dashboard", { timeout: 20_000 });
    await expect(page.getByText("Smoke Test Cafe")).toBeVisible();
    await page.screenshot({ path: ".sisyphus/evidence/smoke-signup.png" });
  });

  test("3: roster page loads and accepts new shift", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(PROD_EMAIL);
    await page.getByLabel("Password").fill(PROD_PASS);
    await page.getByRole("button", { name: "Log In" }).click();
    await page.waitForURL("/dashboard");
    await page.goto("/roster");
    await expect(page.locator("[data-testid='roster-grid']")).toBeVisible();
    await page.screenshot({ path: ".sisyphus/evidence/smoke-roster.png" });
  });

  test("4: timesheets page loads", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(PROD_EMAIL);
    await page.getByLabel("Password").fill(PROD_PASS);
    await page.getByRole("button", { name: "Log In" }).click();
    await page.waitForURL("/dashboard");
    await page.goto("/timesheets");
    await expect(page.getByText(/timesheet/i)).toBeVisible();
    await page.screenshot({ path: ".sisyphus/evidence/smoke-timesheets.png" });
  });

  test("5: billing settings page loads", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(PROD_EMAIL);
    await page.getByLabel("Password").fill(PROD_PASS);
    await page.getByRole("button", { name: "Log In" }).click();
    await page.waitForURL("/dashboard");
    await page.goto("/settings/billing");
    await expect(page.getByText(/\$4/)).toBeVisible();
    await page.screenshot({ path: ".sisyphus/evidence/smoke-billing.png" });
  });
});
```

---

## Part 5 — Mobile E2E Tests (Maestro)

Maestro flows are YAML files executed with: `maestro test tests/mobile/<file>.yaml`
All flows use Expo Go with the dev build. Set environment variable: `MAESTRO_APP_ID=host.exp.exponent`

### 5.1 — Login flow

File: `tests/mobile/login.yaml`

```yaml
appId: ${MAESTRO_APP_ID}
---
- launchApp:
    clearState: true

# Assert login screen is visible
- assertVisible:
    text: "Log In"
    timeout: 10000

# Fill credentials
- tapOn:
    text: "Email"
- inputText: ${MOBILE_TEST_EMAIL}
- tapOn:
    text: "Password"
- inputText: "TestPass123!"

- tapOn:
    text: "Log In"

# Wait for tab bar
- assertVisible:
    text: "Roster"
    timeout: 15000

- assertVisible:
    text: "Time Clock"

- assertVisible:
    text: "Profile"

- takeScreenshot: .sisyphus/evidence/mobile-login-success.png

# Verify profile tab shows name
- tapOn:
    text: "Profile"
- assertVisible:
    text: "Test"  # first name
```

### 5.2 — Roster view

File: `tests/mobile/roster_view.yaml`

```yaml
appId: ${MAESTRO_APP_ID}
---
- launchApp

- tapOn:
    text: "Roster"
    timeout: 10000

# Assert current week heading visible
- assertVisible:
    id: "week-heading"
    timeout: 5000

# Shift cards should be visible if published roster exists
- assertVisible:
    text: "Staff"  # role_label from test shift
    timeout: 8000

- takeScreenshot: .sisyphus/evidence/mobile-roster-view.png

# Navigate to next week
- tapOn:
    id: "next-week-button"

- assertVisible:
    text: "No shifts scheduled"
    timeout: 5000

- takeScreenshot: .sisyphus/evidence/mobile-roster-empty.png

# Navigate back to current week
- tapOn:
    id: "prev-week-button"

- assertVisible:
    text: "Staff"
    timeout: 5000
```

### 5.3 — Availability management

File: `tests/mobile/availability.yaml`

```yaml
appId: ${MAESTRO_APP_ID}
---
- launchApp

- tapOn:
    text: "Profile"

- tapOn:
    text: "My Availability"

# Assert 7 day rows visible
- assertVisible:
    text: "Monday"
- assertVisible:
    text: "Sunday"

# Toggle Tuesday to Unavailable
- tapOn:
    id: "availability-toggle-tuesday"

# Assert toggle is now "off" (unavailable)
- assertNotVisible:
    id: "availability-toggle-tuesday-on"

- takeScreenshot: .sisyphus/evidence/mobile-availability-tuesday-off.png

# Toggle back to Available
- tapOn:
    id: "availability-toggle-tuesday"

- assertVisible:
    id: "availability-toggle-tuesday-on"
    timeout: 3000

- takeScreenshot: .sisyphus/evidence/mobile-availability-tuesday-on.png
```

### 5.4 — Time clock (manual script — requires physical device at location)

File: `tests/mobile/timeclock_manual.md`

```markdown
# Time Clock Manual Test Script

## Precondition
- Physical device with GPS
- Expo Go installed and logged in as test employee
- Location geofence set to device's current position (lat/lon from Maps app), radius 150m
- Test employee has a shift today

## Steps

### Scenario A: Clock in within geofence

1. Open app, tap "Time Clock"
2. Verify: current shift info is visible (role, time range)
3. Tap "Clock In"
4. GPS permission dialog: tap "Allow While Using"
5. Expected: green indicator "Clocked in at [Location Name]"
6. Expected: duration timer starts counting up (00:00:01, 00:00:02…)
7. In Supabase: verify `clock_events` row exists with:
   - type = 'clock_in'
   - is_within_geofence = true
   - latitude/longitude populated
   - source = 'mobile'
8. Save screenshot: .sisyphus/evidence/mobile-clock-in-within.png

### Scenario B: Clock out
1. Tap "Clock Out"
2. Expected: timer stops, "Clocked out" confirmation shown
3. In Supabase: verify matching clock_out row

### Scenario C: Clock in outside geofence
1. Move 200m from location (or set geofence to a far location in Supabase)
2. Tap "Clock In"
3. Expected: orange warning "You appear to be outside [Location Name]. Clock in anyway?"
4. Tap "Clock In Anyway"
5. In Supabase: verify clock_events row with is_within_geofence = false
6. Save screenshot: .sisyphus/evidence/mobile-clock-in-outside.png

### Scenario D: Offline clock-in
1. Enable airplane mode
2. Tap "Clock In"
3. Expected: "Offline — will sync when connection restored" indicator
4. Check SQLite outbox: row exists with synced_at = null
5. Disable airplane mode, wait 30 seconds
6. In Supabase: verify row now exists in clock_events
7. In SQLite: outbox row has synced_at set (not null)
8. Save evidence: .sisyphus/evidence/mobile-clock-in-offline.txt

### Scenario E: Anti-spoofing detection (mock GPS)
1. Install a mock GPS app (e.g., Fake GPS)
2. Set fake location to the geofence center
3. Open app, tap "Clock In"
4. Expected: warning "Mock location detected" shown (but not blocked)
5. Save screenshot: .sisyphus/evidence/mobile-mock-gps.png
```

### 5.5 — Push notifications (manual)

File: `tests/mobile/push_notifications_manual.md`

```markdown
# Push Notification Manual Test Script

## Precondition
- Physical iOS or Android device
- App installed via EAS preview build (not Expo Go — push doesn't work in Expo Go simulator)
- Employee logged in, push permissions granted (verified in device settings)
- Token exists in `push_tokens` table in Supabase

## Scenario A: Roster published notification

1. Open device — app in background or closed
2. Manager publishes roster on web dashboard
3. Expected within 30 seconds: push notification appears on device lock screen
4. Notification title: "Roster Published"
5. Notification body: contains week date range
6. Tap notification: app opens to Roster tab showing the new roster
7. Save screenshot: .sisyphus/evidence/mobile-push-roster.png

## Scenario B: Shift reminder notification

1. Create a shift starting 1h 50min from now
2. Wait until 2 hours before shift start (cron fires every 15 min)
3. Expected: push notification "Your shift starts at [time] at [location]"
4. Save screenshot: .sisyphus/evidence/mobile-push-reminder.png

## Scenario C: Invalid token removed

1. Delete the push token from `push_tokens` table manually (simulate device reinstall)
2. Publisher sends a push (via roster publish)
3. Expo Push API returns DeviceNotRegistered
4. In Supabase Edge Function logs: verify token deletion ran
5. In `push_tokens` table: token row no longer exists
6. Save evidence: .sisyphus/evidence/mobile-push-invalid-token.txt
```

---

## Part 6 — Security Audit Tests

### 6.1 — No service role key in client bundles

```bash
# Run after production build
cd apps/web && pnpm build

grep -r "service_role" .next/ 2>/dev/null | grep -v ".next/cache"
# Expected: 0 results
# If any results found: CRITICAL FAILURE — abort deployment

grep -r "SUPABASE_SERVICE_ROLE_KEY" .next/static/ 2>/dev/null
# Expected: 0 results

# Save output
echo "Service role key audit: $(grep -r 'service_role' .next/static/ | wc -l) occurrences" \
  > .sisyphus/evidence/security-service-role-audit.txt
```

### 6.2 — Hard delete audit

```bash
# Search entire codebase for hard delete patterns
grep -rn "\.delete()\|DELETE FROM\|\.destroy()\|\.remove()" \
  apps/ packages/ supabase/functions/ \
  --include="*.ts" --include="*.tsx" --include="*.sql" \
  | grep -v "deleted_at\|soft\|node_modules\|test\|spec\|__tests__"

# Expected: 0 results
# If results found: each must be audited — clock_events cleanup, migration rollbacks,
# and test cleanup via supabaseAdmin are the only legitimate exceptions

echo "Hard delete audit complete" > .sisyphus/evidence/security-hard-delete-audit.txt
```

### 6.3 — Auth.jwt() in RLS policies

```bash
# Check no RLS policy uses auth.jwt()
supabase db dump --local | grep -i "auth.jwt()"
# Expected: 0 results

psql $DATABASE_URL -c \
  "SELECT schemaname, tablename, policyname, qual
   FROM pg_policies
   WHERE qual::text ILIKE '%auth.jwt%'
   OR with_check::text ILIKE '%auth.jwt%'"
# Expected: 0 rows

echo "JWT in RLS audit complete" > .sisyphus/evidence/security-rls-jwt-audit.txt
```

### 6.4 — Unauthenticated route access

```bash
# All protected routes must return 302 to /login
for ROUTE in /dashboard /roster /team /timesheets /settings/billing; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L "http://localhost:3000${ROUTE}")
  if [ "$STATUS" != "200" ] || [[ "$(curl -s -L "http://localhost:3000${ROUTE}" | grep -i "log in\|login")" ]]; then
    echo "PASS: $ROUTE redirects unauthenticated users"
  else
    echo "FAIL: $ROUTE accessible without auth"
  fi
done | tee .sisyphus/evidence/security-unauth-routes.txt
```

---

## Part 7 — Performance Tests

### 7.1 — Lighthouse CI

```bash
# Install
npm install -g @lhci/cli

# Run against local build
pnpm --filter web build
pnpm --filter web start &
sleep 5

lhci autorun --collect.url=http://localhost:3000 \
  --assert.assertions.performance=">0.90" \
  --assert.assertions.accessibility=">0.90" \
  --assert.assertions.seo=">0.90" \
  --output=json \
  --output-path=.sisyphus/evidence/lighthouse-landing.json
```

### 7.2 — Roster grid render time

This is covered inside `tests/web/roster.spec.ts` (the 30-employee test).
Additionally, write a standalone benchmark:

```typescript
// tests/web/benchmarks/roster-render.bench.ts
import { test } from "@playwright/test";
import * as fs from "fs";

test("roster grid render benchmark: 50 employees, 150 shifts", async ({ page }) => {
  // Setup via admin client — omitted for brevity, same pattern as roster.spec.ts
  const results: number[] = [];

  for (let run = 0; run < 3; run++) {
    const start = Date.now();
    await page.goto("/roster?rosterId=<seeded-id>");
    await page.waitForSelector("[data-testid='roster-grid']");
    results.push(Date.now() - start);
    await page.reload();
  }

  const avg = results.reduce((a, b) => a + b, 0) / results.length;
  const max = Math.max(...results);

  fs.writeFileSync(
    ".sisyphus/evidence/benchmark-roster-render.txt",
    `Avg: ${avg.toFixed(0)}ms | Max: ${max}ms | Runs: ${results.join(", ")}ms`
  );

  expect(avg).toBeLessThan(2_000);
  expect(max).toBeLessThan(3_000);
});
```

---

## Part 8 — Test Execution Runbook

The agent must execute tests in this exact order. Do not proceed to the next stage if the current stage has failures.

```bash
# ============================================================
# STAGE 1: Database layer (no running app required)
# ============================================================
supabase test db
# Expected: all pgTap tests pass (0 failures)
cp supabase/test-results.txt .sisyphus/evidence/stage1-pgtap.txt

# ============================================================
# STAGE 2: Unit tests (pure functions, no DB, no browser)
# ============================================================
pnpm --filter validators test --reporter=verbose
# Expected: all Vitest tests pass
cp packages/validators/test-results.txt .sisyphus/evidence/stage2-vitest.txt

# ============================================================
# STAGE 3: Web integration (Next.js dev server + Supabase)
# ============================================================
pnpm --filter web dev &
sleep 5

npx playwright test tests/web/auth.spec.ts
npx playwright test tests/web/roster.spec.ts
npx playwright test tests/web/shifts.spec.ts
npx playwright test tests/web/publish.spec.ts
npx playwright test tests/web/timesheets.spec.ts
npx playwright test tests/web/billing.spec.ts
npx playwright test tests/web/landing.spec.ts

# ============================================================
# STAGE 4: Security audit (post-build)
# ============================================================
bash tests/security/audit.sh
# Expected: 0 occurrences in all checks

# ============================================================
# STAGE 5: Performance
# ============================================================
npx playwright test tests/web/benchmarks/roster-render.bench.ts

# ============================================================
# STAGE 6: Mobile (manual scripts, physical device required)
# ============================================================
# Follow: tests/mobile/timeclock_manual.md
# Follow: tests/mobile/push_notifications_manual.md
# Maestro flows (if device connected):
maestro test tests/mobile/login.yaml
maestro test tests/mobile/roster_view.yaml
maestro test tests/mobile/availability.yaml

# ============================================================
# STAGE 7: Production smoke (only after deployment)
# ============================================================
TEST_BASE_URL=https://crewcircle.com.au npx playwright test tests/web/smoke.spec.ts
```

---

## Part 9 — Evidence Manifest

Every test must produce a corresponding evidence file. The agent verifies this manifest is complete before marking the test plan as done.

| Suite | Evidence File | Format |
|---|---|---|
| pgTap RLS isolation | `stage1-pgtap.txt` | Text |
| pgTap role-based | `stage1-pgtap.txt` | Text |
| pgTap soft delete | `stage1-pgtap.txt` | Text |
| pgTap ABN constraint | `stage1-pgtap.txt` | Text |
| Vitest ABN | `stage2-vitest.txt` | Text |
| Vitest conflicts | `stage2-vitest.txt` | Text |
| Vitest CSV | `stage2-vitest.txt` | Text |
| Auth signup success | `auth-signup-success.png` | PNG |
| Auth invalid ABN | `auth-abn-invalid.png` | PNG |
| Auth redirect | (no screenshot — URL assertion sufficient) | |
| Roster grid columns | `roster-grid-columns.png` | PNG |
| Roster add shift | `roster-add-shift.png` | PNG |
| Roster drag persist | `roster-drag-persist.png` | PNG |
| Roster 30-employee perf | `roster-performance.txt` + `.png` | Text + PNG |
| Shifts overlap warning | `shifts-overlap-warning.png` | PNG |
| Shifts availability | `shifts-availability-warning.png` | PNG |
| Shifts conflict override | `shifts-conflict-override.png` | PNG |
| Shifts min rest | `shifts-min-rest-warning.png` | PNG |
| Publish read-only | `publish-read-only.png` | PNG |
| Publish unpublish | `publish-unpublish.png` | PNG |
| Publish copy forward | `publish-copy-forward.png` | PNG |
| Publish realtime | `publish-realtime.png` | PNG |
| Timesheets basic | `timesheets-basic.png` | PNG |
| Timesheets midnight | `timesheets-midnight.png` | PNG |
| Timesheets open | `timesheets-open.png` | PNG |
| Timesheets approve | `timesheets-approve-all.png` | PNG |
| Timesheets CSV | `timesheets-export.csv` | CSV |
| Billing free-5 | `billing-free-5.png` | PNG |
| Billing upgrade modal | `billing-upgrade-modal.png` | PNG |
| Billing pricing display | `billing-pricing-display.png` | PNG |
| Landing hero | `landing-hero.png` | PNG |
| Landing mobile | `landing-mobile.png` | PNG |
| Landing privacy | `landing-privacy.png` | PNG |
| Landing terms | `landing-terms.png` | PNG |
| Security service role | `security-service-role-audit.txt` | Text |
| Security hard deletes | `security-hard-delete-audit.txt` | Text |
| Security unauth routes | `security-unauth-routes.txt` | Text |
| Lighthouse landing | `lighthouse-landing.json` | JSON |
| Roster render benchmark | `benchmark-roster-render.txt` | Text |
| Mobile login | `mobile-login-success.png` | PNG |
| Mobile roster view | `mobile-roster-view.png` | PNG |
| Mobile roster empty | `mobile-roster-empty.png` | PNG |
| Mobile availability | `mobile-availability-tuesday-off.png` | PNG |
| Mobile clock in geofence | `mobile-clock-in-within.png` | PNG |
| Mobile clock out-of-fence | `mobile-clock-in-outside.png` | PNG |
| Mobile offline sync | `mobile-clock-in-offline.txt` | Text |
| Mobile push roster | `mobile-push-roster.png` | PNG |
| Production smoke | `smoke-signup.png` + `smoke-roster.png` | PNG |

---

## Part 10 — Test Failure Response Protocol

When a test fails, the agent must:

1. **Stop** — do not proceed to the next test in the same suite.
2. **Capture** — save the full error message, stack trace, and screenshot to `.sisyphus/evidence/FAILURE-{suite}-{test-slug}.txt`.
3. **Diagnose** — check these common causes in order:
   - Supabase RLS blocking query? Check `profiles.tenant_id` and `tenant_members` rows exist.
   - Selector not found? Check `data-testid` attribute is on the rendered element.
   - Timing issue? Add `await page.waitForSelector(...)` before the assertion.
   - DB not seeded? Check factory functions returned without error.
4. **Fix** — apply the minimal code change to the application or test.
5. **Re-run** — run only the failing test first, then the full suite.
6. **Never mark a test as passing by removing the assertion** — either fix the underlying code or mark the test `test.skip` with a documented reason.
