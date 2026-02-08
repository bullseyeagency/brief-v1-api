import { NextRequest } from 'next/server';
import { CrawlResult, AIProvider, CreativeBrief, Deliverables } from '@/lib/types';
import { generateWithProvider } from '@/lib/providers';
import { buildSystemPrompt, buildGenerationPrompt, buildDeliverablesPrompt } from '@/lib/prompts';
import { validateCreativeBrief, sanitizeEmDashes } from '@/lib/validation';

interface GenerateRequest {
  crawlResult: CrawlResult;
  provider: AIProvider;
  model?: string;
  apiKey: string;
}

function parseJsonResponse(content: string): unknown {
  let jsonStr = content.trim();

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
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendEvent = async (event: string, data: any) => {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    await writer.write(encoder.encode(message));
  };

  // Start processing in background
  (async () => {
    try {
      const body: GenerateRequest = await request.json();
      const { crawlResult, provider, model, apiKey } = body;

      if (!crawlResult || !provider || !apiKey) {
        await sendEvent('error', { error: 'Missing required fields' });
        await writer.close();
        return;
      }

      // Step 1: Generate the creative brief
      await sendEvent('progress', {
        step: 'brief-start',
        message: 'Starting brief generation...',
        timestamp: Date.now()
      });

      const systemPrompt = buildSystemPrompt();
      const generationPrompt = buildGenerationPrompt(crawlResult);

      await sendEvent('progress', {
        step: 'brief-api-call',
        message: `Calling ${provider} API (this may take 1-3 minutes)...`,
        provider,
        model: model || 'default',
        timestamp: Date.now()
      });

      const startTime = Date.now();
      const briefResult = await generateWithProvider(provider, {
        systemPrompt,
        userPrompt: generationPrompt,
        apiKey,
        model,
      });
      const briefDuration = Date.now() - startTime;

      await sendEvent('progress', {
        step: 'brief-complete',
        message: `Brief generated in ${(briefDuration / 1000).toFixed(1)}s`,
        duration: briefDuration,
        timestamp: Date.now()
      });

      // Parse the brief JSON
      let brief: CreativeBrief;
      try {
        brief = parseJsonResponse(briefResult.content) as CreativeBrief;
      } catch (parseError) {
        await sendEvent('error', {
          error: 'Failed to parse AI response as JSON',
          details: briefResult.content.substring(0, 500)
        });
        await writer.close();
        return;
      }

      // Validate the brief
      const validation = validateCreativeBrief(brief);
      if (!validation.valid) {
        await sendEvent('progress', {
          step: 'validation-warning',
          message: 'Brief has minor validation issues (continuing)',
          warnings: validation.errors
        });
      }

      // Step 2: Generate deliverables
      await sendEvent('progress', {
        step: 'deliverables-start',
        message: 'Starting deliverables generation...',
        timestamp: Date.now()
      });

      const deliverablesPrompt = buildDeliverablesPrompt(JSON.stringify(brief, null, 2));

      await sendEvent('progress', {
        step: 'deliverables-api-call',
        message: `Calling ${provider} API for deliverables...`,
        timestamp: Date.now()
      });

      const delivStartTime = Date.now();
      const deliverablesResult = await generateWithProvider(provider, {
        systemPrompt: 'You are a creative copywriter. Generate deliverables based on the creative brief. Respond with valid JSON only.',
        userPrompt: deliverablesPrompt,
        apiKey,
        model,
      });
      const delivDuration = Date.now() - delivStartTime;

      await sendEvent('progress', {
        step: 'deliverables-complete',
        message: `Deliverables generated in ${(delivDuration / 1000).toFixed(1)}s`,
        duration: delivDuration,
        timestamp: Date.now()
      });

      let deliverables: Deliverables;
      try {
        deliverables = parseJsonResponse(deliverablesResult.content) as Deliverables;
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

      // Send final result
      await sendEvent('complete', {
        brief: sanitizedBrief,
        deliverables: sanitizedDeliverables,
        provider: briefResult.provider,
        model: briefResult.model,
        totalDuration: briefDuration + delivDuration,
      });

    } catch (error) {
      await sendEvent('error', {
        error: error instanceof Error ? error.message : 'Generation failed',
        timestamp: Date.now()
      });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
