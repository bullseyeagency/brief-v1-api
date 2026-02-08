/**
 * Google Gemini Provider
 * Handles persona/avatar image generation using Gemini 3 Pro
 */

import { GoogleGenAI } from '@google/genai';

const MODEL_IMAGE_GEN = "gemini-3-pro-image-preview";

export interface PersonaImageParams {
  name: string;
  age: number;
  background: string;
  cinematicPrompt: string;
  style?: string;
}

/**
 * Generate persona/avatar image using Gemini
 */
export async function generatePersonaImage(
  params: PersonaImageParams,
  apiKey: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  const style = params.style || "Professional commercial photography";

  const prompt = `STYLE: ${style}, highly detailed, cinematic lighting, 8K quality, shallow depth of field.

CHARACTER PROFILE:
- Name: ${params.name}
- Age: ${params.age}
- Background: ${params.background}

SCENE DESCRIPTION:
${params.cinematicPrompt}

INSTRUCTIONS:
- Photorealistic portrait
- Natural environment matching the scene
- Authentic human emotion
- Commercial-grade quality
- Sharp focus on subject
- Professional color grading`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_IMAGE_GEN,
      contents: { text: prompt },
      config: {
        imageConfig: {
          aspectRatio: '16:9' // Widescreen for commercial use
        }
      }
    });

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part?.inlineData?.data) {
      throw new Error('No image generated');
    }

    // Return as data URL
    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
  } catch (error) {
    console.error('Gemini image generation failed:', error);
    throw new Error(`Failed to generate persona image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate multiple persona images in batch
 */
export async function generatePersonaImages(
  personas: PersonaImageParams[],
  apiKey: string
): Promise<Array<{ name: string; imageUrl: string }>> {
  const results: Array<{ name: string; imageUrl: string }> = [];

  for (const persona of personas) {
    try {
      const imageUrl = await generatePersonaImage(persona, apiKey);
      results.push({ name: persona.name, imageUrl });
    } catch (error) {
      console.error(`Failed to generate image for ${persona.name}:`, error);
      results.push({ name: persona.name, imageUrl: '' });
    }
  }

  return results;
}
