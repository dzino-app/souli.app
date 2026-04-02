-- Soul file metadata (content lives in Supabase Storage bucket "souls")
CREATE TABLE soul_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  slug TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  updated_by TEXT CHECK (updated_by IN ('user', 'dzino')) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, slug)
);

CREATE INDEX idx_soul_files_user ON soul_files(user_id);

-- Events (diary + plans)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  type TEXT CHECK (type IN ('diary', 'plan')),
  status TEXT CHECK (status IN ('upcoming', 'done', 'missed')) DEFAULT 'upcoming',
  remind_before INT,
  created_by TEXT CHECK (created_by IN ('user', 'dzino')) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_events_user ON events(user_id);
CREATE INDEX idx_events_date ON events(user_id, event_date);

-- Avatar cache metadata (frame images in Storage bucket "avatars")
CREATE TABLE avatar_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  appearance JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE soul_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own soul files" ON soul_files
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own events" ON events
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own avatar cache" ON avatar_cache
  FOR ALL USING (auth.uid() = user_id);

-- Storage buckets (run these in SQL editor or create via dashboard)
-- Bucket: souls (private, per-user soul .md files)
INSERT INTO storage.buckets (id, name, public) VALUES ('souls', 'souls', false)
  ON CONFLICT DO NOTHING;

-- Bucket: avatars (private, per-user cached avatar frames)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', false)
  ON CONFLICT DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Users can manage own soul files in storage" ON storage.objects
  FOR ALL USING (bucket_id = 'souls' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can manage own avatar files in storage" ON storage.objects
  FOR ALL USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
