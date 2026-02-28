import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { CrawlResult, AIProvider } from '@/lib/types';
import { processBriefGeneration } from '@/lib/background-processor';

interface CreateBriefRequest {
  url: string;
  contactId?: string;
  metadata?: Record<string, any>;
  callbackUrl?: string;
}

interface CreateBriefResponse {
  success: boolean;
  publicUrl?: string;
  briefId?: string;
  status?: string;
  error?: string;
}

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
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
    const { url, contactId, metadata, callbackUrl } = body;

    console.log('📥 Received brief request:', {
      url,
      contactId,
      metadata,
      metadataType: metadata?.type || 'MISSING'
    });

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: url' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400, headers: corsHeaders }
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
        { status: 500, headers: corsHeaders }
      );
    }

    // Choose provider
    let provider: AIProvider;
    let apiKey: string;
    let model: string;

    if (claudeKey) {
      provider = 'claude';
      apiKey = claudeKey;
      model = 'claude-sonnet-4-6';
    } else if (openaiKey) {
      provider = 'openai';
      apiKey = openaiKey;
      model = 'gpt-5.2-2025-12-11';
    } else {
      provider = 'gemini';
      apiKey = geminiKey!;
      model = 'gemini-2.0-flash-exp';
    }

    console.log(`[API] Using provider: ${provider}, model: ${model}`);

    // Determine site URL for API responses
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

    // Step 1: Crawl the website
    console.log('[API] Starting crawl...');
    const crawlResponse = await fetch(`${request.nextUrl.origin}/api/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, type: metadata?.type || 'default' }),
    });

    if (!crawlResponse.ok) {
      const error = await crawlResponse.json();
      throw new Error(`Crawl failed: ${error.error || 'Unknown error'}`);
    }

    const crawlResult: CrawlResult = await crawlResponse.json();
    console.log(`[API] Crawl complete (${crawlResult.pages.length} pages)`);

    // Step 2: Create database record immediately
    console.log('💾 Storing in database with metadata:', metadata);

    const { data: newBrief, error: dbError } = await supabase
      .from('v1_generated_briefs')
      .insert({
        source_url: url,
        crawl_result: crawlResult,
        brief: {}, // Empty object initially, populated when complete
        deliverables: {}, // Empty object initially, populated when complete
        provider,
        model,
        is_public: true,
        sophia_contact_id: contactId || null,
        metadata: metadata || null, // Store metadata (includes type: 'local' | 'shopify')
        callback_url: callbackUrl || null,
        status: 'processing',
        progress: 30,
        current_task: 'Crawl complete',
        logs: [
          `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] Starting website crawl`,
          `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] Fetching pages`,
          `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] Found ${crawlResult.pages.length} pages to analyze`,
          `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] Crawl complete`,
          metadata?.type ? `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] Brief type: ${metadata.type}` : '',
        ].filter(Boolean),
      })
      .select('id, public_slug')
      .single();

    if (dbError || !newBrief) {
      console.error('[API] ❌ Database error:', dbError);
      console.error('[API] ❌ Full error details:', JSON.stringify(dbError, null, 2));
      throw new Error('Failed to create brief record');
    }

    console.log('[API] ✅ Brief created in database:', {
      id: newBrief.id,
      slug: newBrief.public_slug,
      metadataWasIncluded: !!metadata
    });

    // Verify metadata was saved
    const { data: verifyBrief } = await supabase
      .from('v1_generated_briefs')
      .select('metadata')
      .eq('id', newBrief.id)
      .single();

    console.log('[API] 🔍 Verification - metadata in database:', verifyBrief?.metadata);

    const publicUrl = `${siteUrl}/brief/${newBrief.public_slug}`;
    console.log(`[API] ✅ Brief created: ${publicUrl}`);

    // Step 3: Process brief — inline locally, background function in production
    const isLocal = request.nextUrl.origin.includes('localhost');

    if (isLocal) {
      // Run inline so local dev works without netlify dev
      console.log('[API] Local environment — processing inline (no background function)');
      processBriefGeneration({
        briefId: newBrief.id,
        crawlResult,
        provider,
        model,
        apiKey,
      }).then(() => {
        console.log('[API] Inline processing complete');
      }).catch((err) => {
        console.error('[API] Inline processing error:', err);
      });
    } else {
      // Production — hand off to Netlify background function (up to 10 min)
      const backgroundUrl = `${siteUrl}/.netlify/functions/process-brief-background`;
      console.log(`[API] Invoking background function: ${backgroundUrl}`);

      fetch(backgroundUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefId: newBrief.id,
          crawlResult,
          provider,
          model,
          apiKey,
        }),
      })
        .then(async (res) => {
          console.log(`[API] Background function response: ${res.status}`);
          if (!res.ok) {
            const error = await res.text();
            console.error(`[API] Background function error: ${error}`);
          }
        })
        .catch((error) => {
          console.error('[API] Failed to invoke background function:', error);
        });
    }

    // Step 4: Return immediately
    const response: CreateBriefResponse = {
      success: true,
      publicUrl,
      briefId: newBrief.id,
      status: 'processing',
    };

    return NextResponse.json(response, { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('[API] Error:', error);

    const response: CreateBriefResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    };

    return NextResponse.json(response, { status: 500, headers: corsHeaders });
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
        publicUrl: 'https://briefs.dalyandco.com/brief/abc123ef',
        briefId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'processing',
      },
    },
  }, { headers: corsHeaders });
}
