-- Add sound_dna JSONB column to avatars table
-- Stores the unique 8-bit sound parameters for each Souli
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS sound_dna JSONB DEFAULT NULL;

COMMENT ON COLUMN avatars.sound_dna IS 'Unique 8-bit sound parameters: basePitch, timbre, tempo, chirpRange, harmonicShift';
