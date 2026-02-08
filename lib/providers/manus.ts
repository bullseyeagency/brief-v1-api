/**
 * @fileoverview Manus AI provider integration
 *
 * Manus API uses a task-based approach where you create a task
 * and poll for completion. This provider handles the full workflow.
 *
 * API Docs: https://open.manus.ai/docs
 */

import { GenerateOptions, GenerateResult } from './index';
import { PROVIDER_CONFIGS } from '../types';

/** Manus API base endpoint */
const MANUS_API_ENDPOINT = 'https://api.manus.ai/v1/tasks';

/** Polling interval in ms when waiting for task completion */
const POLL_INTERVAL = 2000;

/** Maximum time to wait for task completion (5 minutes) */
const MAX_WAIT_TIME = 300000;

/**
 * Generates content using the Manus AI API
 *
 * Manus uses a task-based async model:
 * 1. Create task with prompt
 * 2. Poll for task completion
 * 3. Extract response from completed task
 *
 * @param options - Generation options including prompt and API key
 * @returns Promise resolving to generated content
 * @throws Error if task creation fails or times out
 */
export async function generateWithManus(options: GenerateOptions): Promise<GenerateResult> {
  const { systemPrompt, userPrompt, apiKey, model } = options;
  const selectedModel = model || PROVIDER_CONFIGS.manus.defaultModel;

  // Combine system and user prompts for Manus
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

  // Step 1: Create the task
  const createResponse = await fetch(MANUS_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'API_KEY': apiKey,
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      prompt: fullPrompt,
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Manus API error: ${error}`);
  }

  const taskData = await createResponse.json();
  const taskId = taskData.id;

  if (!taskId) {
    throw new Error('Manus API did not return a task ID');
  }

  // Step 2: Poll for task completion
  const startTime = Date.now();

  while (Date.now() - startTime < MAX_WAIT_TIME) {
    const statusResponse = await fetch(`${MANUS_API_ENDPOINT}/${taskId}`, {
      headers: {
        'API_KEY': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!statusResponse.ok) {
      throw new Error(`Failed to check task status: ${statusResponse.statusText}`);
    }

    const statusData = await statusResponse.json();

    if (statusData.status === 'completed') {
      // Extract the response text from the output
      let content = '';

      if (statusData.output && Array.isArray(statusData.output)) {
        // Find the assistant's response in the output
        for (const item of statusData.output) {
          if (item.role === 'assistant' && item.content) {
            for (const contentItem of item.content) {
              if (contentItem.type === 'output_text' && contentItem.text) {
                content += contentItem.text;
              }
            }
          }
        }
      }

      if (!content) {
        content = JSON.stringify(statusData.output);
      }

      return {
        content,
        model: statusData.model || selectedModel,
        provider: 'manus',
      };
    }

    if (statusData.status === 'failed') {
      throw new Error(`Manus task failed: ${statusData.error || 'Unknown error'}`);
    }

    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
  }

  throw new Error('Manus task timed out after 5 minutes');
}
