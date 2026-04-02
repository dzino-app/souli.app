-- Add language tracking to soul files
ALTER TABLE soul_files ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'sk';

-- Translation cache table — stores LLM-generated translations
-- so we don't re-translate when user switches back to a language
CREATE TABLE IF NOT EXISTS translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  slug TEXT NOT NULL,
  language TEXT NOT NULL,
  content TEXT NOT NULL,
  display_name TEXT,
  translated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, slug, language)
);

CREATE INDEX IF NOT EXISTS idx_translations_user_lang ON translations(user_id, language);

ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own translations" ON translations
  FOR ALL USING (auth.uid() = user_id);
