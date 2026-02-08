import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { CrawlResult, AIProvider } from '@/lib/types';
import { processBriefGeneration } from '@/lib/background-processor';

interface CreateBriefRequest {
  url: string;
  contactId?: string;
  metadata?: Record<string, any>;
}

interface CreateBriefResponse {
  success: boolean;
  publicUrl?: string;
  briefId?: string;
  status?: string;
  error?: string;
}

/**
 * Generic API endpoint for external systems to create briefs
 * POST /api/create-brief
 *
 * Returns immediately with URL, processes in background
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateBriefRequest = await request.json();
    const { url, contactId, metadata } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: url' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    console.log('[API] Creating brief for:', url);

    // Get server-side API keys
    const openaiKey = process.env.OPENAI_API_KEY;
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!openaiKey && !claudeKey && !geminiKey) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error: No AI provider keys configured' },
        { status: 500 }
      );
    }

    // Choose provider
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
    console.log('[API] Starting crawl...');
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
    console.log(`[API] Crawl complete (${crawlResult.pages.length} pages)`);

    // Step 2: Create database record immediately
    const { data: newBrief, error: dbError } = await supabase
      .from('v1_generated_briefs')
      .insert({
        source_url: url,
        crawl_result: crawlResult,
        brief: null,
        deliverables: null,
        provider,
        model,
        is_public: true,
        sophia_contact_id: contactId || null,
        status: 'processing',
        progress: 30,
        current_task: 'Crawl complete',
        logs: [
          `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] Starting website crawl`,
          `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] Fetching pages`,
          `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] Found ${crawlResult.pages.length} pages to analyze`,
          `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] Crawl complete`,
        ],
      })
      .select('id, public_slug')
      .single();

    if (dbError || !newBrief) {
      console.error('[API] Database error:', dbError);
      throw new Error('Failed to create brief record');
    }

    const publicUrl = `${request.nextUrl.origin}/brief/${newBrief.public_slug}`;
    console.log(`[API] ✅ Brief created: ${publicUrl}`);

    // Step 3: Start background processing (don't wait)
    processBriefGeneration({
      briefId: newBrief.id,
      crawlResult,
      provider,
      model,
      apiKey,
    }).catch((error) => {
      console.error('[API] Background processing error:', error);
    });

    // Step 4: Return immediately
    const response: CreateBriefResponse = {
      success: true,
      publicUrl,
      briefId: newBrief.id,
      status: 'processing',
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
    description: 'Generate a creative brief from any website URL (async)',
    note: 'Returns immediately with public URL. Brief generates in background.',
    requestBody: {
      url: 'string (required) - Website URL to analyze',
      contactId: 'string (optional) - External contact/customer ID',
      metadata: 'object (optional) - Additional metadata',
    },
    responseBody: {
      success: 'boolean',
      publicUrl: 'string - Public URL of the brief (visit to see status)',
      briefId: 'string - Database ID',
      status: 'string - Will be "processing"',
      error: 'string (if success=false)',
    },
    polling: {
      statusEndpoint: 'GET /api/brief/[slug]/status',
      interval: '10 seconds recommended',
    },
    example: {
      request: {
        url: 'https://example.com',
        contactId: 'sophia-12345',
      },
      response: {
        success: true,
        publicUrl: 'https://cb-api.dalyandco.com/brief/abc123ef',
        briefId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'processing',
      },
    },
  });
}
