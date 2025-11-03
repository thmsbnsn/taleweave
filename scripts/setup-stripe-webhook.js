/**
 * Script to automatically set up Stripe webhook endpoint
 * Run with: node scripts/setup-stripe-webhook.js
 */

const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/stripe`
  : 'https://lightslategray-caribou-743803.hostingersite.com/api/webhooks/stripe';

async function setupWebhook() {
  try {
    console.log('🔍 Checking existing webhooks...');
    
    // List existing webhooks
    const webhooks = await stripe.webhookEndpoints.list({
      limit: 100,
    });

    // Check if webhook already exists
    const existingWebhook = webhooks.data.find(
      webhook => webhook.url === WEBHOOK_URL
    );

    if (existingWebhook) {
      console.log('✅ Webhook already exists!');
      console.log(`   Webhook ID: ${existingWebhook.id}`);
      console.log(`   URL: ${existingWebhook.url}`);
      console.log(`   Signing Secret: ${existingWebhook.secret || 'Click "Reveal" in Stripe dashboard'}`);
      
      // Get the signing secret
      if (existingWebhook.secret) {
        console.log(`\n📋 Add this to your .env.local:`);
        console.log(`STRIPE_WEBHOOK_SECRET=${existingWebhook.secret}`);
      } else {
        console.log(`\n⚠️  To get the signing secret:`);
        console.log(`   1. Go to: https://dashboard.stripe.com/webhooks`);
        console.log(`   2. Click on the webhook endpoint`);
        console.log(`   3. Click "Reveal" next to "Signing secret"`);
        console.log(`   4. Add it to .env.local as STRIPE_WEBHOOK_SECRET`);
      }
      
      return existingWebhook;
    }

    console.log('📝 Creating new webhook endpoint...');
    
    // Create new webhook
    const webhook = await stripe.webhookEndpoints.create({
      url: WEBHOOK_URL,
      enabled_events: [
        'checkout.session.completed',
        'customer.subscription.deleted',
      ],
      description: 'Tale Weave - Payment and Subscription Webhooks',
    });

    console.log('✅ Webhook created successfully!');
    console.log(`   Webhook ID: ${webhook.id}`);
    console.log(`   URL: ${webhook.url}`);
    console.log(`   Status: ${webhook.status}`);
    
    if (webhook.secret) {
      console.log(`\n📋 Add this to your .env.local file:`);
      console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);
    } else {
      console.log(`\n⚠️  To get the signing secret:`);
      console.log(`   1. Go to: https://dashboard.stripe.com/webhooks/${webhook.id}`);
      console.log(`   2. Click "Reveal" next to "Signing secret"`);
      console.log(`   3. Add it to .env.local as STRIPE_WEBHOOK_SECRET`);
    }

    return webhook;
  } catch (error) {
    console.error('❌ Error setting up webhook:', error.message);
    
    if (error.type === 'StripeAuthenticationError') {
      console.error('\n💡 Make sure STRIPE_SECRET_KEY is set in .env.local');
    } else if (error.type === 'StripeInvalidRequestError') {
      console.error('\n💡 The webhook URL might be invalid or unreachable');
      console.error(`   URL: ${WEBHOOK_URL}`);
    }
    
    process.exit(1);
  }
}

// Run the script
setupWebhook()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

