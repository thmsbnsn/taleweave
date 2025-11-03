# PowerShell script to prepare files for Hostinger deployment
# Run this before uploading files via FTP

Write-Host "🚀 Preparing Tale Weave for deployment..." -ForegroundColor Green

# Ensure build exists
if (-not (Test-Path ".next")) {
    Write-Host "❌ Build not found. Running build..." -ForegroundColor Yellow
    npm run build
}

# Create deployment directory
$deployDir = "deploy"
if (Test-Path $deployDir) {
    Remove-Item -Recurse -Force $deployDir
}
New-Item -ItemType Directory -Path $deployDir | Out-Null

Write-Host "📦 Copying files for deployment..." -ForegroundColor Cyan

# Copy necessary files
Copy-Item -Recurse ".next" "$deployDir/.next"
Copy-Item -Recurse "public" "$deployDir/public"
Copy-Item "package.json" "$deployDir/"
Copy-Item "package-lock.json" "$deployDir/" -ErrorAction SilentlyContinue
Copy-Item "next.config.js" "$deployDir/"
Copy-Item "tsconfig.json" "$deployDir/"
Copy-Item "tailwind.config.ts" "$deployDir/" -ErrorAction SilentlyContinue
Copy-Item "postcss.config.js" "$deployDir/" -ErrorAction SilentlyContinue
Copy-Item "server.js" "$deployDir/" -ErrorAction SilentlyContinue

# Create .env.example (NOT the actual .env.local)
Write-Host "📝 Creating .env.example template..." -ForegroundColor Cyan
@"
# Copy this to .env.local on the server and fill in your values
ELEVENLABS_API_KEY=your_elevenlabs_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
REPLICATE_API_TOKEN=your_replicate_token
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_APP_URL=https://lightslategray-caribou-743803.hostingersite.com
"@ | Out-File -FilePath "$deployDir/.env.example" -Encoding utf8

Write-Host "✅ Deployment package ready in '$deployDir' folder!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Upload contents of '$deployDir' to Hostinger FTP (public_html)" -ForegroundColor White
Write-Host "2. SSH into server and run: npm install --production" -ForegroundColor White
Write-Host "3. Create .env.local file on server with your API keys" -ForegroundColor White
Write-Host "4. Start server with: pm2 start npm --name 'taleweave' -- start" -ForegroundColor White
Write-Host ""
Write-Host "FTP Details:" -ForegroundColor Cyan
Write-Host "  Host: 46.202.183.226" -ForegroundColor White
Write-Host "  Port: 21" -ForegroundColor White
Write-Host "  User: u204461404.lightslategray-caribou-743803.hostingersite.com" -ForegroundColor White
Write-Host "  Path: public_html/" -ForegroundColor White

