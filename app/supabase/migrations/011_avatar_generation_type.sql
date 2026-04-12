-- Track how each avatar's visual assets were generated.
-- avatar_type: 'pixel' (procedural), 'imagen' (Vertex AI Imagen), 'veo' (Vertex AI Veo)
-- portrait_url: AI-generated portrait image (Imagen)
-- video_url: AI-generated video clip (Veo)

ALTER TABLE avatars
  ADD COLUMN IF NOT EXISTS avatar_type TEXT DEFAULT 'pixel',
  ADD COLUMN IF NOT EXISTS portrait_url TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT;
