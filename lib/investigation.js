/**
 * Investigation Data Model & Case Identifier Engine (Step 73)
 *
 * Normalizes all analysis outputs into a single cohesive investigation case model:
 * - Case Metadata (Local Case ID: EML-YYYYMMDD-XXXXXX, ISO Analysis Timestamp)
 * - Email Metadata, URLs, and Attachments
 * - Authentication & Consistency Posture
 * - Artifacts & Threat Intelligence Results
 * - AI Content Assessment
 * - Unified Forensic Risk & Itemized Breakdown
 * - Chronological Timeline
 * - Relationship Graph
 */

import { generateEvidenceTimeline } from "./evidenceTimeline.js";
import { generateEvidenceGraph } from "./evidenceGraph.js";

/**
 * Generates a unique, privacy-safe local Case ID (e.g., EML-20260827-A1B2C3).
 *
 * @returns {string} Unique investigation case identifier.
 */
export function generateCaseId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const randHex = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EML-${year}${month}${day}-${randHex}`;
}

/**
 * Creates a normalized investigation case model from active forensic analysis results.
 *
 * @param {Object} result - Analysis output containing metadata, auth, threat intel, AI, and risk.
 * @returns {Object} Comprehensive normalized investigation case object.
 */
export function createInvestigation(result = {}) {
  const nowIso = new Date().toISOString();
  const caseId = result.caseId || generateCaseId();

  const metadata = result.metadata || {};
  const authentication = result.authentication || {};
  const identity = result.identity || {};
  const consistency = result.consistency || {};
  const threatIntel = result.threatIntel || {};
  const artifacts = result.artifacts || {};
  const breakdown = Array.isArray(result.breakdown) ? result.breakdown : [];
  const categoryScores = result.categoryScores || {};

  // Build timeline and relationship graph from actual forensic evidence
  const timeline = generateEvidenceTimeline({
    metadata,
    artifacts,
    authentication,
    threatIntel,
    aiResult: {
      indicators: result.indicators || [],
      summary: result.summary || "",
    },
    riskData: {
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      classification: result.classification,
      confidence: result.confidence,
    },
  });

  const graph = generateEvidenceGraph({
    metadata,
    artifacts,
    authentication,
    threatIntel,
    aiResult: {
      indicators: result.indicators || [],
      summary: result.summary || "",
    },
    riskData: {
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      classification: result.classification,
    },
  });

  return {
    case: {
      id: caseId,
      createdAt: result.createdAt || nowIso,
      type: "email-forensics",
      version: "1.0.0",
    },
    email: {
      metadata: {
        from: metadata.from || null,
        to: metadata.to || null,
        cc: metadata.cc || null,
        bcc: metadata.bcc || null,
        replyTo: metadata.replyTo || null,
        returnPath: metadata.returnPath || null,
        subject: metadata.subject || null,
        date: metadata.date || null,
        messageId: metadata.messageId || null,
      },
      urls: result.urls || artifacts?.urls?.map((u) => u.normalized || u.original) || [],
      attachments: result.attachments || [],
    },
    authentication,
    identity,
    consistency,
    artifacts,
    threatIntelligence: threatIntel,
    aiAnalysis: {
      classification: result.aiClassification || result.classification,
      riskScore: result.aiRiskScore || result.riskScore,
      riskLevel: result.riskLevel,
      confidence: result.confidence,
      indicators: result.indicators || [],
      summary: result.summary || "",
      recommendation: result.recommendation || "",
    },
    risk: {
      score: result.riskScore,
      level: result.riskLevel,
      classification: result.classification,
      confidence: result.confidence,
      categoryScores,
      breakdown,
    },
    evidence: breakdown,
    timeline,
    graph,
  };
}

export default createInvestigation;
