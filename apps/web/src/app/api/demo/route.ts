import { sql } from '@/lib/neon/client';

export async function POST() {
  try {
    const existingTenants = await sql`SELECT id FROM tenants WHERE name = 'The Daily Grind Cafe' LIMIT 1`;
    
    if (existingTenants.length > 0) {
      return Response.json({
        success: true,
        message: 'Demo organization already exists',
        tenantId: existingTenants[0].id,
      });
    }

    const tenantResult = await sql`
      INSERT INTO tenants (name, abn, timezone, plan)
      VALUES ('The Daily Grind Cafe', '51824753556', 'Australia/Sydney', 'free')
      RETURNING id
    `;
    const tenantId = tenantResult[0].id;

    await sql`
      INSERT INTO locations (tenant_id, name, address, latitude, longitude, timezone, geofence_radius_m)
      VALUES (${tenantId}, 'Main Cafe - Surry Hills', '42 Crown Street, Surry Hills NSW 2010', -33.8833, 151.2167, 'Australia/Sydney', 150)
    `;

    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    const weekStart = monday.toISOString().split('T')[0];

    await sql`
      INSERT INTO rosters (tenant_id, location_id, week_start, status)
      VALUES (${tenantId}, (SELECT id FROM locations WHERE tenant_id = ${tenantId} LIMIT 1), ${weekStart}, 'published')
    `;

    return Response.json({
      success: true,
      message: 'Demo organization created successfully',
      tenantId,
    });
  } catch (error) {
    console.error('Error setting up demo:', error);
    return Response.json({ error: 'Failed to set up demo' }, { status: 500 });
  }
}
