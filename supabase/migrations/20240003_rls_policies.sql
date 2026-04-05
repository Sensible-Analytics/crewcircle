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
