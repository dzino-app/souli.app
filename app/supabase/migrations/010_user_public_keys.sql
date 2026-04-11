-- User asymmetric keypairs for end-to-end encrypted sharing
--
-- Each user gets an ECDH P-256 keypair:
--   public_key: base64 exported SPKI — shared openly for encrypting content to this user
--   encrypted_private_key: AES-GCM encrypted PKCS8 private key, encrypted under the user's session key
--
-- This allows cross-user E2E sharing via ECDH key agreement without
-- the server ever seeing the private key or the shared secret.

CREATE TABLE IF NOT EXISTS user_keys (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  encrypted_private_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_keys ENABLE ROW LEVEL SECURITY;

-- Anyone can read public keys (needed for encrypting content for a recipient)
CREATE POLICY "Public keys are readable by all" ON user_keys FOR SELECT USING (true);
CREATE POLICY "Users can insert own keys" ON user_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own keys" ON user_keys FOR UPDATE USING (auth.uid() = user_id);
