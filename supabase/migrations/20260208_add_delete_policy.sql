-- Add DELETE and UPDATE policies for v1_generated_briefs
-- Allows anyone to delete/update briefs (no auth required for now)

-- Allow anyone to delete briefs
CREATE POLICY "Anyone can delete briefs"
ON v1_generated_briefs FOR DELETE
USING (true);

-- Allow anyone to update briefs (needed for status updates)
CREATE POLICY "Anyone can update briefs"
ON v1_generated_briefs FOR UPDATE
USING (true)
WITH CHECK (true);
