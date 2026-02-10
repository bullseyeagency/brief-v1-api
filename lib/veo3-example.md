# Veo 3 Prompt Generation Example

## Input (tvCommercial30s object):
```typescript
{
  openingHook: "A serene home. Morning light filters in.",
  problemEstablishment: "Struggling to find time and motivation?",
  brandIntroduction: "Meet Sole Fitness, your home workout partner.",
  proofMoment: "Show quiet motor in action. Display the app. Free classes. No fees. Top performance.",
  transformation: "View Sarah energized on the treadmill. Confidence and ease.",
  ctaAndResolution: "Start your journey today at SoleFitness.com",
  visualDirections: "Focus on smooth movements, clean home aesthetics, and the confidence transformation."
}
```

## Generated Veo 3 Prompt:
```
Style: 1960s Silver Age comic book aesthetic
- Halftone textures and Ben-Day dot patterns
- Clean black ink outlines around all subjects
- Muted vintage color palette (soft tans, teals, slate grays)
- Dynamic action lines and motion effects
- Hand-drawn, illustrated feel
- Slightly oversaturated colors with slight fade
- Comic panel framing with subtle borders

Scene 1: The Problem:
A serene home. Morning light filters in.
Struggling to find time and motivation?

Scene 2: Brand Introduction:
Meet Sole Fitness, your home workout partner.

Scene 3: Proof Moment:
Show quiet motor in action. Display the app. Free classes. No fees. Top performance.

Scene 4: Transformation:
View Sarah energized on the treadmill. Confidence and ease.

Visual Notes:
Focus on smooth movements, clean home aesthetics, and the confidence transformation.

Format: 4-scene progression, 8 seconds total duration, let pacing flow naturally between scenes.
```

## Usage in Backend:

```typescript
import { generateVeo3Prompt } from '@/lib/veo3-prompt';

// When deliverables are created
const veo3Prompt = generateVeo3Prompt(deliverables.tvCommercial30s);

// Send to Veo 3 API
const videoUrl = await generateVeo3Video(veo3Prompt);

// Store videoUrl in database for display
deliverables.tvCommercial30sVideoUrl = videoUrl;
```
