/**
 * Image generation style presets for NanoBanana API
 * Used to generate persona avatars and comic panels with consistent visual style
 */

export interface ImagePreset {
  name: string;
  category: string;
  description: string;
  styleTags: string[];
}

export const IMAGE_PRESETS: Record<string, ImagePreset> = {
  'photorealistic-grid': {
    name: 'Hyper-Realistic 3x3 Identity-Locked Portrait Grid',
    category: 'Photorealistic Portrait',
    description: 'A hyper-realistic 3x3 grid portrait collage with absolute facial identity lock across all panels. The same subject is rendered with nine different expressions while preserving identical bone structure, facial proportions, and likeness. Studio photography realism with cinematic lighting and shallow depth of field.',
    styleTags: [
      'hyper-realistic',
      'photorealistic',
      'identity lock',
      '3x3 grid',
      'editorial portrait',
      'cinematic studio lighting',
      'lens-accurate',
      'facial consistency'
    ]
  },
  'illustrated-doodle': {
    name: 'Creative Spark: Doodle-Framed Portrait',
    category: 'Illustrated Concept Art',
    description: 'An illustrated portrait of a thoughtful young woman on a ruled notebook background, surrounded by hand-drawn doodles and motivational words. Modern comic-sketch style with warm tones, expressive linework, and a creative, idea-generation theme.',
    styleTags: [
      'illustration',
      'modern comic-sketch',
      'hand-drawn doodles',
      'creative concept',
      'editorial illustration',
      'warm tones',
      'notebook aesthetic'
    ]
  },
  'cinematic-contact-sheet': {
    name: 'Cinematic 3x3 Contact Sheet',
    category: 'Cinematic Photorealism',
    description: 'A cinematic 3x3 contact sheet that preserves the same subject across nine shots with strict likeness accuracy. Each panel explores different camera distances and angles from extreme wide to extreme close-up, maintaining consistent lighting, environment, and editorial-grade photorealism.',
    styleTags: [
      'cinematic',
      'contact sheet',
      'storyboard grid',
      'photorealistic',
      'editorial realism',
      'lens-accurate',
      'subject continuity',
      'shot taxonomy'
    ]
  },
  'vintage-comic-cover': {
    name: 'Vintage 1960s Comic Book Cover',
    category: 'Comic Book Art',
    description: 'Transform subject into a vintage 1960s comic book cover with Jack Kirby / Silver Age comic style. Halftone dot printing (Ben-Day dots), bold ink lines, yellowed cheap newsprint texture. Title "THE AMAZING [NAME]" in bold 3D block letters at top. Details: "12¢" price box, Comics Code Authority seal. Worn spine, slight creases.',
    styleTags: [
      'vintage 1960s',
      'Jack Kirby style',
      'Silver Age comic',
      'halftone Ben-Day dots',
      'bold ink lines',
      'newsprint texture',
      'comic book cover',
      'worn vintage condition',
      '3D block letters',
      'Comics Code Authority'
    ]
  },
  'midcentury-narrative': {
    name: '1960s Mid-Century Narrative Comic',
    category: 'Narrative Illustration',
    description: 'A 1960s mid-century narrative comic illustration with bright home office setting, sunlight streaming through windows, halftone textures, and muted vintage color palette. Subject portrayed as disciplined, energized, and reliable professional in work-from-home environment. Clean narrative storytelling style with no text overlays.',
    styleTags: [
      '1960s mid-century',
      'narrative comic',
      'halftone textures',
      'muted vintage tones',
      'bright home office',
      'natural sunlight',
      'professional atmosphere',
      'clean illustration',
      'retro color palette',
      'no text'
    ]
  }
};

export const DEFAULT_IMAGE_PRESET = 'photorealistic-grid';

/**
 * Image generation provider configurations
 */
export interface ImageModel {
  id: string;
  name: string;
}

export interface ImageProviderConfig {
  name: string;
  apiUrl: string;
  defaultModel: string;
  models: ImageModel[];
}

export const IMAGE_PROVIDERS: Record<string, ImageProviderConfig> = {
  nanobanana: {
    name: 'NanoBanana',
    apiUrl: 'https://api.nanobananaapi.dev',
    defaultModel: 'gemini-2.5-flash-image',
    models: [
      { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro Preview' },
      { id: 'gemini-3-pro-image-preview-2k', name: 'Gemini 3 Pro Preview 2K' },
      { id: 'gemini-3-pro-image-preview-4k', name: 'Gemini 3 Pro Preview 4K' },
      { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-flash-image-hd', name: 'Gemini 2.5 Flash HD' },
    ]
  }
};

export const DEFAULT_IMAGE_PROVIDER = 'nanobanana';
export const DEFAULT_IMAGE_MODEL = 'gemini-3-pro-image-preview';

/**
 * Builds final prompt for image generation by combining avatar prompt with preset style
 */
export function buildImagePrompt(avatarPrompt: string, presetKey: string, avatarName?: string): string {
  const preset = IMAGE_PRESETS[presetKey] || IMAGE_PRESETS[DEFAULT_IMAGE_PRESET];

  let finalPrompt = `${avatarPrompt}. ${preset.description}`;

  // Replace [NAME] placeholder in vintage comic preset
  if (presetKey === 'vintage-comic-cover' && avatarName) {
    finalPrompt = finalPrompt.replace('[NAME]', avatarName.toUpperCase());
  }

  // Add style tags
  finalPrompt += `. Style: ${preset.styleTags.join(', ')}`;

  return finalPrompt;
}
