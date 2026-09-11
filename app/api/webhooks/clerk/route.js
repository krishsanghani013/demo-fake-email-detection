import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { headers } from "next/headers";
import { syncClerkUser, deleteClerkUser } from "@/lib/userService";

/**
 * Clerk Webhook Handler (Route Handler)
 *
 * Listens for user lifecycle events from Clerk:
 * - user.created: Creates application user in Supabase PostgreSQL
 * - user.updated: Updates user profile / email changes in PostgreSQL
 * - user.deleted: Safely cleans up application user record
 *
 * Security:
 * - Verifies Svix cryptographic signatures (svix-id, svix-timestamp, svix-signature)
 * - Requires CLERK_WEBHOOK_SECRET environment variable
 */
export async function POST(req) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.warn(
      "[Clerk Webhook] CLERK_WEBHOOK_SECRET is not configured in environment variables. Webhook rejected."
    );
    return NextResponse.json(
      {
        success: false,
        error: "CLERK_WEBHOOK_SECRET is not configured on the server.",
      },
      { status: 500 }
    );
  }

  // Get Svix headers for signature verification
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing Svix verification headers.",
      },
      { status: 400 }
    );
  }

  // Get raw body as text for verification
  const payload = await req.text();

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("[Clerk Webhook] Verification failed:", err.message);
    return NextResponse.json(
      {
        success: false,
        error: "Invalid webhook signature.",
      },
      { status: 400 }
    );
  }

  const eventType = evt.type;
  const data = evt.data;

  console.log(`[Clerk Webhook] Received verified event: ${eventType} for user ${data?.id}`);

  try {
    switch (eventType) {
      case "user.created":
      case "user.updated": {
        const primaryEmail =
          data.email_addresses?.find((e) => e.id === data.primary_email_address_id)
            ?.email_address ||
          data.email_addresses?.[0]?.email_address;

        if (!primaryEmail) {
          console.warn(`[Clerk Webhook] User ${data.id} has no email address. Skipping sync.`);
          return NextResponse.json({ success: true, warning: "No email address found" });
        }

        const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ").trim();

        await syncClerkUser({
          clerkUserId: data.id,
          email: primaryEmail,
          name: fullName || data.username || primaryEmail.split("@")[0],
          firstName: data.first_name,
          lastName: data.last_name,
          imageUrl: data.image_url,
        });

        break;
      }

      case "user.deleted": {
        if (data.id) {
          await deleteClerkUser(data.id);
        }
        break;
      }

      default:
        console.log(`[Clerk Webhook] Unhandled event type: ${eventType}`);
        break;
    }

    return NextResponse.json({
      success: true,
      received: eventType,
      userId: data?.id,
    });
  } catch (error) {
    console.error(`[Clerk Webhook] Error processing event ${eventType}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process webhook event.",
      },
      { status: 500 }
    );
  }
}
