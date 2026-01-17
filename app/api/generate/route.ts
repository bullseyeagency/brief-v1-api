import { NextRequest, NextResponse } from 'next/server';
import { CrawlResult, AIProvider, CreativeBrief, Deliverables } from '@/lib/types';
import { generateWithProvider } from '@/lib/providers';
import { buildSystemPrompt, buildGenerationPrompt, buildDeliverablesPrompt } from '@/lib/prompts';
import { validateCreativeBrief, sanitizeEmDashes } from '@/lib/validation';

interface GenerateRequest {
  crawlResult: CrawlResult;
  provider: AIProvider;
  model?: string;
  apiKey: string;
}

function parseJsonResponse(content: string): unknown {
  // Try to extract JSON from the response
  let jsonStr = content.trim();

  // Remove markdown code blocks if present
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }

  jsonStr = jsonStr.trim();

  return JSON.parse(jsonStr);
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { crawlResult, provider, model, apiKey } = body;

    if (!crawlResult || !provider || !apiKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Step 1: Generate the creative brief
    const systemPrompt = buildSystemPrompt();
    const generationPrompt = buildGenerationPrompt(crawlResult);

    const briefResult = await generateWithProvider(provider, {
      systemPrompt,
      userPrompt: generationPrompt,
      apiKey,
      model,
    });

    // Parse the brief JSON
    let brief: CreativeBrief;
    try {
      brief = parseJsonResponse(briefResult.content) as CreativeBrief;
    } catch (parseError) {
      console.error('Failed to parse brief JSON:', briefResult.content);
      return NextResponse.json(
        { error: 'Failed to parse AI response as JSON. Please try again.' },
        { status: 500 }
      );
    }

    // Validate the brief
    const validation = validateCreativeBrief(brief);
    if (!validation.valid) {
      console.warn('Brief validation warnings:', validation.errors);
      // Don't fail, just log warnings - the AI might have minor issues
    }

    // Step 2: Generate deliverables
    const deliverablesPrompt = buildDeliverablesPrompt(JSON.stringify(brief, null, 2));

    const deliverablesResult = await generateWithProvider(provider, {
      systemPrompt: 'You are a creative copywriter. Generate deliverables based on the creative brief. Respond with valid JSON only.',
      userPrompt: deliverablesPrompt,
      apiKey,
      model,
    });

    let deliverables: Deliverables;
    try {
      deliverables = parseJsonResponse(deliverablesResult.content) as Deliverables;
    } catch {
      // If deliverables fail to parse, create placeholder
      deliverables = {
        websiteSummary: 'Failed to generate website summary. Please regenerate.',
        facebookCampaigns: 'Failed to generate Facebook campaigns. Please regenerate.',
        tvCommercial30s: 'Failed to generate TV commercial. Please regenerate.',
      };
    }

    // Sanitize em dashes from all text content
    const sanitizedBrief = JSON.parse(sanitizeEmDashes(JSON.stringify(brief)));
    const sanitizedDeliverables = JSON.parse(sanitizeEmDashes(JSON.stringify(deliverables)));

    return NextResponse.json({
      brief: sanitizedBrief,
      deliverables: sanitizedDeliverables,
      model: briefResult.model,
      provider: briefResult.provider,
    });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate brief' },
      { status: 500 }
    );
  }
}
