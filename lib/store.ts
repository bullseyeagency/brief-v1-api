// Simple client-side store using localStorage for passing data between pages
import { CreativeBrief, CrawlResult, Deliverables } from './types';

const STORAGE_KEY = 'creative-brief-output';

export interface BriefOutput {
  url: string;
  crawlResult: CrawlResult;
  brief: CreativeBrief;
  deliverables: Deliverables;
  provider: string;
  model: string;
  generatedAt: string;
  logs: string[];
  prompts: {
    systemPrompt: string;
    generationPrompt: string;
    deliverablesPrompt: string;
  };
}

export function saveBriefOutput(output: BriefOutput): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(output));
  }
}

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

export function clearBriefOutput(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}
