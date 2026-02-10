-- =====================================================
-- Add metadata column to v1_generated_briefs
-- Stores additional context like type ('local' | 'shopify')
-- =====================================================

ALTER TABLE v1_generated_briefs
ADD COLUMN metadata JSONB;

COMMENT ON COLUMN v1_generated_briefs.metadata IS 'Additional metadata including type (local/shopify), companyName, source, etc.';
