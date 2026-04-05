import { testSql, generateTestId } from '../helpers/db';

export interface TestTenant {
  tenantId: string;
  locationId: string;
  ownerEmail: string;
  ownerPassword: string;
}

export interface TestEmployee {
  profileId: string;
  email: string;
  firstName: string;
  lastName: string;
}

export async function createTestTenant(overrides: {
  name?: string;
  abn?: string | null;
  timezone?: string;
  plan?: 'free' | 'starter';
  ownerEmail?: string;
  ownerPassword?: string;
} = {}): Promise<TestTenant> {
  const tenantId = generateTestId();
  const locationId = generateTestId();
  const ownerEmail = overrides.ownerEmail || `owner-${Date.now()}@test.crewcircle.com.au`;
  const ownerPassword = overrides.ownerPassword || 'TestPass123!';

  const tenantName = overrides.name || 'Test Cafe';
  const abn = overrides.abn ?? null;
  const timezone = overrides.timezone || 'Australia/Melbourne';
  const plan = overrides.plan || 'free';

  await testSql`
    INSERT INTO tenants (id, name, abn, timezone, plan)
    VALUES (${tenantId}, ${tenantName}, ${abn}, ${timezone}, ${plan})
  `;

  await testSql`
    INSERT INTO locations (id, tenant_id, name, timezone, geofence_radius_m)
    VALUES (${locationId}, ${tenantId}, 'Main Location', ${timezone}, 150)
  `;

  return {
    tenantId,
    locationId,
    ownerEmail,
    ownerPassword,
  };
}

export async function createTestEmployee(
  tenantId: string,
  overrides: {
    role?: 'manager' | 'employee';
    firstName?: string;
    lastName?: string;
    clerkUserId?: string;
  } = {}
): Promise<TestEmployee> {
  const profileId = overrides.clerkUserId || generateTestId();
  const email = `emp-${Date.now()}-${Math.random().toString(36).slice(2)}@test.crewcircle.com.au`;
  const firstName = overrides.firstName || 'Test';
  const lastName = overrides.lastName || `Employee-${Date.now()}`;
  const role = overrides.role || 'employee';

  await testSql`
    INSERT INTO profiles (id, tenant_id, email, first_name, last_name, role)
    VALUES (${profileId}, ${tenantId}, ${email}, ${firstName}, ${lastName}, ${role})
  `;

  await testSql`
    INSERT INTO tenant_members (tenant_id, profile_id, role, accepted_at)
    VALUES (${tenantId}, ${profileId}, ${role}, NOW())
  `;

  return {
    profileId,
    email,
    firstName,
    lastName,
  };
}
