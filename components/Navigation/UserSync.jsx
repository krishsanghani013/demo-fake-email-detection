"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";

/**
 * UserSync Component
 *
 * Automatically triggers server-side Just-In-Time synchronization when a user is signed in.
 * Ensures the PostgreSQL database record exists immediately upon login,
 * providing a seamless experience in local development environments where webhooks aren't connected to localhost.
 */
export default function UserSync() {
  const { isSignedIn, user } = useUser();
  const syncedRef = useRef(null);

  useEffect(() => {
    if (isSignedIn && user?.id && syncedRef.current !== user.id) {
      syncedRef.current = user.id;
      fetch("/api/auth/sync", { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (data?.success) {
            console.log("[UserSync] Synchronized user with database:", data.user?.email);
          }
        })
        .catch((err) => {
          console.warn("[UserSync] Auto-sync attempt failed:", err.message);
        });
    }
  }, [isSignedIn, user?.id]);

  return null;
}
