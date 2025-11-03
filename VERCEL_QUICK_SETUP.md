# Quick Vercel Deployment Guide

## Step 1: Push Code to GitHub

If your code isn't on GitHub yet:

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# Add GitHub remote (replace with your actual repo URL)
git remote add origin https://github.com/thmsbnsn/taleweave.git

# Push
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Using Web Interface (Easiest!)

1. **Go to Vercel**: https://vercel.com
2. **Sign up** with your GitHub account
3. **Click "Add New Project"**
4. **Import your GitHub repository** (`taleweave`)
5. **Vercel auto-detects Next.js** - no configuration needed!
6. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add each one:
     ```
     ELEVENLABS_API_KEY=sk_f4f51433a4d38a94b320a0d8e977ab54b0bb4ebbc88514a0
     NEXT_PUBLIC_SUPABASE_URL=https://bkwivsskmyexflakxyzf.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrd2l2c3NrbXlleGZsYWt4eXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNjYxNDEsImV4cCI6MjA3NzY0MjE0MX0.bq_tfCZigxvQgrMoMyvvJOhstKDlXVmKhUAtGblQxFQ
     SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrd2l2c3NrbXlleGZsYWt4eXpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjA2NjE0MSwiZXhwIjoyMDc3NjQyMTQxfQ.lc-v6AG98HdSRduOlbxDkkl9f-C7HxyLOu_0hnS4OzI
     OPENAI_API_KEY=your_openai_api_key
     REPLICATE_API_TOKEN=your_replicate_api_token
     NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
     STRIPE_SECRET_KEY=your_stripe_secret_key
     STRIPE_WEBHOOK_SECRET=your_webhook_secret_from_stripe
     ```
7. **Update `NEXT_PUBLIC_APP_URL`** after first deploy:
   - After deployment, Vercel gives you a URL like `taleweave.vercel.app`
   - Add environment variable: `NEXT_PUBLIC_APP_URL=https://taleweave.vercel.app`
   - Redeploy (it happens automatically on next push)

8. **Click "Deploy"**
   - Done! Your app will be live in ~2 minutes

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts
# - Link to existing project or create new
# - Add environment variables
# - Deploy!
```

## Step 3: Update Stripe Webhook

After deployment:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Find your webhook
3. Update URL to: `https://your-app.vercel.app/api/webhooks/stripe`
4. Save

## Step 4: Custom Domain (Optional)

If you want to use your Hostinger domain:

1. In Vercel dashboard → Settings → Domains
2. Add your domain: `lightslategray-caribou-743803.hostingersite.com`
3. Vercel gives you DNS records
4. Update DNS in Hostinger to point to Vercel
5. Wait for DNS propagation (~5-30 minutes)

## Troubleshooting

### Build fails?
- Check environment variables are all set
- Check Vercel build logs for errors
- Make sure Node.js version is 18+ (Vercel handles this automatically)

### API routes not working?
- All your API routes work automatically on Vercel
- They become serverless functions
- No additional configuration needed!

### Webhooks not working?
- Make sure `STRIPE_WEBHOOK_SECRET` is set
- Make sure webhook URL in Stripe points to Vercel URL
- Check Vercel function logs for errors

## Benefits of Vercel

✅ **Free Tier Includes:**
- 100GB bandwidth/month
- Unlimited requests
- Automatic HTTPS
- Global CDN
- Serverless functions
- Automatic deployments

✅ **Perfect for Next.js:**
- Zero configuration
- Optimized builds
- Edge functions support
- Image optimization built-in

## Next Steps

After deployment:
1. Test signup/login
2. Test story creation
3. Test Stripe payments
4. Verify webhooks are working

Your app is now live! 🎉

