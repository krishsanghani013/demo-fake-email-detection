/**
 * Investigation Data Snapshot (Step 34)
 *
 * Combines all completed forensic analysis results into a single, normalized,
 * deterministic snapshot object that serves as the single source of truth
 * for JSON evidence export, Web Forensic Report, and PDF generation.
 */

import { generateEvidenceTimeline } from "./evidenceTimeline.js";
import { generateEvidenceGraph } from "./evidenceGraph.js";

/**
 * Generates a local, privacy-safe Case ID (e.g., EML-20260827-7A8B9C).
 *
 * @returns {string} Unique case identifier.
 */
export function generateCaseId() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EML-${dateStr}-${randomSuffix}`;
}

/**
 * Builds the complete normalized investigation snapshot object from existing analysis data.
 *
 * @param {Object} result - Complete analysis result object.
 * @returns {Object} Clean, normalized snapshot data structure.
 */
export function createInvestigationSnapshot(result) {
  if (!result) return null;

  const caseId = result.caseId || generateCaseId();
  const snapshotTimestamp = new Date().toISOString();

  const metadata = result.metadata || {};
  const body = result.body || { text: "" };
  const urls = Array.isArray(result.urls) ? result.urls : [];
  const attachments = Array.isArray(result.attachments) ? result.attachments : [];
  const artifacts = result.artifacts || {
    urls: [],
    ips: [],
    domains: [],
  };

  const authentication = result.authentication || {
    spf: { status: "not_available" },
    dkim: { status: "not_available" },
    dmarc: { status: "not_available" },
  };

  const identity = result.identity || {};
  const consistency = result.consistency || { observations: [] };
  const threatIntel = result.threatIntel || { urls: [], domains: [], ips: [], evidence: [] };

  const aiAnalysis = {
    classification: result.aiClassification || result.classification || "unknown",
    riskLevel: result.riskLevel || "medium",
    riskScore: typeof result.aiRiskScore === "number" ? result.aiRiskScore : result.riskScore || 0,
    confidence: result.confidence || 0,
    indicators: Array.isArray(result.indicators) ? result.indicators : [],
    summary: result.summary || "",
    recommendation: result.recommendation || "",
  };

  const risk = {
    score: result.riskScore || 0,
    level: result.riskLevel || "medium",
    classification: result.classification || "suspicious",
    confidence: result.confidence || 0,
    categoryScores: result.categoryScores || {},
    breakdown: Array.isArray(result.breakdown) ? result.breakdown : [],
  };

  // Compile timeline from existing data
  const timeline = generateEvidenceTimeline({
    metadata,
    artifacts,
    authentication,
    threatIntel,
    aiResult: aiAnalysis,
    riskData: risk,
  });

  // Compile graph representation from existing data
  const graph = generateEvidenceGraph({
    metadata,
    artifacts,
    authentication,
    threatIntel,
    aiResult: aiAnalysis,
    riskData: risk,
  });

  return {
    case: {
      id: caseId,
      createdAt: snapshotTimestamp,
      type: "email-forensics",
      version: "1.0.0",
      environment: "local-client",
    },
    email: {
      metadata: {
        from: metadata.from || "Unknown",
        to: metadata.to || "Unknown",
        cc: metadata.cc || null,
        bcc: metadata.bcc || null,
        replyTo: metadata.replyTo || null,
        returnPath: metadata.returnPath || null,
        subject: metadata.subject || "No Subject",
        date: metadata.date || null,
        messageId: metadata.messageId || null,
        inReplyTo: metadata.inReplyTo || null,
        references: metadata.references || null,
      },
      body: {
        text: body.text || "",
        characterCount: (body.text || "").length,
      },
      urls,
      attachments,
    },
    authentication: {
      spf: authentication.spf || {},
      dkim: authentication.dkim || {},
      dmarc: authentication.dmarc || {},
    },
    identity: {
      fromDomain: identity.fromDomain || null,
      replyToDomain: identity.replyToDomain || null,
      dkimDomain: identity.dkimDomain || null,
      spfDomain: identity.spfDomain || null,
      returnPathDomain: identity.returnPathDomain || null,
    },
    consistency: {
      status: consistency.status || "consistent",
      replyToMismatch: Boolean(consistency.replyToMismatch),
      returnPathMismatch: Boolean(consistency.returnPathMismatch),
      dkimDomainMismatch: Boolean(consistency.dkimDomainMismatch),
      spfDomainMismatch: Boolean(consistency.spfDomainMismatch),
      observations: consistency.observations || [],
    },
    threatIntelligence: {
      urls: threatIntel.urls || [],
      domains: threatIntel.domains || [],
      ips: threatIntel.ips || [],
      evidence: threatIntel.evidence || [],
    },
    aiAnalysis,
    risk,
    evidence: risk.breakdown || [],
    timeline,
    graph,
  };
}

export default createInvestigationSnapshot;
