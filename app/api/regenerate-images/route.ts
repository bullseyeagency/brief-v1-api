import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  generateMagazineImages,
  generateAvatarImages,
  generateMagazinePages,
  generateCampaignImages,
} from '@/lib/image-generator';
import { saveMagazineImages, saveImagePermanently } from '@/lib/image-storage';
import { CreativeBrief, BriefImages } from '@/lib/types';

type RegenType = 'all' | 'avatars' | 'journey' | 'facebook' | 'tv';

export async function POST(request: NextRequest) {
  try {
    const { briefId, type = 'all', model } = await request.json();

    if (!briefId) {
      return NextResponse.json({ error: 'Missing briefId' }, { status: 400 });
    }

    const imageModel = model || 'gemini-2.5-flash-image';
    const regenType: RegenType = type;

    console.log(`[Regenerate] type=${regenType} brief=${briefId} model=${imageModel}`);

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

    const businessName = briefData.source_url
      ? briefData.source_url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
      : 'Business';

    const existingImages: BriefImages = briefData.images || {};
    const startTime = Date.now();
    let mergedImages: BriefImages = { ...existingImages };

    if (regenType === 'all') {
      const tempImages = await generateMagazineImages(brief, businessName, imageModel);
      mergedImages = await saveMagazineImages(briefId, tempImages);
      await supabase
        .from('v1_generated_briefs')
        .update({
          images: mergedImages,
          image_credits: tempImages.creditsUsed,
          image_cost_usd: tempImages.imageCostUsd,
        })
        .eq('id', briefId);

    } else if (regenType === 'avatars') {
      const avatarUrls = await generateAvatarImages(brief, businessName, imageModel);
      const [avatar1, avatar2, avatar3] = await Promise.all([
        saveImagePermanently(avatarUrls[0], briefId, 'avatar_primary'),
        saveImagePermanently(avatarUrls[1], briefId, 'avatar_secondary'),
        saveImagePermanently(avatarUrls[2], briefId, 'avatar_tertiary'),
      ]);
      mergedImages = { ...existingImages, avatars: [avatar1, avatar2, avatar3] };
      await supabase.from('v1_generated_briefs').update({ images: mergedImages }).eq('id', briefId);

    } else if (regenType === 'journey') {
      const existingAvatars: [string, string, string] = [
        existingImages.avatars?.[0] || '',
        existingImages.avatars?.[1] || '',
        existingImages.avatars?.[2] || '',
      ];
      const pages = await generateMagazinePages(brief, businessName, existingAvatars, imageModel);
      const [
        cover, brandTruth, marketContext, problem, transformation,
        proofPillars, offer, messaging, creativeDirection, backCover,
      ] = await Promise.all([
        saveImagePermanently(pages.cover, briefId, 'page_cover'),
        saveImagePermanently(pages.pages.brandTruth, briefId, 'page_brand_truth'),
        saveImagePermanently(pages.pages.marketContext, briefId, 'page_market_context'),
        saveImagePermanently(pages.pages.problem, briefId, 'page_problem'),
        saveImagePermanently(pages.pages.transformation, briefId, 'page_transformation'),
        saveImagePermanently(pages.pages.proofPillars, briefId, 'page_proof_pillars'),
        saveImagePermanently(pages.pages.offer, briefId, 'page_offer'),
        saveImagePermanently(pages.pages.messaging, briefId, 'page_messaging'),
        saveImagePermanently(pages.pages.creativeDirection, briefId, 'page_creative_direction'),
        saveImagePermanently(pages.backCover, briefId, 'page_back_cover'),
      ]);
      mergedImages = {
        ...existingImages,
        cover,
        pages: { brandTruth, marketContext, problem, transformation, proofPillars, offer, messaging, creativeDirection },
        backCover,
      };
      await supabase.from('v1_generated_briefs').update({ images: mergedImages }).eq('id', briefId);

    } else if (regenType === 'facebook' || regenType === 'tv') {
      const deliverables = briefData.deliverables;
      if (!deliverables) {
        return NextResponse.json({ error: 'No deliverables found for this brief' }, { status: 400 });
      }
      const campaignImages = await generateCampaignImages(deliverables, businessName, imageModel);
      if (regenType === 'facebook') {
        const [fb1, fb2, fb3] = await Promise.all([
          saveImagePermanently(campaignImages.facebookImages[0], briefId, 'fb_ad_primary'),
          saveImagePermanently(campaignImages.facebookImages[1], briefId, 'fb_ad_secondary'),
          saveImagePermanently(campaignImages.facebookImages[2], briefId, 'fb_ad_tertiary'),
        ]);
        mergedImages = { ...existingImages, facebookImages: [fb1, fb2, fb3] };
      } else {
        const [sb1, sb2, sb3] = await Promise.all([
          saveImagePermanently(campaignImages.storyboardFrames[0], briefId, 'storyboard_recognition'),
          saveImagePermanently(campaignImages.storyboardFrames[1], briefId, 'storyboard_proof'),
          saveImagePermanently(campaignImages.storyboardFrames[2], briefId, 'storyboard_belief'),
        ]);
        mergedImages = { ...existingImages, storyboardFrames: [sb1, sb2, sb3] };
      }
      await supabase.from('v1_generated_briefs').update({ images: mergedImages }).eq('id', briefId);
    }

    console.log(`[Regenerate] Done in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

    return NextResponse.json({
      success: true,
      images: mergedImages,
      generationTimeMs: Date.now() - startTime,
      briefId,
      type: regenType,
    });

  } catch (error) {
    console.error('[Regenerate] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to regenerate images' },
      { status: 500 }
    );
  }
}
