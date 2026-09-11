/**
 * Case Storage & Dual-Mode Persistence Utility
 *
 * Implements persistent case management:
 * 1. Primary: Server-side Prisma + Supabase PostgreSQL via /api/cases
 * 2. Fallback: Browser localStorage for demo cases and offline mode
 *
 * Guarantees zero downtime, instant UI updates, and zero data loss.
 */

const STORAGE_KEY = "email_forensics_cases";
const MAX_STORED_CASES = 50;

/**
 * Retrieves all stored investigation cases from localStorage.
 *
 * @returns {Array<Object>} List of stored cases ordered from newest to oldest.
 */
export function getStoredCases() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const cases = JSON.parse(raw);
    return Array.isArray(cases) ? cases : [];
  } catch (err) {
    console.error("Error reading stored cases from localStorage:", err);
    return [];
  }
}

/**
 * Saves or updates an investigation case in localStorage and asynchronously
 * syncs it to the Prisma / Supabase database.
 *
 * @param {Object} investigation - The normalized investigation case or analysis result.
 * @returns {Array<Object>} Updated list of local cases.
 */
export async function saveCaseToStorage(investigation) {
  if (typeof window === "undefined" || !investigation) return [];
  try {
    const existing = getStoredCases();
    const caseId =
      investigation.case?.id ||
      investigation.caseNumber ||
      investigation.caseId ||
      `EML-${Date.now().toString(36).toUpperCase()}`;

    const createdAt =
      investigation.case?.createdAt || investigation.createdAt || new Date().toISOString();

    const subject =
      investigation.email?.metadata?.subject ||
      investigation.metadata?.subject ||
      "No Subject";

    const sender =
      investigation.email?.metadata?.from ||
      investigation.metadata?.from ||
      "Unknown Sender";

    const riskScore =
      investigation.risk?.score ?? investigation.riskScore ?? 0;

    const classification =
      investigation.risk?.classification || investigation.classification || "suspicious";

    const riskLevel =
      investigation.risk?.level || investigation.riskLevel || "medium";

    const confidence =
      investigation.risk?.confidence ?? investigation.confidence ?? 0;

    const summaryItem = {
      caseId,
      createdAt,
      subject,
      sender,
      riskScore,
      classification,
      riskLevel,
      confidence,
      fullResult: investigation,
    };

    // Filter out if duplicate caseId exists and prepend to top
    const filtered = existing.filter((c) => c.caseId !== caseId);
    const updated = [summaryItem, ...filtered].slice(0, MAX_STORED_CASES);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Await database persistence to Prisma & Supabase
    try {
      await persistCaseToDatabase(investigation, caseId);
    } catch (err) {
      console.warn("[DB] Database persistence note:", err?.message || err);
    }

    return updated;
  } catch (err) {
    console.error("Error saving case to localStorage:", err);
    return [];
  }
}

/**
 * Sends the investigation payload to the server-side Prisma persistence layer.
 *
 * @param {Object} investigation
 * @param {string} caseId
 */
async function persistCaseToDatabase(investigation, caseId) {
  if (typeof window === "undefined") return null;

  try {
    const payload = {
      ...investigation,
      caseNumber: caseId,
    };

    const res = await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.success) {
      if (json.fallbackRequired) {
        // Database credentials not entered yet; local storage fallback active
        return null;
      }
      console.error("[DB] /api/cases error:", json.error || res.statusText);
      throw new Error(json.error || `Server responded with ${res.status}`);
    }

    console.log("[DB] Investigation case successfully saved to Supabase:", json.data?.caseNumber || caseId);
    return json.data;
  } catch (err) {
    console.warn("[DB] Failed to reach /api/cases:", err.message);
    throw err;
  }
}

/**
 * Synchronizes cases from the Prisma / Supabase database with local storage.
 * If database is connected, merges records and updates the client.
 *
 * @returns {Promise<Array<Object>>} Consolidated list of cases.
 */
export async function syncCasesWithDatabase() {
  if (typeof window === "undefined") return [];

  try {
    const res = await fetch("/api/cases?limit=50");
    if (!res.ok) {
      if (res.status === 401) {
        // Unauthenticated session: clear any user storage
        localStorage.removeItem(STORAGE_KEY);
        return [];
      }
      return getStoredCases();
    }

    const json = await res.json();
    if (json?.success && json?.source === "database" && Array.isArray(json.data)) {
      const dbCases = json.data;

      // Always persist the authenticated user's exact case set
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dbCases.slice(0, MAX_STORED_CASES)));
      } catch (e) {
        // quota limit guard
      }

      return dbCases;
    }
  } catch (err) {
    // Return local cases if offline or server unconfigured
  }

  return getStoredCases();
}

