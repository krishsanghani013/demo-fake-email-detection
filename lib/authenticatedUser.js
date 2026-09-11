import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getDatabaseUserByClerkId, syncCurrentAuthenticatedUser } from "./userService.js";
import { isDatabaseConfigured } from "./prisma.js";

/**
 * Server-side helper to resolve the currently authenticated Clerk user
 * to their corresponding Prisma / Supabase PostgreSQL database User record.
 *
 * Architecture:
 *   Clerk session (auth())
 *         ↓
 *   clerkUserId
 *         ↓
 *   Prisma (db.user)
 *         ↓
 *   databaseUser.id
 */

/**
 * Retrieves the database User record for the currently authenticated session.
 * If the user is authenticated in Clerk but their record does not yet exist in PostgreSQL,
 * this function automatically synchronizes their profile on the fly to prevent race conditions.
 *
 * @returns {Promise<Object|null>} The Prisma database User record, or null if unauthenticated.
 */
export async function getAuthenticatedDatabaseUser() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return null;
    }

    if (!isDatabaseConfigured()) {
      return null;
    }

    // 1. Try to find the user by their Clerk ID in PostgreSQL
    let user = await getDatabaseUserByClerkId(userId);

    // 2. If the user doesn't exist in the database yet, auto-sync on the fly
    if (!user) {
      user = await syncCurrentAuthenticatedUser();
    }

    return user;
  } catch (error) {
    console.error("[authenticatedUser] Error resolving current database user:", error);
    return null;
  }
}

/**
 * Enforces authentication on a route handler.
 * If the user is unauthenticated or database is unconfigured, returns an unauthorizedResponse.
 *
 * Usage:
 *   const { user, unauthorizedResponse } = await requireAuthenticatedUser();
 *   if (unauthorizedResponse) return unauthorizedResponse;
 *
 * @returns {Promise<{ user: Object|null, unauthorizedResponse: NextResponse|null }>}
 */
export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedDatabaseUser();

  if (!user) {
    return {
      user: null,
      unauthorizedResponse: NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Please sign in to access your investigations.",
        },
        { status: 401 }
      ),
    };
  }

  return {
    user,
    unauthorizedResponse: null,
  };
}
