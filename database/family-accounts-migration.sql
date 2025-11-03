-- Family Accounts & Co-Parent Support Migration
-- Run this in Supabase SQL Editor

-- 1. Add fields to users table for child accounts
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_child BOOLEAN DEFAULT FALSE;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username) WHERE username IS NOT NULL;

-- 2. Create parent_children linking table (many-to-many for co-parents)
CREATE TABLE IF NOT EXISTS public.parent_children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'parent', -- 'parent', 'co_parent'
  invited_by UUID REFERENCES public.users(id), -- who invited this parent
  status TEXT DEFAULT 'active', -- 'active', 'pending', 'removed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(parent_id, child_id)
);

-- Indexes for parent_children
CREATE INDEX IF NOT EXISTS idx_parent_children_parent_id ON public.parent_children(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_children_child_id ON public.parent_children(child_id);
CREATE INDEX IF NOT EXISTS idx_parent_children_status ON public.parent_children(status);

-- 3. Create parent_invitations table for co-parent invites
CREATE TABLE IF NOT EXISTS public.parent_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inviter_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invitation_token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for invitations
CREATE INDEX IF NOT EXISTS idx_parent_invitations_token ON public.parent_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_parent_invitations_email ON public.parent_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_parent_invitations_child_id ON public.parent_invitations(child_id);

-- 4. Enable RLS for new tables
ALTER TABLE public.parent_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_invitations ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for parent_children
CREATE POLICY "Parents can view their linked children"
  ON public.parent_children FOR SELECT
  USING (
    auth.uid() = parent_id OR 
    EXISTS (
      SELECT 1 FROM public.parent_children pc
      WHERE pc.child_id = parent_children.child_id
      AND pc.parent_id = auth.uid()
      AND pc.status = 'active'
    )
  );

CREATE POLICY "Parents can link children"
  ON public.parent_children FOR INSERT
  WITH CHECK (
    auth.uid() = parent_id AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = child_id AND is_child = TRUE
    )
  );

CREATE POLICY "Parents can update their own links"
  ON public.parent_children FOR UPDATE
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can remove their own links"
  ON public.parent_children FOR DELETE
  USING (auth.uid() = parent_id);

-- 6. RLS Policies for parent_invitations
CREATE POLICY "Users can view invitations sent to their email"
  ON public.parent_invitations FOR SELECT
  USING (
    invited_email = (SELECT email FROM public.users WHERE id = auth.uid()) OR
    auth.uid() = inviter_id OR
    auth.uid() = child_id
  );

CREATE POLICY "Parents can create invitations"
  ON public.parent_invitations FOR INSERT
  WITH CHECK (
    auth.uid() = inviter_id AND
    EXISTS (
      SELECT 1 FROM public.parent_children
      WHERE parent_id = auth.uid()
      AND child_id = parent_invitations.child_id
      AND status = 'active'
    )
  );

CREATE POLICY "Parents can update invitations they created"
  ON public.parent_invitations FOR UPDATE
  USING (auth.uid() = inviter_id);

-- 7. Function to generate invitation token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger to auto-create parent_children link when child is created
-- (This assumes the parent creates the child account)
CREATE OR REPLACE FUNCTION auto_link_parent_child()
RETURNS TRIGGER AS $$
BEGIN
  -- Only link if child has a parent_id set
  IF NEW.is_child = TRUE AND NEW.parent_id IS NOT NULL THEN
    INSERT INTO public.parent_children (parent_id, child_id, relationship_type, status)
    VALUES (NEW.parent_id, NEW.id, 'parent', 'active')
    ON CONFLICT (parent_id, child_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_child_created_link_parent ON public.users;
CREATE TRIGGER on_child_created_link_parent
  AFTER INSERT ON public.users
  FOR EACH ROW
  WHEN (NEW.is_child = TRUE)
  EXECUTE FUNCTION auto_link_parent_child();

-- Done! ✅

