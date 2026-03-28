import { clerkClient } from '@clerk/nextjs/server';
import { sql } from '@/lib/neon/client';

const DEMO_USERS = [
  { email: 'demo-owner@crewcircle.co', password: 'Demo2026!', first_name: 'Maria', last_name: 'Papadopoulos', role: 'owner' },
  { email: 'demo-manager@crewcircle.co', password: 'Demo2026!', first_name: 'Jake', last_name: 'Thompson', role: 'manager' },
  { email: 'demo-employee1@crewcircle.co', password: 'Demo2026!', first_name: 'Sarah', last_name: 'Chen', role: 'employee' },
  { email: 'demo-employee2@crewcircle.co', password: 'Demo2026!', first_name: 'Emma', last_name: 'Wilson', role: 'employee' },
];

export async function POST() {
  try {
    const existingTenants = await sql`SELECT id FROM tenants WHERE name = 'The Daily Grind Cafe' LIMIT 1`;
    let tenantId: string;

    if (existingTenants.length > 0) {
      tenantId = existingTenants[0].id;
    } else {
      const tenantResult = await sql`
        INSERT INTO tenants (name, abn, timezone, plan)
        VALUES ('The Daily Grind Cafe', '51824753556', 'Australia/Sydney', 'free')
        RETURNING id
      `;
      tenantId = tenantResult[0].id;
    }

    const locationResult = await sql`
      INSERT INTO locations (tenant_id, name, address, latitude, longitude, timezone, geofence_radius_m)
      VALUES (${tenantId}, 'Main Cafe - Surry Hills', '42 Crown Street, Surry Hills NSW 2010', -33.8833, 151.2167, 'Australia/Sydney', 150)
      RETURNING id
    `;
    const locationId = locationResult[0].id;

    const clerk = await clerkClient();

    for (const user of DEMO_USERS) {
      try {
        const clerkUser = await clerk.users.createUser({
          emailAddress: [user.email],
          password: user.password,
          publicMetadata: { tenant_id: tenantId, role: user.role },
        });

        await sql`
          INSERT INTO profiles (id, tenant_id, role, first_name, last_name, email)
          VALUES (${clerkUser.id}, ${tenantId}, ${user.role}, ${user.first_name}, ${user.last_name}, ${user.email})
        `;
      } catch (err: any) {
        if (err.code !== 'user_exists') console.error(`Error creating user ${user.email}:`, err);
      }
    }

    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    const weekStart = monday.toISOString().split('T')[0];

    const rosterResult = await sql`
      INSERT INTO rosters (tenant_id, location_id, week_start, status)
      VALUES (${tenantId}, ${locationId}, ${weekStart}, 'published')
      RETURNING id
    `;
    const rosterId = rosterResult[0].id;

    const profiles = await sql`SELECT id, email, role FROM profiles WHERE tenant_id = ${tenantId}`;
    const profileMap = new Map(profiles.map((p: any) => [p.email, p.id]));

    for (let day = 0; day < 7; day++) {
      const shiftDate = new Date(monday);
      shiftDate.setDate(monday.getDate() + day);
      const dateStr = shiftDate.toISOString().split('T')[0];

      if (day < 5) {
        const sarahId = profileMap.get('demo-employee1@crewcircle.co');
        if (sarahId) {
          await sql`INSERT INTO shifts (tenant_id, location_id, roster_id, profile_id, start_time, end_time, role_label)
            VALUES (${tenantId}, ${locationId}, ${rosterId}, ${sarahId}, ${`${dateStr}T06:00:00+11:00`}, ${`${dateStr}T14:00:00+11:00`}, 'Barista')`;
        }
        const jakeId = profileMap.get('demo-manager@crewcircle.co');
        if (jakeId) {
          await sql`INSERT INTO shifts (tenant_id, location_id, roster_id, profile_id, start_time, end_time, role_label)
            VALUES (${tenantId}, ${locationId}, ${rosterId}, ${jakeId}, ${`${dateStr}T08:00:00+11:00`}, ${`${dateStr}T16:00:00+11:00`}, 'Manager')`;
        }
      }
      if (day >= 1 && day <= 5) {
        const emmaId = profileMap.get('demo-employee2@crewcircle.co');
        if (emmaId) {
          await sql`INSERT INTO shifts (tenant_id, location_id, roster_id, profile_id, start_time, end_time, role_label)
            VALUES (${tenantId}, ${locationId}, ${rosterId}, ${emmaId}, ${`${dateStr}T12:00:00+11:00`}, ${`${dateStr}T20:00:00+11:00`}, 'Server')`;
        }
      }
    }

    for (const profile of profiles) {
      for (let day = 1; day <= 7; day++) {
        await sql`INSERT INTO availability (tenant_id, profile_id, day_of_week, start_time, end_time, is_available)
          VALUES (${tenantId}, ${(profile as any).id}, ${day}, '06:00:00', '22:00:00', true)`;
      }
    }

    return Response.json({
      success: true,
      message: 'Demo organization created successfully',
      tenantId,
      users: DEMO_USERS.map(u => ({ email: u.email, password: u.password, role: u.role })),
    });
  } catch (error) {
    console.error('Error setting up demo:', error);
    return Response.json({ error: 'Failed to set up demo: ' + (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 });
  }
}
