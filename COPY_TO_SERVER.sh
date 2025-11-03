#!/bin/bash
# This file contains all commands to run on the server
# Copy this entire file content and paste into SSH terminal

# Navigate to public_html
cd public_html || cd ~/public_html || cd ~/domains/*/public_html

# Install dependencies
echo "Installing dependencies..."
npm install --production

# Create .env.local
echo "Creating .env.local..."
cat > .env.local << 'EOF'
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
EOF

# Install PM2
echo "Installing PM2..."
npm install -g pm2

# Stop any existing instance
pm2 stop taleweave 2>/dev/null
pm2 delete taleweave 2>/dev/null

# Start the application
echo "Starting application..."
pm2 start npm --name "taleweave" -- start

# Save PM2 configuration
pm2 save

echo "Setup complete! Run 'pm2 status' to check."

