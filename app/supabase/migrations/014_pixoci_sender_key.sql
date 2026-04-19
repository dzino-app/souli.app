-- Track the publisher's public key for each published avatar so readers can
-- decrypt E2E-encrypted soul files from the public library. The key itself
-- is stored as-is (it's public info, readable by anyone).

ALTER TABLE avatars
  ADD COLUMN IF NOT EXISTS sender_public_key TEXT;
