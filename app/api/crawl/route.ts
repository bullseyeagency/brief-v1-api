import { NextRequest, NextResponse } from 'next/server';
import { crawlWebsite, BriefType } from '@/lib/crawler';

export async function POST(request: NextRequest) {
  try {
    const { url, type } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const result = await crawlWebsite(url, (type as BriefType) || 'default');

    if (result.pages.length === 0) {
      return NextResponse.json({ error: 'Could not crawl any pages from the provided URL' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Crawl error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to crawl website' },
      { status: 500 }
    );
  }
}
