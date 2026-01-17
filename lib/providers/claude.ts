import Anthropic from '@anthropic-ai/sdk';
import { GenerateOptions, GenerateResult } from './index';
import { PROVIDER_CONFIGS } from '../types';

export async function generateWithClaude(options: GenerateOptions): Promise<GenerateResult> {
  const { systemPrompt, userPrompt, apiKey, model } = options;
  const selectedModel = model || PROVIDER_CONFIGS.claude.defaultModel;

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: selectedModel,
    max_tokens: 8192,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt }
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  return {
    content: content.text,
    model: selectedModel,
    provider: 'claude',
  };
}
