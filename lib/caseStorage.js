/**
 * Case Storage & Local History Utility
 *
 * Persists analyzed email cases to localStorage without external databases.
 * Allows viewing previous cases on the Dashboard and Investigations page
 * with ZERO additional Gemini or external network requests.
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
 * Saves or updates an investigation case in localStorage.
 *
 * @param {Object} investigation - The normalized investigation case or analysis result.
 * @returns {Array<Object>} Updated list of cases.
 */
export function saveCaseToStorage(investigation) {
  if (typeof window === "undefined" || !investigation) return [];
  try {
    const existing = getStoredCases();
    const caseId =
      investigation.case?.id || investigation.caseId || `EML-${Date.now().toString(36).toUpperCase()}`;

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
    return updated;
  } catch (err) {
    console.error("Error saving case to localStorage:", err);
    return [];
  }
}

/**
 * Retrieves a single case by its Case ID.
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
        fullResult: null,
      },
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSeed));
  } catch (err) {
    console.error("Error seeding default cases:", err);
  }
}
