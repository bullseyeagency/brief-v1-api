-- Migration: Add images column for magazine format
-- Date: 2026-02-11
-- Description: Adds JSONB column to store magazine images (cover, avatars, pages, backCover)

-- Add images column if it doesn't exist
ALTER TABLE v1_generated_briefs
ADD COLUMN IF NOT EXISTS images JSONB;

-- Add index for performance (check if images exist)
CREATE INDEX IF NOT EXISTS idx_v1_briefs_has_images
ON v1_generated_briefs((images IS NOT NULL));

-- Add comment for documentation
COMMENT ON COLUMN v1_generated_briefs.images
IS 'Magazine images in BriefImages format: { cover, avatars: [3], pages: {8}, backCover }';
