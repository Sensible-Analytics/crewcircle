import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/neon/client';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    const profile = await sql`
      SELECT tenant_id, role 
      FROM profiles 
      WHERE id = ${userId}
    `;

    if (profile.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!['owner', 'manager'].includes(profile[0].role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const tenantId = profile[0].tenant_id;

    const tenant = await sql`
      SELECT plan FROM tenants WHERE id = ${tenantId}
    `;

    if (tenant.length > 0 && tenant[0].plan !== 'starter') {
      const employeeCount = await sql`
        SELECT COUNT(*) as count FROM profiles 
        WHERE tenant_id = ${tenantId} AND deleted_at IS NULL
      `;

      if (employeeCount[0]?.count >= 5) {
        return NextResponse.json(
          { error: 'Free tier limit reached (5 employees). Please upgrade to add more.' },
          { status: 403 }
        );
      }
    }

    const clerk = await clerkClient();
    await clerk.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite`,
      publicMetadata: {
        role: role,
        tenant_id: tenantId,
        invited_by: userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
