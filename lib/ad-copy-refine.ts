import { FacebookCampaign } from './types';

const SYSTEM_PROMPT = `You are a direct-response copywriter specializing in emotionally resonant ad copy. You work within the Mercenary Creative System: the customer is the hero, the brand is the guide, and the copy must feel like a real human thought — not a marketing line.

Your job is to rewrite Facebook ad copy to be more moving and specific without changing the strategy.

Rules:
- primaryText: Max 125 characters. Should read like something a real person thinks or feels in the moment of the problem. Specific, grounded, human. Not a tagline.
- headline: Max 40 characters. One clear, arrestive statement. No clever wordplay. No generic energy. Should make someone pause mid-scroll.
- description: Max 30 characters. Reinforces the headline. Simple and direct.
- Do NOT introduce new claims, benefits, or proof not already present in the original copy
- Do NOT use hype words (amazing, incredible, game-changing, revolutionary)
- Do NOT use urgency manipulation (limited time, act now, don't miss out)
- Keep the same emotional direction as the original — just sharpen it
- Preserve campaignName, objective, targetAvatar, and visualDirection exactly as given
- Return ONLY valid JSON, no commentary`;

function parseJsonArray(content: string): FacebookCampaign[] | null {
  try {
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
    }
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed as FacebookCampaign[] : null;
  } catch {
    return null;
  }
}

/**
 * Rewrites Facebook campaign copy (primaryText, headline, description) to be
 * more emotionally resonant. Preserves all strategic fields.
 * Falls back to original campaigns on any error.
 */
export async function refineFacebookAdCopy(
  campaigns: FacebookCampaign[],
  businessContext?: string
): Promise<FacebookCampaign[]> {
  if (!Array.isArray(campaigns) || campaigns.length === 0) return campaigns;

  const userPrompt = `Rewrite the following Facebook ad campaigns to make the copy more emotionally resonant and human. Keep all strategy, character limits, and structure exactly as specified.${businessContext ? `\n\nBusiness context: ${businessContext}` : ''}

Return a JSON array with the same structure as the input. Only rewrite primaryText, headline, and description. Preserve all other fields exactly.

Input campaigns:
${JSON.stringify(campaigns, null, 2)}

Return ONLY the JSON array, no explanation.`;

  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  try {
    if (anthropicKey) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1200,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content: string = data.content?.[0]?.text?.trim() ?? '';
        const refined = parseJsonArray(content);
        if (refined && refined.length === campaigns.length) {
          console.log('[AdCopyRefine] Refined via Claude');
          return refined;
        }
      }
    }
  } catch (err) {
    console.error('[AdCopyRefine] Error during refinement, using original:', err);
  }

  console.warn('[AdCopyRefine] Falling back to original campaigns');
  return campaigns;
}
