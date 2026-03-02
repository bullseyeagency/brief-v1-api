import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are an expert direct-response copywriter. Your job is to transform factual business summaries into client-oriented, benefit-driven copy that speaks directly to the reader. Rules:
- Write in second person where natural ("you", "your customers")
- Lead with the transformation or outcome, not the feature list
- Keep all factual details (services, contact info, locations) but frame them as benefits
- Break into 3-5 short paragraphs. Each paragraph = one clear idea
- No marketing buzzwords ("world-class", "cutting-edge", "seamless")
- Keep the same tone as the source — if it's a plumber, stay grounded; if it's a luxury brand, stay elevated
- Output ONLY the rewritten copy, no explanation, no preamble`;

/**
 * POST /api/editorial-rewrite
 *
 * Rewrites a factual business summary into client-oriented, benefit-driven copy.
 *
 * @param req - Request body: { text: string; context?: string }
 * @returns { rewritten: string } — on error, returns original text
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let text = '';

  try {
    const body = await req.json();
    text = body.text as string;
    const context = body.context as string | undefined;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ rewritten: '' }, { status: 400 });
    }

    const userPrompt = `Rewrite the following business summary into client-oriented copy:\n\n${text}${context ? '\n\nBusiness context: ' + context : ''}`;

    const openAiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (openAiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 600,
          temperature: 0.4,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rewritten: string = data.choices?.[0]?.message?.content?.trim() ?? text;
        return NextResponse.json({ rewritten });
      }
    }

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
          max_tokens: 600,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rewritten: string = data.content?.[0]?.text?.trim() ?? text;
        return NextResponse.json({ rewritten });
      }
    }

    // No keys available or both calls failed — return original
    return NextResponse.json({ rewritten: text });
  } catch (err) {
    console.error('[editorial-rewrite] error:', err);
    return NextResponse.json({ rewritten: text });
  }
}
