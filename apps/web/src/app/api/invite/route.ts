import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/packages/supabase/src/client.server';

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const adminSupabase = createSupabaseAdminClient();
    const { email, role } = await request.json();

    // Validate input
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user's profile to verify they are owner/manager and get tenant_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found or insufficient permissions' },
        { status: 403 }
      );
    }

    // Only owners and managers can invite
    if (!['owner', 'manager'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // CHECK FREE TIER LIMIT
    // Get tenant data to check plan
    const { data: tenant } = await supabase
      .from('tenants')
      .select('plan')
      .eq('id', profile.tenant_id)
      .single();

    if (tenant?.plan !== 'starter') {
      // Count active employees
      const { count } = await adminSupabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', profile.tenant_id)
        .is('deleted_at', null);

      if (count && count >= 5) {
        return NextResponse.json(
          { error: 'Free tier limit reached (5 employees). Please upgrade to add more.' },
          { status: 403 }
        );
      }
    }

    // Invite the user via Supabase Auth
    const { data, error } = await adminSupabase.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          role: role,
          tenant_id: profile.tenant_id,
          invited_by: user.id,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite`,
      }
    );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Invite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
