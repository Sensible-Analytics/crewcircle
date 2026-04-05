import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const weekStart = searchParams.get('weekStart');

    if (!tenantId || !weekStart) {
      return NextResponse.json({ error: 'tenantId and weekStart required' }, { status: 400 });
    }

    const rosters = await sql`
      SELECT * FROM rosters 
      WHERE tenant_id = ${tenantId} 
      AND week_start = ${weekStart}
      AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `;

    let roster = rosters.length > 0 ? rosters[0] : null;

    if (!roster) {
      const locations = await sql`
        SELECT id FROM locations 
        WHERE tenant_id = ${tenantId} 
        AND deleted_at IS NULL 
        LIMIT 1
      `;

      if (locations.length === 0) {
        return NextResponse.json({ error: 'No location found for tenant' }, { status: 404 });
      }

      const locationId = locations[0].id;
      const newRosters = await sql`
        INSERT INTO rosters (tenant_id, location_id, week_start, status)
        VALUES (${tenantId}, ${locationId}, ${weekStart}, 'draft')
        RETURNING *
      `;

      roster = newRosters.length > 0 ? newRosters[0] : null;
    }

    if (!roster) {
      return NextResponse.json({ error: 'Failed to create roster' }, { status: 500 });
    }

    const shifts = await sql`
      SELECT * FROM shifts 
      WHERE roster_id = ${roster.id} 
      AND deleted_at IS NULL
    `;

    return NextResponse.json({ roster, shifts });
  } catch (error) {
    console.error('Failed to fetch roster:', error);
    return NextResponse.json({ error: 'Failed to fetch roster' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, tenantId, weekStart, rosterId, shifts } = body;

    switch (action) {
      case 'publish': {
        await sql`
          UPDATE rosters 
          SET status = 'published', 
              published_at = ${new Date().toISOString()},
              published_by = 'system'
          WHERE id = ${rosterId}
        `;
        return NextResponse.json({ success: true });
      }

      case 'unpublish': {
        await sql`
          UPDATE rosters 
          SET status = 'draft', 
              published_at = NULL,
              published_by = NULL
          WHERE id = ${rosterId}
        `;
        return NextResponse.json({ success: true });
      }

      case 'copy-forward': {
        const currentWeekStart = new Date(weekStart);
        const newWeekStart = new Date(currentWeekStart);
        newWeekStart.setDate(currentWeekStart.getDate() + 7);
        const newWeekStartStr = newWeekStart.toISOString().split('T')[0];

        const existingRosters = await sql`
          SELECT * FROM rosters 
          WHERE tenant_id = ${tenantId} 
          AND week_start = ${newWeekStartStr}
          AND deleted_at IS NULL
        `;

        if (existingRosters.length > 0) {
          return NextResponse.json({ success: true, roster: existingRosters[0] });
        }

        const roster = await sql`SELECT * FROM rosters WHERE id = ${rosterId}`;
        if (roster.length === 0) {
          return NextResponse.json({ error: 'Roster not found' }, { status: 404 });
        }

        const newRosters = await sql`
          INSERT INTO rosters (tenant_id, location_id, week_start, status)
          VALUES (${tenantId}, ${roster[0].location_id}, ${newWeekStartStr}, 'draft')
          RETURNING *
        `;

        if (newRosters.length === 0) {
          return NextResponse.json({ error: 'Failed to create new roster' }, { status: 500 });
        }

        const newRoster = newRosters[0];
        const sourceShifts = await sql`
          SELECT * FROM shifts 
          WHERE roster_id = ${rosterId} 
          AND deleted_at IS NULL
        `;

        for (const shift of sourceShifts) {
          const startTime = new Date(shift.start_time);
          const endTime = new Date(shift.end_time);
          startTime.setDate(startTime.getDate() + 7);
          endTime.setDate(endTime.getDate() + 7);

          await sql`
            INSERT INTO shifts (tenant_id, roster_id, profile_id, start_time, end_time, role_label, notes)
            VALUES (
              ${shift.tenant_id},
              ${newRoster.id},
              ${shift.profile_id},
              ${startTime.toISOString()},
              ${endTime.toISOString()},
              ${shift.role_label},
              ${shift.notes}
            )
          `;
        }

        return NextResponse.json({ success: true, roster: newRoster });
      }

      case 'save-shifts': {
        if (!rosterId || !shifts) {
          return NextResponse.json({ error: 'rosterId and shifts required' }, { status: 400 });
        }

        await sql`DELETE FROM shifts WHERE roster_id = ${rosterId}`;

        for (const shift of shifts) {
          await sql`
            INSERT INTO shifts (tenant_id, roster_id, profile_id, start_time, end_time, role_label, notes)
            VALUES (
              ${tenantId},
              ${rosterId},
              ${shift.profile_id},
              ${shift.start_time},
              ${shift.end_time},
              ${shift.role_label || null},
              ${shift.notes || null}
            )
          `;
        }

        return NextResponse.json({ success: true });
      }

      case 'update-shift': {
        const { shiftId, profileId, startTime, endTime } = body;
        await sql`
          UPDATE shifts 
          SET 
            profile_id = ${profileId},
            start_time = ${startTime},
            end_time = ${endTime}
          WHERE id = ${shiftId}
        `;
        return NextResponse.json({ success: true });
      }

      case 'create-shift': {
        const { profileId, startTime, endTime, roleLabel, notes } = body;
        const newShifts = await sql`
          INSERT INTO shifts (tenant_id, roster_id, profile_id, start_time, end_time, role_label, notes)
          VALUES (
            ${tenantId},
            ${rosterId || null},
            ${profileId},
            ${startTime},
            ${endTime},
            ${roleLabel || null},
            ${notes || null}
          )
          RETURNING *
        `;

        if (newShifts.length === 0) {
          return NextResponse.json({ error: 'Failed to create shift' }, { status: 500 });
        }

        return NextResponse.json({ success: true, shift: newShifts[0] });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Roster API error:', error);
    return NextResponse.json({ error: 'Failed to process roster request' }, { status: 500 });
  }
}
