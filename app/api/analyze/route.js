import { NextResponse } from "next/server";
import { analyzeEmail } from "@/lib/gemini";

/**
 * POST /api/analyze
 *
 * Receives raw email text from the client, validates the payload,
 * runs forensic analysis via analyzeEmail(), and returns the structured result.
 *
 * @param {Request} request - Next.js App Router request object.
 * @returns {Promise<NextResponse>} JSON response with analysis result or error.
 */
export async function POST(request) {
  let body;

  // Safely parse incoming JSON request body
  try {
    body = await request.json();
  } catch (parseError) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON format in request body.",
      },
      { status: 400 }
    );
  }

  // Validate presence and type of body
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      {
        success: false,
        error: "Request body is missing or invalid.",
      },
      { status: 400 }
    );
  }

  const { email } = body;

  // Validate that the 'email' property exists and is a string
  if (email === undefined || email === null) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing required field: 'email'.",
      },
      { status: 400 }
    );
  }

  if (typeof email !== "string") {
    return NextResponse.json(
      {
        success: false,
        error: "The 'email' field must be a valid string.",
      },
      { status: 400 }
    );
  }

  const trimmedEmail = email.trim();

  // Validate content length
  if (trimmedEmail.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: "Email content cannot be empty.",
      },
      { status: 400 }
    );
  }

  if (trimmedEmail.length < 10) {
    return NextResponse.json(
      {
        success: false,
        error: "Email content is too short to perform a meaningful forensic analysis.",
      },
      { status: 400 }
    );
  }

  // Perform forensic email analysis using the Gemini service
  try {
    const analysisResult = await analyzeEmail(trimmedEmail);

    return NextResponse.json(
      {
        success: true,
        data: analysisResult,
      },
      { status: 200 }
    );
  } catch (error) {
    // Log server error diagnostic without leaking sensitive environment information
    console.error("API /api/analyze error:", error?.message || error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "An unexpected error occurred during email analysis.",
      },
      { status: 500 }
    );
  }
}
