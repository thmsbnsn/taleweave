# 🚀 Quick Deployment Guide - Hostinger

## Step-by-Step Deployment

### ✅ Step 1: Files Are Ready
The `deploy/` folder contains everything you need. It's already prepared!

### 📤 Step 2: Upload to Hostinger via FTP

**FTP Client (FileZilla recommended):**
- **Host:** `46.202.183.226`
- **Port:** `21`
- **Protocol:** FTP
- **Username:** `u204461404.lightslategray-caribou-743803.hostingersite.com`
- **Password:** `L0g!nSt@geX4`
- **Remote Directory:** `public_html/`

**Upload these folders/files:**
- `.next/` folder (entire folder)
- `public/` folder (entire folder)
- `package.json`
- `next.config.js`
- `tsconfig.json`
- `tailwind.config.ts`
- `postcss.config.js`
- `server.js` (if exists)

### 🔐 Step 3: Set Environment Variables

**Option A: Via Hostinger Dashboard (Recommended)**
1. Go to Hostinger control panel
2. Find Node.js App settings
3. Add all environment variables from your local `.env.local`

**Option B: Via SSH**
1. SSH into server: `ssh u204461404@46.202.183.226`
2. Navigate: `cd public_html`
3. Create file: `nano .env.local`
4. Paste your environment variables (see ENV_SETUP.md)

**Required Environment Variables:**
```env
ELEVENLABS_API_KEY=sk_f4f51433a4d38a94b320a0d8e977ab54b0bb4ebbc88514a0
NEXT_PUBLIC_SUPABASE_URL=https://bkwivsskmyexflakxyzf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrd2l2c3NrbXlleGZsYWt4eXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNjYxNDEsImV4cCI6MjA3NzY0MjE0MX0.bq_tfCZigxvQgrMoMyvvJOhstKDlXVmKhUAtGblQxFQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrd2l2c3NrbXlleGZsYWt4eXpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjA2NjE0MSwiZXhwIjoyMDc3NjQyMTQxfQ.lc-v6AG98HdSRduOlbxDkkl9f-C7HxyLOu_0hnS4OzI
OPENAI_API_KEY=your_openai_api_key
REPLICATE_API_TOKEN=your_replicate_api_token
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret_from_stripe_dashboard
NEXT_PUBLIC_APP_URL=https://lightslategray-caribou-743803.hostingersite.com
```

### 📦 Step 4: Install Dependencies & Start Server

**SSH into Hostinger:**
```bash
ssh u204461404@46.202.183.226
cd public_html
```

**Install dependencies:**
```bash
npm install --production
```

**Start with PM2 (Recommended - keeps app running):**
```bash
npm install -g pm2
pm2 start npm --name "taleweave" -- start
pm2 save
pm2 startup
```

**OR start directly (for testing):**
```bash
npm start
# OR
node server.js
```

### 🔧 Step 5: Configure Hostinger Node.js App

If using Hostinger's Node.js App Manager:
1. Set **Start File:** `server.js` or leave blank (uses npm start)
2. Set **Port:** `3000` (or your configured port)
3. Set **Build Command:** `npm run build` (optional, already built)
4. Deploy

### ✅ Step 6: Verify Deployment

1. Visit: `https://lightslategray-caribou-743803.hostingersite.com`
2. Test the homepage loads
3. Test signup/login
4. Test story creation (if you have admin access)
5. Check Stripe webhook URL is updated

### 🔄 Step 7: Update Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Update webhook URL to:
   ```
   https://lightslategray-caribou-743803.hostingersite.com/api/webhooks/stripe
   ```
3. Verify it's listening for:
   - `checkout.session.completed`
   - `customer.subscription.deleted`

## Troubleshooting

### Check if server is running:
```bash
pm2 status
pm2 logs taleweave
```

### Restart server:
```bash
pm2 restart taleweave
```

### View logs:
```bash
pm2 logs taleweave --lines 50
```

### Port issues:
- Make sure port 3000 is open in Hostinger firewall
- Check Hostinger Node.js settings for correct port

## Need Help?

See `DEPLOYMENT.md` for detailed instructions.

