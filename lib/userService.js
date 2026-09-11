import { db, isDatabaseConfigured } from "./prisma.js";
import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * Service to manage application-level User records in Supabase PostgreSQL (via Prisma)
 * synchronized with Clerk authentication identities.
 *
 * Architecture:
 *   Clerk User Identity
 *       ↓
 *   lib/userService
 *       ↓
 *   Prisma (db.user)
 *       ↓
 *   Supabase PostgreSQL
 */

/**
 * Idempotently synchronize a Clerk user to the PostgreSQL `users` table.
 *
 * @param {Object} params
 * @param {string} params.clerkUserId - Unique Clerk user ID (e.g. "user_2...")
 * @param {string} params.email - Primary user email address
 * @param {string} [params.name] - Full display name
 * @param {string} [params.firstName] - First name
 * @param {string} [params.lastName] - Last name
 * @param {string} [params.imageUrl] - Avatar or profile image URL
 * @returns {Promise<Object|null>} Synchronized Prisma User record
 */
export async function syncClerkUser({
  clerkUserId,
  email,
  name,
  firstName,
  lastName,
  imageUrl,
}) {
  if (!isDatabaseConfigured() || !db) {
    console.warn("[userService] Database is not configured. Skipping user sync.");
    return null;
  }

  if (!clerkUserId) {
    throw new Error("[userService] clerkUserId is required for user synchronization.");
  }

  const primaryEmail = (email || "").trim().toLowerCase();
  if (!primaryEmail) {
    throw new Error("[userService] email is required for user synchronization.");
  }

  const resolvedName =
    name ||
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    primaryEmail.split("@")[0];

  try {
    // 1. Check if user already exists with this clerkUserId
    const existingByClerkId = await db.user.findUnique({
      where: { clerkUserId },
    });

    if (existingByClerkId) {
      return await db.user.update({
        where: { clerkUserId },
        data: {
          email: primaryEmail,
          name: resolvedName,
          firstName: firstName || null,
          lastName: lastName || null,
          imageUrl: imageUrl || null,
          updatedAt: new Date(),
        },
      });
    }

    // 2. Check if a legacy record exists with this email but without clerkUserId link
    const existingByEmail = await db.user.findUnique({
      where: { email: primaryEmail },
    });

    if (existingByEmail) {
      return await db.user.update({
        where: { id: existingByEmail.id },
        data: {
          clerkUserId,
          name: resolvedName || existingByEmail.name,
          firstName: firstName || existingByEmail.firstName,
          lastName: lastName || existingByEmail.lastName,
          imageUrl: imageUrl || existingByEmail.imageUrl,
          updatedAt: new Date(),
        },
      });
    }

    // 3. Create fresh application User row
    return await db.user.create({
      data: {
        clerkUserId,
        email: primaryEmail,
        name: resolvedName,
        firstName: firstName || null,
        lastName: lastName || null,
        imageUrl: imageUrl || null,
      },
    });
  } catch (error) {
    console.error(`[userService] Failed to synchronize Clerk user ${clerkUserId}:`, error);
    throw error;
  }
}

/**
 * Handle Clerk user deletion by removing or archiving the user record in PostgreSQL.
 *
 * @param {string} clerkUserId
 * @returns {Promise<boolean>}
 */
export async function deleteClerkUser(clerkUserId) {
  if (!isDatabaseConfigured() || !db) return false;
  if (!clerkUserId) return false;

  try {
    const existing = await db.user.findUnique({
      where: { clerkUserId },
    });

    if (!existing) {
      console.log(`[userService] User ${clerkUserId} not found for deletion. Already removed.`);
      return true;
    }

    await db.user.delete({
      where: { clerkUserId },
    });

    console.log(`[userService] Successfully deleted user ${clerkUserId} (ID: ${existing.id}).`);
    return true;
  } catch (error) {
    console.error(`[userService] Failed to delete Clerk user ${clerkUserId}:`, error);
    throw error;
  }
}

/**
 * Query the application database record for a Clerk user.
 *
 * @param {string} clerkUserId
 * @returns {Promise<Object|null>}
 */
export async function getDatabaseUserByClerkId(clerkUserId) {
  if (!isDatabaseConfigured() || !db || !clerkUserId) return null;

  try {
    return await db.user.findUnique({
      where: { clerkUserId },
    });
  } catch (error) {
    console.error(`[userService] Error fetching user by clerkUserId ${clerkUserId}:`, error);
    return null;
  }
}

/**
 * Server-side helper to synchronize the currently authenticated Clerk session user.
 * Reads the session token securely from Clerk's server context (never trusting client IDs).
 *
 * @returns {Promise<Object|null>}
 */
export async function syncCurrentAuthenticatedUser() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return null;
  }

  const primaryEmail =
    clerkUser.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
    clerkUser.emailAddresses?.[0]?.emailAddress;

  if (!primaryEmail) {
    throw new Error(`[userService] Clerk user ${userId} has no email address.`);
  }

  const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim();

  return await syncClerkUser({
    clerkUserId: clerkUser.id,
    email: primaryEmail,
    name: fullName || clerkUser.username || primaryEmail.split("@")[0],
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    imageUrl: clerkUser.imageUrl,
  });
}
