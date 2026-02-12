import { NextRequest, NextResponse } from 'next/server';
import { CreativeBrief } from '@/lib/types';

type SectionType = 'brandTruth' | 'marketContext' | 'problem' | 'transformation' | 'proofPillars';

/**
 * Builds section-specific image prompts
 */
function buildSectionPrompt(sectionType: SectionType, brief: CreativeBrief): string {
  switch (sectionType) {
    case 'brandTruth':
      return `Modern comic illustration: 2-panel split. Left: symbolic imagery for brand truth. Right: promise delivered (success/achievement). Arrow connecting panels. Top banner "THE BRAND PROMISE". Circular badge icons. Style: clean lines, soft pastels, beige/cream background, gold/blue accents, subtle halftone texture, professional contemporary design. Truth: ${brief.brandTruth.substring(0, 150)}. Promise: ${brief.brandPromise.substring(0, 150)}.`.trim();

    case 'marketContext':
      return `Modern business comic: Wide market landscape with 3-4 small panels showing customer segments and competitors. Circular icons for market forces. Top banner "THE MARKET LANDSCAPE". Style: clean lines, professional blues/grays/gold, muted backgrounds, contemporary editorial illustration. Market: ${brief.marketContext.substring(0, 200)}.`.trim();

    case 'problem':
      return `Modern comic: 3-4 panels showing problem escalating. Worried character expressions, thought bubbles with concerns, question marks. Dark muted backgrounds (grays, blues, purples). Top banner "THE CHALLENGE". Style: clean lines, professional, subtle texture, empathetic tone. Problem: ${brief.humanProblem.substring(0, 200)}.`.trim();

    case 'transformation':
      return `Modern comic: 2 large side-by-side panels. Left: before state (muted grays/blues, stressed expression). Right: after state (vibrant pastels/gold, confident, successful). Large arrow between. Badge icons on right. Top banner "THE TRANSFORMATION". Style: clean lines, dramatic color shift, professional finish. Before: ${brief.beforeState.substring(0, 150)}. After: ${brief.afterState.substring(0, 150)}.`.trim();

    case 'proofPillars':
      const pillarsText = brief.proofPillars
        .map((p, i) => `${i + 1}. ${p.claim.substring(0, 40)}`)
        .join(', ');
      return `Modern comic credibility wall: 5 shield/badge icons in balanced pattern. Bold numbers 1-5, each badge different color (gold/blue/green). Top banner "PROVEN RESULTS". Style: clean professional design, subtle halftone, beige/cream background, contemporary certification graphics. Pillars: ${pillarsText}.`.trim();

    default:
      throw new Error(`Unknown section type: ${sectionType}`);
  }
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sectionType, brief, model } = body;

    if (!sectionType || !brief) {
      return NextResponse.json({ error: 'Missing sectionType or brief data' }, { status: 400 });
    }

    const imageModel = model || 'gemini-3-pro-image-preview';
    console.log(`[Section Image] Generating image for ${sectionType} using ${imageModel}...`);

    const prompt = buildSectionPrompt(sectionType, brief);
    const imageUrl = await generateImage(prompt, imageModel);

    console.log(`[Section Image] ✅ Generated image for ${sectionType}`);

    return NextResponse.json({
      imageUrl,
      sectionType,
    });
  } catch (error) {
    console.error('[Section Image] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate section image' },
      { status: 500 }
    );
  }
}
