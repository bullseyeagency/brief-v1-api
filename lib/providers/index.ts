/**
 * @fileoverview AI Provider abstraction layer
 *
 * This module provides a unified interface for multiple AI providers.
 * New providers can be added by implementing the GenerateOptions/GenerateResult
 * interface and adding a case to the switch statement.
 *
 * Supported providers:
 * - Claude (Anthropic) - claude.ts
 * - OpenAI (GPT-5) - openai.ts
 * - Manus - manus.ts
 */

import { AIProvider } from '../types';
import { generateWithClaude } from './claude';
import { generateWithOpenAI } from './openai';
import { generateWithManus } from './manus';

/**
 * Options for generating content with an AI provider
 */
export interface GenerateOptions {
  /** System prompt setting the AI's role and rules */
  systemPrompt: string;
  /** User prompt with the actual request/content */
  userPrompt: string;
  /** API key for the selected provider */
  apiKey: string;
  /** Model ID (optional, uses provider default if not specified) */
  model?: string;
}

/**
 * Result from an AI generation request
 */
export interface GenerateResult {
  /** The generated text content */
  content: string;
  /** The model ID that was used */
  model: string;
  /** The provider that was used */
  provider: AIProvider;
}

/**
 * Factory function that routes generation requests to the appropriate AI provider
 *
 * This is the main entry point for AI generation. It abstracts away
 * provider-specific implementation details.
 *
 * @param provider - The AI provider to use ('claude', 'openai', or 'manus')
 * @param options - Generation options including prompts and API key
 * @returns Promise resolving to the generated content
 * @throws Error if provider is unknown or API call fails
 *
 * @example
 * ```typescript
 * const result = await generateWithProvider('claude', {
 *   systemPrompt: 'You are a helpful assistant.',
 *   userPrompt: 'Write a haiku about coding.',
 *   apiKey: 'sk-ant-...',
 *   model: 'claude-sonnet-4-20250514'
 * });
 * console.log(result.content);
 * ```
 */
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
