import { NextRequest, NextResponse } from 'next/server';
import { IMAGE_PRESETS, buildImagePrompt } from '@/lib/image-presets';

interface GenerateSampleRequest {
  presetKey: string;
  provider: string;
  model: string;
}

/**
 * POST /api/generate-image-sample
 * Generates a sample image using the selected preset for preview purposes
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Image Sample] Request received');

    const body: GenerateSampleRequest = await request.json();
    const { presetKey, provider, model } = body;

    console.log('[Image Sample] Params:', { presetKey, provider, model });

    if (!presetKey || !provider || !model) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.NANOBANANA_API_KEY;
    console.log('[Image Sample] API key exists:', !!apiKey);
    console.log('[Image Sample] API key prefix:', apiKey?.substring(0, 10));

    if (!apiKey) {
      return NextResponse.json(
        { error: 'NanoBanana API key not configured on server' },
        { status: 500 }
      );
    }

    // Build sample prompt
    console.log('[Image Sample] Building prompt for preset:', presetKey);
    const preset = IMAGE_PRESETS[presetKey];

    if (!preset) {
      return NextResponse.json(
        { error: `Invalid preset: ${presetKey}` },
        { status: 400 }
      );
    }

    const defaultPrompt = 'Professional portrait of a confident business person in modern office setting';
    console.log('[Image Sample] Default prompt:', defaultPrompt);

    const finalPrompt = buildImagePrompt(defaultPrompt, presetKey, 'Sample Person');
    console.log('[Image Sample] Final prompt length:', finalPrompt.length);
    console.log('[Image Sample] Final prompt:', finalPrompt);

    // Call NanoBanana API
    const apiUrl = 'https://api.nanobananaapi.dev/v1/images/generate';
    const requestBody = {
      model: model,
      prompt: finalPrompt,
      num: 1,
      image_size: '16:9',
    };

    console.log('[Image Sample] Calling API:', apiUrl);
    console.log('[Image Sample] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[Image Sample] Response status:', response.status);
    console.log('[Image Sample] Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Image Sample] API error status:', response.status);
      console.error('[Image Sample] API error text:', errorText);
      throw new Error(`NanoBanana API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[Image Sample] Response data:', JSON.stringify(data, null, 2));

    // Check for API error
    if (data.code !== 0) {
      throw new Error(`NanoBanana error: ${data.message}`);
    }

    // Extract image URL from response
    const imageUrl = data.data?.url;
    console.log('[Image Sample] Extracted image URL:', imageUrl);

    if (!imageUrl) {
      console.error('[Image Sample] No image URL found in response');
      console.error('[Image Sample] Full response data:', data);
      throw new Error('No image URL in response');
    }

    console.log('[Image Sample] ✅ Generated successfully');

    return NextResponse.json({
      imageUrl,
      preset: preset.name,
    });

  } catch (error) {
    console.error('[Image Sample] Full error:', error);
    if (error instanceof Error) {
      console.error('[Image Sample] Error message:', error.message);
      console.error('[Image Sample] Error stack:', error.stack);
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate sample',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}
