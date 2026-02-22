-- Add token usage and cost tracking to v1_generated_briefs
-- Run manually in Supabase SQL editor (CLI not linked)

ALTER TABLE v1_generated_briefs
  ADD COLUMN IF NOT EXISTS tokens_used JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cost_usd    NUMERIC(10, 6) DEFAULT NULL;

COMMENT ON COLUMN v1_generated_briefs.tokens_used IS
  'Token counts per AI call: { brief: { prompt, completion, total }, deliverables: { prompt, completion, total }, total }';

COMMENT ON COLUMN v1_generated_briefs.cost_usd IS
  'Estimated generation cost in USD (GPT-5: $1.75/1M input, $14.00/1M output)';
