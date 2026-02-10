/**
 * Generates a Veo 3 video prompt from TV commercial script data
 * Creates 8-second, 4-scene structure with 1960s comic book aesthetic
 */

interface TVCommercialScript {
  openingHook?: string;
  brandIntroduction?: string;
  problemEstablishment?: string;
  transformation?: string;
  proofMoment?: string;
  ctaAndResolution?: string;
  visualDirections?: string;
}

export function generateVeo3Prompt(script: TVCommercialScript): string {
  // 1960s Silver Age comic book style base specifications
  const styleDirections = `
Style: 1960s Silver Age comic book aesthetic
- Halftone textures and Ben-Day dot patterns
- Clean black ink outlines around all subjects
- Muted vintage color palette (soft tans, teals, slate grays)
- Dynamic action lines and motion effects
- Hand-drawn, illustrated feel
- Slightly oversaturated colors with slight fade
- Comic panel framing with subtle borders
`.trim();

  // Map script sections to 4-scene structure
  const scenes = [
    {
      title: "Scene 1: The Problem",
      content: script.problemEstablishment || script.openingHook || "",
    },
    {
      title: "Scene 2: Brand Introduction",
      content: script.brandIntroduction || "",
    },
    {
      title: "Scene 3: Proof Moment",
      content: script.proofMoment || "",
    },
    {
      title: "Scene 4: Transformation",
      content: script.transformation || script.ctaAndResolution || "",
    },
  ];

  // Build the prompt
  const sceneDescriptions = scenes
    .map((scene, index) => {
      const cleanContent = scene.content
        .replace(/\(.*?\)/g, "") // Remove timing markers
        .replace(/Scene \d+:/gi, "") // Remove scene labels
        .replace(/Opening Hook:/gi, "")
        .replace(/Voiceover:/gi, "")
        .trim();

      return `${scene.title}:\n${cleanContent}`;
    })
    .join("\n\n");

  // Add visual directions if provided
  const visualNotes = script.visualDirections
    ? `\n\nVisual Notes:\n${script.visualDirections}`
    : "";

  return `${styleDirections}

${sceneDescriptions}${visualNotes}

Format: 4-scene progression, 8 seconds total duration, let pacing flow naturally between scenes.`;
}

/**
 * Example usage:
 * const prompt = generateVeo3Prompt(briefData.deliverables.tvCommercial30s);
 * // Send prompt to Veo 3 API
 */
