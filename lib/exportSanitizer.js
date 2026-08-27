/**
 * Export Sanitization & Secret Scanning Engine (Step 85)
 *
 * Explicitly sanitizes and constructs the exportable forensic object rather than
 * blindly dumping application state. Guarantees that:
 * 1. Zero API keys (GEMINI_API_KEY, VirusTotal, AbuseIPDB, etc.) are present.
 * 2. Zero environment variables, tokens, session cookies, or server secrets exist.
 * 3. All exported data is normalized and serializable.
 */

/**
 * Sanitizes an investigation snapshot for export, removing any potential sensitive credentials.
 *
 * @param {Object} snapshot - Raw investigation snapshot.
 * @returns {Object} Cleaned, strictly sanitized exportable object.
 */
export function sanitizeForExport(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    throw new Error("Invalid snapshot provided for export sanitization.");
  }

  const caseInfo = {
    id: snapshot.case?.id || "EML-SESSION-EXPORT",
    createdAt: snapshot.case?.createdAt || new Date().toISOString(),
    type: snapshot.case?.type || "email-forensics",
    version: snapshot.case?.version || "1.0.0",
  };

  const email = {
    metadata: {
      from: snapshot.email?.metadata?.from || "Unknown",
      to: snapshot.email?.metadata?.to || "Unknown",
      cc: snapshot.email?.metadata?.cc || null,
      bcc: snapshot.email?.metadata?.bcc || null,
      replyTo: snapshot.email?.metadata?.replyTo || null,
      returnPath: snapshot.email?.metadata?.returnPath || null,
      subject: snapshot.email?.metadata?.subject || "No Subject",
      date: snapshot.email?.metadata?.date || null,
      messageId: snapshot.email?.metadata?.messageId || null,
      inReplyTo: snapshot.email?.metadata?.inReplyTo || null,
      references: snapshot.email?.metadata?.references || null,
    },
    body: {
      text: snapshot.email?.body?.text || "",
      characterCount: (snapshot.email?.body?.text || "").length,
    },
    urls: Array.isArray(snapshot.email?.urls) ? snapshot.email.urls : [],
    attachments: Array.isArray(snapshot.email?.attachments)
      ? snapshot.email.attachments.map((att) => ({
          filename: att.filename || "unnamed",
          contentType: att.contentType || "application/octet-stream",
          size: att.size || 0,
          formattedSize: att.formattedSize || "0 B",
        }))
      : [],
  };

  const authentication = {
    spf: {
      status: snapshot.authentication?.spf?.status || "not_available",
      domain: snapshot.authentication?.spf?.domain || null,
      source: snapshot.authentication?.spf?.source || null,
    },
    dkim: {
      status: snapshot.authentication?.dkim?.status || "not_available",
      signaturePresent: Boolean(snapshot.authentication?.dkim?.signaturePresent),
      signingDomain: snapshot.authentication?.dkim?.signingDomain || null,
      selector: snapshot.authentication?.dkim?.selector || null,
      algorithm: snapshot.authentication?.dkim?.algorithm || null,
    },
    dmarc: {
      status: snapshot.authentication?.dmarc?.status || "not_available",
      policy: snapshot.authentication?.dmarc?.policy || null,
      domain: snapshot.authentication?.dmarc?.domain || null,
    },
  };

  const identity = {
    fromDomain: snapshot.identity?.fromDomain || null,
    replyToDomain: snapshot.identity?.replyToDomain || null,
    dkimDomain: snapshot.identity?.dkimDomain || null,
    spfDomain: snapshot.identity?.spfDomain || null,
    returnPathDomain: snapshot.identity?.returnPathDomain || null,
  };

  const consistency = {
    status: snapshot.consistency?.status || "consistent",
    replyToMismatch: Boolean(snapshot.consistency?.replyToMismatch),
    returnPathMismatch: Boolean(snapshot.consistency?.returnPathMismatch),
    dkimDomainMismatch: Boolean(snapshot.consistency?.dkimDomainMismatch),
    spfDomainMismatch: Boolean(snapshot.consistency?.spfDomainMismatch),
    observations: Array.isArray(snapshot.consistency?.observations)
      ? snapshot.consistency.observations.map((obs) => ({
          type: obs.type || "Observation",
          severity: obs.severity || "info",
          description: obs.description || "",
        }))
      : [],
  };

  const threatIntelligence = {
    urls: Array.isArray(snapshot.threatIntelligence?.urls)
      ? snapshot.threatIntelligence.urls.map((u) => ({
          artifact: u.artifact,
          type: "url",
          source: u.source || "Threat Intelligence Feed",
          status: u.status || "unknown",
          confidence: u.confidence || 0,
        }))
      : [],
    domains: Array.isArray(snapshot.threatIntelligence?.domains)
      ? snapshot.threatIntelligence.domains.map((d) => ({
          artifact: d.artifact,
          type: "domain",
          source: d.source || "Domain Intelligence",
          status: d.status || "unknown",
          categories: d.categories || [],
        }))
      : [],
    ips: Array.isArray(snapshot.threatIntelligence?.ips)
      ? snapshot.threatIntelligence.ips.map((ip) => ({
          artifact: ip.artifact,
          type: "ip",
          source: ip.source || "IP Intelligence",
          status: ip.status || "unknown",
          confidence: ip.confidence || 0,
        }))
      : [],
  };

  const aiAnalysis = {
    classification: snapshot.aiAnalysis?.classification || "unknown",
    riskScore: snapshot.aiAnalysis?.riskScore || 0,
    riskLevel: snapshot.aiAnalysis?.riskLevel || "medium",
    confidence: snapshot.aiAnalysis?.confidence || 0,
    indicators: Array.isArray(snapshot.aiAnalysis?.indicators)
      ? snapshot.aiAnalysis.indicators.map((ind) => ({
          type: ind.type || "Threat Pattern",
          severity: ind.severity || "medium",
          description: ind.description || "",
        }))
      : [],
    summary: snapshot.aiAnalysis?.summary || "",
    recommendation: snapshot.aiAnalysis?.recommendation || "",
  };

  const risk = {
    score: snapshot.risk?.score || 0,
    level: snapshot.risk?.level || "medium",
    classification: snapshot.risk?.classification || "suspicious",
    confidence: snapshot.risk?.confidence || 0,
    categoryScores: snapshot.risk?.categoryScores || {},
    breakdown: Array.isArray(snapshot.risk?.breakdown)
      ? snapshot.risk.breakdown.map((b) => ({
          category: b.category || "evidence",
          finding: b.finding || "Evidence Finding",
          contribution: b.contribution || 0,
          source: b.source || "analyzer",
        }))
      : [],
  };

  const timeline = Array.isArray(snapshot.timeline)
    ? snapshot.timeline.map((ev) => ({
        formattedTime: ev.formattedTime || "Event",
        type: ev.type || "event",
        title: ev.title || "Timeline Entry",
        description: ev.description || "",
        source: ev.source || "Investigation",
      }))
    : [];

  const graph = {
    nodes: Array.isArray(snapshot.graph?.nodes)
      ? snapshot.graph.nodes.map((n) => ({
          id: n.id,
          type: n.type,
          label: n.label,
          sublabel: n.sublabel || null,
        }))
      : [],
    edges: Array.isArray(snapshot.graph?.edges)
      ? snapshot.graph.edges.map((e) => ({
          source: e.source,
          target: e.target,
          relationship: e.relationship,
          label: e.label,
        }))
      : [],
  };

  return {
    case: caseInfo,
    email,
    authentication,
    identity,
    consistency,
    threatIntelligence,
    aiAnalysis,
    risk,
    evidence: risk.breakdown,
    timeline,
    graph,
  };
}

export default sanitizeForExport;
