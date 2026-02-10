import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { operationName } = await request.json();

    if (!operationName) {
      throw new Error("operationName is required");
    }

    const apiKey = process.env.VEO3_API_KEY;
    if (!apiKey) {
      throw new Error("VEO3_API_KEY not found in environment variables");
    }

    // Poll the operation status
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${operationName}`,
      {
        method: "GET",
        headers: {
          "x-goog-api-key": apiKey,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Poll error: ${error}`);
    }

    const data = await response.json();

    // Check if operation is complete
    if (data.done) {
      const videoUrl =
        data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
      return NextResponse.json({
        success: true,
        done: true,
        videoUrl: videoUrl,
        result: data.response,
      });
    } else {
      return NextResponse.json({
        success: true,
        done: false,
        message: "Video generation still in progress",
        metadata: data.metadata,
      });
    }
  } catch (error) {
    console.error("Veo 3 poll error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
