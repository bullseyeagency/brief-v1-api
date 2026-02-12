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
 * Process brief generation in background
 * This function runs async and updates the database as it progresses
 */
export async function processBriefGeneration(options: ProcessOptions) {
  const { briefId, crawlResult, provider, model, apiKey } = options;

  try {
    // Fetch brief status and metadata
    const { data: briefRecord } = await supabase
      .from('v1_generated_briefs')
      .select('metadata, status, progress')
      .eq('id', briefId)
      .single();

    // SAFEGUARD: Prevent duplicate processing
    if (!briefRecord) {
      console.error(`[Background] ❌ Brief ${briefId} not found`);
      return;
    }

    // Skip if already completed or failed
    if (briefRecord.status === 'completed' || briefRecord.status === 'failed') {
      console.log(`[Background] ⚠️ Brief ${briefId} already ${briefRecord.status}, skipping`);
      return;
    }

    // Skip if already in progress beyond 40% (likely duplicate invocation)
    if (briefRecord.progress && briefRecord.progress > 40) {
      console.log(`[Background] ⚠️ Brief ${briefId} already at ${briefRecord.progress}%, skipping duplicate run`);
      return;
    }

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

    // ================== DEBUG: BRIEF GENERATION REQUEST ==================
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('📤 SENDING TO AI: BRIEF GENERATION');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Provider:', provider);
    console.log('Model:', model);
    console.log('\n--- SYSTEM PROMPT ---');
    console.log(systemPrompt);
    console.log('\n--- USER PROMPT ---');
    console.log(generationPrompt);
    console.log('═══════════════════════════════════════════════════════\n\n');
    // =====================================================================

    const briefResult = await generateWithProvider(provider, {
      systemPrompt,
      userPrompt: generationPrompt,
      apiKey,
      model,
    });

    // ================== DEBUG: BRIEF GENERATION RESPONSE ==================
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('📥 AI RESPONSE: BRIEF GENERATION');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Response length:', briefResult.content.length, 'characters');
    console.log('\n--- RAW RESPONSE ---');
    console.log(briefResult.content);
    console.log('═══════════════════════════════════════════════════════\n\n');
    // ======================================================================

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

    // ================== DEBUG: DELIVERABLES REQUEST ==================
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('📤 SENDING TO AI: DELIVERABLES GENERATION');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Provider:', provider);
    console.log('Model:', model);
    console.log('\n--- SYSTEM PROMPT ---');
    console.log('You are a creative copywriter. Generate deliverables based on the creative brief. Respond with valid JSON only.');
    console.log('\n--- USER PROMPT ---');
    console.log(deliverablesPrompt);
    console.log('═══════════════════════════════════════════════════════\n\n');
    // =================================================================

    const deliverablesResult = await generateWithProvider(provider, {
      systemPrompt: 'You are a creative copywriter. Generate deliverables based on the creative brief. Respond with valid JSON only.',
      userPrompt: deliverablesPrompt,
      apiKey,
      model,
    });

    // ================== DEBUG: DELIVERABLES RESPONSE ==================
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('📥 AI RESPONSE: DELIVERABLES GENERATION');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Response length:', deliverablesResult.content.length, 'characters');
    console.log('\n--- RAW RESPONSE ---');
    console.log(deliverablesResult.content);
    console.log('═══════════════════════════════════════════════════════\n\n');
    // ==================================================================

    let deliverables: Deliverables;
    try {
      deliverables = parseJsonResponse(deliverablesResult.content) as Deliverables;
      console.log('✅ Deliverables parsed successfully');
    } catch (error) {
      console.error('❌ Failed to parse deliverables JSON:', error);
      // Fallback for new format with backwards compatibility
      deliverables = {
        websiteSummary: 'Failed to generate website summary.',
        facebookCampaigns: [],
        video8s: {
          recognition: {
            duration: '0-2 seconds',
            purpose: 'Failed to generate',
            visualDirection: 'Failed to generate',
            voiceoverOrText: 'Failed to generate',
          },
          proofInContext: {
            duration: '2-6 seconds',
            purpose: 'Failed to generate',
            visualDirection: 'Failed to generate',
            voiceoverOrText: 'Failed to generate',
          },
          beliefLock: {
            duration: '6-8 seconds',
            purpose: 'Failed to generate',
            visualDirection: 'Failed to generate',
            voiceoverOrText: 'Failed to generate',
          },
        },
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
