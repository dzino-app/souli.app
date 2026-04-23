-- TTS trial tracking: extend user_credits with neural-voice usage counters.
-- Free tier gets 50 neural calls OR 7 days (whichever first) as a "premium
-- voice" taste. After trial: Web Speech fallback unless user is on a paid tier.

ALTER TABLE user_credits
  ADD COLUMN IF NOT EXISTS tts_trial_started_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS tts_trial_calls_used INTEGER DEFAULT 0;
