import { CreativeBrief, Avatar, ProofPillar } from './types';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// Check for em dash characters (prohibited by the system)
function containsEmDash(text: string): boolean {
  return text.includes('—') || text.includes('–');
}

function validateAvatar(avatar: Avatar, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `avatars[${index}]`;

  if (!avatar.name) errors.push({ field: `${prefix}.name`, message: 'Avatar name is required' });
  if (!avatar.age || avatar.age < 1) errors.push({ field: `${prefix}.age`, message: 'Avatar age must be positive' });
  if (!avatar.background) errors.push({ field: `${prefix}.background`, message: 'Avatar background is required' });
  if (!avatar.currentState) errors.push({ field: `${prefix}.currentState`, message: 'Current state is required' });
  if (!avatar.desire) errors.push({ field: `${prefix}.desire`, message: 'Desire is required' });
  if (!avatar.conflict) errors.push({ field: `${prefix}.conflict`, message: 'Conflict is required' });
  if (!avatar.transformation) errors.push({ field: `${prefix}.transformation`, message: 'Transformation is required' });
  if (!avatar.moralArc) errors.push({ field: `${prefix}.moralArc`, message: 'Moral arc is required' });
  if (!avatar.cinematicImagePrompt) errors.push({ field: `${prefix}.cinematicImagePrompt`, message: 'Cinematic image prompt is required' });

  // Check feature benefits (must be exactly 3)
  if (!avatar.featureBenefits || avatar.featureBenefits.length !== 3) {
    errors.push({ field: `${prefix}.featureBenefits`, message: 'Exactly 3 feature/benefit/WIIFM lines required' });
  } else {
    avatar.featureBenefits.forEach((fb, i) => {
      if (!fb.feature) errors.push({ field: `${prefix}.featureBenefits[${i}].feature`, message: 'Feature is required' });
      if (!fb.benefit) errors.push({ field: `${prefix}.featureBenefits[${i}].benefit`, message: 'Benefit is required' });
      if (!fb.wiifm) errors.push({ field: `${prefix}.featureBenefits[${i}].wiifm`, message: 'WIIFM is required' });
    });
  }

  // Check for em dashes
  const avatarText = JSON.stringify(avatar);
  if (containsEmDash(avatarText)) {
    errors.push({ field: prefix, message: 'Avatar contains prohibited em dash characters' });
  }

  return errors;
}

function validateProofPillar(pillar: ProofPillar, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `proofPillars[${index}]`;

  if (!pillar.claim) errors.push({ field: `${prefix}.claim`, message: 'Claim is required' });
  if (!pillar.evidenceType) errors.push({ field: `${prefix}.evidenceType`, message: 'Evidence type is required' });
  if (!pillar.evidence) errors.push({ field: `${prefix}.evidence`, message: 'Evidence is required (no evidence, no pillar)' });
  if (!pillar.usageGuidance) errors.push({ field: `${prefix}.usageGuidance`, message: 'Usage guidance is required' });

  // Check for em dashes
  const pillarText = JSON.stringify(pillar);
  if (containsEmDash(pillarText)) {
    errors.push({ field: prefix, message: 'Proof pillar contains prohibited em dash characters' });
  }

  return errors;
}

export function validateCreativeBrief(brief: CreativeBrief): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate avatars (must be exactly 3)
  if (!brief.avatars || brief.avatars.length !== 3) {
    errors.push({ field: 'avatars', message: 'Exactly 3 avatars are required' });
  } else {
    // Check avatar types
    const types = brief.avatars.map(a => a.type);
    if (!types.includes('primary')) errors.push({ field: 'avatars', message: 'Primary Hero Avatar is required' });
    if (!types.includes('secondary')) errors.push({ field: 'avatars', message: 'Secondary Mirror Avatar is required' });
    if (!types.includes('tertiary')) errors.push({ field: 'avatars', message: 'Tertiary Aspirational Avatar is required' });

    brief.avatars.forEach((avatar, i) => {
      errors.push(...validateAvatar(avatar, i));
    });
  }

  // Validate proof pillars (must be exactly 5)
  if (!brief.proofPillars || brief.proofPillars.length !== 5) {
    errors.push({ field: 'proofPillars', message: 'Exactly 5 proof pillars are required' });
  } else {
    brief.proofPillars.forEach((pillar, i) => {
      errors.push(...validateProofPillar(pillar, i));
    });
  }

  // Validate required text fields
  const requiredFields = [
    'brandTruth', 'brandPromise', 'uniqueTruth',
    'marketContext', 'humanProblem', 'emotionalTension',
    'transformation', 'beforeState', 'afterState',
    'offer', 'conversionPath', 'callToAction',
    'creativeDirections', 'testingPlan'
  ];

  requiredFields.forEach(field => {
    if (!brief[field as keyof CreativeBrief]) {
      errors.push({ field, message: `${field} is required` });
    }
  });

  // Check entire brief for em dashes
  const briefText = JSON.stringify(brief);
  if (containsEmDash(briefText)) {
    errors.push({ field: 'general', message: 'Brief contains prohibited em dash characters. Use hyphens or commas instead.' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Helper to remove em dashes from text
export function sanitizeEmDashes(text: string): string {
  return text.replace(/—/g, ', ').replace(/–/g, '-');
}
