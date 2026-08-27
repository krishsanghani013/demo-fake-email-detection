/**
 * Evidence Timeline Generator (Steps 75 & 76)
 *
 * Normalizes chronological events and evidence extracted from the email
 * without inventing timestamps or synthesizing non-existent data.
 */

/**
 * Safely parses and formats a date string.
 *
 * @param {string|Date} dateStr - Date representation.
 * @returns {{ iso: string, formatted: string } | null}
 */
function parseDateSafely(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return {
      iso: d.toISOString(),
      formatted: d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }),
    };
  } catch {
    return null;
  }
}

/**
 * Generates an ordered timeline of forensic investigation events.
 *
 * @param {Object} params
 * @param {Object} [params.metadata] - Email metadata (Date, From, To, Subject, Message-ID).
 * @param {Object} [params.artifacts] - Discovered artifacts (urls, ips, domains).
 * @param {Object} [params.authentication] - SPF, DKIM, DMARC reported evidence.
 * @param {Object} [params.threatIntel] - Threat intelligence lookups.
 * @param {Object} [params.aiResult] - AI content indicators.
 * @param {Object} [params.riskData] - Unified risk score and classification.
 * @returns {Array<{
 *   id: string,
 *   timestamp: string|null,
 *   formattedTime: string,
 *   type: "email"|"received"|"authentication"|"url"|"ip"|"threat-intelligence"|"ai"|"risk",
 *   title: string,
 *   description: string,
 *   source: string,
 *   severity?: "low"|"medium"|"high"|"critical"|"info"
 * }>} Chronologically structured timeline events.
 */
