-- Enhanced Child Profiles & Parent Roles Migration
-- Run this in Supabase SQL Editor

-- 1. Add child profile fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS favorite_color TEXT;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- 2. Update parent_children table with roles and permissions
ALTER TABLE public.parent_children 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'co_parent' CHECK (role IN ('primary_parent', 'co_parent', 'guardian'));

ALTER TABLE public.parent_children 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{
  "can_manage_access": true,
  "can_create_stories": true,
  "can_view_progress": true,
  "can_manage_characters": true,
  "can_invite_others": false,
  "can_remove_children": false
}'::jsonb;

-- 3. Create child_preferences table for detailed preferences
CREATE TABLE IF NOT EXISTS public.child_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  interests TEXT[] DEFAULT ARRAY[]::TEXT[],
  favorite_subjects TEXT[] DEFAULT ARRAY[]::TEXT[],
  learning_style TEXT, -- 'visual', 'auditory', 'kinesthetic', 'mixed'
  difficulty_preference TEXT DEFAULT 'medium', -- 'easy', 'medium', 'challenging'
  theme_preferences JSONB DEFAULT '{}'::jsonb, -- 'space', 'animals', 'princesses', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_child_preferences_child_id ON public.child_preferences(child_id);

-- 4. Enable RLS for child_preferences
ALTER TABLE public.child_preferences ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for child_preferences
CREATE POLICY "Parents can view their child's preferences"
  ON public.child_preferences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_children
      WHERE parent_children.child_id = child_preferences.child_id
      AND parent_children.parent_id = auth.uid()
      AND parent_children.status = 'active'
    )
  );

CREATE POLICY "Parents can update their child's preferences"
  ON public.child_preferences FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_children
      WHERE parent_children.child_id = child_preferences.child_id
      AND parent_children.parent_id = auth.uid()
      AND parent_children.status = 'active'
    )
  );

CREATE POLICY "Parents can insert child preferences"
  ON public.child_preferences FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.parent_children
      WHERE parent_children.child_id = child_preferences.child_id
      AND parent_children.parent_id = auth.uid()
      AND parent_children.status = 'active'
    )
  );

-- 6. Update auto-link trigger to set primary_parent role
CREATE OR REPLACE FUNCTION auto_link_parent_child()
RETURNS TRIGGER AS $$
BEGIN
  -- Only link if child has a parent_id set
  IF NEW.is_child = TRUE AND NEW.parent_id IS NOT NULL THEN
    INSERT INTO public.parent_children (parent_id, child_id, relationship_type, role, status)
    VALUES (
      NEW.parent_id, 
      NEW.id, 
      'parent', 
      'primary_parent', -- First parent is always primary
      'active'
    )
    ON CONFLICT (parent_id, child_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function to check parent permissions
CREATE OR REPLACE FUNCTION check_parent_permission(
  p_parent_id UUID,
  p_child_id UUID,
  p_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_permissions JSONB;
  v_role TEXT;
BEGIN
  SELECT permissions, role INTO v_permissions, v_role
  FROM public.parent_children
  WHERE parent_id = p_parent_id
    AND child_id = p_child_id
    AND status = 'active'
  LIMIT 1;

  -- Primary parent has all permissions
  IF v_role = 'primary_parent' THEN
    RETURN TRUE;
  END IF;

  -- Check specific permission
  IF v_permissions IS NOT NULL THEN
    RETURN COALESCE((v_permissions->>p_permission)::boolean, FALSE);
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Done! ✅

