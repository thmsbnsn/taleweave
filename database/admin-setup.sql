-- Add admin column to users table if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create admin user (replace email with your admin email)
-- This will be linked to a user when they sign up with this email
UPDATE public.users 
SET is_admin = TRUE, subscription_active = TRUE 
WHERE email = 'admin@taleweave.com';

-- Or create a policy that allows admins full access
CREATE POLICY "Admins have full access to all stories"
  ON public.stories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- Admins can create stories without restrictions
CREATE POLICY "Admins can create any story"
  ON public.stories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

