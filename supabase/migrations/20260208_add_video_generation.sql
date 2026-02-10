-- =====================================================
-- V1 GENERATED VIDEOS (Veo 3.1)
-- =====================================================

CREATE TABLE v1_generated_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brief_id UUID NOT NULL REFERENCES v1_generated_briefs(id) ON DELETE CASCADE,

  -- Video Info
  video_type TEXT NOT NULL, -- 'tv-commercial' | 'brand-story' | 'social-media'
  duration_seconds INTEGER DEFAULT 8,

  -- Video Data
  video_url TEXT, -- Final video URL from Veo 3
  thumbnail_url TEXT, -- Optional thumbnail
  generation_prompt TEXT NOT NULL, -- The prompt sent to Veo 3

  -- Generation Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'generating' | 'completed' | 'failed'
  operation_name TEXT, -- Veo 3 operation ID for polling
  error_message TEXT,

  -- Generation Metadata
  provider TEXT DEFAULT 'veo',
  model TEXT DEFAULT 'veo-3.1-generate-preview',
  generation_time_ms INTEGER,
  aspect_ratio TEXT DEFAULT '16:9',
  resolution TEXT DEFAULT '720p',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT valid_video_type CHECK (video_type IN ('tv-commercial', 'brand-story', 'social-media')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'generating', 'completed', 'failed'))
);

CREATE INDEX idx_v1_videos_brief ON v1_generated_videos(brief_id);
CREATE INDEX idx_v1_videos_status ON v1_generated_videos(status);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE v1_generated_videos IS 'Veo 3.1 generated videos for TV commercials, brand stories, etc.';
