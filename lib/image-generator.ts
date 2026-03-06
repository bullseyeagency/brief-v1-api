/**
 * @fileoverview Image generation module for creative briefs
 * Generates comic-style images for avatars and brief sections using Gemini/Imagen
 */

import { Avatar, CreativeBrief, Deliverables, FacebookCampaign, Video8sSection } from './types';

export interface ImageGenerationResult {
  avatars: [string, string, string]; // 3 avatar image URLs
  sections: {
    brandTruth: string;
    marketContext: string;
    problem: string;
    transformation: string;
    proofPillars: string;
  };
  generationTimeMs: number;
}

export interface MagazineImageGenerationResult {
  cover: string;
  avatars: [string, string, string];
  pages: {
    brandTruth: string;
    marketContext: string;
    problem: string;
    transformation: string;
    proofPillars: string;
    offer: string;
    messaging: string;
    creativeDirection: string;
  };
  backCover: string;
  generationTimeMs: number;
  creditsUsed: number;
  imageCostUsd: number;
}

export interface CampaignImageGenerationResult {
  facebookImages: [string, string, string];
  storyboardFrames: [string, string, string];
}

/** Credits consumed per image by model (source: NanoBanana API docs) */
const CREDITS_PER_IMAGE: Record<string, number> = {
  'gemini-2.5-flash-image':                    2,
  'gemini-2.5-flash-image-hd':                 5,
  'gemini-3.1-flash-image-preview-512':        4,
  'gemini-3.1-flash-image-preview':            4,
  'gemini-3.1-flash-image-preview-2k':         6,
  'gemini-3.1-flash-image-preview-4k':         8,
  'gemini-3-pro-image-preview':                8,
  'gemini-3-pro-image-preview-2k':             8,
  'gemini-3-pro-image-preview-4k':            16,
};
const COST_PER_CREDIT = 0.01; // $10 per 1000 credits

/**
 * Builds avatar image prompt in modern comic style
 */
function buildAvatarImagePrompt(
  avatar: Avatar,
  briefContext: string
): string {
  const moodMap = {
    primary: 'confident, successful, inspiring',
    secondary: 'relatable, hopeful, determined',
    tertiary: 'accomplished, satisfied, aspirational',
  };

  const avatarName = avatar.name || 'Customer';
  return `Modern graphic novel multi-panel portrait: ${avatarName}, age ${avatar.age || 30}. Background: ${avatar.background || 'Professional background'}. Current state: ${avatar.currentState || 'Seeking solutions'}. Transformation: ${avatar.transformation || 'Finding success'}. Desire: "${avatar.desire || 'Better outcomes'}". Large center panel showing ${moodMap[avatar.type] || 'confident'} expression, surrounded by 4-6 panels showing journey. Top banner: "${avatarName.toUpperCase()}'S EVOLUTION". Speech bubble with quote. Badge icons. Business: ${briefContext}. Style: clean lines, natural tones, soft pastels, beige backgrounds, subtle halftone, contemporary comic, NOT vintage.`.trim();
}

/**
 * Builds brand truth section image prompt
 */
function buildBrandTruthImagePrompt(brief: CreativeBrief): string {
  return `Modern comic illustration: 2-panel split. Left: symbolic imagery for brand truth. Right: promise delivered (success/achievement). Arrow connecting panels. Top banner "THE BRAND PROMISE". Circular badge icons. Style: clean lines, soft pastels, beige/cream background, gold/blue accents, subtle halftone texture, professional contemporary design. Truth: ${brief.brandTruth.substring(0, 150)}. Promise: ${brief.brandPromise.substring(0, 150)}.`.trim();
}

/**
 * Builds market context section image prompt
 */
