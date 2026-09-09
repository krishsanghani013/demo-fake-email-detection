"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Quota Configuration Constants
 */
export const QUOTA_LIMIT = 20; // 20 AI analyses per 12-hour window
export const QUOTA_RESET_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours in ms
export const QUOTA_STORAGE_KEY = "email_forensics_ai_quota";
const QUOTA_EVENT_NAME = "email_forensics_quota_updated";

/**
 * Formats milliseconds remaining into a readable string (e.g. "11h 45m", "35m", "< 1m").
 *
 * @param {number} ms - Milliseconds until reset.
 * @returns {string} Formatted human-readable string.
 */
export function formatTimeRemaining(ms) {
  if (ms <= 0) return "0m";
  const totalSeconds = Math.floor(ms / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return "< 1m";
}

/**
 * Retrieves the current quota status from localStorage.
 * Automatically detects if 12+ or 24+ hours have elapsed and resets quota to 0.
 *
 * @returns {Object} Quota information object.
 */
export function getQuota() {
  if (typeof window === "undefined") {
    return {
      used: 0,
      limit: QUOTA_LIMIT,
      remaining: QUOTA_LIMIT,
      percentage: 0,
      windowStartTime: Date.now(),
      resetAt: Date.now() + QUOTA_RESET_INTERVAL_MS,
      msUntilReset: QUOTA_RESET_INTERVAL_MS,
      formattedTimeRemaining: "12h 0m",
      isExhausted: false,
    };
  }

  const now = Date.now();
  let data = null;

  try {
    const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (raw) {
      data = JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Failed to parse AI quota storage:", err);
  }

  // Initialize fresh record if not found or corrupted
  if (!data || typeof data.used !== "number" || !data.resetAt) {
    data = {
      used: 0,
      limit: QUOTA_LIMIT,
      windowStartTime: now,
      resetAt: now + QUOTA_RESET_INTERVAL_MS,
      lastReset: now,
    };
    try {
      localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // ignore storage errors
    }
  }

  // Check if 12 hours (or 24+ hours) have passed since the window started or resetAt was reached
  if (now >= data.resetAt || now - (data.windowStartTime || 0) >= QUOTA_RESET_INTERVAL_MS) {
    // Quota expired -> Reset used to 0 and establish new 12-hour window
    data.used = 0;
    data.limit = QUOTA_LIMIT;
    data.windowStartTime = now;
    data.resetAt = now + QUOTA_RESET_INTERVAL_MS;
    data.lastReset = now;

    try {
      localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent(QUOTA_EVENT_NAME, { detail: data }));
    } catch (e) {
      // ignore
    }
  }

  const used = Math.min(Math.max(0, data.used), data.limit || QUOTA_LIMIT);
  const limit = data.limit || QUOTA_LIMIT;
  const remaining = Math.max(0, limit - used);
  const percentage = Math.min(100, Math.round((used / limit) * 100));
  const msUntilReset = Math.max(0, data.resetAt - now);
  const formattedTimeRemaining = formatTimeRemaining(msUntilReset);
  const isExhausted = used >= limit;

  return {
    used,
    limit,
    remaining,
    percentage,
    windowStartTime: data.windowStartTime,
    resetAt: data.resetAt,
    msUntilReset,
    formattedTimeRemaining,
    isExhausted,
  };
}

/**
 * Increments quota usage by a given amount (default 1).
 *
 * @param {number} [amount=1]
 * @returns {Object} Updated quota status.
 */
export function consumeQuota(amount = 1) {
  if (typeof window === "undefined") return getQuota();

  const current = getQuota();
  const now = Date.now();
  const newUsed = Math.min(current.limit, current.used + amount);

  const updatedData = {
    used: newUsed,
    limit: current.limit,
    windowStartTime: current.windowStartTime || now,
    resetAt: current.resetAt || now + QUOTA_RESET_INTERVAL_MS,
    lastReset: current.windowStartTime || now,
  };

  try {
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(updatedData));
    window.dispatchEvent(new CustomEvent(QUOTA_EVENT_NAME, { detail: updatedData }));
  } catch (err) {
    console.error("Error saving updated AI quota:", err);
  }

  return getQuota();
}

/**
 * Manually resets the AI quota to 0 used and restarts the 12-hour window.
 *
 * @returns {Object} Fresh quota status.
 */
export function resetQuotaManually() {
  if (typeof window === "undefined") return getQuota();

  const now = Date.now();
  const freshData = {
    used: 0,
    limit: QUOTA_LIMIT,
    windowStartTime: now,
    resetAt: now + QUOTA_RESET_INTERVAL_MS,
    lastReset: now,
  };

  try {
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(freshData));
    window.dispatchEvent(new CustomEvent(QUOTA_EVENT_NAME, { detail: freshData }));
  } catch (err) {
    console.error("Error manually resetting AI quota:", err);
  }

  return getQuota();
}

/**
 * React hook to subscribe to dynamic AI quota updates and countdown timers.
 *
 * @returns {Object} Quota state with live timer and helper methods.
 */
export function useQuota() {
  const [quota, setQuota] = useState(() => ({
    used: 0,
    limit: QUOTA_LIMIT,
    remaining: QUOTA_LIMIT,
    percentage: 0,
    windowStartTime: Date.now(),
    resetAt: Date.now() + QUOTA_RESET_INTERVAL_MS,
    msUntilReset: QUOTA_RESET_INTERVAL_MS,
    formattedTimeRemaining: "12h 0m",
    isExhausted: false,
    mounted: false,
  }));

  const refreshQuota = useCallback(() => {
    const live = getQuota();
    setQuota({ ...live, mounted: true });
  }, []);

  useEffect(() => {
    // Initial fetch once mounted on client (deferred to avoid synchronous render cascade)
    const initTimer = setTimeout(() => {
      refreshQuota();
    }, 0);

    // Listen for custom quota updates across app components
    const handleCustomUpdate = () => refreshQuota();
    window.addEventListener(QUOTA_EVENT_NAME, handleCustomUpdate);

    // Listen for storage events across other browser tabs
    const handleStorage = (e) => {
      if (e.key === QUOTA_STORAGE_KEY) {
        refreshQuota();
      }
    };
    window.addEventListener("storage", handleStorage);

    // Periodic interval to update remaining countdown timer and auto-reset when expired
    const interval = setInterval(() => {
      refreshQuota();
    }, 15000); // Check every 15s

    return () => {
      clearTimeout(initTimer);
      window.removeEventListener(QUOTA_EVENT_NAME, handleCustomUpdate);
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, [refreshQuota]);

  return {
    ...quota,
    consume: consumeQuota,
    reset: resetQuotaManually,
    refresh: refreshQuota,
  };
}
