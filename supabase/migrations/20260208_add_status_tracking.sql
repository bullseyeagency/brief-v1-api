-- Add status tracking columns to v1_generated_briefs
ALTER TABLE v1_generated_briefs
ADD COLUMN status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
ADD COLUMN progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
ADD COLUMN current_task TEXT,
ADD COLUMN logs JSONB DEFAULT '[]'::jsonb,
ADD COLUMN error_message TEXT;

-- Add index for status lookups
CREATE INDEX idx_v1_briefs_status ON v1_generated_briefs(status);

-- Comment
COMMENT ON COLUMN v1_generated_briefs.status IS 'Brief generation status: processing, completed, or failed';
COMMENT ON COLUMN v1_generated_briefs.progress IS 'Generation progress percentage (0-100)';
COMMENT ON COLUMN v1_generated_briefs.current_task IS 'Current task description for UI display';
COMMENT ON COLUMN v1_generated_briefs.logs IS 'Array of timestamped log entries';
