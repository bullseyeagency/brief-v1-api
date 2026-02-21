-- Add callback_url to support webhook notifications back to Sophia OS
ALTER TABLE v1_generated_briefs
  ADD COLUMN IF NOT EXISTS callback_url TEXT DEFAULT NULL;
