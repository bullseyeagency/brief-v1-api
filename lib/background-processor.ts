/**
 * Background brief generation processor
 * Handles async generation and updates database with progress
 */

import { supabase } from './supabase';
import { generateWithProvider } from './providers';
import { buildSystemPrompt, buildGenerationPrompt, buildLocalGenerationPrompt, buildShopifyGenerationPrompt, buildDeliverablesPrompt } from './prompts';
import { validateCreativeBrief, sanitizeEmDashes } from './validation';
import { cleanupCrawlResult, convertToLegacyFormat } from './crawl-cleanup';
import { CrawlResult, AIProvider, CreativeBrief, Deliverables, FacebookCampaign } from './types';
import { generateAvatarImages, generateMagazinePages, generateCampaignImages, MagazineImageGenerationResult } from './image-generator';
import { saveMagazineImages, saveCampaignImages } from './image-storage';
import { refineFacebookAdCopy } from './ad-copy-refine';

interface ProcessOptions {
  briefId: string;
  crawlResult: CrawlResult;
  provider: AIProvider;
  model: string;
  apiKey: string;
}

/**
 * Updates brief status in database
 * Prevents progress from going backwards
 */
async function updateBriefStatus(
  briefId: string,
  updates: {
    status?: 'processing' | 'completed' | 'failed';
    progress?: number;
    current_task?: string;
    log?: string;
    brief?: any;
    deliverables?: any;
    error_message?: string;
    tokens_used?: object;
    cost_usd?: number;
    images?: object;
    image_credits?: number;
    image_cost_usd?: number;
  }
) {
  // Fetch current state to prevent backwards progress
  const { data: currentBrief } = await supabase
    .from('v1_generated_briefs')
    .select('logs, progress, status')
    .eq('id', briefId)
    .single();

  const logs = currentBrief?.logs || [];

  // Add new log entry
  if (updates.log) {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    logs.push(`[${timestamp}] ${updates.log}`);
  }

  const updateData: any = {
    ...updates,
    logs,
  };
  delete updateData.log;

  // CRITICAL: Prevent progress from going backwards
  // Only update progress if:
  // 1. There's no current progress (first update), OR
  // 2. New progress is higher than current progress, OR
  // 3. Status is being set to 'completed' or 'failed' (final states)
  if (updates.progress !== undefined && currentBrief) {
    const currentProgress = currentBrief.progress || 0;
    const newProgress = updates.progress;

    // Don't update progress if it would go backwards (unless completing/failing)
    if (newProgress < currentProgress && updates.status !== 'completed' && updates.status !== 'failed') {
      console.warn(`[Background] ⚠️ Prevented backwards progress: ${currentProgress}% → ${newProgress}%`);
      delete updateData.progress; // Remove progress from update

      // Log the attempted backwards progress
      logs.push(`[${new Date().toLocaleTimeString('en-US', { hour12: false })}] ⚠️ Skipped backwards progress update`);
      updateData.logs = logs;
    }
  }

  await supabase
    .from('v1_generated_briefs')
    .update(updateData)
    .eq('id', briefId);
}

/**
 * Helper to parse JSON response from AI
 */
function parseJsonResponse(content: string): unknown {
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
  else if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
  if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
  return JSON.parse(jsonStr.trim());
}

/**
 * Fire webhook callback to notify the caller (e.g. Sophia OS) that a brief is done
 */
async function fireCallback(
  callbackUrl: string,
  payload: { companyId: string | null; briefId: string; status: 'completed' | 'failed'; publicUrl?: string; error?: string }
) {
  try {
    const secret = process.env.BRIEF_CALLBACK_SECRET;
    const res = await fetch(callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'x-callback-secret': secret } : {}),
      },
      body: JSON.stringify(payload),
    });
    console.log(`[Background] Callback fired → ${callbackUrl} (${res.status})`);
  } catch (err) {
    console.error('[Background] Callback failed:', err);
  }
}

