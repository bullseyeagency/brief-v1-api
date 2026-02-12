/**
 * @fileoverview Image generation module for creative briefs
 * Generates comic-style images for avatars and brief sections using Gemini/Imagen
 */

import { Avatar, CreativeBrief } from './types';

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
}

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
// MAGAZINE PAGE PROMPTS (Image-to-Image Transformation)
// ============================================================================

/**
 * Builds cover page prompt (transforms avatar into cover with business name)
 */
function buildCoverPagePrompt(brief: CreativeBrief, businessName: string): string {
  return `Transform this person into a dynamic comic book cover. Show them in confident hero pose with city skyline behind. Large bold title "${businessName.toUpperCase()}" at top. Subtitle "CREATIVE BRIEF" below. Modern graphic novel style, vibrant but professional colors, magazine quality. 1:1 square format.`.trim();
}

/**
 * Builds Brand Truth page prompt (shows character discovering truth)
 */
function buildBrandTruthPagePrompt(brief: CreativeBrief): string {
  return `Transform this person into comic panel showing them experiencing a revelation moment. They're discovering "${brief.brandTruth.substring(0, 100)}". Scene: modern office or workspace, lightbulb moment, confident expression. Top banner "BRAND TRUTH". Style: modern graphic novel, clean lines, soft pastels. 1:1 square.`.trim();
}

/**
 * Builds Market Context page prompt (shows character in market landscape)
 */
function buildMarketContextPagePrompt(brief: CreativeBrief): string {
  return `Transform this person into comic panel showing them analyzing the market. They're viewing charts, graphs, or competitive landscape. Scene represents: "${brief.marketContext.substring(0, 100)}". Professional business setting. Top banner "MARKET LANDSCAPE". Style: modern graphic novel, blues and golds. 1:1 square.`.trim();
}

/**
 * Builds Problem page prompt (shows character experiencing pain)
 */
function buildProblemPagePrompt(brief: CreativeBrief): string {
  return `Transform this person into comic panel showing them struggling with: "${brief.humanProblem.substring(0, 100)}". Worried expression, thought bubbles with concerns, stressed posture. Dark muted background. Top banner "THE CHALLENGE". Style: empathetic, professional, clean lines. 1:1 square.`.trim();
}

/**
 * Builds Transformation page prompt (shows before/after split)
 */
function buildTransformationPagePrompt(brief: CreativeBrief): string {
  return `Transform this person into 2-panel split. LEFT PANEL: them struggling (${brief.beforeState.substring(0, 80)}), muted colors, stressed. RIGHT PANEL: same person succeeding (${brief.afterState.substring(0, 80)}), vibrant colors, confident. Large arrow between panels. Top banner "TRANSFORMATION". 1:1 square.`.trim();
}

/**
 * Builds Proof Pillars page prompt (shows character presenting success)
 */
function buildProofPillarsPagePrompt(brief: CreativeBrief): string {
  const pillarsText = brief.proofPillars
    .map((p, i) => `${i + 1}. ${p.claim.substring(0, 30)}`)
    .join(', ');

  return `Transform this person into comic panel showing them confidently presenting success stories. They're surrounded by 5 shield/badge icons with numbers 1-5. Professional presenter stance. Top banner "PROVEN RESULTS". Credibility wall behind them. Pillars: ${pillarsText}. Style: modern graphic novel. 1:1 square.`.trim();
}

/**
 * Builds Offer page prompt (shows all avatars presenting solution)
 */
function buildOfferPagePrompt(brief: CreativeBrief): string {
  return `Transform this person into comic panel showing them presenting the solution/offer. Confident gesture, pointing to offer details: "${brief.offer.substring(0, 100)}". Call-to-action energy. Top banner "THE OFFER". Modern business presentation style. 1:1 square.`.trim();
}

/**
 * Builds Messaging page prompt (shows character communicating)
 */
function buildMessagingPagePrompt(brief: CreativeBrief): string {
  const rulesText = brief.messagingRules.slice(0, 3).join(', ');

  return `Transform this person into comic panel showing them communicating the message. Speech bubbles, confident communication stance. Messaging rules visible: "${rulesText}". Top banner "MESSAGING FRAMEWORK". Professional communicator style. 1:1 square.`.trim();
}

/**
 * Builds Creative Direction page prompt (pure visual showcase)
 */
function buildCreativeDirectionPagePrompt(brief: CreativeBrief): string {
  return `Visual style showcase for creative direction: ${brief.visualStyle.substring(0, 150)}. Modern brand identity board with color swatches, typography samples, visual elements. Top banner "CREATIVE DIRECTION". Professional design presentation. 1:1 square.`.trim();
}

/**
 * Builds Back Cover page prompt (CTA and branding)
 */
