import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { CreativeBrief, Avatar } from '@/lib/types';

function buildAvatarPrompt(avatar: Avatar, businessName: string): string {
  const moodMap: Record<string, string> = {
    primary: 'confident, successful, inspiring',
    secondary: 'relatable, hopeful, determined',
    tertiary: 'accomplished, satisfied, aspirational',
  };
  const avatarName = avatar.name || 'Customer';
  return `Modern graphic novel multi-panel portrait: ${avatarName}, age ${avatar.age || 30}. Background: ${avatar.background || 'Professional background'}. Current state: ${avatar.currentState || 'Seeking solutions'}. Transformation: ${avatar.transformation || 'Finding success'}. Desire: "${avatar.desire || 'Better outcomes'}". Large center panel showing ${moodMap[avatar.type] || 'confident'} expression, surrounded by 4-6 panels showing journey. Top banner: "${avatarName.toUpperCase()}'S EVOLUTION". Speech bubble with quote. Badge icons. Business: ${businessName}. Style: clean lines, natural tones, soft pastels, beige backgrounds, subtle halftone, contemporary comic, NOT vintage.`.trim();
}

/**
 * Debug endpoint — fires ONE image request to NanoBanana and returns:
 *   requestPayload, rawStatus, rawHeaders, rawBody, parsedResponse, imageUrl
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.NANOBANANA_API_KEY;

  // 1. Check key
  if (!apiKey) {
    return NextResponse.json({ error: 'NANOBANANA_API_KEY is not set in environment' }, { status: 500 });
  }

  const { briefId, model } = await request.json();
  if (!briefId) {
    return NextResponse.json({ error: 'Missing briefId' }, { status: 400 });
  }

  const imageModel = model || 'gemini-2.5-flash-image';

  // 2. Fetch brief
  const { data: briefData, error: fetchError } = await supabase
    .from('v1_generated_briefs')
    .select('brief, source_url')
    .eq('id', briefId)
    .single();

  if (fetchError || !briefData) {
    return NextResponse.json({ error: 'Brief not found', fetchError }, { status: 404 });
  }

  const brief = briefData.brief as CreativeBrief;
  const firstAvatar: Avatar = brief.avatars?.[0];

  if (!firstAvatar) {
    return NextResponse.json({ error: 'No avatars in brief' }, { status: 400 });
  }

  const businessName = briefData.source_url
    ? briefData.source_url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
    : 'Business';

  const prompt = buildAvatarPrompt(firstAvatar, businessName);

  // 3. Build request payload
  const requestPayload = {
    model: imageModel,
    prompt,
    num: 1,
    image_size: '1:1',
  };

  console.log('[DebugNano] API Key (first 8 chars):', apiKey.slice(0, 8) + '...');
  console.log('[DebugNano] Model:', imageModel);
  console.log('[DebugNano] Prompt length:', prompt.length);
  console.log('[DebugNano] Request payload:', JSON.stringify(requestPayload, null, 2));

  // 4. Fire request
  const startMs = Date.now();
  let rawStatus: number;
  let rawHeadersObj: Record<string, string>;
  let rawBody: string;
  let parsedBody: unknown = null;

  try {
    const res = await fetch('https://api.nanobananaapi.dev/v1/images/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestPayload),
    });

    rawStatus = res.status;
    rawHeadersObj = Object.fromEntries(res.headers.entries());
    rawBody = await res.text();
    const elapsedMs = Date.now() - startMs;

    console.log('[DebugNano] Response status:', rawStatus);
    console.log('[DebugNano] Response headers:', JSON.stringify(rawHeadersObj, null, 2));
    console.log('[DebugNano] Raw body:', rawBody);
    console.log('[DebugNano] Elapsed:', elapsedMs, 'ms');

    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      // rawBody is not JSON (HTML error page, plain text, etc.)
    }

    return NextResponse.json({
      debug: {
        apiKeyPrefix: apiKey.slice(0, 8) + '...',
        model: imageModel,
        promptLength: prompt.length,
        prompt,
        avatarUsed: { name: firstAvatar.name, type: firstAvatar.type, age: firstAvatar.age },
        businessName,
        elapsedMs,
      },
      request: requestPayload,
      response: {
        status: rawStatus,
        headers: rawHeadersObj,
        rawBody,
        parsed: parsedBody,
      },
    });
  } catch (fetchErr) {
    console.error('[DebugNano] fetch() threw:', fetchErr);
    return NextResponse.json({
      error: 'fetch() threw an exception',
      message: fetchErr instanceof Error ? fetchErr.message : String(fetchErr),
    }, { status: 500 });
  }
}
