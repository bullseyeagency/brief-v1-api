/**
 * Applies the user_roles migration to Supabase via the transaction pooler.
 * Supabase transaction pooler (port 6543) accepts the service role key as password.
 *
 * Usage: npm run apply:migration
 */

import { Client } from 'pg';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Extract project ref from URL: https://<ref>.supabase.co
const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
if (!match) {
  console.error('Could not parse project ref from NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

const projectRef = match[1];

const sql = `
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_roles' AND policyname = 'Users can read own role'
  ) THEN
    CREATE POLICY "Users can read own role"
      ON public.user_roles FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END;
$$;
`;

async function applyMigration(): Promise<void> {
  // Try common Supabase pooler regions
  const regions = [
    'us-east-1', 'us-east-2', 'us-west-1',
    'eu-west-1', 'eu-central-1',
    'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1',
    'ca-central-1', 'sa-east-1',
  ];

  let connected = false;
  let client!: Client;

  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    client = new Client({
      host,
      port: 6543,
      database: 'postgres',
      user: `postgres.${projectRef}`,
      password: supabaseServiceKey,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
    try {
      await client.connect();
      console.log(`Connected via ${host}`);
      connected = true;
      break;
    } catch (err) {
      await client.end().catch(() => {});
    }
  }

  if (!connected) {
    throw new Error('Could not connect to any Supabase pooler region. Check your credentials or apply the migration manually via the Supabase SQL editor.');
  }

  try {
    console.log('Connecting to Supabase transaction pooler...');
    await client.connect();
    console.log('Connected. Applying migration...');
    await client.query(sql);
    console.log('Migration applied successfully.');
  } finally {
    await client.end();
  }
}

applyMigration().catch((err: Error) => {
  console.error('Migration failed:', err.message ?? err);
  process.exit(1);
});
