#!/bin/bash

# Tale Weave Deployment Script for Hostinger
# Make sure to set all environment variables on the server first!

echo "🚀 Starting Tale Weave deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Build the application
echo "🔨 Building application..."
npm run build

# Copy branding files if needed
if [ ! -f "public/tw-logo.ico" ]; then
    echo "📁 Copying branding files..."
    cp Branding/tw-logo.ico public/ 2>/dev/null || echo "Warning: Could not copy logo"
fi

echo "✅ Deployment preparation complete!"
echo "⚠️  Make sure to:"
echo "   1. Set all environment variables"
echo "   2. Run database migrations (schema.sql)"
echo "   3. Start the server with: npm start"
echo "   4. Set up PM2 or similar process manager"

