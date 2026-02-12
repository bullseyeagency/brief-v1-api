export interface FeatureBenefit {
  feature: string;
  benefit: string;
  wiifm: string; // What's In It For Me
}

export interface Avatar {
  type: 'primary' | 'secondary' | 'tertiary';
  name: string;
  age: number;
  background: string;
  currentState: string;
  desire: string;
  conflict: string;
  transformation: string;
  moralArc: string;
  featureBenefits?: [FeatureBenefit, FeatureBenefit, FeatureBenefit]; // Optional - may not be generated
  cinematicImagePrompt: string;
  generatedImageUrl?: string; // Stores the avatar image URL for use as reference in section images
}

export interface ProofPillar {
  claim: string;
  evidenceType: 'testimonial' | 'statistic' | 'case-study' | 'certification' | 'demonstration';
  evidence: string;
  usageGuidance: string;
}

export interface CreativeBrief {
  // Section 1: Brand Truth and Promise
  brandTruth: string;
  brandPromise: string;
  uniqueTruth: string;

  // Section 2: Market Context
  marketContext: string;
  competitiveLandscape: string;
  marketTension: string;

  // Section 3: Avatars (exactly 3)
  avatars: [Avatar, Avatar, Avatar];

  // Section 4: Problem and Tension
  humanProblem: string;
  emotionalTension: string;

  // Section 5: Transformation
  transformation: string;
  beforeState: string;
  afterState: string;

  // Section 6: Proof Pillars (exactly 5)
  proofPillars: [ProofPillar, ProofPillar, ProofPillar, ProofPillar, ProofPillar];

  // Section 7: Offer and Conversion Path
  offer: string;
  conversionPath: string;
  callToAction: string;

  // Section 8: Messaging Rules
  messagingRules: string[];
  toneGuidelines: string[];
  forbiddenPhrases: string[];

  // Section 9: Creative Directions
  creativeDirections: string;
  visualStyle: string;
  narrativeApproach: string;

  // Section 10: Testing Plan
  testingPlan: string;
  hypotheses: string[];
  metrics: string[];
}

export interface CrawledPage {
  url: string;
  title: string;
  metaDescription: string;
  headings: string[];
  bodyText: string;
  links: string[];
}

export interface CrawlResult {
  mainUrl: string;
  pages: CrawledPage[];
  crawledAt: string;
}

export interface GenerationRequest {
  crawlResult: CrawlResult;
  provider: 'claude' | 'openai' | 'manus';
  apiKey: string;
  model?: string;
}

export interface FacebookCampaign {
  campaignName: string;
  objective: string;
  targetAvatar: 'Primary' | 'Secondary' | 'Tertiary';
  primaryText: string;
  headline: string;
  description: string;
  visualDirection: string;
}

export interface Video8sSection {
  duration: string;
  purpose: string;
  visualDirection: string;
  voiceoverOrText: string;
}

export interface Video8s {
  recognition: Video8sSection;
  proofInContext: Video8sSection;
  beliefLock: Video8sSection;
}

export interface Deliverables {
  websiteSummary: string;
  creativeBrief?: string; // Legacy field, may not exist in new briefs
  facebookCampaigns: FacebookCampaign[] | string; // Array for new format, string for legacy
  tvCommercial30s?: string; // Legacy field, replaced by video8s
  video8s?: Video8s; // New field
}

export interface BriefImages {
  cover: string;              // Page 0: Cover with 2 avatars
  avatars: [string, string, string]; // Reference images for avatars
  pages: {
    brandTruth: string;       // Page 1: Brand Truth with primary avatar
    marketContext: string;    // Page 2: Market Context with secondary avatar
    problem: string;          // Page 3: Problem with primary avatar
    transformation: string;   // Page 4: Transformation with primary avatar
    proofPillars: string;     // Page 5: Proof Pillars with tertiary avatar
    offer: string;            // Page 6: Offer with all 3 avatars
    messaging: string;        // Page 7: Messaging with secondary avatar
    creativeDirection: string;// Page 8: Creative Direction (visual showcase)
  };
  backCover: string;          // Page 9: Back Cover with CTA
}

export type AIProvider = 'claude' | 'openai' | 'manus' | 'gemini';

export interface ProviderConfig {
  name: string;
  models: { id: string; name: string }[];
  defaultModel: string;
}

export const PROVIDER_CONFIGS: Record<AIProvider, ProviderConfig> = {
  claude: {
    name: 'Claude (Anthropic)',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4' },
    ],
    defaultModel: 'claude-sonnet-4-20250514',
  },
  openai: {
    name: 'OpenAI',
    models: [
      { id: 'gpt-5-2025-08-07', name: 'GPT-5 (Aug 2025)' },
      { id: 'gpt-5-mini-2025-08-07', name: 'GPT-5 Mini (Aug 2025)' },
      { id: 'gpt-5-nano-2025-08-07', name: 'GPT-5 Nano (Aug 2025)' },
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    ],
    defaultModel: 'gpt-4o',
  },
  manus: {
    name: 'Manus',
    models: [
      { id: 'manus-1', name: 'Manus 1' },
    ],
    defaultModel: 'manus-1',
  },
  gemini: {
    name: 'Google Gemini',
    models: [
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro (Image)' },
    ],
    defaultModel: 'gemini-2.0-flash-exp',
  },
};
