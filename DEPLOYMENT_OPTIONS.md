# Production Deployment Options

Since Hostinger basic plan doesn't support Node.js/VPS, here are the best alternatives:

## 🚀 Recommended: Vercel (Easiest & Free)

**Best choice for Next.js apps!**

### Why Vercel?
- ✅ Free tier (generous)
- ✅ Built by the Next.js team - perfect integration
- ✅ Automatic deployments from GitHub
- ✅ Zero configuration needed
- ✅ Automatic HTTPS/SSL
- ✅ Serverless functions (your API routes work perfectly)
- ✅ Environment variables management

### Setup Steps:

1. **Push your code to GitHub** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/thmsbnsn/taleweave.git
   git push -u origin main
   ```

2. **Sign up for Vercel**:
   - Go to: https://vercel.com
   - Sign up with GitHub (recommended)

3. **Import your project**:
   - Click "Add New Project"
   - Import from GitHub repository `taleweave`
   - Vercel will auto-detect Next.js

4. **Add Environment Variables** in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add all your API keys:
     - `ELEVENLABS_API_KEY`
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `OPENAI_API_KEY`
     - `REPLICATE_API_TOKEN`
     - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
     - `STRIPE_SECRET_KEY`
     - `STRIPE_WEBHOOK_SECRET`
     - `NEXT_PUBLIC_APP_URL` (Vercel will provide this - use `https://your-app.vercel.app`)

5. **Deploy!**
   - Click "Deploy"
   - Done! Your app will be live in ~2 minutes

6. **Update Stripe Webhook**:
   - In Stripe dashboard, update webhook URL to: `https://your-app.vercel.app/api/webhooks/stripe`

---

## 🟢 Option 2: Netlify

### Why Netlify?
- ✅ Free tier
- ✅ Great Next.js support
- ✅ Automatic deployments
- ✅ Serverless functions

### Setup:
1. Sign up at https://netlify.com
2. Connect GitHub repository
3. Build command: `npm run build`
4. Publish directory: `.next` (but Netlify handles Next.js automatically)
5. Add environment variables
6. Deploy!

---

## 🟡 Option 3: Railway

### Why Railway?
- ✅ $5/month free credits (often enough for small apps)
- ✅ Easy deployment
- ✅ Full Node.js environment
- ✅ Automatic deployments

### Setup:
1. Sign up at https://railway.app
2. New Project → Deploy from GitHub
3. Select your repository
4. Railway auto-detects Node.js
5. Add environment variables
6. Deploy!

---

## 🟡 Option 4: Render

### Why Render?
- ✅ Free tier (with limitations)
- ✅ Good Next.js support
- ✅ Auto-deploy from GitHub

### Setup:
1. Sign up at https://render.com
2. New → Web Service
3. Connect GitHub repository
4. Build command: `npm run build`
5. Start command: `npm start`
6. Add environment variables
7. Deploy!

---

## 🎯 Recommendation: Use Vercel

For a Next.js app, **Vercel is the best choice**:
- Zero configuration
- Free tier is generous
- Perfect Next.js integration
- Automatic HTTPS
- Global CDN
- Easy environment variable management

---

## Quick Vercel Setup Commands

Once your code is on GitHub:

```bash
# Install Vercel CLI (optional, but helpful)
npm i -g vercel

# Deploy (if using CLI)
vercel

# Or just use the web interface - it's easier!
```

---

## After Deployment

1. **Update your domain** (if you have one):
   - Point your domain to Vercel's servers
   - Or use Vercel's provided domain (e.g., `taleweave.vercel.app`)

2. **Update environment variables**:
   - Update `NEXT_PUBLIC_APP_URL` to your Vercel URL
   - Update Stripe webhook URL

3. **Test everything**:
   - Sign up/login
   - Create stories
   - Test payments
   - Verify webhooks

---

## Notes

- Your Hostinger domain can still point to Vercel (via DNS)
- All your API routes work perfectly on Vercel
- Supabase and Stripe integrations work seamlessly
- File uploads to Supabase work great

Want help setting up Vercel? Let me know!

