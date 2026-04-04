import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }

    const profiles = await sql`
      SELECT * FROM profiles 
      WHERE tenant_id = ${tenantId} 
      AND deleted_at IS NULL
    `;

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('Failed to fetch profiles:', error);
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
  }
}
