import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/brief/[slug]
 * Returns full brief data including status and content
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

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

/**
 * DELETE /api/brief/[slug]
 * Deletes a brief from the database
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const { error } = await supabase
      .from('v1_generated_briefs')
      .delete()
      .eq('public_slug', slug);

    if (error) {
      console.error('[Brief API] Delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete brief' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Brief API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
