-- Guided 30-day programs
-- programs: catalog (official + user-generated custom)
-- user_programs: enrollment tracking per user

CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  locale TEXT,
  /** Array of { day: number, prompt: string, focus: string } */
  days JSONB NOT NULL,
  total_days INTEGER NOT NULL DEFAULT 30,
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_official BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_programs_public ON programs(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_programs_creator ON programs(creator_id);

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public programs are readable by all" ON programs FOR SELECT USING (is_public = true OR auth.uid() = creator_id);
CREATE POLICY "Users can create programs" ON programs FOR INSERT WITH CHECK (auth.uid() = creator_id OR is_official = true);

-- User enrollment / progress
CREATE TABLE IF NOT EXISTS user_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
  current_day INTEGER DEFAULT 1,
  completed_days JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  UNIQUE(user_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_user_programs_user ON user_programs(user_id);

ALTER TABLE user_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own programs" ON user_programs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users enroll self" ON user_programs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own progress" ON user_programs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users drop own programs" ON user_programs FOR DELETE USING (auth.uid() = user_id);
