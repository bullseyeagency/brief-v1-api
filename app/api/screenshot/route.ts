import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/screenshot?url=https://example.com
 * Returns a website screenshot
 */
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // Use screenshotone.com free API (no key required for basic usage)
    const screenshotUrl = `https://api.screenshotone.com/take?url=${encodeURIComponent(url)}&viewport_width=1280&viewport_height=800&device_scale_factor=1&format=jpg&image_quality=80&block_ads=true&block_cookie_banners=true&block_trackers=true`;

    // Fetch the screenshot
    const response = await fetch(screenshotUrl);

    if (!response.ok) {
      throw new Error(`Screenshot API error: ${response.status}`);
    }

    // Get the image buffer
    const imageBuffer = await response.arrayBuffer();

    // Return the image
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Screenshot error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to capture screenshot' },
      { status: 500 }
    );
  }
}
