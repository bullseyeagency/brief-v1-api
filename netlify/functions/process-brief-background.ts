/**
 * Netlify Background Function for processing briefs
 * Can run up to 10 minutes
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { processBriefGeneration } from '../../lib/background-processor';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const handler: Handler = async (event) => {
  console.log('[Background] Processing brief...');

  try {
    const body = JSON.parse(event.body || '{}');
    const { briefId, crawlResult, provider, model, apiKey } = body;

    if (!briefId || !crawlResult || !provider || !model || !apiKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Process the brief
    await processBriefGeneration({
      briefId,
      crawlResult,
      provider,
      model,
      apiKey,
    });

    console.log(`[Background] ✅ Brief ${briefId} completed`);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('[Background] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Processing failed' }),
    };
  }
};
