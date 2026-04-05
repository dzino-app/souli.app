-- User encryption salts for client-side encryption
-- The salt is NOT secret — it's stored unencrypted and is needed to derive
-- the encryption key from the user's password.

CREATE TABLE IF NOT EXISTS user_crypto (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  salt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_crypto ENABLE ROW LEVEL SECURITY;

-- Users can only read their own salt
CREATE POLICY "Users can read own salt"
  ON user_crypto FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own salt (once, during signup)
CREATE POLICY "Users can insert own salt"
  ON user_crypto FOR INSERT
  WITH CHECK (auth.uid() = user_id);
