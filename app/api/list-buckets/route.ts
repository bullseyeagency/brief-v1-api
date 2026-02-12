import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

/**
 * Lists all available storage buckets to help debug
 * GET /api/list-buckets
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Bucket List] Fetching all buckets...');

    // Check if Supabase client is configured
    if (!supabase) {
      return NextResponse.json({
        error: 'Supabase client not initialized',
        message: 'Check your SUPABASE_URL and SUPABASE_ANON_KEY environment variables'
      }, { status: 500 });
    }

    // List all buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('[Bucket List] Error:', error);
      return NextResponse.json({
        error: error.message,
        details: error,
        hint: 'Check your Supabase credentials and permissions'
      }, { status: 500 });
    }

    console.log('[Bucket List] Found buckets:', buckets);

    return NextResponse.json({
      success: true,
      totalBuckets: buckets?.length || 0,
      buckets: buckets?.map(b => ({
        id: b.id,
        name: b.name,
        public: b.public,
        created_at: b.created_at,
        updated_at: b.updated_at
      })) || [],
      lookingFor: 'brief-images',
      found: buckets?.some(b => b.name === 'brief-images') || false,
      message: buckets?.length
        ? `Found ${buckets.length} bucket(s)`
        : 'No buckets found - create one in Supabase dashboard'
    });

  } catch (error) {
    console.error('[Bucket List] Unexpected error:', error);
    return NextResponse.json({
      error: 'Unexpected error',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
