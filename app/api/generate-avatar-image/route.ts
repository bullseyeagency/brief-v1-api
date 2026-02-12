import { NextRequest, NextResponse } from 'next/server';
import { Avatar } from '@/lib/types';

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

  return `Modern graphic novel multi-panel portrait: ${avatar.name}, age ${avatar.age}. Background: ${avatar.background}. Current state: ${avatar.currentState}. Transformation: ${avatar.transformation}. Desire: "${avatar.desire}". Large center panel showing ${moodMap[avatar.type]} expression, surrounded by 4-6 panels showing journey. Top banner: "${avatar.name.toUpperCase()}'S EVOLUTION". Speech bubble with quote. Badge icons. Business: ${briefContext}. Style: clean lines, natural tones, soft pastels, beige backgrounds, subtle halftone, contemporary comic, NOT vintage.`.trim();
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
    const { avatar, businessName, model } = body;

    if (!avatar) {
      return NextResponse.json({ error: 'Missing avatar data' }, { status: 400 });
    }

    if (!businessName) {
      return NextResponse.json({ error: 'Missing businessName' }, { status: 400 });
    }

    const imageModel = model || 'gemini-3-pro-image-preview';
    console.log(`[Avatar Image] Generating image for ${avatar.name} (${avatar.type}) using ${imageModel}...`);

    const prompt = buildAvatarImagePrompt(avatar, businessName);
    const imageUrl = await generateImage(prompt, imageModel);

    console.log(`[Avatar Image] ✅ Generated image for ${avatar.name}`);

    return NextResponse.json({
      imageUrl,
      avatarName: avatar.name,
      avatarType: avatar.type,
    });
  } catch (error) {
    console.error('[Avatar Image] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate avatar image' },
      { status: 500 }
    );
  }
}
