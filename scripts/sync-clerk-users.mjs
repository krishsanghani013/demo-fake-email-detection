import dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env"] });

/**
 * One-time Synchronization Script for Existing Clerk Users
 *
 * Purpose:
 *   Retrieves all existing users registered in the Clerk application
 *   and idempotently synchronizes their profile records into the
 *   Supabase PostgreSQL database (Prisma `users` table).
 *
 * Usage:
 *   npx tsx scripts/sync-clerk-users.mjs
 */

async function main() {
  console.log("=================================================");
  console.log("Starting Clerk -> PostgreSQL User Sync Script...");
  console.log("=================================================");

  const { clerkClient } = await import("@clerk/nextjs/server");
  const { db, isDatabaseConfigured } = await import("../lib/prisma.js");
  const { syncClerkUser } = await import("../lib/userService.js");

  if (!isDatabaseConfigured() || !db) {
    console.error("❌ Database is not configured. Check DATABASE_URL/DIRECT_URL in .env.local.");
    process.exit(1);
  }

  if (!process.env.CLERK_SECRET_KEY) {
    console.error("❌ CLERK_SECRET_KEY is missing from environment variables.");
    process.exit(1);
  }

  try {
    const client = typeof clerkClient === "function" ? await clerkClient() : clerkClient;
    console.log("✓ Connected to Clerk Backend API.");

    const userListResponse = await client.users.getUserList({
      limit: 100,
    });

    const users = userListResponse.data || [];
    console.log(`Found ${users.length} user(s) in Clerk instance.`);

    if (users.length === 0) {
      console.log("No existing users to synchronize.");
      console.log("✓ Done.");
      return;
    }

    let syncedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      const primaryEmail =
        user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
        user.emailAddresses?.[0]?.emailAddress;

      if (!primaryEmail) {
        console.warn(`⚠️ User ${user.id} has no email address. Skipping.`);
        continue;
      }

      const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

      try {
        const dbRecord = await syncClerkUser({
          clerkUserId: user.id,
          email: primaryEmail,
          name: fullName || user.username || primaryEmail.split("@")[0],
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
        });

        console.log(`✓ Synchronized [${user.id}] ${primaryEmail} -> DB User ID: ${dbRecord?.id}`);
        syncedCount++;
      } catch (err) {
        console.error(`❌ Failed to sync user ${user.id}:`, err.message);
        errorCount++;
      }
    }

    console.log("-------------------------------------------------");
    console.log(`Synchronization Complete: ${syncedCount} synced, ${errorCount} errors.`);
    console.log("=================================================");
  } catch (error) {
    console.error("❌ Unexpected error during user synchronization:", error);
    process.exit(1);
  }
}

main();
