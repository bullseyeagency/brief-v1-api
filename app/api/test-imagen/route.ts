import { NextResponse } from "next/server";
import { generateImagenPrompt } from "@/lib/imagen-prompt";

export async function POST(request: Request) {
  try {
    const { avatar, config } = await request.json();

    // Use test avatar if none provided
    const testAvatar = avatar || {
      name: "Jason Cole",
      age: 29,
      occupation: "Personal trainer/Powerlifter",
    };

    const testConfig = config || {
      stylePreference: "1960s Mid-Century Narrative Comic",
      keyTraits: ["Confident", "Grounded", "Efficient"],
      visualCues:
        "Muted vintage color palette, halftone dot shading, thin ink outlines, wide-angle cinematic frame, no text, no speech bubbles",
    };

    // Generate the Imagen prompt
    const imagenPrompt = generateImagenPrompt(testAvatar, testConfig);

    // Call Google Imagen 4 API
    const apiKey = process.env.VEO3_API_KEY; // Same key works for Imagen
    if (!apiKey) {
      throw new Error("VEO3_API_KEY not found in environment variables");
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict",
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instances: [
            {
              prompt: imagenPrompt,
            },
          ],
          parameters: {
            sampleCount: 1,
            aspectRatio: "1:1",
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Imagen 4 API error: ${error}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      prompt: imagenPrompt,
      images: data.predictions || [],
      rawResponse: data,
    });
  } catch (error) {
    console.error("Imagen 4 test error:", error);
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
    message: "Imagen 4 test endpoint ready. Use POST with avatar data.",
    example: {
      method: "POST",
      body: {
        avatar: {
          name: "Jason Cole",
          age: 29,
          occupation: "Personal trainer/Powerlifter",
        },
        config: {
          stylePreference: "1960s Mid-Century Narrative Comic",
          keyTraits: ["Confident", "Grounded", "Efficient"],
          visualCues:
            "Muted vintage color palette, halftone dot shading, thin ink outlines",
        },
      },
    },
  });
}
