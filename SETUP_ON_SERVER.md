# Setting Up Tale Weave on Hostinger Server

Files are uploaded! Now let's set up the server.

## Step 1: SSH into Hostinger

Open PowerShell or Command Prompt and run:

```bash
ssh u204461404@46.202.183.226
```

**Or use your SSH credentials if different:**
- If you have SSH access enabled in Hostinger, use those credentials
- Some Hostinger accounts may need to enable SSH first in the dashboard

**Alternative:** Use Hostinger's Terminal/SSH tool in their dashboard if SSH isn't accessible from your computer.

## Step 2: Navigate to public_html

```bash
cd public_html
```

## Step 3: Install Dependencies

```bash
npm install --production
```

This installs only production dependencies (no dev dependencies).

## Step 4: Create .env.local File

Create the environment variables file:

```bash
nano .env.local
```

**Paste this content** (replace with your actual keys):

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
STRIPE_WEBHOOK_SECRET=your_webhook_secret_from_stripe_dashboard

# App URL
NEXT_PUBLIC_APP_URL=https://lightslategray-caribou-743803.hostingersite.com
```

**To save in nano:**
- Press `Ctrl + O` (write out)
- Press `Enter` (confirm filename)
- Press `Ctrl + X` (exit)

**Note:** Replace `STRIPE_WEBHOOK_SECRET` with your actual webhook secret from Stripe dashboard.

## Step 5: Install PM2 (Process Manager)

PM2 keeps your app running even if you disconnect:

```bash
npm install -g pm2
```

## Step 6: Start the Application

```bash
pm2 start npm --name "taleweave" -- start
```

**Or if using the custom server:**
```bash
pm2 start server.js --name "taleweave"
```

## Step 7: Save PM2 Configuration

This ensures the app restarts if the server reboots:

```bash
pm2 save
pm2 startup
```

Follow the instructions from `pm2 startup` to enable auto-start on boot.

## Step 8: Check Status

Verify the app is running:

```bash
pm2 status
pm2 logs taleweave
```

## Step 9: Configure Hostinger Node.js App (If Available)

If Hostinger has a Node.js App Manager in their dashboard:

1. Set **Start File:** `server.js` or leave blank
2. Set **Port:** `3000`
3. Set **Build Command:** (leave empty, already built)
4. Save and restart

## Step 10: Configure Web Server

**If your site is not accessible:**

Hostinger might need to be configured to route traffic to Node.js. Check:
- Is port 3000 open?
- Is the domain pointing to the Node.js app?
- Do you need to configure a reverse proxy?

**Alternative:** You may need to use Hostinger's Node.js App Manager to create a Node.js application that points to your `public_html` folder.

## Troubleshooting

### Check if server is running:
```bash
pm2 status
pm2 logs taleweave --lines 50
```

### Restart server:
```bash
pm2 restart taleweave
```

### Check Node.js version:
```bash
node --version
```
(Should be 18+ for Next.js 14)

### Check if port is in use:
```bash
netstat -tulpn | grep 3000
```

### View recent errors:
```bash
pm2 logs taleweave --err
```

## Test Your Site

1. Visit: https://lightslategray-caribou-743803.hostingersite.com
2. Check if the homepage loads
3. Test signup/login
4. Verify everything works!

## Update Stripe Webhook

Don't forget to update your Stripe webhook URL:
- Go to Stripe Dashboard → Webhooks
- Update URL to: `https://lightslategray-caribou-743803.hostingersite.com/api/webhooks/stripe`

