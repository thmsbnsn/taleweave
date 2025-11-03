# Stripe Setup Instructions

## ✅ Your Stripe Keys (LIVE - Production Mode)

**⚠️ IMPORTANT: These are LIVE keys - they will charge real credit cards!**

Your Stripe keys have been configured:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

STRIPE_SECRET_KEY=your_stripe_secret_key
```

## 🔔 Set Up Stripe Webhook

To handle payment events (like when a payment succeeds), you need to set up a webhook:

### Step 1: Create Webhook Endpoint

1. Go to https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. Set the endpoint URL to:
   ```
   https://lightslategray-caribou-743803.hostingersite.com/api/webhooks/stripe
   ```
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
5. Click **"Add endpoint"**

### Step 2: Get Webhook Signing Secret

1. After creating the webhook, click on it
2. Click **"Reveal"** next to "Signing secret"
3. Copy the secret (starts with `whsec_`)
4. Add it to your `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## 🧪 Testing with Test Mode

If you want to test without charging real cards:

1. Go to https://dashboard.stripe.com/test/apikeys
2. Get your TEST keys (start with `pk_test_` and `sk_test_`)
3. Replace the LIVE keys in `.env.local` with TEST keys
4. Use test card: `4242 4242 4242 4242` with any future expiry date

## 💰 Pricing Configuration

Your app is configured for:
- **Single Story**: $1.99 per story
- **Monthly Subscription**: $9.99/month (unlimited stories)

To change pricing, edit:
- `app/api/checkout/single/route.ts` - line 28: `unit_amount: 199` (in cents)
- `app/api/checkout/subscription/route.ts` - line 31: `unit_amount: 999` (in cents)

## 📝 Add to .env.local

Add these three lines to your `.env.local` file:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

**⚠️ Security Warning**: Never commit these keys to git! They're already in `.gitignore`, but always double-check.

