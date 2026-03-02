import { NextRequest, NextResponse } from 'next/server';
import { CrawlResult, AIProvider, CreativeBrief, Deliverables, BriefImages, FacebookCampaign } from '@/lib/types';
import { generateWithProvider } from '@/lib/providers';
import { buildSystemPrompt, buildGenerationPrompt, buildDeliverablesPrompt } from '@/lib/prompts';
import { validateCreativeBrief, sanitizeEmDashes } from '@/lib/validation';
import { cleanupCrawlResult, convertToLegacyFormat } from '@/lib/crawl-cleanup';
import { supabase } from '@/lib/supabase';
import { generateMagazineImages, generateCampaignImages } from '@/lib/image-generator';
import { saveMagazineImages, saveCampaignImages } from '@/lib/image-storage';
import { refineFacebookAdCopy } from '@/lib/ad-copy-refine';

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

/**
 * Updates progress, current_task, and optionally appends a log entry for a brief row.
 * All updates are gated — if briefId is null, this is a no-op.
 */
async function updateStatus(
  briefId: string | null,
  progress: number,
  currentTask: string,
  logEntry?: string
): Promise<void> {
  if (!briefId) return;

  try {
    if (logEntry) {
      const { data } = await supabase
        .from('v1_generated_briefs')
        .select('logs')
        .eq('id', briefId)
        .single();
      const logs = [...((data?.logs as string[]) || []), logEntry];
      await supabase
        .from('v1_generated_briefs')
        .update({ progress, current_task: currentTask, logs })
        .eq('id', briefId);
    } else {
      await supabase
        .from('v1_generated_briefs')
        .update({ progress, current_task: currentTask })
        .eq('id', briefId);
    }
  } catch (err) {
    // Non-fatal — status tracking failure should never break the pipeline
    console.error('[StatusUpdate] Failed to update status:', err);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let briefId: string | null = null;
  let publicSlug: string | null = null;

  try {
    const body: GenerateRequest = await request.json();
    let { crawlResult, provider, model, apiKey, generateImages = true } = body;

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
        if (claudeKey) {
          provider = 'claude';
          apiKey = claudeKey;
          model = model || 'claude-sonnet-4-6';
        } else if (openaiKey) {
          provider = 'openai';
          apiKey = openaiKey;
          model = model || 'gpt-4o';
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

    // Ensure provider and apiKey are set
    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Failed to determine AI provider' },
        { status: 500 }
      );
    }

    // Step 0: INSERT initial row with status='processing' so the progress page
    // can start polling immediately before any heavy work begins.
    console.log('[Database] Inserting initial processing row...');
    const { data: initialRow, error: initialInsertError } = await supabase
      .from('v1_generated_briefs')
      .insert({
        source_url: crawlResult.mainUrl,
        crawl_result: crawlResult,
        status: 'processing',
        progress: 0,
        current_task: 'Generating creative brief...',
        logs: [],
        is_public: true,
      })
      .select('id, public_slug')
      .single();

    if (initialInsertError || !initialRow) {
      console.error('[Database] Failed to insert initial row:', initialInsertError);
      // Non-fatal — continue without status tracking
    } else {
      briefId = initialRow.id;
      publicSlug = initialRow.public_slug;
      console.log(`[Database] Initial row created: id=${briefId} slug=${publicSlug}`);
    }

    // Step 0b: Clean and normalize crawl data
    console.log('[Cleanup] Starting crawl data cleanup...');
    const { cleanedPages, stats } = cleanupCrawlResult(crawlResult);
    console.log('[Cleanup] Stats:', JSON.stringify(stats, null, 2));
    console.log(`[Cleanup] Reduced from ${stats.original} to ${cleanedPages.length} pages`);

    const cleanedCrawlResult = convertToLegacyFormat(
      cleanedPages,
      crawlResult.mainUrl,
      crawlResult.crawledAt
    );

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
      if (briefId) {
        await supabase
          .from('v1_generated_briefs')
          .update({ status: 'failed', error_message: 'Failed to parse AI response as JSON.' })
          .eq('id', briefId);
      }
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

    // Update: Step 1 complete
    await updateStatus(briefId, 35, 'Generating deliverables...', 'Creative brief generated');

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

    // Update: Step 2 complete
    await updateStatus(briefId, 55, 'Refining ad copy...', 'Deliverables generated');

    // Step 2b: Refine Facebook ad copy to be more emotionally resonant
    if (Array.isArray(deliverables.facebookCampaigns) && deliverables.facebookCampaigns.length > 0) {
      try {
        console.log('[AdCopyRefine] Refining Facebook ad copy...');
        const businessName = cleanedCrawlResult.mainUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
        const refined = await refineFacebookAdCopy(deliverables.facebookCampaigns, businessName);
        deliverables.facebookCampaigns = refined as FacebookCampaign[];
        console.log('[AdCopyRefine] Facebook ad copy refined successfully');
      } catch (refineError) {
        console.error('[AdCopyRefine] Refinement failed, keeping original copy:', refineError);
      }
    }

    // Update: Step 2b complete
    await updateStatus(briefId, 65, 'Generating images...', 'Ad copy refined');

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
        console.log(`[Magazine] Generated 13 images (3 avatars + cover + 8 pages + back cover)`);

        // Note: We need a briefId to save images, so we'll save them after database update
        // For now, store temporary URLs (without generationTimeMs)
        const { generationTimeMs, ...imageUrls } = tempImages;
        images = imageUrls;
      } catch (imageError) {
        console.error('[Magazine] Image generation failed, continuing without images:', imageError);
        // Don't fail the entire request if images fail
        images = null;
        tempImages = null;
      }
    }

    // Update: Step 3 complete
    await updateStatus(briefId, 80, 'Generating campaign images...', 'Magazine images generated');

    // Step 3b: Generate campaign images (FB ads + storyboard) — requires deliverables
    let tempCampaignImages: { facebookImages: [string, string, string]; storyboardFrames: [string, string, string] } | null = null;
    if (generateImages && Array.isArray(sanitizedDeliverables.facebookCampaigns) && sanitizedDeliverables.facebookCampaigns.length >= 3 && sanitizedDeliverables.video8s) {
      try {
        console.log('[Campaign] Starting campaign image generation...');
        const businessName = cleanedCrawlResult.mainUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
        tempCampaignImages = await generateCampaignImages(sanitizedDeliverables, businessName);
        console.log('[Campaign] Generated 6 campaign images');
        if (images) {
          images.facebookImages = tempCampaignImages.facebookImages;
          images.storyboardFrames = tempCampaignImages.storyboardFrames;
        }
      } catch (campaignImageError) {
        console.error('[Campaign] Campaign image generation failed, continuing:', campaignImageError);
      }
    }

    // Update: Step 3b complete
    await updateStatus(briefId, 90, 'Saving to storage...', 'Campaign images generated');

    // Calculate total generation time
    const generationTimeMs = Date.now() - startTime;

    // Step 4: Update the existing row (inserted at Step 0) with full brief data.
    // If briefId is null (initial insert failed), fall back to a fresh insert.
    console.log('[Database] Saving brief data to Supabase...');
    let savedBrief: { id: string; public_slug: string } | null = null;

    if (briefId) {
      const { data: updatedBrief, error: updateError } = await supabase
        .from('v1_generated_briefs')
        .update({
          brief: sanitizedBrief,
          deliverables: sanitizedDeliverables,
          images: images || null,
          provider: briefResult.provider,
          model: briefResult.model,
          generation_time_ms: generationTimeMs,
          is_public: true,
        })
        .eq('id', briefId)
        .select('id, public_slug')
        .single();

      if (updateError) {
        console.error('[Database] Error updating brief:', updateError);
      } else {
        savedBrief = updatedBrief;
        console.log(`[Database] Brief updated: slug=${savedBrief?.public_slug}`);
      }
    } else {
      // Fallback: initial insert failed, so do a full insert now
      const { data: insertedBrief, error: insertError } = await supabase
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
          status: 'processing',
        })
        .select('id, public_slug')
        .single();

      if (insertError) {
        console.error('[Database] Error inserting brief (fallback):', insertError);
      } else {
        savedBrief = insertedBrief;
        briefId = insertedBrief?.id ?? null;
        publicSlug = insertedBrief?.public_slug ?? null;
        console.log(`[Database] Brief inserted (fallback): slug=${publicSlug}`);
      }
    }

    // Step 5: If images were generated, save them permanently to storage
    if (savedBrief?.id) {
      if (images && tempImages) {
        try {
          console.log('[Storage] Saving magazine images to permanent storage...');
          const permanentImages = await saveMagazineImages(savedBrief.id, tempImages);

          // Update database with permanent URLs
          const { error: imgUpdateError } = await supabase
            .from('v1_generated_briefs')
            .update({ images: permanentImages })
            .eq('id', savedBrief.id);

          if (imgUpdateError) {
            console.error('[Storage] Error updating with permanent URLs:', imgUpdateError);
          } else {
            console.log('[Storage] Updated database with permanent magazine image URLs');
            images = permanentImages; // Return permanent URLs to user
          }

          // Step 5b: Save campaign images permanently
          if (tempCampaignImages && images) {
            try {
              const permanentCampaignImages = await saveCampaignImages(savedBrief.id, tempCampaignImages);
              images.facebookImages = permanentCampaignImages.facebookImages;
              images.storyboardFrames = permanentCampaignImages.storyboardFrames;
              await supabase
                .from('v1_generated_briefs')
                .update({ images })
                .eq('id', savedBrief.id);
              console.log('[Storage] Campaign images saved permanently');
            } catch (campaignStorageError) {
              console.error('[Storage] Failed to save campaign images:', campaignStorageError);
            }
          }
        } catch (storageError) {
          console.error('[Storage] Failed to save magazine images permanently:', storageError);
          // Continue with temporary URLs
        }
      }

      // Mark as completed
      await updateStatus(briefId, 100, 'Done', 'Brief saved successfully');
      await supabase
        .from('v1_generated_briefs')
        .update({ status: 'completed' })
        .eq('id', savedBrief.id);
      console.log('[Database] Brief marked as completed');
    }

    const resolvedSlug = savedBrief?.public_slug ?? publicSlug;

    return NextResponse.json({
      brief: sanitizedBrief,
      deliverables: sanitizedDeliverables,
      images: images,
      model: briefResult.model,
      provider: briefResult.provider,
      publicUrl: resolvedSlug ? `/creative-strategy-brief/${resolvedSlug}` : undefined,
      briefId: savedBrief?.id ?? briefId,
    });
  } catch (error) {
    console.error('Generate error:', error);

    // Update DB row to failed if we have a briefId
    if (briefId) {
      try {
        await supabase
          .from('v1_generated_briefs')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', briefId);
        console.log('[Database] Brief marked as failed');
      } catch (dbErr) {
        console.error('[Database] Failed to mark brief as failed:', dbErr);
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate brief' },
      { status: 500 }
    );
  }
}
