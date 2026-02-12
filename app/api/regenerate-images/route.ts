import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateMagazineImages } from '@/lib/image-generator';
import { saveMagazineImages } from '@/lib/image-storage';
import { CreativeBrief } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { briefId } = await request.json();

    if (!briefId) {
      return NextResponse.json({ error: 'Missing briefId' }, { status: 400 });
    }

    // Fetch brief from database
    console.log(`[Regenerate] Fetching brief ${briefId}...`);
    const { data: briefData, error: fetchError } = await supabase
      .from('v1_generated_briefs')
      .select('*')
      .eq('id', briefId)
      .single();

    if (fetchError || !briefData) {
      return NextResponse.json({ error: 'Brief not found' }, { status: 404 });
    }

    const brief: CreativeBrief = briefData.brief;
    if (!brief) {
      return NextResponse.json({ error: 'Brief data is null' }, { status: 400 });
    }

    // Extract business name from source URL
    const businessName = briefData.source_url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];

    // Generate magazine images
    console.log('[Regenerate] Generating magazine images...');
    const startTime = Date.now();
    const tempImages = await generateMagazineImages(brief, businessName);
    const generationTime = Date.now() - startTime;
    console.log(`[Regenerate] ✅ Images generated in ${(generationTime / 1000).toFixed(1)}s`);

    // Save images permanently
    console.log('[Regenerate] Saving images to storage...');
    const permanentImages = await saveMagazineImages(briefId, tempImages);
    console.log('[Regenerate] ✅ Images saved permanently');

    // Update database with images
    console.log('[Regenerate] Updating database...');
    const { error: updateError } = await supabase
      .from('v1_generated_briefs')
      .update({ images: permanentImages })
      .eq('id', briefId);

    if (updateError) {
      console.error('[Regenerate] Database update error:', updateError);
      return NextResponse.json({
        error: 'Failed to update database',
        details: updateError,
        images: permanentImages // Return images anyway
      }, { status: 500 });
    }

    console.log('[Regenerate] ✅ Database updated successfully');

    return NextResponse.json({
      success: true,
      images: permanentImages,
      generationTimeMs: generationTime,
      briefId: briefId
    });

  } catch (error) {
    console.error('[Regenerate] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to regenerate images' },
      { status: 500 }
    );
  }
}
