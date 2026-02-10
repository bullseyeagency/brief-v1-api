/**
 * Generates Imagen 4 prompts from avatar data
 */

interface AvatarData {
  name: string;
  age: number;
  occupation: string;
  demographics?: {
    location?: string;
    income_level?: string;
    family_status?: string;
  };
  psychographics?: {
    values?: string[];
    interests?: string[];
    lifestyle?: string;
  };
  pain_points?: string[];
  goals?: string[];
  behaviors?: {
    decision_making_style?: string;
    preferred_channels?: string[];
  };
}

interface ImageGenerationConfig {
  stylePreference?: string;
  keyTraits?: string[];
  visualCues?: string;
}

export function generateImagenPrompt(
  avatar: AvatarData,
  config?: ImageGenerationConfig
): string {
  const {
    stylePreference = "1960s Mid-Century Narrative Comic",
    keyTraits = [],
    visualCues = "Muted vintage color palette, halftone dot shading, thin ink outlines, wide-angle cinematic frame, no text, no speech bubbles",
  } = config || {};

  // Build character description
  const characterDesc = `${avatar.age}-year-old ${avatar.occupation}`;

  // Add personality traits
  const traitsDesc =
    keyTraits.length > 0
      ? `with a ${keyTraits.join(", ").toLowerCase()} demeanor`
      : "";

  // Build the prompt
  const prompt = `Portrait of ${avatar.name}, a ${characterDesc} ${traitsDesc}.
Style: ${stylePreference}.
Visual treatment: ${visualCues}.
Character should look professional and approachable, captured in a moment that reflects their personality and occupation.
High quality character illustration, detailed facial features, professional lighting.`;

  return prompt.trim().replace(/\s+/g, " ");
}

/**
 * Example usage:
 * const prompt = generateImagenPrompt(briefData.avatars.customer_avatar);
 * // Send to Imagen 4 API
 */