function buildMarketContextImagePrompt(brief: CreativeBrief): string {
  return `Modern business comic: Wide market landscape with 3-4 small panels showing customer segments and competitors. Circular icons for market forces. Top banner "THE MARKET LANDSCAPE". Style: clean lines, professional blues/grays/gold, muted backgrounds, contemporary editorial illustration. Market: ${brief.marketContext.substring(0, 200)}.`.trim();
}

/**
 * Builds problem & tension section image prompt
 */
function buildProblemImagePrompt(brief: CreativeBrief): string {
  return `Modern comic: 3-4 panels showing problem escalating. Worried character expressions, thought bubbles with concerns, question marks. Dark muted backgrounds (grays, blues, purples). Top banner "THE CHALLENGE". Style: clean lines, professional, subtle texture, empathetic tone. Problem: ${brief.humanProblem.substring(0, 200)}.`.trim();
}

/**
 * Builds transformation section image prompt
 */
function buildTransformationImagePrompt(brief: CreativeBrief): string {
  return `Modern comic: 2 large side-by-side panels. Left: before state (muted grays/blues, stressed expression). Right: after state (vibrant pastels/gold, confident, successful). Large arrow between. Badge icons on right. Top banner "THE TRANSFORMATION". Style: clean lines, dramatic color shift, professional finish. Before: ${brief.beforeState.substring(0, 150)}. After: ${brief.afterState.substring(0, 150)}.`.trim();
}

/**
 * Builds proof pillars section image prompt
 */
function buildProofPillarsImagePrompt(brief: CreativeBrief): string {
  const pillarsText = brief.proofPillars
    .map((p, i) => `${i + 1}. ${p.claim.substring(0, 40)}`)
    .join(', ');

  return `Modern comic credibility wall: 5 shield/badge icons in balanced pattern. Bold numbers 1-5, each badge different color (gold/blue/green). Top banner "PROVEN RESULTS". Style: clean professional design, subtle halftone, beige/cream background, contemporary certification graphics. Pillars: ${pillarsText}.`.trim();
}

// ============================================================================
// MAGAZINE PAGE PROMPTS
// ============================================================================

/**
 * Builds cover page prompt
 */
export function buildCoverPagePrompt(brief: CreativeBrief, businessName: string): string {
  return `Modern comic book cover illustration. A confident professional figure in hero pose with city skyline behind. Large bold title "${businessName.toUpperCase()}" at top. Subtitle "CREATIVE BRIEF" below. Modern graphic novel style, vibrant but professional colors, magazine quality. 1:1 square format.`.trim();
}

/**
 * Builds Brand Truth page prompt
 */
export function buildBrandTruthPagePrompt(brief: CreativeBrief): string {
  return `Modern comic panel: a professional figure experiencing a revelation moment, discovering "${brief.brandTruth.substring(0, 100)}". Scene: modern office or workspace, lightbulb moment, confident expression. Top banner "BRAND TRUTH". Style: modern graphic novel, clean lines, soft pastels. 1:1 square.`.trim();
}

/**
 * Builds Market Context page prompt
 */
export function buildMarketContextPagePrompt(brief: CreativeBrief): string {
  return `Modern comic panel: a professional figure analyzing the market, viewing charts, graphs, or competitive landscape. Scene represents: "${brief.marketContext.substring(0, 100)}". Professional business setting. Top banner "MARKET LANDSCAPE". Style: modern graphic novel, blues and golds. 1:1 square.`.trim();
}

/**
 * Builds Problem page prompt
 */
export function buildProblemPagePrompt(brief: CreativeBrief): string {
  return `Modern comic panel: a professional figure struggling with: "${brief.humanProblem.substring(0, 100)}". Worried expression, thought bubbles with concerns, stressed posture. Dark muted background. Top banner "THE CHALLENGE". Style: empathetic, professional, clean lines. 1:1 square.`.trim();
}

/**
 * Builds Transformation page prompt
 */
