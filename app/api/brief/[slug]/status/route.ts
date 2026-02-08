import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface StatusResponse {
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  currentTask: string;
  logs: string[];
  errorMessage?: string;
}

/**
 * GET /api/brief/[slug]/status
 * Returns current generation status for polling
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const { data: brief, error } = await supabase
      .from('v1_generated_briefs')
      .select('status, progress, current_task, logs, error_message')
      .eq('public_slug', slug)
      .eq('is_public', true)
      .single();

    if (error || !brief) {
      return NextResponse.json(
        { error: 'Brief not found' },
        { status: 404 }
      );
    }

    const response: StatusResponse = {
      status: brief.status,
      progress: brief.progress,
      currentTask: brief.current_task || 'Initializing...',
      logs: brief.logs || [],
      errorMessage: brief.error_message,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Status API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
