import Anthropic from '@anthropic-ai/sdk';
import { GenerateOptions, GenerateResult } from './index';
import { PROVIDER_CONFIGS } from '../types';

export async function generateWithClaude(options: GenerateOptions): Promise<GenerateResult> {
  const { systemPrompt, userPrompt, apiKey, model } = options;
  const selectedModel = model || PROVIDER_CONFIGS.claude.defaultModel;

  const client = new Anthropic({ apiKey });

  console.log(`[Claude] Starting request to ${selectedModel}...`);
  console.log(`[Claude] System prompt: ${systemPrompt.length} chars`);
  console.log(`[Claude] User prompt: ${userPrompt.length} chars`);
  console.log(`[Claude] Max tokens: 8192`);

  const startTime = Date.now();

  const response = await client.messages.create({
    model: selectedModel,
    max_tokens: 8192,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt }
    ],
  });

  const duration = Date.now() - startTime;
  const content = response.content[0];

  if (content.type !== 'text') {
    console.log(`[Claude] ❌ Unexpected response type`);
    throw new Error('Unexpected response type from Claude');
  }

  console.log(`[Claude] ✅ Response received in ${(duration / 1000).toFixed(1)}s`);
  console.log(`[Claude] Response length: ${content.text.length} chars`);
  console.log(`[Claude] Tokens used: input=${response.usage.input_tokens}, output=${response.usage.output_tokens}`);

  return {
    content: content.text,
    model: selectedModel,
    provider: 'claude',
  };
}
