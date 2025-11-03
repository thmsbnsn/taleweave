# Tale Weave - Hostinger Deployment Guide

## Quick Deployment Steps

### 1. Build the Application (Already Done)
```bash
npm run build
```

### 2. Upload Files to Hostinger

**Via FTP (using FileZilla or similar):**
- Host: `46.202.183.226`
- Port: `21`
- Username: `u204461404.lightslategray-caribou-743803.hostingersite.com`
- Password: `L0g!nSt@geX4`
- Upload to: `public_html/`

**Files to upload:**
- `.next/` folder (build output)
- `public/` folder (static assets)
- `package.json`
- `package-lock.json` (if exists)
- `next.config.js`
- `tsconfig.json`
- `tailwind.config.ts`
- `postcss.config.js`
- `.env.local` (or set environment variables in Hostinger dashboard)

**DO NOT upload:**
- `node_modules/` (install on server)
- `.git/`
- Development files

### 3. SSH into Hostinger Server

Connect via SSH to your Hostinger server:
```bash
ssh u204461404@46.202.183.226
```

Navigate to your website directory:
```bash
cd ~/domains/lightslategray-caribou-743803.hostingersite.com/public_html
# OR
cd public_html
```

### 4. Install Dependencies on Server

```bash
npm install --production
```

### 5. Set Environment Variables on Server

Create `.env.local` file on the server with:

```env
# ElevenLabs API Key
ELEVENLABS_API_KEY=sk_f4f51433a4d38a94b320a0d8e977ab54b0bb4ebbc88514a0

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://bkwivsskmyexflakxyzf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrd2l2c3NrbXlleGZsYWt4eXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNjYxNDEsImV4cCI6MjA3NzY0MjE0MX0.bq_tfCZigxvQgrMoMyvvJOhstKDlXVmKhUAtGblQxFQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrd2l2c3NrbXlleGZsYWt4eXpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjA2NjE0MSwiZXhwIjoyMDc3NjQyMTQxfQ.lc-v6AG98HdSRduOlbxDkkl9f-C7HxyLOu_0hnS4OzI

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Replicate
REPLICATE_API_TOKEN=your_replicate_api_token

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# App URL
NEXT_PUBLIC_APP_URL=https://lightslategray-caribou-743803.hostingersite.com
```

### 6. Install PM2 (Process Manager)

```bash
npm install -g pm2
```

### 7. Start the Application

```bash
# Start Next.js server
pm2 start npm --name "taleweave" -- start

# Save PM2 configuration
pm2 save

# Set PM2 to start on server reboot
pm2 startup
```

### 8. Configure Hostinger to Route Traffic

If using Hostinger's Node.js hosting:
- In Hostinger dashboard, go to Node.js settings
- Set Start File: `server.js` or use the PM2 process
- Set Port: Usually 3000 or as configured
- Point your domain to the Node.js application

### 9. Update Stripe Webhook URL

In Stripe Dashboard:
1. Go to Developers > Webhooks
2. Update your webhook URL to:
   ```
   https://lightslategray-caribou-743803.hostingersite.com/api/webhooks/stripe
   ```
3. Ensure it's listening for:
   - `checkout.session.completed`
   - `customer.subscription.deleted`

## Alternative: Using Hostinger's Node.js App Manager

If Hostinger provides a Node.js App Manager in their dashboard:

1. Create a new Node.js application
2. Set:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Port:** `3000` (or as configured)
3. Upload your code via Git or file manager
4. Set all environment variables in the dashboard
5. Deploy

## Troubleshooting

### Check if server is running:
```bash
pm2 status
pm2 logs taleweave
```

### Restart the server:
```bash
pm2 restart taleweave
```

### View server logs:
```bash
pm2 logs taleweave --lines 50
```

### Check port availability:
```bash
netstat -tulpn | grep :3000
```

## Important Notes

- Make sure Node.js version on server is compatible (Node.js 18+ recommended)
- Ensure port 3000 (or your chosen port) is open
- Keep `.env.local` secure - never commit it to Git
- The `.next` folder contains your built application - this is critical
- Static assets in `public/` folder will be served automatically

## After Deployment

1. Visit: `https://lightslategray-caribou-743803.hostingersite.com`
2. Test signup/login functionality
3. Test story creation
4. Verify Stripe payments work
5. Check that webhooks are receiving events

