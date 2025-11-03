-- Add admin column to existing users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Optional: Set a specific email as admin (uncomment and change email)
-- UPDATE public.users 
-- SET is_admin = TRUE, subscription_active = TRUE 
-- WHERE email = 'your@email.com';

