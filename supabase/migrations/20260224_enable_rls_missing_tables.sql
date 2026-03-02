-- =====================================================
-- Enable RLS on tables that were missing it
-- Fixes: rls_disabled_in_public security errors
-- =====================================================

-- =====================================================
-- v1_persona_images
-- =====================================================

ALTER TABLE v1_persona_images ENABLE ROW LEVEL SECURITY;

-- Public can read images that belong to a public brief
CREATE POLICY "Persona images are viewable if brief is public"
ON v1_persona_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM v1_generated_briefs
    WHERE id = v1_persona_images.brief_id
    AND is_public = true
  )
);

-- Only service role can insert/update/delete (bypasses RLS by default)
-- No explicit policy needed — absence of policy blocks anon/authenticated roles

-- =====================================================
-- v1_comic_panels
-- =====================================================

ALTER TABLE v1_comic_panels ENABLE ROW LEVEL SECURITY;

-- Public can read panels that belong to a public brief
CREATE POLICY "Comic panels are viewable if brief is public"
ON v1_comic_panels FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM v1_generated_briefs
    WHERE id = v1_comic_panels.brief_id
    AND is_public = true
  )
);

-- Only service role can insert/update/delete (bypasses RLS by default)

-- =====================================================
-- v1_api_usage
-- =====================================================

ALTER TABLE v1_api_usage ENABLE ROW LEVEL SECURITY;

-- No public read access — internal tracking only
-- Service role bypasses RLS, so API writes continue to work
-- No policies = all non-service-role access is denied
