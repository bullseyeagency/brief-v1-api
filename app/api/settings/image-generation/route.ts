import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const DEFAULT_SLOTS: Record<string, boolean> = {
  avatars: true,
  cover: false,
  'pages.brandTruth': false,
  'pages.marketContext': true,
  'pages.problem': true,
  'pages.transformation': true,
  'pages.proofPillars': false,
  'pages.offer': true,
  'pages.messaging': false,
  'pages.creativeDirection': false,
  backCover: true,
  facebookImages: true,
  storyboardFrames: true,
};

export async function GET() {
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'image_slots')
    .single();

  return NextResponse.json({ slots: data?.value ?? DEFAULT_SLOTS });
}

export async function POST(req: NextRequest) {
  const { slots } = await req.json();
  await supabase
    .from('app_settings')
    .upsert({ key: 'image_slots', value: slots, updated_at: new Date().toISOString() });
  return NextResponse.json({ success: true });
}
