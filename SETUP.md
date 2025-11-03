# Tale Weave - Quick Setup Guide

## Initial Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Copy Branding Files
Copy logo files to the public directory:
```bash
# Windows PowerShell
Copy-Item -Path "Branding\tw-logo.ico" -Destination "public\tw-logo.ico"
Copy-Item -Path "Branding\twlogo-full.svg" -Destination "public\twlogo-full.svg"

# macOS/Linux
cp Branding/tw-logo.ico public/
cp Branding/twlogo-full.svg public/
```

### 3. Set Up Supabase

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL script from `database/schema.sql`
4. Go to Settings > API to get your keys:
   - Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Create Storage Buckets

In Supabase:
1. Go to Storage
2. Create bucket: `story-images` (make it public)
3. Create bucket: `story-audio` (make it public)

### 5. Set Up API Keys

#### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Create new API key
3. Add to `.env.local` as `OPENAI_API_KEY`

#### Replicate
1. Go to https://replicate.com/account/api-tokens
2. Create new API token
3. Add to `.env.local` as `REPLICATE_API_TOKEN`

#### ElevenLabs
1. Go to https://elevenlabs.io/app/settings/api-keys
2. Create new API key
3. Add to `.env.local` as `ELEVENLABS_API_KEY`

#### Stripe
1. Go to https://dashboard.stripe.com/apikeys
2. Copy Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Copy Secret key → `STRIPE_SECRET_KEY`
4. Set up webhook:
   - Webhook URL: `https://lightslategray-caribou-743803.hostingersite.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`
   - Copy webhook signing secret → `STRIPE_WEBHOOK_SECRET`

### 6. Create `.env.local` File

Create `.env.local` in the root directory with all the keys from above:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

OPENAI_API_KEY=your_openai_key
REPLICATE_API_TOKEN=your_replicate_token
ELEVENLABS_API_KEY=your_elevenlabs_key

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

NEXT_PUBLIC_APP_URL=https://lightslategray-caribou-743803.hostingersite.com
```

### 7. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Production Deployment

### Build
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Hostinger Deployment

1. Upload files via FTP to `public_html`
2. SSH into server
3. Run `npm install --production`
4. Run `npm run build`
5. Set up PM2 or similar process manager:
   ```bash
   npm install -g pm2
   pm2 start npm --name "taleweave" -- start
   pm2 save
   pm2 startup
   ```

Make sure all environment variables are set on the server!

