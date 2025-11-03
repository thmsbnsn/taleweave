# Fix: npm command not found on Hostinger

Your files are uploaded, but Node.js/npm needs to be set up on the server.

## Option 1: Check if Node.js is Installed (Try This First)

Run these commands in SSH to find Node.js:

```bash
which node
which npm
node --version
```

If you see version numbers, Node.js is installed but not in PATH.

## Option 2: Check Common Node.js Locations

```bash
# Check if Node.js is installed in common locations
/usr/local/bin/node --version
/opt/nodejs/bin/node --version
~/.nvm/versions/*/bin/node --version
/usr/bin/node --version
```

## Option 3: Use Hostinger Node.js App Manager (Recommended)

Hostinger often has a Node.js App Manager in their dashboard:

1. **Go to Hostinger Dashboard**
2. **Look for "Node.js" or "Node.js App Manager"** in the menu
3. **Create a new Node.js application:**
   - **App Name:** `taleweave`
   - **Start File:** `server.js` (or leave blank to use `npm start`)
   - **Root Directory:** `public_html` (or select the folder)
   - **Port:** `3000` (or as configured)
   - **Node.js Version:** Select latest (18.x or 20.x)
4. **Add Environment Variables** in the dashboard (all your API keys)
5. **Start the application**

This is the easiest method!

## Option 4: Install Node.js via NVM (If You Have Access)

If you have sudo access or can install software:

```bash
# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc

# Install Node.js 20
nvm install 20
nvm use 20

# Verify
node --version
npm --version
```

## Option 5: Add Node.js to PATH (If Already Installed)

If Node.js is installed but not accessible:

```bash
# Find where Node.js is installed
find /usr -name "node" 2>/dev/null
find /opt -name "node" 2>/dev/null
find ~ -name "node" 2>/dev/null

# Once found, add to PATH (replace /path/to/node with actual path)
export PATH=$PATH:/path/to/node/bin
echo 'export PATH=$PATH:/path/to/node/bin' >> ~/.bashrc
source ~/.bashrc
```

## Option 6: Check Hostinger Node.js Setup

Some Hostinger plans include Node.js but need activation:

1. **Go to Hostinger Dashboard**
2. **Advanced → Node.js** (if available)
3. **Enable Node.js** or create a Node.js app
4. **Point it to your `public_html` folder**

## Quick Test Commands

After setting up Node.js, verify it works:

```bash
cd public_html
node --version
npm --version
npm install --production
```

## After Node.js is Working

Once `npm` works, continue with the setup:

```bash
npm install --production

# Create .env.local
cat > .env.local << 'ENVEOF'
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
pm2 start npm --name "taleweave" -- start
pm2 save
pm2 status
```

## Most Likely Solution

**Try Option 3 first** - Hostinger's Node.js App Manager. This is usually the easiest way to get Node.js running on Hostinger.

Look in your Hostinger dashboard for:
- **Advanced → Node.js**
- **Apps → Node.js**
- **Website Settings → Node.js**

