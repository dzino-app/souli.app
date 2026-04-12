-- Installed skills per user (junction table)
-- Users can install public skills from the marketplace

CREATE TABLE IF NOT EXISTS user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE NOT NULL,
  enabled BOOLEAN DEFAULT true,
  installed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

CREATE INDEX idx_user_skills_user ON user_skills(user_id);

ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own skills" ON user_skills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can install skills" ON user_skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own skills" ON user_skills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can uninstall skills" ON user_skills FOR DELETE USING (auth.uid() = user_id);

-- Add tags, category, locale to skills for marketplace filtering
ALTER TABLE skills
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS locale TEXT; -- null = universal, 'sk'/'en'/etc = locale-specific

-- Allow anyone to browse public skills
CREATE POLICY "Anyone can read public skills" ON skills FOR SELECT USING (is_public = true OR auth.uid() = creator_id);
CREATE POLICY "Users can create skills" ON skills FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update own skills" ON skills FOR UPDATE USING (auth.uid() = creator_id);
