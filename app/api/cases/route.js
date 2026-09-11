import { NextResponse } from "next/server";
import {
  createInvestigationCase,
  getCases,
} from "@/lib/caseRepository";
import { isDatabaseConfigured } from "@/lib/prisma";
import { requireAuthenticatedUser } from "@/lib/authenticatedUser";

/**
 * GET /api/cases
 * Returns cases strictly belonging to the currently authenticated Clerk user.
 * Query parameters:
 * - page: number
 * - limit: number
 * - filter: "all" | "fraudulent" | "suspicious" | "legitimate"
 * - search: string
 * - status: "all" | "NEW" | "INVESTIGATING" | "RESOLVED"
 */
export async function GET(request) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        success: true,
        source: "unconfigured",
        data: [],
        message: "Database URL not configured or contains placeholder.",
      });
    }

    const { user, unauthorizedResponse } = await requireAuthenticatedUser();
    if (unauthorizedResponse) {
      return unauthorizedResponse;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const filter = searchParams.get("filter") || "all";
    const searchQuery = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";

    // Enforce multi-user data isolation: query strictly with the authenticated user ID
    const cases = await getCases({
      userId: user.id,
      page,
      limit,
      filter,
      searchQuery,
      status,
    });

    return NextResponse.json({
      success: true,
      source: "database",
      data: cases,
    });
  } catch (error) {
    console.error("GET /api/cases error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve cases.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cases
 * Persists an investigation case associated strictly with the authenticated Clerk user.
 * Body: Full investigation result object
 */
export async function POST(request) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        {
          success: false,
          fallbackRequired: true,
          error: "Database is not configured yet. DATABASE_URL contains placeholder.",
        },
        { status: 503 }
      );
    }

    const { user, unauthorizedResponse } = await requireAuthenticatedUser();
    if (unauthorizedResponse) {
      return unauthorizedResponse;
    }

    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid investigation payload." },
        { status: 400 }
      );
    }

    // Security: completely disregard any client-provided userId and bind to authenticated user
    const sanitizedBody = { ...body, userId: user.id };
    const savedCase = await createInvestigationCase(sanitizedBody, user.id);

    return NextResponse.json({
      success: true,
      data: savedCase,
    });
  } catch (error) {
    console.error("POST /api/cases error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to persist investigation to database.",
      },
      { status: 500 }
    );
  }
}

