-- =====================================================
-- Brief V1 API Schema
-- Separate tables from creative-brief-v2
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- V1 GENERATED BRIEFS
-- =====================================================

CREATE TABLE v1_generated_briefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Input
  source_url TEXT NOT NULL,
  crawl_result JSONB NOT NULL, -- CrawlResult object (after cleanup)

  -- Generated Content
  brief JSONB NOT NULL, -- CreativeBrief object
  deliverables JSONB NOT NULL, -- Deliverables object

  -- Generation Metadata
  provider TEXT NOT NULL, -- 'openai' | 'claude'
  model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  generation_time_ms INTEGER,

  -- Public Access
  public_slug TEXT UNIQUE NOT NULL, -- For public URLs
  is_public BOOLEAN DEFAULT true,

  -- Optional: Link to Sophia OS
  sophia_contact_id TEXT, -- External ID from Sophia

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration

  -- Indexes
  CONSTRAINT valid_provider CHECK (provider IN ('openai', 'claude', 'gemini'))
);

CREATE INDEX idx_v1_briefs_public_slug ON v1_generated_briefs(public_slug);
CREATE INDEX idx_v1_briefs_sophia_contact ON v1_generated_briefs(sophia_contact_id);
CREATE INDEX idx_v1_briefs_created_at ON v1_generated_briefs(created_at DESC);

-- =====================================================
-- V1 PERSONA IMAGES (Gemini-generated)
-- =====================================================

CREATE TABLE v1_persona_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brief_id UUID NOT NULL REFERENCES v1_generated_briefs(id) ON DELETE CASCADE,

  -- Persona Info
  persona_name TEXT NOT NULL,
  persona_type TEXT NOT NULL, -- 'primary' | 'secondary' | 'tertiary'

  -- Image Data
  image_url TEXT NOT NULL, -- S3/Storage URL or base64
  generation_prompt TEXT NOT NULL,

  -- Generation Metadata
  provider TEXT DEFAULT 'gemini',
  model TEXT DEFAULT 'gemini-3-pro-image-preview',
  generation_time_ms INTEGER,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_v1_persona_images_brief ON v1_persona_images(brief_id);

-- =====================================================
-- V1 COMIC PANELS (for future comic generation)
-- =====================================================

CREATE TABLE v1_comic_panels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brief_id UUID NOT NULL REFERENCES v1_generated_briefs(id) ON DELETE CASCADE,

  -- Panel Info
  panel_number INTEGER NOT NULL,
  panel_type TEXT NOT NULL, -- 'brand-story' | '30sec-commercial'

  -- Content
  scene TEXT NOT NULL,
  caption TEXT,
  dialogue TEXT,
  character_focus TEXT,

  -- Image
  image_url TEXT, -- Generated panel image

  -- Generation Metadata
  provider TEXT DEFAULT 'gemini',
  model TEXT,
  generation_time_ms INTEGER,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(brief_id, panel_type, panel_number)
);

CREATE INDEX idx_v1_comic_panels_brief ON v1_comic_panels(brief_id);

-- =====================================================
-- V1 API USAGE TRACKING
-- =====================================================

CREATE TABLE v1_api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Request Info
  endpoint TEXT NOT NULL, -- '/api/generate' | '/api/sophia/create-brief'
  source TEXT, -- 'sophia-os' | 'webapp' | 'api'

  -- Token Usage
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,

  -- Cost Estimation (optional)
  estimated_cost_usd DECIMAL(10, 6),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_v1_api_usage_created_at ON v1_api_usage(created_at DESC);
CREATE INDEX idx_v1_api_usage_source ON v1_api_usage(source);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Generate unique slug for public URLs
CREATE OR REPLACE FUNCTION generate_brief_slug()
RETURNS TEXT AS $$
DECLARE
  new_slug TEXT;
  slug_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 8-character slug
    new_slug := substring(md5(random()::text) from 1 for 8);

    -- Check if slug exists
    SELECT EXISTS(SELECT 1 FROM v1_generated_briefs WHERE public_slug = new_slug) INTO slug_exists;

    -- Exit loop if slug is unique
    EXIT WHEN NOT slug_exists;
  END LOOP;

  RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug
CREATE OR REPLACE FUNCTION set_brief_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.public_slug IS NULL THEN
    NEW.public_slug := generate_brief_slug();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_brief_slug
BEFORE INSERT ON v1_generated_briefs
FOR EACH ROW
EXECUTE FUNCTION set_brief_slug();

-- =====================================================
-- ROW LEVEL SECURITY (Public read access)
-- =====================================================

ALTER TABLE v1_generated_briefs ENABLE ROW LEVEL SECURITY;

-- Anyone can read public briefs
CREATE POLICY "Public briefs are viewable by anyone"
ON v1_generated_briefs FOR SELECT
USING (is_public = true);

-- Only authenticated users can create briefs (for future auth)
CREATE POLICY "Anyone can create briefs"
ON v1_generated_briefs FOR INSERT
WITH CHECK (true);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE v1_generated_briefs IS 'Stores briefs generated via brief-v1-api';
COMMENT ON TABLE v1_persona_images IS 'Gemini-generated persona images for briefs';
COMMENT ON TABLE v1_comic_panels IS 'Comic strip panels generated from briefs';
COMMENT ON TABLE v1_api_usage IS 'Tracks API usage and token consumption';
