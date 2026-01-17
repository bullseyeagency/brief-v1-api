import { GenerateOptions, GenerateResult } from './index';
import { PROVIDER_CONFIGS } from '../types';

// Manus API integration
// Note: Update the endpoint and authentication method based on Manus API documentation
const MANUS_API_ENDPOINT = process.env.MANUS_API_ENDPOINT || 'https://api.manus.ai/v1/generate';

export async function generateWithManus(options: GenerateOptions): Promise<GenerateResult> {
  const { systemPrompt, userPrompt, apiKey, model } = options;
  const selectedModel = model || PROVIDER_CONFIGS.manus.defaultModel;

  const response = await fetch(MANUS_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: selectedModel,
      system: systemPrompt,
      prompt: userPrompt,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Manus API error: ${error}`);
  }

  const data = await response.json();

  return {
    content: data.content || data.text || data.response,
    model: selectedModel,
    provider: 'manus',
  };
}
