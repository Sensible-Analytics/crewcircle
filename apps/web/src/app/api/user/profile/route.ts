import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/neon/client';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    const queryUserId = targetUserId || userId;

    if (!queryUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profiles = await sql`
      SELECT tenant_id, role 
      FROM profiles 
      WHERE id = ${queryUserId}
    `;

    if (profiles.length === 0) {
      return NextResponse.json({ 
        tenantId: null, 
        role: null 
      });
    }

    return NextResponse.json({
      tenantId: profiles[0].tenant_id,
      role: profiles[0].role,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
