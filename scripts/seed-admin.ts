/**
 * One-time script to provision a superadmin user in Supabase Auth
 * and upsert a superadmin record in the user_roles table.
 *
 * Prerequisites — add to .env.local:
 *   SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@[host]:5432/postgres
 *   (Get this from Supabase Dashboard → Project Settings → Database → Connection string)
 *
 * If SUPABASE_DB_URL is not set, the script will:
 *   1. Create the auth user
 *   2. Print the SQL needed to create user_roles and insert the role
 *   3. Exit with instructions
 *
 * Usage: npm run seed:admin
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.SUPABASE_DB_URL;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const ADMIN_EMAIL = 'marco@thebullseye.agency';
const ADMIN_PASSWORD = 'Generic2023$$';

async function seedAdmin(): Promise<void> {
  // ----------------------------------------------------------------
  // Step 1 — Create or find the auth user via Supabase Auth Admin API
  // ----------------------------------------------------------------
  console.log(`Creating user: ${ADMIN_EMAIL}`);

  const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
  });

  let userId: string;

  if (createError) {
    const msg = createError.message.toLowerCase();
    if (msg.includes('already been registered') || msg.includes('already exists')) {
      console.log('User already exists — fetching existing user...');
      const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) throw new Error(`Failed to list users: ${listError.message}`);
      const existing = listData.users.find((u) => u.email === ADMIN_EMAIL);
      if (!existing) throw new Error(`Could not find existing user with email ${ADMIN_EMAIL}`);
      userId = existing.id;
      console.log(`Found existing user: ${userId}`);
    } else {
      throw new Error(`Failed to create user: ${createError.message}`);
    }
  } else {
    userId = createData.user.id;
    console.log(`User created: ${userId}`);
  }

  // ----------------------------------------------------------------
  // Step 2 — Upsert role via Postgres (if SUPABASE_DB_URL is set)
  //          or via PostgREST (if table already exists in schema cache)
  //          or print manual SQL instructions
  // ----------------------------------------------------------------

  if (dbUrl) {
    // Direct Postgres path — no schema cache issues
    const { Client } = await import('pg');
    const pg = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    });

    try {
      console.log('Connecting to Postgres...');
      await pg.connect();
      console.log('Connected.');

      // Create table if needed
      await pg.query(`
        CREATE TABLE IF NOT EXISTS public.user_roles (
          id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          role       TEXT        NOT NULL DEFAULT 'user',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id)
        );
        ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
      `);

      // Add RLS policy if missing
      await pg.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename   = 'user_roles'
              AND policyname  = 'Users can read own role'
          ) THEN
            CREATE POLICY "Users can read own role"
              ON public.user_roles FOR SELECT
              TO authenticated
              USING (auth.uid() = user_id);
          END IF;
        END;
        $$;
      `);

      console.log('user_roles table ready.');

      // Upsert superadmin role
      await pg.query(
        `INSERT INTO public.user_roles (user_id, role)
         VALUES ($1, 'superadmin')
         ON CONFLICT (user_id) DO UPDATE SET role = 'superadmin'`,
        [userId]
      );

      console.log(`Role 'superadmin' assigned to user ${userId}`);
    } finally {
      await pg.end();
    }
  } else {
    // Try PostgREST (works if table already exists and schema cache is warm)
    const { error: probeError } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .limit(1);

    if (!probeError) {
      // Table is accessible via PostgREST
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({ user_id: userId, role: 'superadmin' }, { onConflict: 'user_id' });

      if (roleError) throw new Error(`Failed to upsert user role: ${roleError.message}`);
      console.log(`Role 'superadmin' assigned to user ${userId}`);
    } else {
      // Table doesn't exist or schema cache is stale — print manual SQL
      const projectRef = supabaseUrl!.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? '_';
      console.log('\n------------------------------------------------------------');
      console.log('ACTION REQUIRED: user_roles table not found.');
      console.log(`\nOpen the SQL editor: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
      console.log('\nRun this SQL:\n');
      console.log(`CREATE TABLE IF NOT EXISTS public.user_roles (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Assign superadmin role to the provisioned user
INSERT INTO public.user_roles (user_id, role)
VALUES ('${userId}', 'superadmin')
ON CONFLICT (user_id) DO UPDATE SET role = 'superadmin';`);
      console.log('\n------------------------------------------------------------');
      console.log('\nAlternatively, add SUPABASE_DB_URL to .env.local and re-run:');
      console.log('  SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@[host]:5432/postgres');
      console.log('\nAuth user was created successfully. Only the role assignment is pending.');
      process.exit(1);
    }
  }

  console.log('Done. Superadmin user provisioned successfully.');
}

seedAdmin().catch((err: Error) => {
  console.error('seed-admin failed:', err.message ?? err);
  process.exit(1);
});
