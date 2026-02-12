import { NextRequest, NextResponse } from 'next/server';
import { CrawlResult, AIProvider, CreativeBrief, Deliverables, BriefImages } from '@/lib/types';
import { generateWithProvider } from '@/lib/providers';
import { buildSystemPrompt, buildGenerationPrompt, buildDeliverablesPrompt } from '@/lib/prompts';
import { validateCreativeBrief, sanitizeEmDashes } from '@/lib/validation';
import { cleanupCrawlResult, convertToLegacyFormat } from '@/lib/crawl-cleanup';
import { supabase } from '@/lib/supabase';
import { generateMagazineImages } from '@/lib/image-generator';
import { saveMagazineImages } from '@/lib/image-storage';

interface GenerateRequest {
  crawlResult: CrawlResult;
  provider?: AIProvider;
  model?: string;
  apiKey?: string;
  generateImages?: boolean; // Optional: generate images for avatars and sections
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
  const startTime = Date.now();

  try {
    const body: GenerateRequest = await request.json();
    let { crawlResult, provider, model, apiKey, generateImages = false } = body;

    if (!crawlResult) {
      return NextResponse.json({ error: 'Missing required field: crawlResult' }, { status: 400 });
    }

    // If no apiKey provided, use server-side keys
    if (!apiKey) {
      const openaiKey = process.env.OPENAI_API_KEY;
      const claudeKey = process.env.ANTHROPIC_API_KEY;
      const geminiKey = process.env.GEMINI_API_KEY;

      if (!openaiKey && !claudeKey && !geminiKey) {
        return NextResponse.json(
          { error: 'No API keys configured. Please add keys in settings or configure server environment variables.' },
          { status: 500 }
        );
      }

      // Choose provider based on available keys
      if (!provider) {
        if (openaiKey) {
          provider = 'openai';
          apiKey = openaiKey;
          model = model || 'gpt-4o';
        } else if (claudeKey) {
          provider = 'claude';
          apiKey = claudeKey;
          model = model || 'claude-sonnet-4-20250514';
        } else {
          provider = 'gemini';
          apiKey = geminiKey!;
          model = model || 'gemini-2.0-flash-exp';
        }
      } else {
        // Provider specified, get matching key
        const keys: Record<AIProvider, string | undefined> = {
          openai: openaiKey,
          claude: claudeKey,
          manus: process.env.MANUS_API_KEY,
          gemini: geminiKey,
        };
        apiKey = keys[provider];
        if (!apiKey) {
          return NextResponse.json(
            { error: `${provider} API key not configured on server` },
            { status: 500 }
          );
        }
      }
    }

    // Step 0: Clean and normalize crawl data
    console.log('[Cleanup] Starting crawl data cleanup...');
    const { cleanedPages, stats } = cleanupCrawlResult(crawlResult);
    console.log('[Cleanup] Stats:', JSON.stringify(stats, null, 2));
    console.log(`[Cleanup] Reduced from ${stats.original} to ${cleanedPages.length} pages`);

    const cleanedCrawlResult = convertToLegacyFormat(
      cleanedPages,
      crawlResult.mainUrl,
      crawlResult.crawledAt
    );

    // Ensure provider and apiKey are set
    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Failed to determine AI provider' },
        { status: 500 }
      );
    }

    // Step 1: Generate the creative brief
    const systemPrompt = buildSystemPrompt();
    const generationPrompt = buildGenerationPrompt(cleanedCrawlResult);

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
        creativeBrief: 'Failed to generate creative brief. Please regenerate.',
        facebookCampaigns: 'Failed to generate Facebook campaigns. Please regenerate.',
        tvCommercial30s: 'Failed to generate TV commercial. Please regenerate.',
      };
    }

    // Sanitize em dashes from all text content
    const sanitizedBrief = JSON.parse(sanitizeEmDashes(JSON.stringify(brief)));
    const sanitizedDeliverables = JSON.parse(sanitizeEmDashes(JSON.stringify(deliverables)));

    // Step 3: Generate magazine images (optional)
    let images: BriefImages | null = null;
    let tempImages: any = null; // Store full result including generationTimeMs
    if (generateImages) {
      try {
        console.log('[Magazine] Starting magazine image generation...');
        const businessName = cleanedCrawlResult.mainUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
        tempImages = await generateMagazineImages(sanitizedBrief, businessName);
        console.log(`[Magazine] ✅ Generated 13 images (3 avatars + cover + 8 pages + back cover)`);

        // Note: We need a briefId to save images, so we'll save them after database insert
        // For now, store temporary URLs (without generationTimeMs)
        const { generationTimeMs, ...imageUrls } = tempImages;
        images = imageUrls;
      } catch (imageError) {
        console.error('[Magazine] ⚠️ Image generation failed, continuing without images:', imageError);
        // Don't fail the entire request if images fail
        images = null;
        tempImages = null;
      }
    }

    // Calculate total generation time
    const generationTimeMs = Date.now() - startTime;

    // Step 4: Save to database
    console.log('[Database] Saving brief to Supabase...');
    const { data: savedBrief, error: dbError } = await supabase
      .from('v1_generated_briefs')
      .insert({
        source_url: crawlResult.mainUrl,
        crawl_result: crawlResult,
        brief: sanitizedBrief,
        deliverables: sanitizedDeliverables,
        images: images || null,
        provider: briefResult.provider,
        model: briefResult.model,
        generation_time_ms: generationTimeMs,
        is_public: true,
      })
      .select('id, public_slug')
      .single();

    if (dbError) {
      console.error('[Database] Error saving brief:', dbError);
      // Don't fail the request, just log the error
      // User still gets the brief data
    } else {
      console.log(`[Database] ✅ Brief saved with slug: ${savedBrief.public_slug}`);

      // Step 5: If images were generated, save them permanently to storage
      if (images && tempImages && savedBrief?.id) {
        try {
          console.log('[Storage] Saving magazine images to permanent storage...');
          const permanentImages = await saveMagazineImages(savedBrief.id, tempImages);

          // Update database with permanent URLs
          const { error: updateError } = await supabase
            .from('v1_generated_briefs')
            .update({ images: permanentImages })
            .eq('id', savedBrief.id);

          if (updateError) {
            console.error('[Storage] Error updating with permanent URLs:', updateError);
          } else {
            console.log('[Storage] ✅ Updated database with permanent magazine image URLs');
            images = permanentImages; // Return permanent URLs to user
          }
        } catch (storageError) {
          console.error('[Storage] ⚠️ Failed to save magazine images permanently:', storageError);
          // Continue with temporary URLs
        }
      }
    }

    return NextResponse.json({
      brief: sanitizedBrief,
      deliverables: sanitizedDeliverables,
      images: images,
      model: briefResult.model,
      provider: briefResult.provider,
      publicUrl: savedBrief ? `/brief/${savedBrief.public_slug}` : undefined,
      briefId: savedBrief?.id,
    });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate brief' },
      { status: 500 }
    );
  }
}
