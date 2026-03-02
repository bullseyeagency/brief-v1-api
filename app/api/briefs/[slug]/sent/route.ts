import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface RouteParams {
  params: { slug: string };
}

export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  const { slug } = params;

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }

  const { error } = await supabase
    .from('v1_generated_briefs')
    .update({ sent_at: new Date().toISOString() })
    .eq('public_slug', slug);

  if (error) {
    console.error('[Sent] DB update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`[Sent] Brief ${slug} marked as sent`);
  return NextResponse.json({ success: true, slug, sent_at: new Date().toISOString() });
}
