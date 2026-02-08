import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateWithProvider } from '@/lib/providers';
import { buildSystemPrompt, buildGenerationPrompt, buildDeliverablesPrompt } from '@/lib/prompts';
import { validateCreativeBrief, sanitizeEmDashes } from '@/lib/validation';
import { cleanupCrawlResult, convertToLegacyFormat } from '@/lib/crawl-cleanup';
import { CrawlResult, CreativeBrief, Deliverables, AIProvider } from '@/lib/types';

interface CreateBriefRequest {
  url: string;
  contactId?: string; // Optional: for linking to external systems (Sophia, CRM, etc.)
  metadata?: Record<string, any>; // Optional: extra data
}

interface CreateBriefResponse {
  success: boolean;
  publicUrl?: string;
  briefId?: string;
  error?: string;
}

/**
 * Generic API endpoint for external systems to create briefs
 * POST /api/create-brief
 *
 * Request body:
 * {
 *   "url": "https://example.com",
 *   "contactId": "optional-id",
 *   "metadata": {}
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "publicUrl": "https://api.dalyandco.com/brief/abc123ef",
 *   "briefId": "uuid"
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body: CreateBriefRequest = await request.json();
    const { url, contactId, metadata } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: url' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    console.log('[API] Creating brief for:', url);
    console.log('[API] Contact ID:', contactId || 'none');
    console.log('[API] Metadata:', metadata || 'none');

    // Get server-side API keys from environment
    const openaiKey = process.env.OPENAI_API_KEY;
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!openaiKey && !claudeKey && !geminiKey) {
      console.error('[API] No AI provider API keys configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error: No AI provider keys configured' },
        { status: 500 }
      );
    }

    // Choose provider (prefer OpenAI if available)
    let provider: AIProvider;
    let apiKey: string;
    let model: string;

    if (openaiKey) {
      provider = 'openai';
      apiKey = openaiKey;
      model = 'gpt-4o';
    } else if (claudeKey) {
      provider = 'claude';
      apiKey = claudeKey;
      model = 'claude-sonnet-4-20250514';
    } else {
      provider = 'gemini';
      apiKey = geminiKey!;
      model = 'gemini-2.0-flash-exp';
    }

    console.log(`[API] Using provider: ${provider}, model: ${model}`);

    // Step 1: Crawl the website
    console.log('[API] Step 1: Crawling website...');
    const crawlStartTime = Date.now();

    const crawlResponse = await fetch(`${request.nextUrl.origin}/api/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!crawlResponse.ok) {
      const error = await crawlResponse.json();
      throw new Error(`Crawl failed: ${error.error || 'Unknown error'}`);
    }

    const crawlResult: CrawlResult = await crawlResponse.json();
    const crawlDuration = Date.now() - crawlStartTime;
    console.log(`[API] Crawl complete in ${(crawlDuration / 1000).toFixed(1)}s (${crawlResult.pages.length} pages)`);

    // Step 2: Clean and normalize crawl data
    console.log('[API] Step 2: Cleaning crawl data...');
    const { cleanedPages, stats } = cleanupCrawlResult(crawlResult);
    console.log(`[API] Reduced from ${stats.original} to ${cleanedPages.length} pages`);

    const cleanedCrawlResult = convertToLegacyFormat(
      cleanedPages,
      crawlResult.mainUrl,
      crawlResult.crawledAt
    );

    // Step 3: Generate the creative brief
    console.log('[API] Step 3: Generating creative brief...');
    const briefStartTime = Date.now();

    const systemPrompt = buildSystemPrompt();
    const generationPrompt = buildGenerationPrompt(cleanedCrawlResult);

    const briefResult = await generateWithProvider(provider, {
      systemPrompt,
      userPrompt: generationPrompt,
      apiKey,
      model,
    });

    const briefDuration = Date.now() - briefStartTime;
    console.log(`[API] Brief generated in ${(briefDuration / 1000).toFixed(1)}s`);

    // Parse the brief JSON
    let brief: CreativeBrief;
    try {
      let jsonStr = briefResult.content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      brief = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('[API] Failed to parse brief JSON');
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate the brief
    const validation = validateCreativeBrief(brief);
    if (!validation.valid) {
      console.warn('[API] Brief validation warnings:', validation.errors);
    }

    // Step 4: Generate deliverables
    console.log('[API] Step 4: Generating deliverables...');
    const deliverablesStartTime = Date.now();

    const deliverablesPrompt = buildDeliverablesPrompt(JSON.stringify(brief, null, 2));

    const deliverablesResult = await generateWithProvider(provider, {
      systemPrompt: 'You are a creative copywriter. Generate deliverables based on the creative brief. Respond with valid JSON only.',
      userPrompt: deliverablesPrompt,
      apiKey,
      model,
    });

    const deliverablesDuration = Date.now() - deliverablesStartTime;
    console.log(`[API] Deliverables generated in ${(deliverablesDuration / 1000).toFixed(1)}s`);

    let deliverables: Deliverables;
    try {
      let jsonStr = deliverablesResult.content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      deliverables = JSON.parse(jsonStr.trim());
    } catch {
      deliverables = {
        websiteSummary: 'Failed to generate website summary.',
        facebookCampaigns: 'Failed to generate Facebook campaigns.',
        tvCommercial30s: 'Failed to generate TV commercial.',
      };
    }

    // Sanitize em dashes
    const sanitizedBrief = JSON.parse(sanitizeEmDashes(JSON.stringify(brief)));
    const sanitizedDeliverables = JSON.parse(sanitizeEmDashes(JSON.stringify(deliverables)));

    // Step 5: Save to database
    console.log('[API] Step 5: Saving to database...');
    const generationTimeMs = Date.now() - startTime;

    const { data: savedBrief, error: dbError } = await supabase
      .from('v1_generated_briefs')
      .insert({
        source_url: url,
        crawl_result: crawlResult,
        brief: sanitizedBrief,
        deliverables: sanitizedDeliverables,
        provider: briefResult.provider,
        model: briefResult.model,
        generation_time_ms: generationTimeMs,
        is_public: true,
        sophia_contact_id: contactId || null,
      })
      .select('id, public_slug')
      .single();

    if (dbError) {
      console.error('[API] Database error:', dbError);
      throw new Error('Failed to save brief to database');
    }

    const publicUrl = `${request.nextUrl.origin}/brief/${savedBrief.public_slug}`;
    console.log(`[API] ✅ Brief saved: ${publicUrl}`);
    console.log(`[API] Total time: ${(generationTimeMs / 1000).toFixed(1)}s`);

    const response: CreateBriefResponse = {
      success: true,
      publicUrl,
      briefId: savedBrief.id,
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('[API] Error:', error);

    const response: CreateBriefResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * GET handler for API documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/create-brief',
    method: 'POST',
    description: 'Generate a creative brief from any website URL',
    requestBody: {
      url: 'string (required) - Website URL to analyze',
      contactId: 'string (optional) - External contact/customer ID',
      metadata: 'object (optional) - Additional metadata',
    },
    responseBody: {
      success: 'boolean',
      publicUrl: 'string - Public URL of the generated brief',
      briefId: 'string - Database ID of the brief',
      error: 'string (if success=false)',
    },
    example: {
      request: {
        url: 'https://example.com',
        contactId: 'sophia-12345',
        metadata: { source: 'sophia-os' },
      },
      response: {
        success: true,
        publicUrl: 'https://api.dalyandco.com/brief/abc123ef',
        briefId: '550e8400-e29b-41d4-a716-446655440000',
      },
    },
  });
}
