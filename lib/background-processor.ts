/**
 * Background brief generation processor
 * Handles async generation and updates database with progress
 */

import { supabase } from './supabase';
import { generateWithProvider } from './providers';
import { buildSystemPrompt, buildGenerationPrompt, buildLocalGenerationPrompt, buildShopifyGenerationPrompt, buildDeliverablesPrompt } from './prompts';
import { validateCreativeBrief, sanitizeEmDashes } from './validation';
import { cleanupCrawlResult, convertToLegacyFormat } from './crawl-cleanup';
import { CrawlResult, AIProvider, CreativeBrief, Deliverables } from './types';
import {
  generateAvatarWithFallback,
  generateImage,
  buildCoverPagePrompt,
  buildBrandTruthPagePrompt,
  buildMarketContextPagePrompt,
  buildProblemPagePrompt,
  buildTransformationPagePrompt,
  buildProofPillarsPagePrompt,
  buildOfferPagePrompt,
  buildMessagingPagePrompt,
  buildCreativeDirectionPagePrompt,
  buildBackCoverPagePrompt,
  buildFacebookAdImagePrompt,
  buildStoryboardFramePrompt,
} from './image-generator';
import { saveImagePermanently } from './image-storage';

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
  let briefRecord: { metadata: any; status: string; callback_url: string | null; sophia_contact_id: string | null; public_slug: string | null } | null = null;

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
      .select('metadata, callback_url, sophia_contact_id, status, public_slug')
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

    // Stage 1: Prepare content (45%)
    await updateBriefStatus(briefId, {
      progress: 45,
      current_task: 'Preparing content',
      log: 'Cleaning and normalizing crawl data...',
    });

    const { cleanedPages, stats } = cleanupCrawlResult(crawlResult);
    await updateBriefStatus(briefId, {
      log: `Reduced from ${stats.original} to ${cleanedPages.length} pages — building ${briefType || 'default'} prompts...`,
    });

    const cleanedCrawlResult = convertToLegacyFormat(
      cleanedPages,
      crawlResult.mainUrl,
      crawlResult.crawledAt
    );

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
      progress: 50,
      current_task: 'Generating brief',
      log: `Sending to ${provider} (${model}) — system: ${systemPrompt.length} chars, prompt: ${generationPrompt.length} chars`,
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
      current_task: 'Brief complete',
      log: `Brief generated with ${brief.avatars.length} avatars — starting deliverables...`,
    });

    // Stage 3: Deliverables only (no images yet)
    const deliverablesPrompt = buildDeliverablesPrompt(JSON.stringify(brief, null, 2));
    await updateBriefStatus(briefId, {
      progress: 72,
      current_task: 'Generating deliverables',
      log: 'Sending deliverables prompt to AI...',
    });
    const nanoBananaKey = process.env.NANOBANANA_API_KEY;
    const imageModel = 'gemini-2.5-flash-image';
    const businessName = (() => {
      try { return new URL(crawlResult.mainUrl).hostname.replace(/^www\./, ''); }
      catch { return 'Business'; }
    })();

    // Run deliverables
    const deliverablesResult = await generateWithProvider(provider, {
      systemPrompt: 'You are a creative copywriter. Generate deliverables based on the creative brief. Respond with valid JSON only.',
      userPrompt: deliverablesPrompt,
      apiKey,
      model,
    });

    await updateBriefStatus(briefId, {
      progress: 82,
      current_task: 'Deliverables complete',
      log: 'Deliverables ready — parsing...',
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

    // Stage 4 & 5: Avatar + section image generation with immediate per-image saves (83-94)
    // Each image is saved to Supabase Storage as soon as it arrives from NanoBanana.
    await updateBriefStatus(briefId, {
      progress: 83,
      current_task: 'Generating avatars',
      log: nanoBananaKey && imageSlots.avatars
        ? 'Generating avatar images — each saved immediately on arrival...'
        : 'Skipping avatar images — slot disabled or no API key',
    });

    // Fire editorial summary in parallel with image generation — await just before final DB write
    const editorialSummaryPromise: Promise<string | null> = (async () => {
      try {
        const websiteSummary = deliverables?.websiteSummary as string | undefined;
        if (!websiteSummary) return null;

        const EDITORIAL_SYSTEM_PROMPT = `You are an expert direct-response copywriter. Your job is to transform factual business summaries into client-oriented, benefit-driven copy that speaks directly to the reader. Rules:
- Write in second person where natural ("you", "your customers")
- Lead with the transformation or outcome, not the feature list
- Keep all factual details (services, contact info, locations) but frame them as benefits
- Break into 3-5 short paragraphs. Each paragraph = one clear idea
- No marketing buzzwords ("world-class", "cutting-edge", "seamless")
- Keep the same tone as the source — if it's a plumber, stay grounded; if it's a luxury brand, stay elevated
- Output ONLY the rewritten copy, no explanation, no preamble`;

        const userPrompt = `Rewrite the following business summary into client-oriented copy:\n\n${websiteSummary}\n\nBusiness context: ${crawlResult.mainUrl}`;
        const anthropicKey = process.env.ANTHROPIC_API_KEY;
        if (!anthropicKey) return null;

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
        if (!response.ok) return null;
        const data = await response.json();
        return data.content?.[0]?.text?.trim() ?? null;
      } catch (err) {
        console.warn('[Background] Editorial summary failed (non-fatal):', err);
        return null;
      }
    })();

    const storageFolder = briefRecord?.public_slug ?? briefId;
    let savedImages: object | undefined;
    let imageCredits: number | undefined;
    let imageCostUsd: number | undefined;

    // Helper: generate one image then immediately save to permanent storage.
    // Returns the permanent URL, or '' on failure (non-fatal).
    const genAndSave = (prompt: string, imageType: string, size: string = '1:1'): Promise<string> =>
      generateImage(prompt, imageModel, size)
        .then((tempUrl) => saveImagePermanently(tempUrl, storageFolder, imageType))
        .catch((err) => {
          console.error(`[Background] Image failed (${imageType}):`, err);
          return '';
        });

    // Avatar generation — each generated image is saved immediately.
    // avatarPermUrls holds the permanent URLs (or '' on failure).
    let avatarPermUrls: [string, string, string] | null = null;
    if (nanoBananaKey && imageSlots.avatars) {
      try {
        const [a1, a2, a3] = await Promise.all([
          generateAvatarWithFallback(brief.avatars[0], businessName, imageModel)
            .then((url) => saveImagePermanently(url, storageFolder, 'avatar_primary'))
            .catch((err) => { console.error('[Background] Avatar 1 failed:', err); return ''; }),
          generateAvatarWithFallback(brief.avatars[1], businessName, imageModel)
            .then((url) => saveImagePermanently(url, storageFolder, 'avatar_secondary'))
            .catch((err) => { console.error('[Background] Avatar 2 failed:', err); return ''; }),
          generateAvatarWithFallback(brief.avatars[2], businessName, imageModel)
            .then((url) => saveImagePermanently(url, storageFolder, 'avatar_tertiary'))
            .catch((err) => { console.error('[Background] Avatar 3 failed:', err); return ''; }),
        ]);
        avatarPermUrls = [a1, a2, a3];
        brief.avatars[0].generatedImageUrl = a1;
        brief.avatars[1].generatedImageUrl = a2;
        brief.avatars[2].generatedImageUrl = a3;
        console.log('[Background] Avatar images generated and saved');
        await updateBriefStatus(briefId, { log: 'Avatar images generated and saved to storage' });
      } catch (avatarError) {
        const avatarErrMsg = avatarError instanceof Error ? avatarError.message : String(avatarError);
        console.error('[Background] Avatar generation failed (brief will complete without images):', avatarError);
        await updateBriefStatus(briefId, { log: `Avatar image generation failed: ${avatarErrMsg}` });
      }
    } else if (!nanoBananaKey) {
      console.warn('[Background] NANOBANANA_API_KEY not configured — skipping avatar generation');
    } else {
      console.log('[Background] Avatar slot disabled — skipping avatar generation');
    }

    // Stage 5: Section images — generate and save each one immediately as it arrives (90-94)
    await updateBriefStatus(briefId, {
      progress: 90,
      current_task: 'Generating section images',
      log: 'Generating magazine pages and campaign images — each saved immediately on arrival...',
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

    // Magazine pages: each promise is generate → immediately save → permanent URL
    const magazinePagesPromise: Promise<{
      cover: string;
      pages: {
        brandTruth: string; marketContext: string; problem: string;
        transformation: string; proofPillars: string; offer: string;
        messaging: string; creativeDirection: string;
      };
      backCover: string;
    } | null> = (async () => {
      if (!nanoBananaKey || !avatarPermUrls || !anyMagazineSlotEnabled) return null;
      try {
        const [
          cover, brandTruth, marketContext, problem,
          transformation, proofPillars, offer, messaging,
          creativeDirection, backCover,
        ] = await Promise.all([
          imageSlots.cover
            ? genAndSave(buildCoverPagePrompt(brief, businessName), 'page_cover')
            : Promise.resolve(''),
          imageSlots['pages.brandTruth']
            ? genAndSave(buildBrandTruthPagePrompt(brief), 'page_brand_truth')
            : Promise.resolve(''),
          imageSlots['pages.marketContext']
            ? genAndSave(buildMarketContextPagePrompt(brief), 'page_market_context')
            : Promise.resolve(''),
          imageSlots['pages.problem']
            ? genAndSave(buildProblemPagePrompt(brief), 'page_problem')
            : Promise.resolve(''),
          imageSlots['pages.transformation']
            ? genAndSave(buildTransformationPagePrompt(brief), 'page_transformation')
            : Promise.resolve(''),
          imageSlots['pages.proofPillars']
            ? genAndSave(buildProofPillarsPagePrompt(brief), 'page_proof_pillars')
            : Promise.resolve(''),
          imageSlots['pages.offer']
            ? genAndSave(buildOfferPagePrompt(brief), 'page_offer')
            : Promise.resolve(''),
          imageSlots['pages.messaging']
            ? genAndSave(buildMessagingPagePrompt(brief), 'page_messaging')
            : Promise.resolve(''),
          imageSlots['pages.creativeDirection']
            ? genAndSave(buildCreativeDirectionPagePrompt(brief), 'page_creative_direction')
            : Promise.resolve(''),
          imageSlots.backCover
            ? genAndSave(buildBackCoverPagePrompt(businessName, brief.callToAction), 'page_back_cover')
            : Promise.resolve(''),
        ]);
        console.log('[Background] Magazine pages generated and saved');
        return {
          cover,
          pages: { brandTruth, marketContext, problem, transformation, proofPillars, offer, messaging, creativeDirection },
          backCover,
        };
      } catch (err) {
        console.error('[Background] Magazine page generation failed (non-fatal):', err);
        return null;
      }
    })();

    // Campaign images: each generate → immediately save → permanent URL
    const campaignImagesPromise: Promise<{ facebookImages: [string, string, string]; storyboardFrames: [string, string, string] } | null> = (async () => {
      const campaigns = Array.isArray(deliverables.facebookCampaigns) ? deliverables.facebookCampaigns : [];
      const video8s = deliverables.video8s;
      if (
        !nanoBananaKey ||
        (!imageSlots.facebookImages && !imageSlots.storyboardFrames) ||
        campaigns.length < 3 ||
        !video8s
      ) return null;
      try {
        const [fb1, fb2, fb3, sb1, sb2, sb3] = await Promise.all([
          imageSlots.facebookImages
            ? genAndSave(buildFacebookAdImagePrompt(campaigns[0], businessName), 'fb_ad_primary')
            : Promise.resolve(''),
          imageSlots.facebookImages
            ? genAndSave(buildFacebookAdImagePrompt(campaigns[1], businessName), 'fb_ad_secondary')
            : Promise.resolve(''),
          imageSlots.facebookImages
            ? genAndSave(buildFacebookAdImagePrompt(campaigns[2], businessName), 'fb_ad_tertiary')
            : Promise.resolve(''),
          imageSlots.storyboardFrames
            ? genAndSave(buildStoryboardFramePrompt(video8s.recognition, 'Recognition', businessName), 'storyboard_recognition', '16:9')
            : Promise.resolve(''),
          imageSlots.storyboardFrames
            ? genAndSave(buildStoryboardFramePrompt(video8s.proofInContext, 'Proof in Context', businessName), 'storyboard_proof', '16:9')
            : Promise.resolve(''),
          imageSlots.storyboardFrames
            ? genAndSave(buildStoryboardFramePrompt(video8s.beliefLock, 'Belief Lock', businessName), 'storyboard_belief', '16:9')
            : Promise.resolve(''),
        ]);
        console.log('[Background] Campaign images generated and saved');
        await updateBriefStatus(briefId, { log: 'Campaign images generated and saved to storage' });
        return {
          facebookImages: [fb1, fb2, fb3] as [string, string, string],
          storyboardFrames: [sb1, sb2, sb3] as [string, string, string],
        };
      } catch (err) {
        console.error('[Background] Campaign image generation failed (non-fatal):', err);
        return null;
      }
    })();

    const [magazinePages, campaignImagesData] = await Promise.all([magazinePagesPromise, campaignImagesPromise]);

    // Assemble savedImages from permanent URLs already in place
    if (nanoBananaKey && avatarPermUrls && magazinePages) {
      const creditsPerImage = 2; // gemini-2.5-flash-image
      imageCredits = 13 * creditsPerImage;
      imageCostUsd = parseFloat((imageCredits * 0.01).toFixed(4));

      savedImages = {
        cover: magazinePages.cover || undefined,
        avatars: avatarPermUrls,
        pages: {
          brandTruth:        magazinePages.pages.brandTruth        || undefined,
          marketContext:     magazinePages.pages.marketContext     || undefined,
          problem:           magazinePages.pages.problem           || undefined,
          transformation:    magazinePages.pages.transformation    || undefined,
          proofPillars:      magazinePages.pages.proofPillars      || undefined,
          offer:             magazinePages.pages.offer             || undefined,
          messaging:         magazinePages.pages.messaging         || undefined,
          creativeDirection: magazinePages.pages.creativeDirection || undefined,
        },
        backCover: magazinePages.backCover || undefined,
      };
      console.log(`[Background] Magazine images complete — ${imageCredits} credits ($${imageCostUsd})`);
    }

    if (campaignImagesData) {
      savedImages = { ...(savedImages as object ?? {}), ...campaignImagesData };
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
      progress: 99,
      current_task: 'Finalising',
      log: 'Images complete — awaiting editorial summary...',
    });

    // Await editorial summary (fired concurrently with avatar generation)
    const editorialSummary = await editorialSummaryPromise;
    if (editorialSummary) {
      await supabase
        .from('v1_generated_briefs')
        .update({ editorial_summary: editorialSummary })
        .eq('id', briefId);
      console.log('[Background] Editorial summary cached');
    }

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
