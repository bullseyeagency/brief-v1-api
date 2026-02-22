-- Add image generation credit and cost tracking to v1_generated_briefs
-- Run manually in Supabase SQL editor

ALTER TABLE v1_generated_briefs
  ADD COLUMN IF NOT EXISTS image_credits  INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS image_cost_usd NUMERIC(10, 4) DEFAULT NULL;

COMMENT ON COLUMN v1_generated_briefs.image_credits  IS 'NanoBanana credits consumed for image generation (13 images × credits/model)';
COMMENT ON COLUMN v1_generated_briefs.image_cost_usd IS 'Image generation cost in USD ($0.01/credit)';
