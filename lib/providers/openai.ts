import OpenAI from 'openai';
import { GenerateOptions, GenerateResult } from './index';
import { PROVIDER_CONFIGS } from '../types';

export async function generateWithOpenAI(options: GenerateOptions): Promise<GenerateResult> {
  const { systemPrompt, userPrompt, apiKey, model } = options;
  const selectedModel = model || PROVIDER_CONFIGS.openai.defaultModel;

  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model: selectedModel,
    max_completion_tokens: 8192,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  return {
    content,
    model: selectedModel,
    provider: 'openai',
  };
}
