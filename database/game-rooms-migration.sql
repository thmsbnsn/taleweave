-- Game Rooms Migration for Multiplayer Games
-- Run this in Supabase SQL Editor

-- Create game_rooms table
CREATE TABLE IF NOT EXISTS public.game_rooms (
  id TEXT PRIMARY KEY,  -- e.g., 'jumper-abc123'
  game_type TEXT NOT NULL DEFAULT 'jumper',  -- 'jumper', 'platformer', 'collector'
  players JSONB DEFAULT '[]'::jsonb,  -- [{user_id, x, y, vx, vy, char_url, name}]
  game_state JSONB DEFAULT '{}'::jsonb,  -- Level state, collectibles, etc.
  max_players INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for active rooms
CREATE INDEX IF NOT EXISTS idx_game_rooms_active ON public.game_rooms(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_game_rooms_game_type ON public.game_rooms(game_type);

-- Enable RLS
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active game rooms"
  ON public.game_rooms FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Authenticated users can create game rooms"
  ON public.game_rooms FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Players can update their game rooms"
  ON public.game_rooms FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM jsonb_array_elements(players) AS player
      WHERE (player->>'user_id')::uuid = auth.uid()
    )
  );

-- Function to clean up old rooms (optional, can be called by cron)
CREATE OR REPLACE FUNCTION cleanup_old_game_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM public.game_rooms
  WHERE created_at < NOW() - INTERVAL '1 hour'
  AND is_active = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Realtime for game_rooms
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.game_rooms;

-- Done! ✅

