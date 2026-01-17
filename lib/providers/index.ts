import { AIProvider } from '../types';
import { generateWithClaude } from './claude';
import { generateWithOpenAI } from './openai';
import { generateWithManus } from './manus';

export interface GenerateOptions {
  systemPrompt: string;
  userPrompt: string;
  apiKey: string;
  model?: string;
}

export interface GenerateResult {
  content: string;
  model: string;
  provider: AIProvider;
}

export async function generateWithProvider(
  provider: AIProvider,
  options: GenerateOptions
): Promise<GenerateResult> {
  switch (provider) {
    case 'claude':
      return generateWithClaude(options);
    case 'openai':
      return generateWithOpenAI(options);
    case 'manus':
      return generateWithManus(options);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
