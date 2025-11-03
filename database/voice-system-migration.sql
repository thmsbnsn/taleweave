-- Voice System & Parental Controls Migration
-- Run this in Supabase SQL Editor

-- 1. Add voice_settings to characters table
ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS voice_settings JSONB;

-- 2. Create parent_profiles table
CREATE TABLE IF NOT EXISTS public.parent_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT,
  avatar_url TEXT,
  voice_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add app_locked and parent_id to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS app_locked BOOLEAN DEFAULT FALSE;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 4. Create index for parent_profiles
CREATE INDEX IF NOT EXISTS idx_parent_profiles_user_id ON public.parent_profiles(user_id);

-- 5. Enable RLS for parent_profiles
ALTER TABLE public.parent_profiles ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for parent_profiles
CREATE POLICY "Users can view their own parent profile"
  ON public.parent_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own parent profile"
  ON public.parent_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own parent profile"
  ON public.parent_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- 7. Create user-voices storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-voices', 'user-voices', false)
ON CONFLICT (id) DO NOTHING;

-- 8. Storage policy for user-voices bucket
CREATE POLICY "Users can upload their voice"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'user-voices' AND auth.uid() = owner);

CREATE POLICY "Users can view their own voices"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-voices' AND auth.uid() = owner);

CREATE POLICY "Users can update their own voices"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'user-voices' AND auth.uid() = owner);

-- Done! ✅

