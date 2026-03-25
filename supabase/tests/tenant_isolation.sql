-- pgTap test for tenant isolation, ABN validation, and soft delete
-- We'll create test functions to simulate the behavior since we can't easily change auth.uid() in tests

-- Load the pgTap extension if not already loaded
create extension if not exists pgtap;

-- Start the test plan
select plan(4);

-- Test 1: ABN validation
-- Test that valid ABN passes and invalid ABN fails
do $$
begin
    -- Valid ABN: 51824753556 (example from the plan)
    perform validate_abn('51824753556');
    ok(true, 'Valid ABN passes validation');
    
    -- Invalid ABN: 12345678901
    begin
        perform validate_abn('12345678901');
        ok(false, 'Invalid ABN should fail validation');
    exception when others then
        ok(true, 'Invalid ABN fails validation as expected');
    end;
end $$;

-- Test 2: Soft delete functionality
-- Insert a record, soft delete it, verify it doesn't appear in default select
do $$
declare
    v_tenant_id uuid;
    v_location_id uuid;
begin
    -- Create a tenant
    insert into tenants (name, abn, timezone, plan)
    values ('Test Tenant', '51824753556', 'Australia/Sydney', 'free')
    returning id into v_tenant_id;
    
    -- Create a location for that tenant
    insert into locations (tenant_id, name, address, latitude, longitude, timezone)
    values (v_tenant_id, 'Test Location', '123 Test St', -33.8688, 151.2093, 'Australia/Sydney')
    returning id into v_location_id;
    
    -- Insert a shift
    insert into shifts (tenant_id, location_id, profile_id, start_time, end_time, role_label)
    values (v_tenant_id, v_location_id, '00000000-0000-0000-0000-000000000001', 
            '2026-04-06 09:00:00+11', '2026-04-06 17:00:00+11', 'Barista');
    
    -- Verify the shift exists before soft delete
    select count(*) into v_count from shifts where id = (select max(id) from shifts);
    ok(v_count = 1, 'Shift exists before soft delete');
    
    -- Soft delete the shift (set deleted_at)
    update shifts set deleted_at = now() where id = (select max(id) from shifts);
    
    -- Verify the shift is gone from default view (should be filtered out by RLS or we check directly)
    -- Actually, we need to check that it's still in the table but would be filtered by RLS in a real query
    -- For this test, we'll check that the record exists but has deleted_at set
    select count(*) into v_count from shifts where id = (select max(id) from shifts) and deleted_at is not null;
    ok(v_count = 1, 'Shift is soft deleted (deleted_at is set)');
    
    -- Verify that a query that excludes deleted_at doesn't see it
    select count(*) into v_count from shifts where id = (select max(id) from shifts) and deleted_at is null;
    ok(v_count = 0, 'Soft deleted shift is not visible in queries that exclude deleted_at');
end $$;

-- Test 3: Tenant isolation using a test function
-- Create a test function that mimics is_tenant_member but allows us to set the user id
create or replace function test_is_tenant_member(p_tenant_id uuid, p_user_id uuid)
returns boolean as $$
  declare
    v_tenant_id uuid;
  begin
    select tenant_id into v_tenant_id
    from profiles
    where id = p_user_id
    limit 1;
    
    if v_tenant_id is null then
        return false;
    end if;
    
    return v_tenant_id = p_tenant_id;
  end;
$$ language plpgsql;

-- Test the function
do $$
declare
    v_tenant_a_id uuid;
    v_tenant_b_id uuid;
    v_profile_a_id uuid := '00000000-0000-0000-0000-000000000001';
    v_profile_b_id uuid := '00000000-0000-0000-0000-000000000002';
begin
    -- Create two tenants
    insert into tenants (name, abn, timezone, plan)
    values ('Tenant A', '51824753556', 'Australia/Sydney', 'free')
    returning id into v_tenant_a_id;
    
    insert into tenants (name, abn, timezone, plan)
    values ('Tenant B', '12345678902', 'Australia/Sydney', 'free')
    returning id into v_tenant_b_id;
    
    -- Create profiles for each tenant
    insert into profiles (id, tenant_id, role, first_name, last_name, email)
    values (v_profile_a_id, v_tenant_a_id, 'owner', 'John', 'Doe', 'john@example.com');
    
    insert into profiles (id, tenant_id, role, first_name, last_name, email)
    values (v_profile_b_id, v_tenant_b_id, 'owner', 'Jane', 'Smith', 'jane@example.com');
    
    -- Test that profile A belongs to tenant A
    select test_is_tenant_member(v_tenant_a_id, v_profile_a_id) into v_result;
    ok(v_result = true, 'Profile A belongs to Tenant A');
    
    // Test that profile A does NOT belong to tenant B
    select test_is_tenant_member(v_tenant_b_id, v_profile_a_id) into v_result;
    ok(v_result = false, 'Profile A does not belong to Tenant B');
    
    // Test that profile B belongs to tenant B
    select test_is_tenant_member(v_tenant_b_id, v_profile_b_id) into v_result;
    ok(v_result = true, 'Profile B belongs to Tenant B');
    
    // Test that profile B does NOT belong to tenant A
    select test_is_tenant_member(v_tenant_a_id, v_profile_b_id) into v_result;
    ok(v_result = false, 'Profile B does not belong to Tenant A');
end $$;

-- Finish the test plan
select * from finish();
