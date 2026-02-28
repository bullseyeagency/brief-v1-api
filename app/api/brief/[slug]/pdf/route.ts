import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer';
import React, { ReactElement, JSXElementConstructor } from 'react';
import { supabase } from '@/lib/supabase';
import BriefPDF from '@/components/BriefPDF';

/**
 * GET /api/brief/[slug]/pdf
 * Generates and returns a PDF file for the given brief.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const { data: brief, error } = await supabase
      .from('v1_generated_briefs')
      .select('*')
      .eq('public_slug', slug)
      .eq('is_public', true)
      .single();

    if (error || !brief) {
      return NextResponse.json({ error: 'Brief not found' }, { status: 404 });
    }

    if (!brief.brief || !brief.deliverables) {
      return NextResponse.json(
        { error: 'Brief content is not available' },
        { status: 422 }
      );
    }

    const element = React.createElement(BriefPDF, {
      brief: brief.brief,
      deliverables: brief.deliverables,
      sourceUrl: brief.source_url ?? '',
      provider: brief.provider ?? '',
      model: brief.model ?? '',
      createdAt: brief.created_at ?? new Date().toISOString(),
    }) as unknown as ReactElement<DocumentProps, string | JSXElementConstructor<DocumentProps>>;

    const buffer = await renderToBuffer(element);
    // Convert Node.js Buffer to Uint8Array for NextResponse compatibility
    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="brief-${slug}.pdf"`,
        'Content-Length': String(uint8.byteLength),
      },
    });
  } catch (err) {
    console.error('[PDF API] Error:', err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
