# Supabase Setup Guide

## ✅ Credentials Configured

- **Username**: thmsbnsn
- **Password**: L0g!nSt@geX4
- **Project Reference**: bkwivsskmyexflakxyzf
- **Supabase URL**: https://bkwivsskmyexflakxyzf.supabase.co

## 🔑 Get Your API Keys

Your Supabase project is set up, but you need to get the API keys:

1. **Go to Supabase Dashboard**:
   - URL: https://supabase.com/dashboard/project/bkwivsskmyexflakxyzf/settings/api
   - Or: https://supabase.com/dashboard → Select your project → Settings → API

2. **Copy the following keys**:
   - **Project URL**: `https://bkwivsskmyexflakxyzf.supabase.co`
   - **anon public** key: Starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role** key: Starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (⚠️ Keep this secret!)

3. **Add them to `.env.local`**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://bkwivsskmyexflakxyzf.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

## 📊 Set Up Database Schema

### Option 1: Using Supabase SQL Editor (Recommended)

1. Go to: https://supabase.com/dashboard/project/bkwivsskmyexflakxyzf/sql
2. Click **"New query"**
3. Copy the entire contents of `database/schema.sql`
4. Paste into the SQL editor
5. Click **"Run"** (or press Ctrl+Enter)
6. Wait for "Success" message

### Option 2: Using Script (After adding API keys)

Once you've added your API keys to `.env.local`, run:

```bash
npm run setup:supabase
```

## 📦 Set Up Storage Buckets

### Automatic (After adding API keys):

The setup script will create these automatically. Or manually:

1. Go to: https://supabase.com/dashboard/project/bkwivsskmyexflakxyzf/storage/buckets
2. Click **"New bucket"**
3. Create bucket: `story-images`
   - Make it **Public**
   - File size limit: 50MB
   - Allowed MIME types: `image/png, image/jpeg, image/webp`
4. Click **"New bucket"** again
5. Create bucket: `story-audio`
   - Make it **Public**
   - File size limit: 100MB
   - Allowed MIME types: `audio/mpeg, audio/mp3, audio/wav`

## ✅ Verify Setup

After adding API keys, test the connection:

```bash
npm run dev
```

Then visit: http://localhost:3000

## 🔗 Quick Links

- **Dashboard**: https://supabase.com/dashboard/project/bkwivsskmyexflakxyzf
- **API Settings**: https://supabase.com/dashboard/project/bkwivsskmyexflakxyzf/settings/api
- **SQL Editor**: https://supabase.com/dashboard/project/bkwivsskmyexflakxyzf/sql
- **Storage**: https://supabase.com/dashboard/project/bkwivsskmyexflakxyzf/storage/buckets
- **Auth Settings**: https://supabase.com/dashboard/project/bkwivsskmyexflakxyzf/auth/providers

## 📝 Summary

**What's Done**:
- ✅ Project identified: bkwivsskmyexflakxyzf
- ✅ URL configured: https://bkwivsskmyexflakxyzf.supabase.co
- ✅ Database connection string added to .env.local

**What You Need to Do**:
1. Get API keys from Supabase dashboard
2. Add them to `.env.local`
3. Run database schema (SQL Editor or script)
4. Create storage buckets (or let script do it)

Once API keys are added, everything else can be automated!

