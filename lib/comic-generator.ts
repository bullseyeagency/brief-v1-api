/**
 * Comic Strip Generator
 * Integrates with infinite-heroes logic to create brand story comics
 */

import { GoogleGenAI } from '@google/genai';
import { Avatar } from './types';

const MODEL_IMAGE_GEN = "gemini-3-pro-image-preview";
const MODEL_TEXT_GEN = "gemini-3-pro-image-preview";

export interface ComicPanel {
  panelNumber: number;
  scene: string;
  caption?: string;
  dialogue?: string;
  characterFocus: string;
  imageUrl?: string;
}

export interface ComicScript {
  title: string;
  panels: ComicPanel[];
}

/**
 * Generate comic script from avatars and brief data
 */
export async function generateComicScript(
  avatars: Avatar[],
  brandStory: {
    brandName: string;
    humanProblem: string;
    transformation: string;
    beforeState: string;
    afterState: string;
  },
  scriptType: 'brand-story' | '30sec-commercial',
  apiKey: string
): Promise<ComicScript> {
  const ai = new GoogleGenAI({ apiKey });

  const avatarContext = avatars.map((a, i) => `
Avatar ${i + 1} - ${a.type.toUpperCase()}:
- Name: ${a.name}
- Age: ${a.age}
- Background: ${a.background}
- Current State: ${a.currentState}
- Desire: ${a.desire}
- Transformation: ${a.transformation}
  `).join('\n');

  const panelCount = scriptType === '30sec-commercial' ? 6 : 8;

  const prompt = `You are writing a ${panelCount}-panel comic strip script for ${brandStory.brandName}.

${scriptType === '30sec-commercial' ? `
Create a 30-second commercial story arc:
- Panel 1: Opening Hook (grab attention)
- Panel 2: Problem (show the pain)
- Panel 3: Character Introduction (meet the hero)
- Panel 4: Proof Moment (demonstrate solution)
- Panel 5: Transformation (show the change)
- Panel 6: CTA & Resolution (drive action)
` : `
Create a brand story arc:
- Panels 1-2: Setup (introduce character and problem)
- Panels 3-4: Rising action (character encounters brand)
- Panels 5-6: Transformation (life changes)
- Panels 7-8: Resolution (new state achieved)
`}

BRAND CONTEXT:
Human Problem: ${brandStory.humanProblem}
Before State: ${brandStory.beforeState}
After State: ${brandStory.afterState}
Transformation: ${brandStory.transformation}

CHARACTERS TO USE:
${avatarContext}

RULES:
1. Each panel must have a clear visual scene description
2. Caption should be narration (max 25 words)
3. Dialogue should be character speech (max 20 words)
4. Specify which avatar is the focus of each panel
5. Panels must flow as a cohesive story
6. Show emotional transformation visually
7. Keep it grounded and realistic (no fantasy elements)

OUTPUT STRICT JSON:
{
  "title": "Comic title reflecting the story",
  "panels": [
    {
      "panelNumber": 1,
      "scene": "Detailed visual description for the artist (what to draw)",
      "caption": "Narrator text (optional)",
      "dialogue": "Character speech (optional)",
      "characterFocus": "Avatar name who is the focus"
    },
    ... (${panelCount} panels total)
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_TEXT_GEN,
      contents: { text: prompt },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || "{}";
    const script = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());

    return script as ComicScript;
  } catch (error) {
    console.error('Comic script generation failed:', error);
    throw new Error(`Failed to generate comic script: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate comic panel images from script
 */
export async function generateComicPanels(
  script: ComicScript,
  avatarImages: Array<{ name: string; imageUrl: string }>,
  apiKey: string
): Promise<ComicPanel[]> {
  const ai = new GoogleGenAI({ apiKey });
  const panels: ComicPanel[] = [];

  for (const panel of script.panels) {
    try {
      // Find avatar reference image
      const avatarImage = avatarImages.find(a => a.name === panel.characterFocus);

      const contents = [];

      // Add reference image if available
      if (avatarImage?.imageUrl) {
        contents.push({ text: `REFERENCE CHARACTER (${panel.characterFocus}):` });

        // Extract base64 from data URL
        const base64Match = avatarImage.imageUrl.match(/base64,(.+)$/);
        if (base64Match) {
          contents.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Match[1]
            }
          });
        }
      }

      // Build image prompt
      let imagePrompt = `STYLE: Modern commercial comic book art, professional illustration, cinematic composition, detailed ink work.

TYPE: Comic panel (horizontal format, wide shot).

SCENE: ${panel.scene}

INSTRUCTIONS:
- Use the reference character if provided
- Match character likeness closely
- Commercial-quality illustration
- Clear visual storytelling`;

      if (panel.caption) {
        imagePrompt += `\n- Include caption box with text: "${panel.caption}"`;
      }

      if (panel.dialogue) {
        imagePrompt += `\n- Include speech bubble with text: "${panel.dialogue}"`;
      }

      contents.push({ text: imagePrompt });

      // Generate image
      const response = await ai.models.generateContent({
        model: MODEL_IMAGE_GEN,
        contents: contents,
        config: {
          imageConfig: {
            aspectRatio: '16:9'
          }
        }
      });

      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      const imageUrl = part?.inlineData?.data
        ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
        : '';

      panels.push({
        ...panel,
        imageUrl
      });

    } catch (error) {
      console.error(`Failed to generate panel ${panel.panelNumber}:`, error);
      panels.push({
        ...panel,
        imageUrl: ''
      });
    }
  }

  return panels;
}

/**
 * Generate complete comic (script + images)
 */
export async function generateComic(
  avatars: Avatar[],
  brandStory: {
    brandName: string;
    humanProblem: string;
    transformation: string;
    beforeState: string;
    afterState: string;
  },
  scriptType: 'brand-story' | '30sec-commercial',
  avatarImages: Array<{ name: string; imageUrl: string }>,
  apiKey: string
): Promise<{ script: ComicScript; panels: ComicPanel[] }> {
  // Generate script
  const script = await generateComicScript(avatars, brandStory, scriptType, apiKey);

  // Generate panel images
  const panels = await generateComicPanels(script, avatarImages, apiKey);

  return { script, panels };
}
