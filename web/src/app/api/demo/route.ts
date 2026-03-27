import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = SupabaseClient();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const orgId = searchParams.get('orgId');

    if (action === 'setup-demo-org' && orgId) {
      // Create demo organization in database
      const { data, error } = await supabase
        .from('organizations')
        .insert({
          id: orgId,
          name: 'The Daily Grind Cafe',
          abn: '51824753556',
          address: {
            line1: '123 Demo Street',
            line2: 'Surry Hills',
            city: 'Sydney',
            state: 'NSW',
            postalCode: '2000',
            country: 'Australia'
          },
          contact: {
            phone: '+61 2 1234 5678',
            email: 'info@dailygrindcafe.com.au',
            website: 'https://dailygrindcafe.com.au'
          }
        })
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        organization: data[0] 
      });
    }

    if (action === 'get-demo-users' && orgId) {
      // Get demo users for organization
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, avatar, joinedAt')
        .eq('organization_id', orgId)
        .limit(4);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        users: data 
      });
    }

    if (action === 'get-demo-credentials' && orgId) {
      // Get demo credentials for organization
      const { data, error } = await supabase
        .from('organization_credentials')
        .select('id, type, value, issued_by, issued_at, expires_at')
        .eq('organization_id', orgId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        credentials: data 
      });
    }

    // Default response
    return NextResponse.json({ 
      message: 'Demo API endpoint', 
      availableActions: [
        'setup-demo-org',
        'get-demo-users', 
        'get-demo-credentials'
      ] 
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = SupabaseClient();
    const body = await request.json();
    
    const { action, organizationId } = body;

    if (action === 'complete-demo-setup') {
      // Mark demo setup as complete
      // In a real implementation, this would update some status or create related records
      return NextResponse.json({ 
        success: true, 
        message: 'Demo setup completed successfully' 
      });
    }

    return NextResponse.json({ 
      error: 'Invalid action', 
      received: action 
    }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
