-- Multi-avatar system + public avatar library

-- Core avatar table
CREATE TABLE avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL DEFAULT 'Dzino',
  slug TEXT NOT NULL,
  appearance JSONB NOT NULL,

  -- Per-avatar gamification
  xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_active_date DATE,
  achievements TEXT[] NOT NULL DEFAULT '{}',
  daily_xp_earned INT NOT NULL DEFAULT 0,
  mood INT NOT NULL DEFAULT 70,
  last_interaction TIMESTAMPTZ,

  -- Public library
  is_public BOOLEAN NOT NULL DEFAULT false,
  public_description TEXT,
  tags TEXT[] DEFAULT '{}',
  times_loaded INT NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT false,
  moderation_status TEXT CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged'))
    DEFAULT 'approved',

  -- Active avatar (one per user)
  is_active BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, slug)
);

CREATE INDEX idx_avatars_user ON avatars(user_id);
CREATE INDEX idx_avatars_active ON avatars(user_id) WHERE is_active = true;
CREATE INDEX idx_avatars_public ON avatars(is_public, moderation_status) WHERE is_public = true;
CREATE INDEX idx_avatars_popularity ON avatars(times_loaded DESC) WHERE is_public = true;

-- Extend soul_files with avatar_id and public visibility
ALTER TABLE soul_files ADD COLUMN IF NOT EXISTS avatar_id UUID REFERENCES avatars(id) ON DELETE CASCADE;
ALTER TABLE soul_files ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_soul_files_avatar ON soul_files(avatar_id);

-- Track avatar loads (who copied what)
CREATE TABLE avatar_loads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_avatar_id UUID REFERENCES avatars(id) NOT NULL,
  loaded_by UUID REFERENCES auth.users NOT NULL,
  created_avatar_id UUID REFERENCES avatars(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_avatar_loads_source ON avatar_loads(source_avatar_id);

-- Avatar reports (moderation)
CREATE TABLE avatar_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_id UUID REFERENCES avatars(id) NOT NULL,
  reporter_id UUID REFERENCES auth.users NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT CHECK (status IN ('pending', 'resolved', 'dismissed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(avatar_id, reporter_id)
);

-- Tag conversations and events with avatar_id
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS avatar_id UUID REFERENCES avatars(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS avatar_id UUID REFERENCES avatars(id);

-- RLS
ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_reports ENABLE ROW LEVEL SECURITY;

-- Owner full access
CREATE POLICY "own_avatars" ON avatars FOR ALL USING (auth.uid() = user_id);

-- Public read for approved avatars
CREATE POLICY "public_avatars" ON avatars FOR SELECT
  USING (is_public = true AND moderation_status = 'approved');

-- Public soul files (only for public avatars)
CREATE POLICY "public_soul_files" ON soul_files FOR SELECT
  USING (
    is_public = true AND
    avatar_id IN (SELECT id FROM avatars WHERE is_public = true AND moderation_status = 'approved')
  );

-- Avatar loads
CREATE POLICY "own_loads" ON avatar_loads FOR ALL USING (auth.uid() = loaded_by);
CREATE POLICY "owner_sees_loads" ON avatar_loads FOR SELECT
  USING (source_avatar_id IN (SELECT id FROM avatars WHERE user_id = auth.uid()));

-- Avatar reports
CREATE POLICY "create_reports" ON avatar_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
