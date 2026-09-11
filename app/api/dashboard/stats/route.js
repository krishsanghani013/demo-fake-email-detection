import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/caseRepository";
import { isDatabaseConfigured } from "@/lib/prisma";
import { requireAuthenticatedUser } from "@/lib/authenticatedUser";

/**
 * GET /api/dashboard/stats
 * Returns aggregated statistics strictly for the authenticated user's cases.
 */
export async function GET() {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        success: true,
        source: "unconfigured",
        data: null,
      });
    }

    const { user, unauthorizedResponse } = await requireAuthenticatedUser();
    if (unauthorizedResponse) {
      return unauthorizedResponse;
    }

    // Calculate statistics exclusively scoped to the authenticated user ID
    const stats = await getDashboardStats(user.id);

    return NextResponse.json({
      success: true,
      source: "database",
      data: stats,
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve stats." },
      { status: 500 }
    );
  }
}
