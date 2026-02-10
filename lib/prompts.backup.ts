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

export function buildLocalGenerationPrompt(crawlResult: CrawlResult): string {
  const websiteSummary = summarizeCrawlResult(crawlResult);

  return `Analyze the following LOCAL SERVICE BUSINESS website and generate a complete Creative Brief.

## Business Type: Local Service Business
This is a location-based service business serving a specific geographic area. When analyzing and creating the brief:

### Key Focus Areas:
- **Geographic Service Area**: Emphasize their local market presence and service radius
- **Local Trust & Reputation**: Highlight community involvement, local reviews, word-of-mouth
- **Personal Service**: Focus on the human element, personal relationships, face-to-face interaction
- **Reliability & Expertise**: Local credentials, years in community, local certifications
- **Convenience**: Proximity benefits, response time, local availability

### Avatar Considerations:
- Customers prioritize proximity and local reputation over price
- Decision factors: trust, convenience, personal connection, local expertise
- Current state: frustrated with generic/distant options, want reliable local help
- Transformation: from anxious about quality to confident in local expert

### Proof Pillar Priorities:
1. Local testimonials and community reputation
2. Years serving the local area
3. Local certifications and credentials
4. Before/after results in the community
5. Response time and local availability

## Website Content
${websiteSummary}

## Required Output Schema
Generate a JSON object with this exact structure:

{
  "brandTruth": "string - the core truth about what this brand stands for",
  "brandPromise": "string - what the brand promises to deliver",
  "uniqueTruth": "string - what makes this brand uniquely credible",

  "marketContext": "string - the LOCAL market landscape and dynamics",
  "competitiveLandscape": "string - local competitors and positioning",
  "marketTension": "string - the tension or gap in the LOCAL market",

  "avatars": [
    {
      "type": "primary",
      "name": "string - realistic name",
      "age": number,
      "background": "string - who they are (include LOCAL context)",
      "currentState": "string - where they are now (LOCAL pain points)",
      "desire": "string - what they want (LOCAL solution)",
      "conflict": "string - what's stopping them (LOCAL friction)",
      "transformation": "string - how they change (LOCAL benefit)",
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

  "humanProblem": "string - the real human problem being solved (LOCAL context)",
  "emotionalTension": "string - the emotional weight of the problem",

  "transformation": "string - the journey from before to after",
  "beforeState": "string - life before the LOCAL solution",
  "afterState": "string - life after the LOCAL solution",

  "proofPillars": [
    {
      "claim": "string - the claim being made",
      "evidenceType": "testimonial|statistic|case-study|certification|demonstration",
      "evidence": "string - specific LOCAL evidence from the website",
      "usageGuidance": "string - how to use this proof"
    },
    ... (exactly 5 pillars total - prioritize LOCAL testimonials and community proof)
  ],

  "offer": "string - the specific offer",
  "conversionPath": "string - how LOCAL customers convert (phone, visit, consultation)",
  "callToAction": "string - the primary CTA (emphasize LOCAL action)",

  "messagingRules": ["string array of messaging do's and don'ts (LOCAL context)"],
  "toneGuidelines": ["string array of tone guidelines (personal, trustworthy, local)"],
  "forbiddenPhrases": ["string array of phrases to avoid"],

  "creativeDirections": "string - overall creative direction (LOCAL service focus)",
  "visualStyle": "string - visual style guidance (authentic, local, personal)",
  "narrativeApproach": "string - storytelling approach (LOCAL stories, real people)",

  "testingPlan": "string - how to test the creative",
  "hypotheses": ["string array of hypotheses to test"],
  "metrics": ["string array of metrics to track (LOCAL conversions)"]
}

Remember:
- NO em dash characters anywhere
- Extract REAL LOCAL evidence from the website for proof pillars
- Make avatars feel like real LOCAL people with LOCAL concerns
- Keep sentences short and declarative
- Emphasize trust, proximity, and personal service throughout

Generate the complete JSON now:`;
}

