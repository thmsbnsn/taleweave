import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 })
  }

  const supabase = await createClient()

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id
      const type = session.metadata?.type

      if (userId) {
        if (type === 'single_story') {
          // Grant one story credit
          await supabase
            .from('user_credits')
            .insert({
              user_id: userId,
              credits: 1,
              type: 'single_story',
            })
        } else if (type === 'subscription') {
          // Update user subscription status
          await supabase
            .from('users')
            .update({
              subscription_active: true,
              stripe_customer_id: session.customer as string,
            })
            .eq('id', userId)
        }
      }
      break

    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription
      await supabase
        .from('users')
        .update({ subscription_active: false })
        .eq('stripe_customer_id', subscription.customer as string)
      break

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

