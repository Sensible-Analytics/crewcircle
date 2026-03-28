import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sql } from '@/lib/neon/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia' as any,
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.mode === 'subscription' && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const tenantId = session.metadata?.tenantId;
        
        if (tenantId) {
          await sql`
            UPDATE tenants
            SET 
              stripe_customer_id = ${session.customer as string},
              stripe_subscription_id = ${session.subscription as string},
              plan = 'starter'
            WHERE id = ${tenantId}
          `;
        }
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string };
      
      const subscriptionId = invoice.subscription;
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const tenantId = subscription.metadata?.tenantId;
        
        if (tenantId) {
          await sql`
            UPDATE tenants
            SET plan = 'starter'
            WHERE stripe_subscription_id = ${subscriptionId}
          `;
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      console.log(`Payment failed for invoice ${event.data.object}`);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const tenantId = subscription.metadata?.tenantId;
      
      if (tenantId && subscription.status === 'active') {
        await sql`
          UPDATE tenants
          SET plan = 'starter'
          WHERE stripe_subscription_id = ${subscription.id}
        `;
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      
      await sql`
        UPDATE tenants
        SET 
          plan = 'free',
          stripe_subscription_id = NULL
        WHERE stripe_subscription_id = ${subscription.id}
      `;
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
