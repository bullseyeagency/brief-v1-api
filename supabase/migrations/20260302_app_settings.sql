CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default image slot settings
INSERT INTO app_settings (key, value) VALUES (
  'image_slots',
  '{
    "avatars": true,
    "cover": false,
    "pages.brandTruth": false,
    "pages.marketContext": true,
    "pages.problem": true,
    "pages.transformation": true,
    "pages.proofPillars": false,
    "pages.offer": true,
    "pages.messaging": false,
    "pages.creativeDirection": false,
    "backCover": true,
    "facebookImages": true,
    "storyboardFrames": true
  }'::jsonb
) ON CONFLICT (key) DO NOTHING;