function buildBackCoverPagePrompt(businessName: string, cta: string): string {
  return `Comic book back cover design. Bold text "NEXT STEPS" at top. Call-to-action: "${cta.substring(0, 100)}". Business name "${businessName}" at bottom. Modern magazine back cover style, professional finish. 1:1 square.`.trim();
}

/**
 * Generates a single image using NanoBanana API
 */
async function generateImage(prompt: string, model: string = 'gemini-3-pro-image-preview'): Promise<string> {
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
          image_size: '1:1',
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NanoBanana API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

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
 * Generates an image using a reference image (image-to-image transformation)
 * Uses NanoBanana's /v1/images/edit endpoint to maintain character consistency
 */
async function generateImageFromReference(
  referenceImageUrl: string,
  prompt: string,
  model: string = 'gemini-3-pro-image-preview'
): Promise<string> {
  const apiKey = process.env.NANOBANANA_API_KEY;
  if (!apiKey) {
    throw new Error('NANOBANANA_API_KEY not configured');
  }

  try {
    const response = await fetch(
      'https://api.nanobananaapi.dev/v1/images/edit',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          image: referenceImageUrl,  // Reference avatar image
          prompt: prompt,             // Scene transformation
          model: model,
          image_size: '1:1',
          num: 1
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NanoBanana API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

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
    console.error('Image-to-image generation error:', error);
    throw error;
  }
}

/**
 * Generates all magazine images using avatar references for character consistency
 * Phase 1: Generate 3 avatar images sequentially
 * Phase 2: Generate 10 magazine pages in parallel using avatars as references
 */
export async function generateMagazineImages(
  brief: CreativeBrief,
  businessName: string,
  model: string = 'gemini-3-pro-image-preview'
): Promise<MagazineImageGenerationResult> {
  const startTime = Date.now();

  console.log('[Magazine] Starting image generation...');

  // PHASE 1: Generate 3 avatar reference images (SEQUENTIAL)
  console.log('[Magazine] Generating avatar references...');

  const avatar1Url = await generateImage(
    buildAvatarImagePrompt(brief.avatars[0], businessName),
    model
  );
  brief.avatars[0].generatedImageUrl = avatar1Url;
  console.log('[Magazine] ✓ Primary avatar generated');

  const avatar2Url = await generateImage(
    buildAvatarImagePrompt(brief.avatars[1], businessName),
    model
  );
  brief.avatars[1].generatedImageUrl = avatar2Url;
  console.log('[Magazine] ✓ Secondary avatar generated');

  const avatar3Url = await generateImage(
    buildAvatarImagePrompt(brief.avatars[2], businessName),
    model
  );
  brief.avatars[2].generatedImageUrl = avatar3Url;
  console.log('[Magazine] ✓ Tertiary avatar generated');

  // PHASE 2: Generate 10 magazine pages using avatars as references (PARALLEL)
  console.log('[Magazine] Generating magazine pages with avatar references...');

  const [cover, page1, page2, page3, page4, page5, page6, page7, page8, backCover] =
    await Promise.all([
      // Cover: Use primary avatar as base
      generateImageFromReference(
        avatar1Url,
        buildCoverPagePrompt(brief, businessName),
        model
      ),
      // Page 1: Brand Truth with primary avatar
      generateImageFromReference(
        avatar1Url,
        buildBrandTruthPagePrompt(brief),
        model
      ),
      // Page 2: Market Context with secondary avatar
      generateImageFromReference(
        avatar2Url,
        buildMarketContextPagePrompt(brief),
        model
      ),
      // Page 3: Problem with primary avatar
      generateImageFromReference(
        avatar1Url,
        buildProblemPagePrompt(brief),
        model
      ),
      // Page 4: Transformation with primary avatar
      generateImageFromReference(
        avatar1Url,
        buildTransformationPagePrompt(brief),
        model
      ),
      // Page 5: Proof Pillars with tertiary avatar
      generateImageFromReference(
        avatar3Url,
        buildProofPillarsPagePrompt(brief),
        model
      ),
      // Page 6: Offer with primary avatar as base
      generateImageFromReference(
        avatar1Url,
        buildOfferPagePrompt(brief),
        model
      ),
      // Page 7: Messaging with secondary avatar
      generateImageFromReference(
        avatar2Url,
        buildMessagingPagePrompt(brief),
        model
      ),
      // Page 8: Creative Direction (no avatar reference)
      generateImage(
        buildCreativeDirectionPagePrompt(brief),
        model
      ),
      // Page 9: Back Cover (no avatar reference)
      generateImage(
        buildBackCoverPagePrompt(businessName, brief.callToAction),
        model
      ),
    ]);

  const generationTimeMs = Date.now() - startTime;
  console.log(`[Magazine] ✅ All 13 images generated in ${(generationTimeMs / 1000).toFixed(1)}s`);

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
