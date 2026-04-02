-- Soul files (shared .md knowledge base between user and Dzino)
CREATE TABLE soul_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  slug TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
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

-- Row Level Security
ALTER TABLE soul_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own soul files" ON soul_files
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own events" ON events
  FOR ALL USING (auth.uid() = user_id);