export function buildTransformationPagePrompt(brief: CreativeBrief): string {
  return `Modern comic 2-panel split illustration. LEFT PANEL: a professional figure struggling (${brief.beforeState.substring(0, 80)}), muted colors, stressed expression. RIGHT PANEL: same figure succeeding (${brief.afterState.substring(0, 80)}), vibrant colors, confident posture. Large arrow between panels. Top banner "TRANSFORMATION". 1:1 square.`.trim();
}

/**
 * Builds Proof Pillars page prompt
 */
export function buildProofPillarsPagePrompt(brief: CreativeBrief): string {
  const pillarsText = brief.proofPillars
    .map((p, i) => `${i + 1}. ${p.claim.substring(0, 30)}`)
    .join(', ');

  return `Modern comic panel: a professional figure confidently presenting success stories, surrounded by 5 shield/badge icons with numbers 1-5. Professional presenter stance. Top banner "PROVEN RESULTS". Credibility wall behind them. Pillars: ${pillarsText}. Style: modern graphic novel. 1:1 square.`.trim();
}

/**
 * Builds Offer page prompt
 */
export function buildOfferPagePrompt(brief: CreativeBrief): string {
  return `Modern comic panel: a professional figure presenting the solution/offer with confident gesture, pointing to offer details: "${brief.offer.substring(0, 100)}". Call-to-action energy. Top banner "THE OFFER". Modern business presentation style. 1:1 square.`.trim();
}

/**
 * Builds Messaging page prompt
 */
export function buildMessagingPagePrompt(brief: CreativeBrief): string {
  const rulesText = brief.messagingRules.slice(0, 3).join(', ');

  return `Modern comic panel: a professional figure communicating a message with speech bubbles and confident stance. Messaging rules visible: "${rulesText}". Top banner "MESSAGING FRAMEWORK". Professional communicator style. 1:1 square.`.trim();
}

/**
 * Builds Creative Direction page prompt (pure visual showcase)
 */
export function buildCreativeDirectionPagePrompt(brief: CreativeBrief): string {
  return `Visual style showcase for creative direction: ${brief.visualStyle.substring(0, 150)}. Modern brand identity board with color swatches, typography samples, visual elements. Top banner "CREATIVE DIRECTION". Professional design presentation. 1:1 square.`.trim();
}

/**
 * Builds Back Cover page prompt (CTA and branding)
 */
export function buildBackCoverPagePrompt(businessName: string, cta: string): string {
  return `Comic book back cover design. Bold text "NEXT STEPS" at top. Call-to-action: "${cta.substring(0, 100)}". Business name "${businessName}" at bottom. Modern magazine back cover style, professional finish. 1:1 square.`.trim();
}

export function buildFacebookAdImagePrompt(campaign: FacebookCampaign, businessName: string): string {
  return `Modern digital advertising visual: ${campaign.visualDirection.substring(0, 200)}. Business: ${businessName}. Campaign objective: ${campaign.objective}. Target audience: ${campaign.targetAvatar} customer. Style: clean, professional, high-contrast, social media ready, lifestyle photography aesthetic. Square format 1:1.`.trim();
}

export function buildStoryboardFramePrompt(section: Video8sSection, _sectionName: string, businessName: string): string {
  return `${section.visualDirection.substring(0, 300)}. Business: ${businessName}. 16:9 cinematic landscape, photorealistic, film production quality.`.trim();
}

/**
 * Generates a single image using NanoBanana API
 */