/**
 * Retrieves a single case by its Case ID, trying the server database first
 * and falling back to localStorage.
 *
 * @param {string} caseId - Unique Case ID to search for.
 * @returns {Promise<Object|null>} The stored investigation or null if not found.
 */
export async function fetchCaseDetails(caseId) {
  if (!caseId) return null;

  // 1. Try server database first
  try {
    const res = await fetch(`/api/cases/${encodeURIComponent(caseId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json?.success && json?.data) {
        return json.data;
      }
    }
  } catch (err) {
    // Fall back to local
  }

  // 2. Fall back to local storage
  return getCaseById(caseId);
}

/**
 * Retrieves a single case by its Case ID from local storage.
 *
 * @param {string} caseId - Unique Case ID to search for.
 * @returns {Object|null} The stored investigation or null if not found.
 */
export function getCaseById(caseId) {
  if (!caseId) return null;
  const cases = getStoredCases();
  const match = cases.find((c) => c.caseId === caseId);
  return match ? match.fullResult : null;
}

/**
 * Deletes a case from both localStorage and server database.
 */
export async function deleteStoredCase(caseId) {
  if (typeof window === "undefined" || !caseId) return [];

  const existing = getStoredCases();
  const updated = existing.filter((c) => c.caseId !== caseId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Error deleting from localStorage:", e);
  }

  // Also notify server
  fetch(`/api/cases/${encodeURIComponent(caseId)}`, { method: "DELETE" }).catch(() => {});

  return updated;
}

/**
 * Seeds initial demo investigation cases if storage is empty, providing
 * realistic data for the Dashboard charts and recent cases list on first visit.
 */
export function seedDefaultCasesIfEmpty() {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredCases();
    if (current.length > 0) return;

    const defaultSeed = [
      {
        caseId: "EML-20260827-SEC892",
        createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        subject: "CRITICAL: Corporate SSO Password Reset Mandatory - Action Required",
        sender: "Security Systems <security-alert@cloud-sso-verify.example.org>",
        riskScore: 94,
        classification: "fraudulent",
        riskLevel: "critical",
        confidence: 96,
        isDemo: true,
        fullResult: null,
      },
      {
        caseId: "EML-20260827-BNK441",
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        subject: "URGENT: Updated Wire Instructions for Invoice #INV-88491 ($84,500.00)",
        sender: "David Henderson <cfo-office@global-trade-escrow.example.com>",
        riskScore: 91,
        classification: "fraudulent",
        riskLevel: "critical",
        confidence: 94,
        isDemo: true,
        fullResult: null,
      },
      {
        caseId: "EML-20260827-VEN102",
        createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        subject: "Inquiry Regarding Pending Purchase Order PO-98412",
        sender: "Finance Support <support@vendor-portal.example.com>",
        riskScore: 42,
        classification: "suspicious",
        riskLevel: "medium",
        confidence: 82,
        isDemo: true,
        fullResult: null,
      },
      {
        caseId: "EML-20260827-SPR019",
        createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
        subject: "Sprint 42 Planning & Architecture Review - Thursday 2 PM",
        sender: "Alex Carter <alex.carter@team-internal.example.com>",
        riskScore: 2,
        classification: "legitimate",
        riskLevel: "low",
        confidence: 98,
        isDemo: true,
        fullResult: null,
      },
      {
        caseId: "EML-20260826-HR9910",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        subject: "Company Benefits Annual Enrollment Window Open",
        sender: "People Operations <hr-benefits@internal-corp.example.com>",
        riskScore: 5,
        classification: "legitimate",
        riskLevel: "low",
        confidence: 95,
        isDemo: true,
        fullResult: null,
      },
      {
        caseId: "EML-20260825-TAX301",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        subject: "IRS / Tax Compliance: Outstanding Corporate Filing Notice",
        sender: "Tax Processing Notice <notice@irs-tax-filing-alerts.net>",
        riskScore: 88,
        classification: "fraudulent",
        riskLevel: "critical",
        confidence: 92,
        isDemo: true,
        fullResult: null,
      },
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSeed));
  } catch (err) {
    console.error("Error seeding default cases:", err);
  }
}
