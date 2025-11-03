# Tale Weave - Deployment Package

This folder contains the files needed to deploy Tale Weave to Hostinger.

## Files Included

- `.next/` - Built Next.js application (REQUIRED)
- `public/` - Static assets (images, logos, etc.)
- `package.json` - Dependencies and scripts
- `next.config.js` - Next.js configuration
- `server.js` - Custom server (if needed by Hostinger)
- `.env.example` - Environment variables template

## Quick Deployment

### Option 1: Using Hostinger Node.js App Manager

1. Upload all files from this folder to your Hostinger Node.js app directory
2. Set environment variables in Hostinger dashboard
3. Set Build Command: `npm run build` (or skip if already built)
4. Set Start Command: `npm start` or `node server.js`
5. Deploy

### Option 2: Manual Deployment via SSH/FTP

1. **Upload files via FTP:**
   - Host: `46.202.183.226`
   - Port: `21`
   - Username: `u204461404.lightslategray-caribou-743803.hostingersite.com`
   - Password: `L0g!nSt@geX4`
   - Upload to: `public_html/`

2. **SSH into server:**
   ```bash
   ssh u204461404@46.202.183.226
   cd public_html
   ```

3. **Install dependencies:**
   ```bash
   npm install --production
   ```

4. **Create .env.local file:**
   ```bash
   nano .env.local
   ```
   Copy content from `.env.example` and fill in your API keys

5. **Start with PM2:**
   ```bash
   npm install -g pm2
   pm2 start npm --name "taleweave" -- start
   pm2 save
   pm2 startup
   ```

6. **Or start with Node.js directly:**
   ```bash
   npm start
   # OR
   node server.js
   ```

## Environment Variables Required

See `.env.example` for all required variables. Key ones:

- `ELEVENLABS_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `REPLICATE_API_TOKEN`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`

## After Deployment

1. Visit: https://lightslategray-caribou-743803.hostingersite.com
2. Test signup/login
3. Test story creation
4. Verify Stripe payments
5. Update Stripe webhook URL if needed

