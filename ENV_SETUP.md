# Environment Variables Setup

## ElevenLabs API Key (Already Added)
✅ Your ElevenLabs API key has been saved:
```
ELEVENLABS_API_KEY=sk_f4f51433a4d38a94b320a0d8e977ab54b0bb4ebbc88514a0
```

## Create .env.local File

Create a `.env.local` file in the root directory with the following content:

```env
# ElevenLabs API Key
ELEVENLABS_API_KEY=sk_f4f51433a4d38a94b320a0d8e977ab54b0bb4ebbc88514a0

# Supabase - Configured
NEXT_PUBLIC_SUPABASE_URL=https://bkwivsskmyexflakxyzf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrd2l2c3NrbXlleGZsYWt4eXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNjYxNDEsImV4cCI6MjA3NzY0MjE0MX0.bq_tfCZigxvQgrMoMyvvJOhstKDlXVmKhUAtGblQxFQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrd2l2c3NrbXlleGZsYWt4eXpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjA2NjE0MSwiZXhwIjoyMDc3NjQyMTQxfQ.lc-v6AG98HdSRduOlbxDkkl9f-C7HxyLOu_0hnS4OzI

# OpenAI - Configured
OPENAI_API_KEY=your_openai_api_key

# Replicate - Configured
REPLICATE_API_TOKEN=your_replicate_api_token

# Stripe - LIVE KEYS (Production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# App URL
NEXT_PUBLIC_APP_URL=https://lightslategray-caribou-743803.hostingersite.com
```

## Quick Setup Commands

**Windows PowerShell:**
```powershell
# Create .env.local file
@"
ELEVENLABS_API_KEY=sk_f4f51433a4d38a94b320a0d8e977ab54b0bb4ebbc88514a0
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
REPLICATE_API_TOKEN=your_replicate_api_token
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_APP_URL=https://lightslategray-caribou-743803.hostingersite.com
"@ | Out-File -FilePath .env.local -Encoding utf8
```

**macOS/Linux:**
```bash
cat > .env.local << 'EOF'
ELEVENLABS_API_KEY=sk_f4f51433a4d38a94b320a0d8e977ab54b0bb4ebbc88514a0
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
REPLICATE_API_TOKEN=your_replicate_api_token
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_APP_URL=https://lightslategray-caribou-743803.hostingersite.com
EOF
```

## Important Notes

- The `.env.local` file is already in `.gitignore` - it will not be committed to git
- Replace all `your_*` placeholders with your actual API keys
- Never commit API keys to version control
- Keep your `.env.local` file secure and private

