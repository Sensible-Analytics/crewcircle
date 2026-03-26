import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseServerClient } from '@/packages/supabase/src/client.server';

export async function POST(req: Request) {
  try {
    // Initialize Stripe inside the handler to avoid build-time errors
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-02-25.clover',
    });

    const { tenantId, email } = await req.json();
    
    // Initialize Supabase client
    const supabase = await createSupabaseServerClient();
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'au_becs_debit'],
      customer_email: email,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // $4 AUD price
          quantity: 1, // Will be updated by usage logic later, or start with current count
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/settings/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/settings/billing?canceled=true`,
      metadata: {
        tenantId: tenantId,
      },
      subscription_data: {
        metadata: {
          tenantId: tenantId,
        },
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
