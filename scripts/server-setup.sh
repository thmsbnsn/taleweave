#!/bin/bash
# Tale Weave Server Setup Script
# Run this on your Hostinger server after uploading files

echo "🚀 Tale Weave Server Setup"
echo "=========================="
echo ""

# Navigate to public_html
cd ~/domains/*/public_html 2>/dev/null || cd ~/public_html 2>/dev/null || cd public_html

if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the correct directory?"
    echo "   Please navigate to public_html first: cd public_html"
    exit 1
fi

echo "📍 Current directory: $(pwd)"
echo ""

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
npm install --production

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Step 2: Create .env.local file
echo "📝 Step 2: Creating .env.local file..."

cat > .env.local << 'ENVFILE'
# ElevenLabs API Key
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Replicate
REPLICATE_API_TOKEN=your_replicate_api_token

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret_from_stripe_dashboard

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.com
ENVFILE

echo "✅ .env.local created"
echo "⚠️  IMPORTANT: Edit .env.local and add your Stripe webhook secret!"
echo ""

# Step 3: Install PM2 globally
echo "📦 Step 3: Installing PM2..."
npm install -g pm2

if [ $? -ne 0 ]; then
    echo "⚠️  Warning: PM2 installation failed. You may need sudo privileges."
    echo "   Try: sudo npm install -g pm2"
else
    echo "✅ PM2 installed"
fi
echo ""

# Step 4: Stop existing process if running
echo "🛑 Step 4: Stopping any existing processes..."
pm2 stop taleweave 2>/dev/null || true
pm2 delete taleweave 2>/dev/null || true

# Step 5: Start the application
echo "🚀 Step 5: Starting Tale Weave application..."

# Try to start with npm start first
if pm2 start npm --name "taleweave" -- start; then
    echo "✅ Application started with 'npm start'"
elif pm2 start server.js --name "taleweave"; then
    echo "✅ Application started with 'server.js'"
else
    echo "❌ Failed to start application"
    exit 1
fi

# Step 6: Save PM2 configuration
echo "💾 Step 6: Saving PM2 configuration..."
pm2 save

echo ""
echo "=========================="
echo "✅ Setup Complete!"
echo "=========================="
echo ""
echo "📋 Useful commands:"
echo "   pm2 status          - Check app status"
echo "   pm2 logs taleweave  - View logs"
echo "   pm2 restart taleweave - Restart app"
echo "   pm2 stop taleweave  - Stop app"
echo ""
echo "🌐 Your site should be live at:"
echo "   https://lightslategray-caribou-743803.hostingersite.com"
echo ""
echo "⚠️  Remember to:"
echo "   1. Update STRIPE_WEBHOOK_SECRET in .env.local"
echo "   2. Update Stripe webhook URL in Stripe dashboard"
echo ""

