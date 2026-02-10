import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoUrl = searchParams.get("url");

    if (!videoUrl) {
      return NextResponse.json(
        { error: "Video URL is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.VEO3_API_KEY;
    if (!apiKey) {
      throw new Error("VEO3_API_KEY not found");
    }

    // Fetch video with API key
    const response = await fetch(videoUrl, {
      headers: {
        "x-goog-api-key": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }

    // Get video data
    const videoData = await response.arrayBuffer();

    // Return video with proper headers
    return new NextResponse(videoData, {
      headers: {
        "Content-Type": response.headers.get("content-type") || "video/mp4",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Video proxy error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load video",
      },
      { status: 500 }
    );
  }
}
