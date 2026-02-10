import { NextResponse } from "next/server";
import { generateVeo3Prompt } from "@/lib/veo3-prompt";

export async function POST(request: Request) {
  try {
    const { script } = await request.json();

    // Use example script if none provided
    const testScript = script || {
      openingHook: "A serene home. Morning light filters in.",
      problemEstablishment: "Struggling to find time and motivation?",
      brandIntroduction: "Meet Sole Fitness, your home workout partner.",
      proofMoment:
        "Show quiet motor in action. Display the app. Free classes. No fees. Top performance.",
      transformation:
        "View Sarah energized on the treadmill. Confidence and ease.",
      ctaAndResolution: "Start your journey today at SoleFitness.com",
      visualDirections:
        "Focus on smooth movements, clean home aesthetics, and the confidence transformation.",
    };

    // Generate the Veo 3 prompt
    const veo3Prompt = generateVeo3Prompt(testScript);

    // Call Google Veo 3 API
    const apiKey = process.env.VEO3_API_KEY;
    if (!apiKey) {
      throw new Error("VEO3_API_KEY not found in environment variables");
    }

    // Google AI Studio Veo 3.1 API endpoint (long-running operation)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:predictLongRunning`,
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instances: [
            {
              prompt: veo3Prompt,
            },
          ],
          parameters: {
            aspectRatio: "16:9",
            resolution: "720p",
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Veo 3 API error: ${error}`);
    }

    const data = await response.json();

    // Return operation info for polling
    return NextResponse.json({
      success: true,
      prompt: veo3Prompt,
      operationName: data.name,
      message:
        "Video generation started. Use the operationName to poll for status.",
      pollUrl: `https://generativelanguage.googleapis.com/v1beta/${data.name}`,
      rawResponse: data,
    });
  } catch (error) {
    console.error("Veo 3 test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to test without sending data
export async function GET() {
  return NextResponse.json({
    message: "Veo 3 test endpoint ready. Use POST with optional script data.",
    example: {
      method: "POST",
      body: {
        script: {
          openingHook: "Scene description...",
          problemEstablishment: "Problem description...",
          brandIntroduction: "Brand intro...",
          proofMoment: "Proof moment...",
          transformation: "Transformation...",
          ctaAndResolution: "CTA...",
          visualDirections: "Visual notes...",
        },
      },
    },
  });
}
