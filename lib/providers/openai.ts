import OpenAI from 'openai';
import { GenerateOptions, GenerateResult } from './index';
import { PROVIDER_CONFIGS } from '../types';

export async function generateWithOpenAI(options: GenerateOptions): Promise<GenerateResult> {
  const { systemPrompt, userPrompt, apiKey, model } = options;
  const selectedModel = model || PROVIDER_CONFIGS.openai.defaultModel;

  const client = new OpenAI({ apiKey });

  console.log(`[OpenAI] Starting request to ${selectedModel}...`);
  console.log(`[OpenAI] System prompt: ${systemPrompt.length} chars`);
  console.log(`[OpenAI] User prompt: ${userPrompt.length} chars`);
  console.log(`[OpenAI] Max tokens: 6000`);

  const startTime = Date.now();

  try {
    const response = await client.chat.completions.create({
      model: selectedModel,
      max_completion_tokens: 6000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
    });

    const duration = Date.now() - startTime;
    const content = response.choices[0]?.message?.content;

    if (!content) {
      console.log(`[OpenAI] ❌ No response content`);
      console.log(`[OpenAI] Response:`, JSON.stringify(response, null, 2));
      throw new Error('No response from OpenAI');
    }

    console.log(`[OpenAI] ✅ Response received in ${(duration / 1000).toFixed(1)}s`);
    console.log(`[OpenAI] Response length: ${content.length} chars`);
    if (response.usage) {
      console.log(`[OpenAI] Tokens: input=${response.usage.prompt_tokens}, output=${response.usage.completion_tokens}, total=${response.usage.total_tokens}`);
    } else {
      console.log(`[OpenAI] Tokens: unknown`);
    }

    return {
      content,
      model: selectedModel,
      provider: 'openai',
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.log(`[OpenAI] ❌ Error after ${(duration / 1000).toFixed(1)}s`);
    console.log(`[OpenAI] Error type:`, error.constructor.name);
    console.log(`[OpenAI] Error message:`, error.message);
    console.log(`[OpenAI] Error status:`, error.status);
    console.log(`[OpenAI] Error code:`, error.code);

    if (error.message?.includes('model')) {
      throw new Error(`OpenAI Error: Invalid model "${selectedModel}". Try gpt-4o or gpt-4o-mini.`);
    }
    if (error.status === 401) {
      throw new Error('OpenAI Error: Invalid API key');
    }
    if (error.status === 429) {
      throw new Error('OpenAI Error: Rate limit exceeded. Please wait and try again.');
    }

    throw new Error(`OpenAI Error: ${error.message || 'Unknown error'}`);
  }
}
