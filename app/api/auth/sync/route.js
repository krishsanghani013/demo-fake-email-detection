import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  syncCurrentAuthenticatedUser,
  getDatabaseUserByClerkId,
} from "@/lib/userService";

/**
 * GET /api/auth/sync
 * Retrieves the database User record for the currently authenticated Clerk user.
 * Validates identity strictly from server-side Clerk session.
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    let user = await getDatabaseUserByClerkId(userId);

    // If record doesn't exist in DB yet, auto-sync on the fly
    if (!user) {
      user = await syncCurrentAuthenticatedUser();
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("GET /api/auth/sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve user record.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/sync
 * Explicitly triggers Just-In-Time synchronization for the currently authenticated session.
 * Guarantees that users are present in Supabase PostgreSQL even in local development without public webhooks.
 */
export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const synchronizedUser = await syncCurrentAuthenticatedUser();

    return NextResponse.json({
      success: true,
      user: synchronizedUser,
    });
  } catch (error) {
    console.error("POST /api/auth/sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to synchronize user session.",
      },
      { status: 500 }
    );
  }
}
