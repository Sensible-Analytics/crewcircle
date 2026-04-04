import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!tenantId || !start || !end) {
      return NextResponse.json({ error: 'tenantId, start, and end required' }, { status: 400 });
    }

    const data = await sql`
      WITH paired_events AS (
        SELECT
          ce.profile_id,
          p.first_name,
          p.last_name,
          p.email,
          DATE(ce.recorded_at AT TIME ZONE 'Australia/Melbourne') as work_date,
          MIN(CASE WHEN ce.type = 'clock_in' THEN ce.recorded_at END) as clock_in,
          MAX(CASE WHEN ce.type = 'clock_out' THEN ce.recorded_at END) as clock_out,
          MAX(ce.is_within_geofence) as is_within_geofence,
          MAX(ce.approved_at) as approved_at,
          MAX(ce.approved_by) as approved_by,
          MAX(l.name) as location_name
        FROM clock_events ce
        JOIN profiles p ON p.id = ce.profile_id
        LEFT JOIN locations l ON l.id = ce.location_id
        WHERE p.tenant_id = ${tenantId}
          AND ce.deleted_at IS NULL
          AND ce.recorded_at >= ${start}
          AND ce.recorded_at < ${end}
        GROUP BY ce.profile_id, p.first_name, p.last_name, p.email, work_date
      )
      SELECT 
        profile_id,
        first_name,
        last_name,
        email,
        work_date,
        clock_in,
        clock_out,
        CASE 
          WHEN clock_in IS NOT NULL AND clock_out IS NOT NULL 
          THEN ROUND(EXTRACT(EPOCH FROM (clock_out - clock_in)) / 3600, 2)
          ELSE NULL 
        END as total_hours,
        is_within_geofence,
        approved_at,
        approved_by,
        location_name
      FROM paired_events
      ORDER BY last_name, first_name, work_date
    `;

    return NextResponse.json({ entries: data });
  } catch (error) {
    console.error('Error fetching timesheet entries:', error);
    return NextResponse.json({ error: 'Failed to fetch timesheets' }, { status: 500 });
  }
}
