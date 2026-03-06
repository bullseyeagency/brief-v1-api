-- =====================================================
-- user_roles table
-- Stores application-level roles for auth users.
-- superadmin: full access to admin dashboard and API controls
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Only the service role (server-side) can read or write roles.
-- Authenticated users can read their own row.
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role bypasses RLS for inserts/updates.
