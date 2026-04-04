import { neon } from '@neondatabase/serverless';

const testDbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!testDbUrl) {
  throw new Error('DATABASE_URL or TEST_DATABASE_URL environment variable is required for tests');
}

export const testSql = neon(testDbUrl);

export async function execSql<T = unknown>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> {
  return testSql(strings, ...values) as Promise<T[]>;
}

export async function cleanupTenant(tenantId: string): Promise<void> {
  try {
    await testSql`DELETE FROM clock_events WHERE tenant_id = ${tenantId}`;
    await testSql`DELETE FROM push_tokens WHERE profile_id IN (SELECT id FROM profiles WHERE tenant_id = ${tenantId})`;
    await testSql`DELETE FROM shifts WHERE tenant_id = ${tenantId}`;
    await testSql`DELETE FROM rosters WHERE tenant_id = ${tenantId}`;
    await testSql`DELETE FROM availability WHERE tenant_id = ${tenantId}`;
    await testSql`DELETE FROM tenant_members WHERE tenant_id = ${tenantId}`;
    await testSql`DELETE FROM profiles WHERE tenant_id = ${tenantId}`;
    await testSql`DELETE FROM locations WHERE tenant_id = ${tenantId}`;
    await testSql`DELETE FROM tenants WHERE id = ${tenantId}`;
  } catch (error) {
    console.error(`Error cleaning up tenant ${tenantId}:`, error);
  }
}

export async function getProfileByEmail(email: string) {
  const result = await testSql`SELECT * FROM profiles WHERE email = ${email} LIMIT 1`;
  return result[0] || null;
}

export async function tenantExists(tenantId: string): Promise<boolean> {
  const result = await testSql`SELECT id FROM tenants WHERE id = ${tenantId} LIMIT 1`;
  return result.length > 0;
}

export async function createTestProfile(params: {
  id: string;
  tenantId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: 'owner' | 'manager' | 'employee';
}) {
  const { id, tenantId, email, firstName = 'Test', lastName = 'User', role = 'employee' } = params;
  
  await testSql`
    INSERT INTO profiles (id, tenant_id, email, first_name, last_name, role)
    VALUES (${id}, ${tenantId}, ${email}, ${firstName}, ${lastName}, ${role})
    ON CONFLICT (id) DO NOTHING
  `;
  
  await testSql`
    INSERT INTO tenant_members (tenant_id, profile_id, role, accepted_at)
    VALUES (${tenantId}, ${id}, ${role}, NOW())
    ON CONFLICT (tenant_id, profile_id) DO NOTHING
  `;
}

export function generateTestId(): string {
  return crypto.randomUUID();
}
