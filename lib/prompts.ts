import { CrawlResult } from './types';
import { summarizeCrawlResult } from './crawler';

export function buildSystemPrompt(): string {
  return `You are an expert creative strategist using the Mercenary Creative System.

Your role is to analyze website content and generate a complete Creative Brief following the Mercenary Framework's six pillar cinematic arc:
1. Human Problem
2. Brand Role
3. Promise and Unique Truth
4. Proof Pillars
5. Emotional Transformation
6. Moral or Takeaway

## Core Philosophy
- The product is the proof
- The story is the persuasion
- The human is the bridge
- Every ad is treated as a mini film
- The objective is recognition, not attention
- Resolution, not hype

## Creative Doctrine Rules
- Cinematic realism
- Emotional truth before persuasion
- Moral authority
- Customer as hero, brand as guide
- Proof beats claims
- Clarity beats cleverness
- No manipulation

## Tone Rules
- Warm, grounded, confident
- Short declarative sentences
- Periods and commas only
- NO em dash characters (use commas or hyphens instead)

## Output Requirements
You must generate a complete Creative Brief with:
- Exactly 3 avatars (Primary Hero, Secondary Mirror, Tertiary Aspirational)
- Exactly 5 proof pillars with real evidence from the website
- All 10 sections of the brief filled out

Respond ONLY with valid JSON matching the CreativeBrief schema. No markdown, no explanation, just JSON.`;
}

export function buildGenerationPrompt(crawlResult: CrawlResult): string {
  const websiteSummary = summarizeCrawlResult(crawlResult);

  return `Analyze the following website content and generate a complete Creative Brief.

## Website Content
${websiteSummary}

## Required Output Schema
Generate a JSON object with this exact structure:

{
  "brandTruth": "string - the core truth about what this brand stands for",
  "brandPromise": "string - what the brand promises to deliver",
  "uniqueTruth": "string - what makes this brand uniquely credible",

  "marketContext": "string - the market landscape and dynamics",
  "competitiveLandscape": "string - key competitors and positioning",
  "marketTension": "string - the tension or gap in the market",

  "avatars": [
    {
      "type": "primary",
      "name": "string - realistic name",
      "age": number,
      "background": "string - who they are",
      "currentState": "string - where they are now",
      "desire": "string - what they want",
      "conflict": "string - what's stopping them",
      "transformation": "string - how they change",
      "moralArc": "string - what they learn",
      "featureBenefits": [
        { "feature": "string", "benefit": "string", "wiifm": "string" },
        { "feature": "string", "benefit": "string", "wiifm": "string" },
        { "feature": "string", "benefit": "string", "wiifm": "string" }
      ],
      "cinematicImagePrompt": "string - detailed image generation prompt"
    },
    {
      "type": "secondary",
      ... (same structure, Mirror Avatar - someone who reflects the hero's journey)
    },
    {
      "type": "tertiary",
      ... (same structure, Aspirational Avatar - where the hero wants to be)
    }
  ],

  "humanProblem": "string - the real human problem being solved",
  "emotionalTension": "string - the emotional weight of the problem",

  "transformation": "string - the journey from before to after",
  "beforeState": "string - life before the solution",
  "afterState": "string - life after the solution",

  "proofPillars": [
    {
      "claim": "string - the claim being made",
      "evidenceType": "testimonial|statistic|case-study|certification|demonstration",
      "evidence": "string - specific evidence from the website",
      "usageGuidance": "string - how to use this proof"
    },
    ... (exactly 5 pillars total)
  ],

  "offer": "string - the specific offer",
  "conversionPath": "string - how users convert",
  "callToAction": "string - the primary CTA",

  "messagingRules": ["string array of messaging do's and don'ts"],
  "toneGuidelines": ["string array of tone guidelines"],
  "forbiddenPhrases": ["string array of phrases to avoid"],

  "creativeDirections": "string - overall creative direction",
  "visualStyle": "string - visual style guidance",
  "narrativeApproach": "string - storytelling approach",

  "testingPlan": "string - how to test the creative",
  "hypotheses": ["string array of hypotheses to test"],
  "metrics": ["string array of metrics to track"]
}

Remember:
- NO em dash characters anywhere
- Extract REAL evidence from the website for proof pillars
- Make avatars feel like real people
- Keep sentences short and declarative

Generate the complete JSON now:`;
}

export function buildDeliverablesPrompt(briefJson: string): string {
  return `Based on this Creative Brief, generate the deliverables package.

## Creative Brief
${briefJson}

Generate a JSON object with these deliverables:

{
  "websiteSummary": "A 500 word summary of the brand, its mission, audience, and unique value proposition",

  "facebookCampaigns": "3 Facebook ad campaigns, each with:\\n- Campaign name\\n- Objective\\n- Target avatar\\n- Primary text (125 chars)\\n- Headline (40 chars)\\n- Description (30 chars)\\n- Visual direction",

  "tvCommercial30s": "A 30 second TV commercial script with:\\n- Opening hook (3 sec)\\n- Problem establishment (5 sec)\\n- Brand introduction (5 sec)\\n- Proof moment (7 sec)\\n- Transformation (5 sec)\\n- CTA and resolution (5 sec)\\n- Include visual directions and voiceover"
}

Remember: NO em dashes. Short sentences. Cinematic and grounded tone.

Generate the JSON:`;
}