export async function generateImage(prompt: string, model: string = 'gemini-3-pro-image-preview', imageSize: string = '1:1'): Promise<string> {
  const apiKey = process.env.NANOBANANA_API_KEY;
  if (!apiKey) {
    throw new Error('NANOBANANA_API_KEY not configured');
  }

  try {
    const response = await fetch(
      'https://api.nanobananaapi.dev/v1/images/generate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          num: 1,
          image_size: imageSize,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NanoBanana API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[NanoBanana] Full response:', JSON.stringify(data, null, 2));

    // Check for API error
    if (data.code !== 0) {
      throw new Error(`NanoBanana error: ${data.message}`);
    }

    // Extract image URL from response
    const imageUrl = data.data?.url;
    if (!imageUrl) {
      throw new Error('No image URL in NanoBanana response');
    }

    return imageUrl;
  } catch (error) {
    console.error('Image generation error:', error);
    throw error;
  }
}

/**
 * Builds a minimal fallback avatar prompt for when the full prompt triggers content filters
 */
function buildAvatarFallbackPrompt(avatar: Avatar, briefContext: string): string {
  const typeLabel = avatar.type === 'primary' ? 'hero' : avatar.type === 'secondary' ? 'supporting' : 'aspirational';
  return `Modern graphic novel portrait of a professional person, age ${avatar.age || 30}. ${typeLabel} character in a business setting. Confident expression. Style: clean lines, soft pastels, beige background, contemporary comic illustration. Business context: ${briefContext}. Square format.`.trim();
}

/**
 * Generates a single avatar image with automatic fallback to a simpler prompt
 * if the full prompt triggers Gemini's content filter.
 */
export async function generateAvatarWithFallback(
  avatar: Avatar,
  businessName: string,
  model: string
): Promise<string> {
  try {
    return await generateImage(buildAvatarImagePrompt(avatar, businessName), model, '1:1');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[Magazine] Avatar generation failed for ${avatar.name} (${msg}), retrying with fallback prompt...`);
    return await generateImage(buildAvatarFallbackPrompt(avatar, businessName), model, '1:1');
  }
}

/**
 * Phase 1 only: Generate 3 avatar images in parallel
 * Returns avatar URLs for use as references in Phase 2
 */
export async function generateAvatarImages(
  brief: CreativeBrief,
  businessName: string,
  model: string = 'gemini-2.5-flash-image'
): Promise<[string, string, string]> {
  console.log(`[Magazine] Generating 3 avatar images (${model})...`);
  const [avatar1Url, avatar2Url, avatar3Url] = await Promise.all([
    generateAvatarWithFallback(brief.avatars[0], businessName, model),
    generateAvatarWithFallback(brief.avatars[1], businessName, model),
    generateAvatarWithFallback(brief.avatars[2], businessName, model),
  ]);
  console.log('[Magazine] ✓ 3 avatars generated');
  return [avatar1Url, avatar2Url, avatar3Url];
}

/**
 * Phase 2 only: Generate cover + 8 section pages + back cover in parallel
 * Accepts avatar URLs from Phase 1 (available for reference if needed later)
 */
export async function generateMagazinePages(
  brief: CreativeBrief,
  businessName: string,
  avatarUrls: [string, string, string],
  model: string = 'gemini-2.5-flash-image'
): Promise<{
  cover: string;
  pages: {
    brandTruth: string;
    marketContext: string;
    problem: string;
    transformation: string;
    proofPillars: string;
    offer: string;
    messaging: string;
    creativeDirection: string;
  };
  backCover: string;
}> {
  // Store avatar URLs on brief for prompt builders to use if needed
  brief.avatars[0].generatedImageUrl = avatarUrls[0];
  brief.avatars[1].generatedImageUrl = avatarUrls[1];
  brief.avatars[2].generatedImageUrl = avatarUrls[2];

  console.log(`[Magazine] Generating 10 magazine pages (${model})...`);
  const [cover, page1, page2, page3, page4, page5, page6, page7, page8, backCover] =
    await Promise.all([
      generateImage(buildCoverPagePrompt(brief, businessName), model, '1:1'),
      generateImage(buildBrandTruthPagePrompt(brief), model, '1:1'),
      generateImage(buildMarketContextPagePrompt(brief), model, '1:1'),
      generateImage(buildProblemPagePrompt(brief), model, '1:1'),
      generateImage(buildTransformationPagePrompt(brief), model, '1:1'),
      generateImage(buildProofPillarsPagePrompt(brief), model, '1:1'),
      generateImage(buildOfferPagePrompt(brief), model, '1:1'),
      generateImage(buildMessagingPagePrompt(brief), model, '1:1'),
      generateImage(buildCreativeDirectionPagePrompt(brief), model, '1:1'),
      generateImage(buildBackCoverPagePrompt(businessName, brief.callToAction), model, '1:1'),
    ]);

  console.log('[Magazine] ✓ 10 pages generated');
  return {
    cover,
    pages: {
      brandTruth: page1,
      marketContext: page2,
      problem: page3,
      transformation: page4,
      proofPillars: page5,
      offer: page6,
      messaging: page7,
      creativeDirection: page8,
    },
    backCover,
  };
}

/**
 * Generates all magazine images using avatar references for character consistency.
 * Probe-first: fires 1 image to validate the API is working, then fires the
 * remaining 12 in parallel. Any error on the probe aborts immediately without
 * spending credits on the full batch.
 */
export async function generateMagazineImages(
  brief: CreativeBrief,
  businessName: string,
  model: string = 'gemini-3-pro-image-preview'
): Promise<MagazineImageGenerationResult> {
  const startTime = Date.now();

  // PROBE: fire 1 image first to validate API key, model, and quota
  console.log(`[Magazine] Probe — generating 1 test image with ${model}...`);
  const avatar1Url = await generateAvatarWithFallback(brief.avatars[0], businessName, model);
  console.log('[Magazine] ✓ Probe succeeded — firing remaining 12 images in parallel');

  // BATCH: remaining 12 images in parallel
  const [
    avatar2Url, avatar3Url,
    cover, page1, page2, page3, page4, page5, page6, page7, page8, backCover,
  ] = await Promise.all([
    generateAvatarWithFallback(brief.avatars[1], businessName, model),
    generateAvatarWithFallback(brief.avatars[2], businessName, model),
    generateImage(buildCoverPagePrompt(brief, businessName), model, '1:1'),
    generateImage(buildBrandTruthPagePrompt(brief), model, '1:1'),
    generateImage(buildMarketContextPagePrompt(brief), model, '1:1'),
    generateImage(buildProblemPagePrompt(brief), model, '1:1'),
    generateImage(buildTransformationPagePrompt(brief), model, '1:1'),
    generateImage(buildProofPillarsPagePrompt(brief), model, '1:1'),
    generateImage(buildOfferPagePrompt(brief), model, '1:1'),
    generateImage(buildMessagingPagePrompt(brief), model, '1:1'),
    generateImage(buildCreativeDirectionPagePrompt(brief), model, '1:1'),
    generateImage(buildBackCoverPagePrompt(businessName, brief.callToAction), model, '1:1'),
  ]);

  brief.avatars[0].generatedImageUrl = avatar1Url;
  brief.avatars[1].generatedImageUrl = avatar2Url;
  brief.avatars[2].generatedImageUrl = avatar3Url;

  const generationTimeMs = Date.now() - startTime;

  const creditsPerImage = CREDITS_PER_IMAGE[model] ?? 2;
  const creditsUsed = 13 * creditsPerImage;
  const imageCostUsd = parseFloat((creditsUsed * COST_PER_CREDIT).toFixed(4));

  console.log(`[Magazine] ✅ All 13 images generated in ${(generationTimeMs / 1000).toFixed(1)}s — ${creditsUsed} credits ($${imageCostUsd})`);

  return {
    cover,
    avatars: [avatar1Url, avatar2Url, avatar3Url],
    pages: {
      brandTruth: page1,
      marketContext: page2,
      problem: page3,
      transformation: page4,
      proofPillars: page5,
      offer: page6,
      messaging: page7,
      creativeDirection: page8,
    },
    backCover,
    generationTimeMs,
    creditsUsed,
    imageCostUsd,
  };
}

/**
 * Generates all images for a creative brief in parallel
 */
export async function generateBriefImages(
  brief: CreativeBrief,
  businessName: string,
  model: string = 'gemini-3-pro-image-preview'
): Promise<ImageGenerationResult> {
  const startTime = Date.now();

  console.log(`[Images] Starting generation for 8 images using ${model}...`);

  try {
    // Generate all images in parallel for speed
    const imagePromises = [
      // 3 Avatar images
      generateImage(buildAvatarImagePrompt(brief.avatars[0], businessName), model),
      generateImage(buildAvatarImagePrompt(brief.avatars[1], businessName), model),
      generateImage(buildAvatarImagePrompt(brief.avatars[2], businessName), model),

      // 5 Brief section images
      generateImage(buildBrandTruthImagePrompt(brief), model),
      generateImage(buildMarketContextImagePrompt(brief), model),
      generateImage(buildProblemImagePrompt(brief), model),
      generateImage(buildTransformationImagePrompt(brief), model),
      generateImage(buildProofPillarsImagePrompt(brief), model),
    ];

    const images = await Promise.all(imagePromises);

    const result: ImageGenerationResult = {
      avatars: [images[0], images[1], images[2]],
      sections: {
        brandTruth: images[3],
        marketContext: images[4],
        problem: images[5],
        transformation: images[6],
        proofPillars: images[7],
      },
      generationTimeMs: Date.now() - startTime,
    };

    console.log(`[Images] ✅ Generated 8 images in ${result.generationTimeMs}ms`);

    return result;
  } catch (error) {
    console.error('[Images] ❌ Generation failed:', error);
    throw error;
  }
}

/**
 * Uploads a base64 image to Supabase Storage
 * (Optional - for converting data URLs to permanent storage)
 */
export async function uploadImageToStorage(
  base64Data: string,
  fileName: string
): Promise<string> {
  // TODO: Implement Supabase Storage upload
  // For now, return the base64 data URL as-is
  return base64Data;
}

/**
 * Generates 6 campaign images: 3 Facebook ad visuals + 3 TV/YouTube storyboard frames.
 * Facebook ads use 1:1 square; storyboard frames use 16:9 landscape.
 * Only runs when deliverables contain a valid facebookCampaigns array and video8s.
 */
export async function generateCampaignImages(
  deliverables: Deliverables,
  businessName: string,
  model: string = 'gemini-2.5-flash-image'
): Promise<CampaignImageGenerationResult> {
  const campaigns = Array.isArray(deliverables.facebookCampaigns)
    ? deliverables.facebookCampaigns
    : [];

  const video8s = deliverables.video8s;

  if (campaigns.length < 3 || !video8s) {
    throw new Error('generateCampaignImages requires at least 3 facebookCampaigns and video8s');
  }

  console.log(`[Campaign] Generating 6 campaign images (3 FB ads + 3 storyboard) with ${model}...`);

  const [fb1, fb2, fb3, sb1, sb2, sb3] = await Promise.all([
    generateImage(buildFacebookAdImagePrompt(campaigns[0], businessName), model, '1:1'),
    generateImage(buildFacebookAdImagePrompt(campaigns[1], businessName), model, '1:1'),
    generateImage(buildFacebookAdImagePrompt(campaigns[2], businessName), model, '1:1'),
    generateImage(buildStoryboardFramePrompt(video8s.recognition, 'Recognition', businessName), model, '16:9'),
    generateImage(buildStoryboardFramePrompt(video8s.proofInContext, 'Proof in Context', businessName), model, '16:9'),
    generateImage(buildStoryboardFramePrompt(video8s.beliefLock, 'Belief Lock', businessName), model, '16:9'),
  ]);

  console.log('[Campaign] ✓ 6 campaign images generated');

  return {
    facebookImages: [fb1, fb2, fb3],
    storyboardFrames: [sb1, sb2, sb3],
  };
}