export function buildShopifyGenerationPrompt(crawlResult: CrawlResult): string {
  const websiteSummary = summarizeCrawlResult(crawlResult);

  return `Analyze the following ECOMMERCE STORE website and generate a complete Creative Brief.

## Business Type: Ecommerce Store (Shopify)
This is an online retail business selling products directly to consumers. When analyzing and creating the brief:

### Key Focus Areas:
- **Product Quality & Selection**: Emphasize catalog depth, product curation, unique offerings
- **Online Shopping Experience**: Focus on ease of discovery, checkout flow, user experience
- **Shipping & Fulfillment**: Delivery speed, costs, reliability, tracking, returns
- **Social Proof**: Customer reviews, ratings, testimonials, user-generated content
- **Brand Story**: Why they exist, product sourcing, quality standards, values

### Avatar Considerations:
- Customers are online shoppers comparing multiple options
- Decision factors: product quality, reviews, price/value, shipping speed, return policy
- Current state: overwhelmed by choice, uncertain about quality, want confidence
- Transformation: from hesitant browser to satisfied repeat customer

### Proof Pillar Priorities:
1. Customer reviews and star ratings
2. Product quality guarantees or certifications
3. Shipping speed and reliability stats
4. Return/satisfaction policy strength
5. Social proof (follower counts, press mentions, awards)

## Website Content
${websiteSummary}

## Required Output Schema
Generate a JSON object with this exact structure:

{
  "brandTruth": "string - the core truth about what this brand stands for",
  "brandPromise": "string - what the brand promises to deliver",
  "uniqueTruth": "string - what makes this brand uniquely credible in ECOMMERCE",

  "marketContext": "string - the ONLINE market landscape and dynamics",
  "competitiveLandscape": "string - online competitors and positioning",
  "marketTension": "string - the tension or gap in the ECOMMERCE market",

  "avatars": [
    {
      "type": "primary",
      "name": "string - realistic name",
      "age": number,
      "background": "string - who they are (include ONLINE shopping context)",
      "currentState": "string - where they are now (ONLINE shopping pain points)",
      "desire": "string - what they want (PRODUCT/SHOPPING solution)",
      "conflict": "string - what's stopping them (ONLINE purchase friction)",
      "transformation": "string - how they change (POST-PURCHASE satisfaction)",
      "moralArc": "string - what they learn",
      "featureBenefits": [
        { "feature": "string (PRODUCT feature)", "benefit": "string", "wiifm": "string" },
        { "feature": "string (PRODUCT feature)", "benefit": "string", "wiifm": "string" },
        { "feature": "string (PRODUCT feature)", "benefit": "string", "wiifm": "string" }
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

  "humanProblem": "string - the real human problem being solved (PRODUCT/SHOPPING context)",
  "emotionalTension": "string - the emotional weight of the problem",

  "transformation": "string - the journey from before to after",
  "beforeState": "string - life before discovering this PRODUCT/BRAND",
  "afterState": "string - life after using this PRODUCT/BRAND",

  "proofPillars": [
    {
      "claim": "string - the claim being made",
      "evidenceType": "testimonial|statistic|case-study|certification|demonstration",
      "evidence": "string - specific ECOMMERCE evidence from the website (reviews, ratings, guarantees)",
      "usageGuidance": "string - how to use this proof"
    },
    ... (exactly 5 pillars total - prioritize customer reviews, product quality proof, satisfaction guarantees)
  ],

  "offer": "string - the specific offer (discount, free shipping, bundle, etc.)",
  "conversionPath": "string - how ONLINE customers convert (add to cart, checkout flow)",
  "callToAction": "string - the primary CTA (Shop Now, Add to Cart, etc.)",

  "messagingRules": ["string array of messaging do's and don'ts (ECOMMERCE context)"],
  "toneGuidelines": ["string array of tone guidelines (confident, quality-focused, customer-centric)"],
  "forbiddenPhrases": ["string array of phrases to avoid"],

  "creativeDirections": "string - overall creative direction (PRODUCT-focused, lifestyle)",
  "visualStyle": "string - visual style guidance (clean, product-forward, aspirational)",
  "narrativeApproach": "string - storytelling approach (product in life, transformation stories)",

  "testingPlan": "string - how to test the creative",
  "hypotheses": ["string array of hypotheses to test"],
  "metrics": ["string array of metrics to track (ECOMMERCE conversions, AOV, ROAS)"]
}

Remember:
- NO em dash characters anywhere
- Extract REAL ECOMMERCE evidence from the website for proof pillars (reviews, ratings, guarantees)
- Make avatars feel like real ONLINE SHOPPERS with PRODUCT-related concerns
- Keep sentences short and declarative
- Emphasize product quality, shopping experience, and customer satisfaction throughout

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
