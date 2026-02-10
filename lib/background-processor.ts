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

interface ProcessOptions {
  briefId: string;
  crawlResult: CrawlResult;
  provider: AIProvider;
  model: string;
  apiKey: string;
}

/**
 * Updates brief status in database
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
  }
) {
  const { data: currentBrief } = await supabase
    .from('v1_generated_briefs')
    .select('logs')
    .eq('id', briefId)
    .single();

  const logs = currentBrief?.logs || [];

  if (updates.log) {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    logs.push(`[${timestamp}] ${updates.log}`);
  }

  const updateData: any = {
    ...updates,
    logs,
  };
  delete updateData.log;

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
 * Process brief generation in background
 * This function runs async and updates the database as it progresses
 */
export async function processBriefGeneration(options: ProcessOptions) {
  const { briefId, crawlResult, provider, model, apiKey } = options;

  try {
    // Fetch brief metadata to determine type
    const { data: briefRecord } = await supabase
      .from('v1_generated_briefs')
      .select('metadata')
      .eq('id', briefId)
      .single();

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
    } catch {
      throw new Error('Failed to parse AI response as JSON');
    }

    const validation = validateCreativeBrief(brief);
    if (!validation.valid) {
      console.warn('[Background] Brief validation warnings:', validation.errors);
    }

    await updateBriefStatus(briefId, {
      progress: 70,
      current_task: 'Brief generation complete',
      log: `Brief generated with ${brief.avatars.length} avatars`,
    });

    // Stage 3: Generate Deliverables (70-95%)
    await updateBriefStatus(briefId, {
      progress: 75,
      current_task: 'Generating deliverables',
      log: 'Building deliverables prompt...',
    });

    const deliverablesPrompt = buildDeliverablesPrompt(JSON.stringify(brief, null, 2));

    await updateBriefStatus(briefId, {
      progress: 80,
      current_task: 'AI is generating deliverables',
      log: 'Sending to AI for deliverables...',
    });

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
      deliverables = {
        websiteSummary: 'Failed to generate website summary.',
        creativeBrief: 'Failed to generate creative brief.',
        facebookCampaigns: 'Failed to generate Facebook campaigns.',
        tvCommercial30s: 'Failed to generate TV commercial.',
      };
    }

    // Sanitize
    const sanitizedBrief = JSON.parse(sanitizeEmDashes(JSON.stringify(brief)));
    const sanitizedDeliverables = JSON.parse(sanitizeEmDashes(JSON.stringify(deliverables)));

    await updateBriefStatus(briefId, {
      progress: 95,
      current_task: 'Deliverables complete',
      log: 'Deliverables generated successfully',
    });

    // Stage 4: Complete (95-100%)
    await updateBriefStatus(briefId, {
      progress: 98,
      current_task: 'Saving to database',
      log: 'Finalizing brief...',
    });

    await updateBriefStatus(briefId, {
      status: 'completed',
      progress: 100,
      current_task: 'Complete!',
      brief: sanitizedBrief,
      deliverables: sanitizedDeliverables,
      log: 'Brief generation completed successfully',
    });

    console.log(`[Background] ✅ Brief ${briefId} completed successfully`);
  } catch (error) {
    console.error(`[Background] ❌ Brief ${briefId} failed:`, error);

    await updateBriefStatus(briefId, {
      status: 'failed',
      current_task: 'Generation failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      log: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}
