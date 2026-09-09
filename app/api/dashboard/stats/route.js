import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/caseRepository";
import { isDatabaseConfigured } from "@/lib/prisma";

/**
 * GET /api/dashboard/stats
 * Returns aggregated statistics for the dashboard cards.
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

    const stats = await getDashboardStats();

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
