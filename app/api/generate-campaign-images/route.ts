import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { CreativeBrief, Deliverables, BriefImages } from '@/lib/types';
import { generateCampaignImages } from '@/lib/image-generator';
import { saveCampaignImages } from '@/lib/image-storage';

export async function POST(req: NextRequest) {
  try {
    const { briefId, model } = await req.json();
    if (!briefId) {
      return NextResponse.json({ error: 'Missing briefId' }, { status: 400 });
    }

    // 1. Fetch brief
    const { data, error } = await supabase
      .from('v1_generated_briefs')
      .select('brief, deliverables, images, source_url')
      .eq('id', briefId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Brief not found', detail: error }, { status: 404 });
    }

    const deliverables = data.deliverables as Deliverables;
    const existingImages = (data.images ?? {}) as BriefImages;
    const businessName = (data.source_url as string)
      .replace(/^https?:\/\/(www\.)?/, '')
      .split('/')[0];

    if (!Array.isArray(deliverables.facebookCampaigns) || deliverables.facebookCampaigns.length < 3) {
      return NextResponse.json({ error: 'Brief does not have 3 facebookCampaigns (array format required)' }, { status: 400 });
    }
    if (!deliverables.video8s) {
      return NextResponse.json({ error: 'Brief does not have video8s deliverable' }, { status: 400 });
    }

    // 2. Generate 6 images
    const imageModel = model || 'gemini-2.5-flash-image';
    console.log(`[CampaignImages] Generating 6 images for brief ${briefId} with ${imageModel}...`);
    const tempImages = await generateCampaignImages(deliverables, businessName, imageModel);

    // 3. Save permanently
    const permanentImages = await saveCampaignImages(briefId, tempImages);

    // 4. Merge into existing images and update DB
    const mergedImages: BriefImages = {
      ...existingImages,
      facebookImages: permanentImages.facebookImages,
      storyboardFrames: permanentImages.storyboardFrames,
    };

    const { error: updateError } = await supabase
      .from('v1_generated_briefs')
      .update({ images: mergedImages })
      .eq('id', briefId);

    if (updateError) {
      console.error('[CampaignImages] DB update failed:', updateError);
      return NextResponse.json({ error: 'Generated images but failed to save to DB', detail: updateError }, { status: 500 });
    }

    console.log(`[CampaignImages] Done — 6 images saved for brief ${briefId}`);

    return NextResponse.json({
      success: true,
      facebookImages: permanentImages.facebookImages,
      storyboardFrames: permanentImages.storyboardFrames,
    });
  } catch (err) {
    console.error('[CampaignImages] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
