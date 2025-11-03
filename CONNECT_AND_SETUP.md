# Quick Setup Guide - Connect & Deploy

## Step 1: Connect via SSH

Open **PowerShell** on your Windows computer and run:

```bash
ssh -p 65002 u204461404@46.202.183.226
```

**When prompted for password, enter:**
```
L0g!nSt@geX4
```

You should see a prompt like:
```
u204461404@hostname:~$
```

## Step 2: Navigate to Your Files

Once connected, run:

```bash
cd public_html
```

Verify you're in the right place:
```bash
ls -la
```

You should see `package.json`, `.next`, `public`, etc.

## Step 3: Run Setup Commands

Copy and paste **ALL** of these commands at once (they'll run one by one):

```bash
npm install --production && cat > .env.local << 'ENVEOF'
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
ENVEOF
npm install -g pm2
pm2 stop taleweave 2>/dev/null || true
pm2 delete taleweave 2>/dev/null || true
pm2 start npm --name "taleweave" -- start
pm2 save
pm2 status
```

**This will:**
- Install all dependencies
- Create `.env.local` with your API keys
- Install PM2 (keeps your app running)
- Start your Tale Weave application
- Show you the status

## Step 4: Check Logs

To see if everything is working:

```bash
pm2 logs taleweave
```

Press `Ctrl+C` to exit the logs view.

## Step 5: Visit Your Site

Open your browser and go to:
```
https://lightslategray-caribou-743803.hostingersite.com
```

Your Tale Weave app should be live! 🎉

## Troubleshooting

### If npm install fails:
```bash
# Check Node.js version
node --version
# Should be 18 or higher
```

### If PM2 doesn't work:
```bash
# Try with sudo (if needed)
sudo npm install -g pm2
```

### To restart your app:
```bash
pm2 restart taleweave
```

### To view logs again:
```bash
pm2 logs taleweave --lines 50
```

### To check what's running:
```bash
pm2 status
```

## Important Next Steps

1. **Update Stripe Webhook:**
   - Go to Stripe Dashboard → Webhooks
   - Update URL to: `https://lightslategray-caribou-743803.hostingersite.com/api/webhooks/stripe`
   - Copy the webhook secret and update `STRIPE_WEBHOOK_SECRET` in `.env.local`

2. **Test your site:**
   - Visit the homepage
   - Try signing up
   - Test creating a story (if you have admin access)

