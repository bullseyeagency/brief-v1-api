/**
 * Supabase client for brief-v1-api
 * Shared database with creative-brief-v2 but separate tables (v1_*)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client for regular database operations (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations like storage (uses service role key)
// This has full permissions and should ONLY be used on the server
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Database types for v1 tables
 */
export interface V1GeneratedBrief {
  id: string;
  source_url: string;
  crawl_result: any;
  brief: any;
  deliverables: any;
  provider: string;
  model: string;
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  generation_time_ms?: number;
  public_slug: string;
  is_public: boolean;
  sophia_contact_id?: string;
  metadata?: any;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  current_task?: string;
  logs: string[];
  error_message?: string;
  created_at: string;
  expires_at?: string;
}

export interface V1PersonaImage {
  id: string;
  brief_id: string;
  persona_name: string;
  persona_type: 'primary' | 'secondary' | 'tertiary';
  image_url: string;
  generation_prompt: string;
  provider: string;
  model: string;
  generation_time_ms?: number;
  created_at: string;
}

export interface V1ComicPanel {
  id: string;
  brief_id: string;
  panel_number: number;
  panel_type: 'brand-story' | '30sec-commercial';
  scene: string;
  caption?: string;
  dialogue?: string;
  character_focus: string;
  image_url?: string;
  provider: string;
  model?: string;
  generation_time_ms?: number;
  created_at: string;
}
