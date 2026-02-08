import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/brief/[slug]
 * Returns full brief data including status and content
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const { data: brief, error } = await supabase
      .from('v1_generated_briefs')
      .select('*')
      .eq('public_slug', slug)
      .eq('is_public', true)
      .single();

    if (error || !brief) {
      return NextResponse.json(
        { error: 'Brief not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(brief);
  } catch (error) {
    console.error('[Brief API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
