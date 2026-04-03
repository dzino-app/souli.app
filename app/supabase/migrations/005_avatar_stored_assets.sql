-- Pre-rendered avatar assets stored in Supabase Storage
-- preview_url: static PNG of idle frame (for gallery cards)
-- animation_urls: JSONB mapping activity names to arrays of frame URLs

ALTER TABLE avatars ADD COLUMN IF NOT EXISTS preview_url TEXT;
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS animation_urls JSONB;

-- Create public storage bucket for avatar assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload avatar assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update (upsert) their own avatar assets
CREATE POLICY "Users can update avatar assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatar assets
CREATE POLICY "Users can delete avatar assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read access (the bucket is public)
CREATE POLICY "Public read access for avatar assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
