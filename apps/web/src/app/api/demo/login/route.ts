import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

const DEMO_EMAILS = [
  'demo-owner@crewcircle.co',
  'demo-manager@crewcircle.co',
  'demo-employee1@crewcircle.co',
  'demo-employee2@crewcircle.co',
];

export async function POST(request: NextRequest) {
  try {
    const { email, role, tenantId } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    if (DEMO_EMAILS.includes(email)) {
      const token = `demo_${randomBytes(32).toString('hex')}`;

      return NextResponse.json({
        success: true,
        token,
        userId: `demo_${email.split('@')[0]}`,
        role,
        tenantId,
      });
    }

    const { clerkClient } = await import('@clerk/nextjs/server');
    const clerk = await clerkClient();

    const users = await clerk.users.getUserList({
      emailAddress: [email],
    });

    if (users.data.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = users.data[0].id;

    const signInToken = await clerk.signInTokens.createSignInToken({
      userId,
      expiresInSeconds: 3600,
    });

    return NextResponse.json({
      success: true,
      token: signInToken.token,
      userId,
      role,
      tenantId,
    });
  } catch (error) {
    console.error('Demo login error:', error);
    return NextResponse.json({
      error: 'Failed to create sign-in token. ' + (error instanceof Error ? error.message : 'Unknown error'),
    }, { status: 500 });
  }
}
