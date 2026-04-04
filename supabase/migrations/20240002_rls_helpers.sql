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
