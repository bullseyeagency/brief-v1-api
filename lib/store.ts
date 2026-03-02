/**
 * @fileoverview Client-side state management using localStorage
 *
 * This module handles passing data between pages without a backend.
 * Data is stored in localStorage and persists across page refreshes.
 *
 * Why localStorage?
 * - No server session needed
 * - Data stays on user's device (privacy)
 * - Survives page navigation and refresh
 * - Simple to implement
 */

import { CreativeBrief, CrawlResult, Deliverables } from './types';

/** localStorage key for the brief output */
const STORAGE_KEY = 'creative-brief-output';

/**
 * Complete output from a brief generation session
 * Contains everything needed to display results and debug
 */
export interface BriefOutput {
  /** The URL that was analyzed */
  url: string;
  /** Raw crawl data from the website */
  crawlResult: CrawlResult;
  /** The generated creative brief */
  brief: CreativeBrief;
  /** Generated deliverables (summary, ads, commercial) */
  deliverables: Deliverables;
  /** AI provider used (claude, openai, gemini) */
  provider: string;
  /** Model ID used for generation */
  model: string;
  /** ISO timestamp of generation */
  generatedAt: string;
  /** Public URL for the saved brief (if saved to database) */
  publicUrl?: string;
  /** Database ID of the brief (if saved to database) */
  briefId?: string;
  /** Task log entries from the generation process */
  logs: string[];
  /** AI prompts used (for debug console) */
  prompts: {
    systemPrompt: string;
    generationPrompt: string;
    deliverablesPrompt: string;
  };
}

/**
 * Saves brief output to localStorage
 *
 * @param output - The complete brief output to save
 *
 * @example
 * ```typescript
 * saveBriefOutput({
 *   url: 'https://example.com',
 *   brief: generatedBrief,
 *   // ...other fields
 * });
 * // User can now navigate to /brand-output
 * ```
 */
export function saveBriefOutput(output: BriefOutput): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(output));
  }
}

/**
 * Loads brief output from localStorage
 *
 * @returns The saved BriefOutput or null if not found/invalid
 *
 * @example
 * ```typescript
 * const output = loadBriefOutput();
 * if (output) {
 *   displayBrief(output.brief);
 * } else {
 *   redirectToHome();
 * }
 * ```
 */
export function loadBriefOutput(): BriefOutput | null {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Clears the saved brief output from localStorage
 *
 * Call this when starting a new generation to ensure
 * stale data doesn't appear.
 */
export function clearBriefOutput(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}
