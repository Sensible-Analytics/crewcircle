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
   46617 INSERT INTO shifts (tenant_id, location_id, roster_id, start_time, end_time)
      VALUES ('aaaaaaaa-0000-0000-0000-000000000001',
              'aaaaaaaa-0000-0000-0000-000000000002',
              'aaaaaaaa-0000-0000-0000-000000000003',
              now(), now() + interval '8 hours') 46617,
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
   46617 INSERT INTO tenants (name, abn) VALUES ('Valid ABN', '51824753556') 46617,
   'Valid ABN 51824753556 accepted'
);

SELECT throws_ok(
   46617 INSERT INTO tenants (name, abn) VALUES ('Invalid ABN', '12345678901') 46617,
   'new row for relation "tenants" violates check constraint "tenants_abn_valid"',
   'Invalid ABN rejected'
);

SELECT * FROM finish();
ROLLBACK;
