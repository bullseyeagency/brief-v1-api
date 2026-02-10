/**
 * Video generation style presets for Veo3 API
 * Used to generate commercial videos and brand stories
 */

export interface VideoPreset {
  name: string;
  category: string;
  description: string;
  styleTags: string[];
  duration: number; // in seconds
}

export const VIDEO_PRESETS: Record<string, VideoPreset> = {
  'commercial-30s': {
    name: '30-Second TV Commercial',
    category: 'Advertising',
    description: 'Professional 30-second TV commercial with cinematic quality, clear narrative arc, product showcase, and compelling call-to-action. Broadcast-ready production values.',
    styleTags: [
      'commercial',
      'broadcast quality',
      'cinematic',
      'product showcase',
      'clear narrative',
      'professional voiceover',
      'brand storytelling'
    ],
    duration: 30
  },
  'brand-story-60s': {
    name: '60-Second Brand Story',
    category: 'Brand Content',
    description: 'Engaging 60-second brand story video focusing on customer transformation and emotional connection. Authentic testimonial-style with documentary aesthetics.',
    styleTags: [
      'brand story',
      'documentary style',
      'customer journey',
      'emotional',
      'authentic',
      'transformation arc',
      'testimonial feel'
    ],
    duration: 60
  },
  'social-15s': {
    name: '15-Second Social Media Ad',
    category: 'Social Media',
    description: 'Fast-paced 15-second social media ad optimized for mobile viewing. Attention-grabbing opening, quick cuts, bold text overlays, modern aesthetic.',
    styleTags: [
      'social media',
      'mobile-first',
      'fast-paced',
      'quick cuts',
      'text overlays',
      'modern',
      'attention-grabbing',
      'vertical friendly'
    ],
    duration: 15
  },
  'explainer-90s': {
    name: '90-Second Product Explainer',
    category: 'Educational',
    description: 'Clear 90-second product explainer video with problem-solution structure. Clean graphics, step-by-step demonstration, easy to follow narrative.',
    styleTags: [
      'explainer',
      'educational',
      'problem-solution',
      'clear graphics',
      'step-by-step',
      'demonstration',
      'instructional',
      'clean design'
    ],
    duration: 90
  }
};

export const DEFAULT_VIDEO_PRESET = 'commercial-30s';

/**
 * Video generation provider configurations
 */
export interface VideoModel {
  id: string;
  name: string;
}

export interface VideoProviderConfig {
  name: string;
  apiUrl: string;
  defaultModel: string;
  models: VideoModel[];
}

export const VIDEO_PROVIDERS: Record<string, VideoProviderConfig> = {
  veo3: {
    name: 'Veo3',
    apiUrl: 'https://www.veo3gen.app',
    defaultModel: 'veo-3',
    models: [
      { id: 'veo-3', name: 'Veo 3' },
      { id: 'veo-3-turbo', name: 'Veo 3 Turbo' },
    ]
  }
};

export const DEFAULT_VIDEO_PROVIDER = 'veo3';
export const DEFAULT_VIDEO_MODEL = 'veo-3';

/**
 * Builds final prompt for video generation by combining brief content with preset style
 */
export function buildVideoPrompt(briefContent: string, presetKey: string): string {
  const preset = VIDEO_PRESETS[presetKey] || VIDEO_PRESETS[DEFAULT_VIDEO_PRESET];

  let finalPrompt = `${briefContent}. ${preset.description}`;

  // Add style tags
  finalPrompt += `. Style: ${preset.styleTags.join(', ')}`;

  // Add duration requirement
  finalPrompt += `. Duration: ${preset.duration} seconds.`;

  return finalPrompt;
}
