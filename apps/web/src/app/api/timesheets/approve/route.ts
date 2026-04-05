import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/neon/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, workDate, tenantId } = body;

    if (!profileId || !workDate || !tenantId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let userId = 'demo-user';
    const isDemoMode = tenantId?.startsWith('demo-');
    if (!isDemoMode) {
      const { userId: clerkUserId } = await auth();
      if (!clerkUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = clerkUserId;
    }

    await sql`
      UPDATE clock_events
      SET approved_at = ${new Date().toISOString()},
          approved_by = ${userId}
      WHERE profile_id = ${profileId}
        AND DATE(recorded_at AT TIME ZONE 'Australia/Melbourne') = ${workDate}
        AND type = 'clock_in'
        AND approved_at IS NULL
        AND deleted_at IS NULL
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Approve error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