/**
 * Process brief generation in background
 * This function runs async and updates the database as it progresses
 */
export async function processBriefGeneration(options: ProcessOptions) {
  const { briefId, crawlResult, provider, model, apiKey } = options;

  // Declared outside try/catch so catch block can access for failure callback
  let briefRecord: { metadata: any; status: string; callback_url: string | null; sophia_contact_id: string | null } | null = null;

  try {
    // Atomic claim: only update if progress <= 40 and status = processing
    // If another instance already started, this update matches 0 rows and we bail
    const { data: claimed } = await supabase
      .from('v1_generated_briefs')
      .update({ progress: 41, current_task: 'Initializing...' })
      .eq('id', briefId)
      .eq('status', 'processing')
      .lte('progress', 40)
      .select('id, metadata, callback_url, sophia_contact_id');

    if (!claimed || claimed.length === 0) {
      console.log(`[Background] Brief ${briefId} already claimed by another process or not in processing state — skipping`);
      return;
    }

    // Fetch remaining fields now that we've claimed it
    const { data: fetchedRecord } = await supabase
      .from('v1_generated_briefs')
      .select('metadata, callback_url, sophia_contact_id, status')
      .eq('id', briefId)
      .single();
    briefRecord = fetchedRecord;

    if (!briefRecord) {
      console.error(`[Background] ❌ Brief ${briefId} not found after claim`);
      return;
    }

    // Fetch image generation slot settings
    let imageSlots: Record<string, boolean> = {
      avatars: true,
      cover: false,
      'pages.brandTruth': false,
      'pages.marketContext': true,
      'pages.problem': true,
      'pages.transformation': true,
      'pages.proofPillars': false,
      'pages.offer': true,
      'pages.messaging': false,
      'pages.creativeDirection': false,
      backCover: true,
      facebookImages: true,
      storyboardFrames: true,
    };
    try {
      const { data: slotData } = await supabase.from('app_settings').select('value').eq('key', 'image_slots').single();
      if (slotData?.value) imageSlots = slotData.value as Record<string, boolean>;
    } catch { /* use defaults */ }

    const briefType = briefRecord?.metadata?.type as 'local' | 'shopify' | undefined;
    console.log(`[Background] Brief type: ${briefType || 'default'}`);

    // Stage 1: Clean crawl data (30-35%)
    await updateBriefStatus(briefId, {
      progress: 30,
      current_task: 'Cleaning crawl data',
      log: 'Cleaning and normalizing crawl data...',
    });

    const { cleanedPages, stats } = cleanupCrawlResult(crawlResult);
    await updateBriefStatus(briefId, {
      progress: 35,
      log: `Reduced from ${stats.original} to ${cleanedPages.length} pages`,
    });

    const cleanedCrawlResult = convertToLegacyFormat(
      cleanedPages,
      crawlResult.mainUrl,
      crawlResult.crawledAt
    );

    // Stage 2: Generate Brief (35-70%)
    await updateBriefStatus(briefId, {
      progress: 40,
      current_task: 'Preparing AI prompts',
      log: `Building ${briefType || 'default'} generation prompts...`,
    });

    const systemPrompt = buildSystemPrompt();

    // Choose prompt based on type
    let generationPrompt: string;
    if (briefType === 'local') {
      generationPrompt = buildLocalGenerationPrompt(cleanedCrawlResult);
    } else if (briefType === 'shopify') {
      generationPrompt = buildShopifyGenerationPrompt(cleanedCrawlResult);
    } else {
      generationPrompt = buildGenerationPrompt(cleanedCrawlResult);
    }

    await updateBriefStatus(briefId, {
      progress: 45,
      current_task: 'Sending to AI for brief generation',
      log: `System prompt: ${systemPrompt.length} characters`,
    });

    await updateBriefStatus(briefId, {
      progress: 50,
      log: `Generation prompt: ${generationPrompt.length} characters`,
    });

    await updateBriefStatus(briefId, {
      progress: 55,
      current_task: 'AI is generating creative brief',
      log: `Using ${provider} - ${model}`,
    });

    const briefResult = await generateWithProvider(provider, {
      systemPrompt,
      userPrompt: generationPrompt,
      apiKey,
      model,
    });

    // Parse and validate brief
    let brief: CreativeBrief;
    try {
      brief = parseJsonResponse(briefResult.content) as CreativeBrief;
      console.log('✅ Brief parsed successfully');
    } catch (error) {
      console.error('❌ Failed to parse brief JSON:', error);
      throw new Error('Failed to parse AI response as JSON');
    }

    const validation = validateCreativeBrief(brief);
    if (!validation.valid) {
      console.warn('[Background] Brief validation warnings:', validation.errors);
    }

    await updateBriefStatus(briefId, {
      progress: 70,
      current_task: 'Brief complete — starting deliverables + avatar images',
      log: `Brief generated with ${brief.avatars.length} avatars`,
    });

    // Stage 3: Deliverables, then avatar images
    const deliverablesPrompt = buildDeliverablesPrompt(JSON.stringify(brief, null, 2));
    const nanoBananaKey = process.env.NANOBANANA_API_KEY;
    const imageModel = 'gemini-2.5-flash-image';
    const businessName = (() => {
      try { return new URL(crawlResult.mainUrl).hostname.replace(/^www\./, ''); }
      catch { return 'Business'; }
    })();

    await updateBriefStatus(briefId, {
      progress: 72,
      current_task: 'Generating deliverables + avatar images',
      log: nanoBananaKey
        ? 'Generating deliverables, then avatar images...'
        : 'Generating deliverables...',
    });

    // Run deliverables first
    const deliverablesResult = await generateWithProvider(provider, {
      systemPrompt: 'You are a creative copywriter. Generate deliverables based on the creative brief. Respond with valid JSON only.',
      userPrompt: deliverablesPrompt,
      apiKey,
      model,
    });

    // Run avatar generation separately — failure is non-fatal
    let avatarUrls: [string, string, string] | null = null;
    if (nanoBananaKey && imageSlots.avatars) {
      try {
        avatarUrls = await generateAvatarImages(brief, businessName, imageModel);
        console.log('[Background] Avatar images generated successfully');
      } catch (avatarError) {
        const avatarErrMsg = avatarError instanceof Error ? avatarError.message : String(avatarError);
        console.error('[Background] Avatar generation failed (brief will complete without images):', avatarError);
        await updateBriefStatus(briefId, { log: `⚠️ Avatar image generation failed: ${avatarErrMsg}` });
      }
    } else if (!nanoBananaKey) {
      console.warn('[Background] NANOBANANA_API_KEY not configured — skipping avatar generation');
    } else {
      console.log('[Background] Avatar slot disabled — skipping avatar generation');
    }

    await updateBriefStatus(briefId, {
      progress: 82,
      current_task: 'Deliverables and avatars ready — refining ad copy',
      log: avatarUrls
        ? 'Deliverables ready. Avatars generated — refining ad copy...'
        : 'Deliverables ready — refining ad copy...',
    });

    // Parse deliverables
    let deliverables: Deliverables;
    try {
      deliverables = parseJsonResponse(deliverablesResult.content) as Deliverables;
      console.log('✅ Deliverables parsed successfully');
    } catch (error) {
      console.error('❌ Failed to parse deliverables JSON:', error);
      deliverables = {
        websiteSummary: 'Failed to generate website summary.',
        facebookCampaigns: [],
        video8s: {
          recognition: { duration: '0-2 seconds', purpose: 'Failed to generate', visualDirection: 'Failed to generate', voiceoverOrText: 'Failed to generate' },
          proofInContext: { duration: '2-6 seconds', purpose: 'Failed to generate', visualDirection: 'Failed to generate', voiceoverOrText: 'Failed to generate' },
          beliefLock: { duration: '6-8 seconds', purpose: 'Failed to generate', visualDirection: 'Failed to generate', voiceoverOrText: 'Failed to generate' },
        },
      };
    }

    // Stage 4: Refine Facebook ad copy (before image generation so refined copy is available for campaign images)
    if (Array.isArray(deliverables.facebookCampaigns) && deliverables.facebookCampaigns.length > 0) {
      try {
        await updateBriefStatus(briefId, {
          progress: 84,
          current_task: 'Refining ad copy',
          log: 'Refining Facebook ad copy...',
        });
        deliverables.facebookCampaigns = await refineFacebookAdCopy(
          deliverables.facebookCampaigns as FacebookCampaign[],
          businessName
        ) as FacebookCampaign[];
        await updateBriefStatus(briefId, { log: 'Ad copy refined' });
      } catch (refineError) {
        console.error('[Background] Ad copy refinement failed (non-fatal):', refineError);
      }
    }

    // Stage 5: Run magazine pages and campaign images concurrently
    await updateBriefStatus(briefId, {
      progress: 86,
      current_task: 'Generating images',
      log: 'Generating magazine pages and campaign images in parallel...',
    });

    // Determine if any booklet-only slot is enabled
    const anyBookletSlotEnabled =
      imageSlots.cover ||
      imageSlots['pages.brandTruth'] ||
      imageSlots['pages.proofPillars'] ||
      imageSlots['pages.messaging'] ||
      imageSlots['pages.creativeDirection'];

    // Also check if any public-page magazine slots are enabled (marketContext, problem, transformation, offer, backCover)
    const anyMagazineSlotEnabled =
      anyBookletSlotEnabled ||
      imageSlots['pages.marketContext'] ||
      imageSlots['pages.problem'] ||
      imageSlots['pages.transformation'] ||
      imageSlots['pages.offer'] ||
      imageSlots.backCover;

    const [magazinePagesResult, campaignImagesResult] = await Promise.allSettled([
      // Magazine pages (needs brief + avatarUrls)
      nanoBananaKey && avatarUrls && anyMagazineSlotEnabled
        ? generateMagazinePages(brief, businessName, avatarUrls, imageModel)
        : Promise.resolve(null),
      // Campaign images (needs deliverables)
      nanoBananaKey &&
        (imageSlots.facebookImages || imageSlots.storyboardFrames) &&
        Array.isArray(deliverables.facebookCampaigns) &&
        (deliverables.facebookCampaigns as FacebookCampaign[]).length >= 3 &&
        deliverables.video8s
        ? generateCampaignImages(deliverables, businessName)
        : Promise.resolve(null),
    ]);

    const magazinePages = magazinePagesResult.status === 'fulfilled' ? magazinePagesResult.value : null;
    const campaignImagesData = campaignImagesResult.status === 'fulfilled' ? campaignImagesResult.value : null;

    if (magazinePagesResult.status === 'rejected') {
      console.error('[Background] Magazine page generation failed (non-fatal):', magazinePagesResult.reason);
    } else if (magazinePages) {
      console.log('[Background] Magazine pages generated successfully');
    }

    if (campaignImagesResult.status === 'rejected') {
      console.error('[Background] Campaign image generation failed (non-fatal):', campaignImagesResult.reason);
    } else if (campaignImagesData) {
      console.log('[Background] Campaign images generated successfully');
    }

    await updateBriefStatus(briefId, {
      progress: 93,
      current_task: 'Saving images',
      log: 'Parallel image generation complete — saving to storage...',
    });

    // Stage 6: Save images to Supabase Storage
    let savedImages: object | undefined;
    let imageCredits: number | undefined;
    let imageCostUsd: number | undefined;

    if (nanoBananaKey && avatarUrls && magazinePages) {
      try {
        const creditsPerImage = 2; // gemini-2.5-flash-image
        imageCredits = 13 * creditsPerImage;
        imageCostUsd = parseFloat((imageCredits * 0.01).toFixed(4));

        // Only include image slots that are enabled
        const tempImages = {
          cover: imageSlots.cover ? magazinePages.cover : undefined,
          avatars: imageSlots.avatars ? avatarUrls : undefined,
          pages: {
            brandTruth:        imageSlots['pages.brandTruth']        ? magazinePages.pages.brandTruth        : undefined,
            marketContext:     imageSlots['pages.marketContext']     ? magazinePages.pages.marketContext     : undefined,
            problem:           imageSlots['pages.problem']           ? magazinePages.pages.problem           : undefined,
            transformation:    imageSlots['pages.transformation']    ? magazinePages.pages.transformation    : undefined,
            proofPillars:      imageSlots['pages.proofPillars']      ? magazinePages.pages.proofPillars      : undefined,
            offer:             imageSlots['pages.offer']             ? magazinePages.pages.offer             : undefined,
            messaging:         imageSlots['pages.messaging']         ? magazinePages.pages.messaging         : undefined,
            creativeDirection: imageSlots['pages.creativeDirection'] ? magazinePages.pages.creativeDirection : undefined,
          },
          backCover: imageSlots.backCover ? magazinePages.backCover : undefined,
          generationTimeMs: 0,
          creditsUsed: imageCredits,
          imageCostUsd,
        } as MagazineImageGenerationResult;

        savedImages = await saveMagazineImages(briefId, tempImages);
        console.log(`[Background] ✅ Magazine images saved — ${imageCredits} credits ($${imageCostUsd})`);
      } catch (imgError) {
        console.error('[Background] Magazine image save failed (non-fatal):', imgError);
      }
    }

    if (campaignImagesData) {
      try {
        const savedCampaignImages = await saveCampaignImages(briefId, campaignImagesData);
        savedImages = { ...(savedImages as object ?? {}), ...savedCampaignImages };
        await updateBriefStatus(briefId, { log: 'Campaign images saved' });
        console.log('[Background] ✅ Campaign images saved');
      } catch (campaignSaveError) {
        console.error('[Background] Campaign image save failed (non-fatal):', campaignSaveError);
      }
    }

    // Sanitize
    const sanitizedBrief = JSON.parse(sanitizeEmDashes(JSON.stringify(brief)));
    const sanitizedDeliverables = JSON.parse(sanitizeEmDashes(JSON.stringify(deliverables)));

    // Calculate token usage and cost (GPT-5 pricing: $1.75/1M input, $14.00/1M output)
    const briefUsage = briefResult.usage;
    const delivUsage = deliverablesResult.usage;
    let tokensUsed: object | undefined;
    let costUsd: number | undefined;

    if (briefUsage || delivUsage) {
      const briefIn  = briefUsage?.promptTokens     ?? 0;
      const briefOut = briefUsage?.completionTokens ?? 0;
      const delivIn  = delivUsage?.promptTokens     ?? 0;
      const delivOut = delivUsage?.completionTokens ?? 0;
      const totalIn  = briefIn + delivIn;
      const totalOut = briefOut + delivOut;

      tokensUsed = {
        brief:        { prompt: briefIn, completion: briefOut, total: briefUsage?.totalTokens ?? briefIn + briefOut },
        deliverables: { prompt: delivIn, completion: delivOut, total: delivUsage?.totalTokens ?? delivIn + delivOut },
        total:        totalIn + totalOut,
      };

      costUsd = parseFloat(((totalIn * 1.75 + totalOut * 14.00) / 1_000_000).toFixed(6));
      console.log(`[Background] Tokens — brief: ${briefIn}in/${briefOut}out, deliverables: ${delivIn}in/${delivOut}out, total: ${totalIn + totalOut}, cost: $${costUsd}`);
    }

    await updateBriefStatus(briefId, {
      progress: 97,
      current_task: 'Finalizing',
      log: 'Images saved — finalizing brief...',
    });

    // Stage 7: Complete
    await updateBriefStatus(briefId, {
      status: 'completed',
      progress: 100,
      current_task: 'Complete!',
      brief: sanitizedBrief,
      deliverables: sanitizedDeliverables,
      log: 'Brief generation completed successfully',
      ...(tokensUsed   !== undefined && { tokens_used: tokensUsed }),
      ...(costUsd      !== undefined && { cost_usd: costUsd }),
      ...(savedImages  !== undefined && { images: savedImages }),
      ...(imageCredits !== undefined && { image_credits: imageCredits }),
      ...(imageCostUsd !== undefined && { image_cost_usd: imageCostUsd }),
    });

    console.log(`[Background] ✅ Brief ${briefId} completed successfully`);

    // Generate and cache editorial summary
    try {
      const websiteSummary = sanitizedDeliverables?.websiteSummary as string | undefined;
      if (websiteSummary) {
        const EDITORIAL_SYSTEM_PROMPT = `You are an expert direct-response copywriter. Your job is to transform factual business summaries into client-oriented, benefit-driven copy that speaks directly to the reader. Rules:
- Write in second person where natural ("you", "your customers")
- Lead with the transformation or outcome, not the feature list
- Keep all factual details (services, contact info, locations) but frame them as benefits
- Break into 3-5 short paragraphs. Each paragraph = one clear idea
- No marketing buzzwords ("world-class", "cutting-edge", "seamless")
- Keep the same tone as the source — if it's a plumber, stay grounded; if it's a luxury brand, stay elevated
- Output ONLY the rewritten copy, no explanation, no preamble`;

        const userPrompt = `Rewrite the following business summary into client-oriented copy:\n\n${websiteSummary}\n\nBusiness context: ${crawlResult.mainUrl}`;

        const openAiKey = process.env.OPENAI_API_KEY;
        const anthropicKey = process.env.ANTHROPIC_API_KEY;

        let editorialSummary: string | null = null;

        if (openAiKey) {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${openAiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                { role: 'system', content: EDITORIAL_SYSTEM_PROMPT },
                { role: 'user', content: userPrompt },
              ],
              max_tokens: 600,
              temperature: 0.4,
            }),
          });
          if (response.ok) {
            const data = await response.json();
            editorialSummary = data.choices?.[0]?.message?.content?.trim() ?? null;
          }
        }

        if (!editorialSummary && anthropicKey) {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': anthropicKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-6',
              max_tokens: 600,
              system: EDITORIAL_SYSTEM_PROMPT,
              messages: [{ role: 'user', content: userPrompt }],
            }),
          });
          if (response.ok) {
            const data = await response.json();
            editorialSummary = data.content?.[0]?.text?.trim() ?? null;
          }
        }

        if (editorialSummary) {
          await supabase
            .from('v1_generated_briefs')
            .update({ editorial_summary: editorialSummary })
            .eq('id', briefId);
          console.log('[Background] Editorial summary cached');
        }
      }
    } catch (err) {
      console.warn('[Background] Editorial summary failed (non-fatal):', err);
    }

    // Fire callback if provided
    if (briefRecord?.callback_url) {
      const siteUrl = 'https://briefs.dalyandco.com';
      const { data: completedBrief } = await supabase
        .from('v1_generated_briefs')
        .select('public_slug')
        .eq('id', briefId)
        .single();
      const publicUrl = completedBrief?.public_slug
        ? `${siteUrl}/creative-strategy-brief/${completedBrief.public_slug}`
        : undefined;
      await fireCallback(briefRecord.callback_url, {
        companyId: briefRecord.sophia_contact_id || null,
        briefId,
        status: 'completed',
        publicUrl,
      });
    }
  } catch (error) {
    console.error(`[Background] ❌ Brief ${briefId} failed:`, error);

    await updateBriefStatus(briefId, {
      status: 'failed',
      progress: 0,
      current_task: 'Generation failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      log: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });

    // Fire failure callback if provided
    if (briefRecord?.callback_url) {
      await fireCallback(briefRecord.callback_url, {
        companyId: briefRecord?.sophia_contact_id || null,
        briefId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