export function generateEvidenceTimeline({
  metadata: rawMeta,
  artifacts: rawArt,
  authentication: rawAuth,
  threatIntel: rawTi,
  aiResult: rawAi,
  riskData: rawRisk,
} = {}) {
  const metadata = rawMeta || {};
  const artifacts = rawArt || {};
  const authentication = rawAuth || {};
  const threatIntel = rawTi || {};
  const aiResult = rawAi || {};
  const riskData = rawRisk || {};

  const events = [];

  // 1. Email Composition / Transmission Date
  const parsedEmailDate = parseDateSafely(metadata.date);
  if (metadata.from || metadata.subject) {
    events.push({
      id: "ev-email-sent",
      timestamp: parsedEmailDate?.iso || null,
      formattedTime: parsedEmailDate?.formatted || "Header Date Recorded",
      type: "email",
      title: "Email Transmitted by Sender",
      description: `Subject: "${metadata.subject || "No Subject"}" from ${metadata.from || "Unknown Sender"}`,
      source: "RFC 5322 Headers",
      severity: "info",
    });
  }

  // 2. Received Header Hops (preserves hop transmission chain)
  const ips = Array.isArray(artifacts.ips) ? artifacts.ips : [];
  ips.forEach((ipArt) => {
    events.push({
      id: `ev-hop-${ipArt.hopIndex || events.length}`,
      timestamp: null,
      formattedTime: ipArt.source || "Transmission Relay",
      type: "received",
      title: `Mail Relay Hop #${ipArt.hopIndex || "?"}`,
      description: `Relayed through IP ${ipArt.ip} (${ipArt.type} network)`,
      source: "Received Headers",
      severity: "info",
    });
  });

  // 3. Technical Email Authentication
  const spf = authentication.spf;
  const dkim = authentication.dkim;
  const dmarc = authentication.dmarc;

  if (spf && spf.status && spf.status !== "not_available") {
    const isFail = spf.status === "fail" || spf.status === "permerror";
    events.push({
      id: "ev-auth-spf",
      timestamp: null,
      formattedTime: "Inbound Verification",
      type: "authentication",
      title: `SPF Validation: ${String(spf.status).toUpperCase()}`,
      description: `Reported by ${spf.source || "Mail Server"}${spf.domain ? ` for domain ${spf.domain}` : ""}`,
      source: "Authentication-Results / Received-SPF",
      severity: isFail ? "high" : "info",
    });
  }

  if (dkim && dkim.status && dkim.status !== "not_available") {
    const isFail = dkim.status === "fail" || dkim.status === "permerror";
    events.push({
      id: "ev-auth-dkim",
      timestamp: null,
      formattedTime: "Inbound Verification",
      type: "authentication",
      title: `DKIM Validation: ${String(dkim.status).toUpperCase()}`,
      description: `Signed by ${dkim.signingDomain || "Domain"}${dkim.selector ? ` (s=${dkim.selector})` : ""}`,
      source: "DKIM-Signature",
      severity: isFail ? "high" : "info",
    });
  }

  if (dmarc && dmarc.status && dmarc.status !== "not_available") {
    const isFail = dmarc.status === "fail" || dmarc.status === "permerror";
    events.push({
      id: "ev-auth-dmarc",
      timestamp: null,
      formattedTime: "Inbound Verification",
      type: "authentication",
      title: `DMARC Policy Evaluation: ${String(dmarc.status).toUpperCase()}`,
      description: `Reported DMARC validation${dmarc.policy ? ` (policy=${dmarc.policy})` : ""}`,
      source: "Authentication-Results",
      severity: isFail ? "critical" : "info",
    });
  }

  // 4. Extracted Artifacts & URL Discoveries
  const urls = Array.isArray(artifacts.urls) ? artifacts.urls : [];
  urls.forEach((urlArt, idx) => {
    const hasLocalObs = urlArt.localObservations && urlArt.localObservations.length > 0;
    events.push({
      id: `ev-url-${idx}`,
      timestamp: null,
      formattedTime: "Artifact Extraction",
      type: "url",
      title: `Discovered Embedded URL (#${idx + 1})`,
      description: `${urlArt.normalized} (${urlArt.rootDomain || urlArt.hostname})`,
      source: "Body Content Extractor",
      severity: hasLocalObs ? "medium" : "info",
    });
  });

  // 5. Threat Intelligence Lookups
  const tiUrls = Array.isArray(threatIntel.urls) ? threatIntel.urls : [];
  tiUrls.forEach((ti, idx) => {
    if (ti.status === "malicious" || ti.status === "suspicious") {
      events.push({
        id: `ev-ti-url-${idx}`,
        timestamp: null,
        formattedTime: "Threat Intelligence Query",
        type: "threat-intelligence",
        title: `Threat Intel: URL Flagged as ${ti.status.toUpperCase()}`,
        description: `${ti.artifact} reported in ${ti.source} database`,
        source: ti.source || "Threat Intelligence Feed",
        severity: ti.status === "malicious" ? "critical" : "high",
      });
    }
  });

  // 6. AI Content & Phishing Assessment
  const indicators = Array.isArray(aiResult.indicators) ? aiResult.indicators : [];
  if (indicators.length > 0 || aiResult.summary) {
    events.push({
      id: "ev-ai-analysis",
      timestamp: null,
      formattedTime: "AI Forensic Inspection",
      type: "ai",
      title: "Content & Social Engineering Analysis Completed",
      description: `Identified ${indicators.length} threat indicator(s): ${indicators.map((i) => i.type).join(", ") || "Pattern assessment"}`,
      source: "AI Content Engine",
      severity: indicators.some((i) => i.severity === "critical" || i.severity === "high") ? "high" : "info",
    });
  }

  // 7. Unified Risk Verdict
  if (typeof riskData.riskScore === "number") {
    events.push({
      id: "ev-risk-verdict",
      timestamp: null,
      formattedTime: "Forensic Synthesis",
      type: "risk",
      title: `Final Assessment: ${String(riskData.classification || "Evaluated").toUpperCase()}`,
      description: `Unified Forensic Risk Score: ${riskData.riskScore}/100 (${String(riskData.riskLevel || "").toUpperCase()}) • Confidence: ${riskData.confidence || 0}%`,
      source: "Unified Risk Engine",
      severity: riskData.riskLevel === "critical" ? "critical" : riskData.riskLevel === "high" ? "high" : "info",
    });
  }

  return events;
}

export default generateEvidenceTimeline;
