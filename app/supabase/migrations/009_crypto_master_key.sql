-- Master key model for client-side encryption (v2)
--
-- Adds support for wrapped master keys and recovery phrases.
-- crypto_version = 1: legacy (password IS the key, no recovery possible)
-- crypto_version = 2: master key wrapped under password + optional recovery phrase
--
-- Also fixes the missing UPDATE + encryption_enabled from the original migration.

ALTER TABLE user_crypto
  ADD COLUMN IF NOT EXISTS encryption_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS crypto_version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS wrapped_key_password TEXT,
  ADD COLUMN IF NOT EXISTS wrapped_key_recovery TEXT,
  ADD COLUMN IF NOT EXISTS recovery_salt TEXT,
  ADD COLUMN IF NOT EXISTS recovery_created_at TIMESTAMPTZ;

-- Allow users to update their own crypto settings (missing from 008)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_crypto' AND policyname = 'Users can update own crypto'
  ) THEN
    CREATE POLICY "Users can update own crypto"
      ON user_crypto FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END
$$;
