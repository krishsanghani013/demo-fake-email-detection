/**
 * Unified Forensic Risk Engine & Explainable Scoring (Steps 61–72)
 *
 * Deterministic local risk engine combining independent evidence sources:
 * 1. AI Content Analysis (phishing, social engineering, credential harvesting, impersonation) (Max: 30 pts)
 * 2. Technical Authentication (SPF, DKIM, DMARC) (Max: 25 pts)
 * 3. Identity & Sender Consistency (Reply-To, Return-Path, DKIM/SPF alignment) (Max: 15 pts)
 * 4. Threat Intelligence & Artifacts (URLhaus, AbuseIPDB, local URL/domain/IP signals) (Max: 30 pts)
 *
 * Total Score: 0–100.
 * Deterministic, local, synchronous, zero extra network/Gemini calls.
 */

/**
 * Category budget weights (Total: 100 points).
 */
export const CATEGORY_WEIGHTS = {
  ai: 30,
  authentication: 25,
  identity: 15,
  threatIntelligence: 30,
};

/**
 * Risk severity level mapping thresholds (Step 69).
 */
export const RISK_THRESHOLDS = {
  LOW_MAX: 24,
  MEDIUM_MAX: 49,
  HIGH_MAX: 74,
};

/**
 * Maps a numeric risk score (0-100) to a standard risk level (Step 69).
 *
 * @param {number} score - Clamped integer score between 0 and 100.
 * @returns {"low"|"medium"|"high"|"critical"}
 */
export function mapScoreToRiskLevel(score) {
  if (score <= RISK_THRESHOLDS.LOW_MAX) return "low";
  if (score <= RISK_THRESHOLDS.MEDIUM_MAX) return "medium";
  if (score <= RISK_THRESHOLDS.HIGH_MAX) return "high";
  return "critical";
}

/**
 * Evaluates AI Content Analysis evidence (Step 63, Max: 30 points).
 *
 * @param {Object} aiResult - Output from Gemini or forensic analysis.
 * @returns {{ score: number, items: Array<Object> }}
 */
function evaluateAiEvidence(aiResult) {
  if (!aiResult) return { score: 0, items: [] };

  const items = [];
  const indicators = Array.isArray(aiResult.indicators) ? aiResult.indicators : [];
  const rawRiskScore = Number(aiResult.riskScore) || 0;

  let calculatedScore = 0;
  const seenTypes = new Set();

  for (const ind of indicators) {
    const type = String(ind.type || "").trim();
    const sev = String(ind.severity || "").toLowerCase().trim();
    const typeKey = type.toLowerCase();

    if (seenTypes.has(typeKey)) continue;
    seenTypes.add(typeKey);

    let points = 0;
    if (sev === "critical") points = 14;
    else if (sev === "high") points = 10;
    else if (sev === "medium") points = 6;
    else points = 3;

    if (points > 0) {
      const rawConf = Number(ind.confidence) || 90;
      const normalizedConfidence = rawConf > 1 ? Number((rawConf / 100).toFixed(2)) : rawConf;
      const explanation = ind.description || ind.type || "Suspicious language pattern detected by content analysis";
      const evidenceSnippet = ind.evidence || ind.description || `Detected ${type}`;

      items.push({
        id: `ai-${items.length + 1}`,
        category: "ai",
        type: type.toLowerCase().replace(/[^a-z0-9]+/g, "_") || "ai_indicator",
        source: "AI Content Analysis",
        evidence: evidenceSnippet,
        artifact: null,
        severity: sev || "medium",
        confidence: normalizedConfidence,
        riskContribution: points,
        contribution: points,
        explanation,
        finding: explanation,
      });
      calculatedScore += points;
    }
  }

  // Provide baseline contribution if indicators were few but overall AI score was high
  if (items.length === 0 && rawRiskScore > 0) {
    const baselinePoints = Math.round((rawRiskScore / 100) * CATEGORY_WEIGHTS.ai);
    if (baselinePoints > 0) {
      const explanation = aiResult.summary || "AI content analysis detected threat patterns across message context";
      items.push({
        id: "ai-baseline",
        category: "ai",
        type: "ai_contextual_threat",
        source: "AI Content Analysis",
        evidence: aiResult.summary || "Cumulative deceptive content patterns detected",
        artifact: null,
        severity: rawRiskScore >= 75 ? "critical" : rawRiskScore >= 40 ? "high" : "medium",
        confidence: 0.85,
        riskContribution: baselinePoints,
        contribution: baselinePoints,
        explanation,
        finding: explanation,
      });
      calculatedScore = baselinePoints;
    }
  }

  const finalAiScore = Math.min(CATEGORY_WEIGHTS.ai, calculatedScore);

  // Pro-rate item contributions if raw points exceeded category cap
  const adjustedItems = scaleItemsToCap(items, finalAiScore);

  return {
    score: finalAiScore,
    items: adjustedItems,
  };
}

/**
 * Evaluates Email Authentication evidence (Step 64, Max: 25 points).
 * SPF, DKIM, DMARC evidence. Pass/none/not_available do NOT add risk points.
 *
 * @param {Object} auth - Authentication object { spf, dkim, dmarc }.
 * @returns {{ score: number, items: Array<Object> }}
 */
function evaluateAuthenticationEvidence(auth) {
  if (!auth) return { score: 0, items: [] };

  const items = [];
  let score = 0;

  const spf = auth.spf || {};
  const dkim = auth.dkim || {};
  const dmarc = auth.dmarc || {};

  // 1. DMARC Evaluation (Step 64: DMARC fail +10)
  const dmarcStatus = String(dmarc.status || "").toLowerCase();
  if (dmarcStatus === "fail" || dmarcStatus === "permerror") {
    const pts = 10;
    score += pts;
    const explanation = "Sender domain failed DMARC policy validation. Message policy evaluation rejected transmission authenticity.";
    const evidenceStr = dmarc.raw || (dmarc.domain ? `DMARC: fail (domain: ${dmarc.domain})` : "DMARC: fail");
    items.push({
      id: "auth-dmarc-fail",
      category: "authentication",
      type: "dmarc_fail",
      source: "email_header",
      evidence: evidenceStr,
      artifact: dmarc.domain || null,
      severity: "high",
      confidence: 0.95,
      riskContribution: pts,
      contribution: pts,
      explanation,
      finding: explanation,
    });
  } else if (dmarcStatus === "softfail" || dmarcStatus === "temperror") {
    const pts = 5;
    score += pts;
    const explanation = "Reported DMARC policy warning or temporary evaluation failure.";
    const evidenceStr = dmarc.raw || (dmarc.domain ? `DMARC: ${dmarcStatus} (domain: ${dmarc.domain})` : `DMARC: ${dmarcStatus}`);
    items.push({
      id: "auth-dmarc-softfail",
      category: "authentication",
      type: "dmarc_softfail",
      source: "email_header",
      evidence: evidenceStr,
      artifact: dmarc.domain || null,
      severity: "medium",
      confidence: 0.80,
      riskContribution: pts,
      contribution: pts,
      explanation,
      finding: explanation,
    });
  }

  // 2. SPF Evaluation (Step 64: SPF fail +8, softfail +4)
  const spfStatus = String(spf.status || "").toLowerCase();
  if (spfStatus === "fail" || spfStatus === "permerror") {
    const pts = 8;
    score += pts;
    const explanation = "Reported SPF origin validation failed. Transmitting relay is not authorized in sender domain DNS.";
    const evidenceStr = spf.raw || (spf.domain ? `SPF: fail (domain: ${spf.domain})` : "SPF: fail");
    items.push({
      id: "auth-spf-fail",
      category: "authentication",
      type: "spf_fail",
      source: "email_header",
      evidence: evidenceStr,
      artifact: spf.domain || null,
      severity: "high",
      confidence: 0.95,
      riskContribution: pts,
      contribution: pts,
      explanation,
      finding: explanation,
    });
  } else if (spfStatus === "softfail") {
    const pts = 4;
    score += pts;
    const explanation = "Reported SPF softfail. Transmitting IP is not designated as authorized by sender domain.";
    const evidenceStr = spf.raw || (spf.domain ? `SPF: softfail (domain: ${spf.domain})` : "SPF: softfail");
    items.push({
      id: "auth-spf-softfail",
      category: "authentication",
      type: "spf_softfail",
      source: "email_header",
      evidence: evidenceStr,
      artifact: spf.domain || null,
      severity: "medium",
      confidence: 0.85,
      riskContribution: pts,
      contribution: pts,
      explanation,
      finding: explanation,
    });
  }

  // 3. DKIM Evaluation (Step 64: DKIM fail +8)
  const dkimStatus = String(dkim.status || "").toLowerCase();
  if (dkimStatus === "fail" || dkimStatus === "permerror") {
    const pts = 8;
    score += pts;
    const explanation = "Reported DKIM cryptographic signature verification failed. Message headers or body were altered or signature key invalid.";
    const evidenceStr = dkim.raw || (dkim.signingDomain ? `DKIM: fail (d=${dkim.signingDomain})` : "DKIM: fail");
    items.push({
      id: "auth-dkim-fail",
      category: "authentication",
      type: "dkim_fail",
      source: "email_header",
      evidence: evidenceStr,
      artifact: dkim.signingDomain || null,
      severity: "high",
      confidence: 0.95,
      riskContribution: pts,
      contribution: pts,
      explanation,
      finding: explanation,
    });
  }

  const finalAuthScore = Math.min(CATEGORY_WEIGHTS.authentication, score);
  const adjustedItems = scaleItemsToCap(items, finalAuthScore);

  return {
    score: finalAuthScore,
    items: adjustedItems,
  };
}

/**
 * Evaluates Sender & Identity Consistency evidence (Step 65, Max: 15 points).
 *
 * @param {Object} consistency - Consistency report.
 * @param {Object} identity - Extracted domains.
 * @returns {{ score: number, items: Array<Object> }}
 */
function evaluateIdentityEvidence(consistency, identity) {
  if (!consistency) return { score: 0, items: [] };

  const items = [];
  let score = 0;

  // Step 65: Reply-To Mismatch (+6)
  if (consistency.replyToMismatch) {
    const pts = 6;
    score += pts;
    const fromVal = identity?.from || identity?.fromDomain || "unspecified";
    const replyVal = identity?.replyTo || identity?.replyToDomain || "unspecified";
    const explanation = `Reply-To destination (${identity?.replyToDomain}) differs from visible sender identity (${identity?.fromDomain}). Indicates response redirection.`;
    const evidenceStr = `From: ${fromVal}\nReply-To: ${replyVal}`;
    items.push({
      id: "ident-replyto-mismatch",
      category: "identity",
      type: "reply_to_mismatch",
      source: "email_header",
      evidence: evidenceStr,
      artifact: identity?.replyToDomain || null,
      severity: "high",
      confidence: 0.92,
      riskContribution: pts,
      contribution: pts,
      explanation,
      finding: explanation,
    });
  }

  // Step 65: DKIM Signing Domain Mismatch (+5)
  if (consistency.dkimDomainMismatch) {
    const pts = 5;
    score += pts;
    const explanation = `DKIM cryptographic signature domain (${identity?.dkimDomain}) is not aligned with From domain (${identity?.fromDomain}).`;
    const evidenceStr = `From domain: ${identity?.fromDomain || "unknown"} vs DKIM domain: ${identity?.dkimDomain || "unknown"}`;
    items.push({
      id: "ident-dkim-mismatch",
      category: "identity",
      type: "dkim_domain_mismatch",
      source: "email_header",
      evidence: evidenceStr,
      artifact: identity?.dkimDomain || null,
      severity: "medium",
      confidence: 0.85,
      riskContribution: pts,
      contribution: pts,
      explanation,
      finding: explanation,
    });
  }

  // Step 65: SPF Domain Mismatch (+4)
  if (consistency.spfDomainMismatch) {
    const pts = 4;
    score += pts;
    const explanation = `SPF authenticated envelope domain (${identity?.spfDomain}) differs from visible From domain (${identity?.fromDomain}).`;
    const evidenceStr = `From domain: ${identity?.fromDomain || "unknown"} vs SPF domain: ${identity?.spfDomain || "unknown"}`;
    items.push({
      id: "ident-spf-mismatch",
      category: "identity",
      type: "spf_domain_mismatch",
      source: "email_header",
      evidence: evidenceStr,
      artifact: identity?.spfDomain || null,
      severity: "low",
      confidence: 0.80,
      riskContribution: pts,
      contribution: pts,
      explanation,
      finding: explanation,
    });
  }

  // Return-Path Mismatch
  if (consistency.returnPathMismatch) {
    const pts = 3;
    score += pts;
    const explanation = `Envelope Return-Path bounce address domain (${identity?.returnPathDomain}) differs from visible From domain (${identity?.fromDomain}).`;
    const evidenceStr = `From domain: ${identity?.fromDomain || "unknown"} vs Return-Path: ${identity?.returnPathDomain || "unknown"}`;
    items.push({
      id: "ident-returnpath-mismatch",
      category: "identity",
      type: "return_path_mismatch",
      source: "email_header",
      evidence: evidenceStr,
      artifact: identity?.returnPathDomain || null,
      severity: "low",
      confidence: 0.80,
      riskContribution: pts,
      contribution: pts,
      explanation,
      finding: explanation,
    });
  }

  const finalIdentityScore = Math.min(CATEGORY_WEIGHTS.identity, score);
  const adjustedItems = scaleItemsToCap(items, finalIdentityScore);

  return {
    score: finalIdentityScore,
    items: adjustedItems,
  };
}

/**
 * Evaluates Threat Intelligence & Artifact findings (Step 66, Max: 30 points).
 * Deduplicates multiple occurrences of the same URL/IP/domain (Step 67).
 *
 * @param {Object} threatIntel - Output from threatIntel.investigateArtifacts.
 * @param {Object} artifacts - Extracted URL, IP, and domain artifacts.
 * @returns {{ score: number, items: Array<Object> }}
 */
function evaluateThreatIntelEvidence(threatIntel, artifacts) {
  const items = [];
  let score = 0;

  const urlIntel = Array.isArray(threatIntel?.urls) ? threatIntel.urls : [];
  const domainIntel = Array.isArray(threatIntel?.domains) ? threatIntel.domains : [];
  const ipIntel = Array.isArray(threatIntel?.ips) ? threatIntel.ips : [];
  const urlArtifacts = Array.isArray(artifacts?.urls) ? artifacts.urls : [];

  const seenArtifacts = new Set();

  // 1. URL Threat Intelligence (Malicious: +20, Suspicious: +10)
  for (const item of urlIntel) {
    const key = `url:${item.artifact}`;
    if (seenArtifacts.has(key)) continue;
    seenArtifacts.add(key);

    if (item.status === "malicious") {
      const pts = 20;
      score += pts;
      const explanation = `URL was identified as malicious in threat intelligence database (${item.source || "URLhaus"}).`;
      items.push({
        id: `ti-url-malicious-${items.length}`,
        category: "threat-intelligence",
        type: "malicious_url",
        source: item.source || "URLhaus Threat Intelligence",
        evidence: item.artifact,
        artifact: item.artifact,
        severity: "critical",
        confidence: item.confidence || 0.95,
        riskContribution: pts,
        contribution: pts,
        explanation,
        finding: explanation,
      });
    } else if (item.status === "suspicious") {
      const pts = 10;
      score += pts;
      const explanation = `URL was flagged with suspicious activity in threat intelligence database (${item.source || "Threat Intel"}).`;
      items.push({
        id: `ti-url-suspicious-${items.length}`,
        category: "threat-intelligence",
        type: "suspicious_url",
        source: item.source || "Threat Intelligence",
        evidence: item.artifact,
        artifact: item.artifact,
        severity: "high",
        confidence: item.confidence || 0.85,
        riskContribution: pts,
        contribution: pts,
        explanation,
        finding: explanation,
      });
    }
  }

  // 2. Domain Threat Intelligence (Malicious: +15, Suspicious: +8)
  for (const item of domainIntel) {
    const key = `domain:${item.artifact}`;
    if (seenArtifacts.has(key)) continue;
    seenArtifacts.add(key);

    if (item.status === "malicious") {
      const pts = 15;
      score += pts;
      const explanation = `Domain was identified as malicious in threat intelligence database (${item.source || "Domain Intel"}).`;
      items.push({
        id: `ti-domain-malicious-${items.length}`,
        category: "threat-intelligence",
        type: "malicious_domain",
        source: item.source || "Domain Threat Intelligence",
        evidence: item.artifact,
        artifact: item.artifact,
        severity: "critical",
        confidence: item.confidence || 0.90,
        riskContribution: pts,
        contribution: pts,
        explanation,
        finding: explanation,
      });
    } else if (item.status === "suspicious") {
      const pts = 8;
      score += pts;
      const explanation = "Domain contains structural risk indicators in intelligence records.";
      items.push({
        id: `ti-domain-suspicious-${items.length}`,
        category: "threat-intelligence",
        type: "suspicious_domain",
        source: item.source || "Domain Intelligence",
        evidence: item.artifact,
        artifact: item.artifact,
        severity: "medium",
        confidence: item.confidence || 0.75,
        riskContribution: pts,
        contribution: pts,
        explanation,
        finding: explanation,
      });
    }
  }

  // 3. IP Threat Intelligence (Malicious: +15, Suspicious: +8)
  for (const item of ipIntel) {
    const key = `ip:${item.artifact}`;
    if (seenArtifacts.has(key)) continue;
    seenArtifacts.add(key);

    if (item.status === "malicious") {
      const pts = 15;
      score += pts;
      const abusePct = Math.round((item.confidence || 0.9) * 100);
      const explanation = `Transmission relay IP reported with high abuse score (${abusePct}%) in ${item.source || "AbuseIPDB"}.`;
      items.push({
        id: `ti-ip-malicious-${items.length}`,
        category: "threat-intelligence",
        type: "malicious_ip",
        source: item.source || "AbuseIPDB Threat Intelligence",
        evidence: `Transmission IP: ${item.artifact}`,
        artifact: item.artifact,
        severity: "critical",
        confidence: item.confidence || 0.90,
        riskContribution: pts,
        contribution: pts,
        explanation,
        finding: explanation,
      });
    } else if (item.status === "suspicious") {
      const pts = 8;
      score += pts;
      const explanation = `Transmission relay IP reported with moderate abuse history in ${item.source || "AbuseIPDB"}.`;
      items.push({
        id: `ti-ip-suspicious-${items.length}`,
        category: "threat-intelligence",
        type: "suspicious_ip",
        source: item.source || "AbuseIPDB Threat Intelligence",
        evidence: `Transmission IP: ${item.artifact}`,
        artifact: item.artifact,
        severity: "medium",
        confidence: item.confidence || 0.80,
        riskContribution: pts,
        contribution: pts,
        explanation,
        finding: explanation,
      });
    }
  }

  // 4. Local URL Heuristic Signals
  for (const urlArt of urlArtifacts) {
    const obsList = Array.isArray(urlArt.localObservations) ? urlArt.localObservations : [];
    for (const obs of obsList) {
      const obsKey = `local:${urlArt.normalized}-${obs.type}`;
      if (seenArtifacts.has(obsKey)) continue;
      seenArtifacts.add(obsKey);

      let pts = 0;
      if (obs.type === "IP Address Hostname") pts = 12;
      else if (obs.type === "Embedded Userinfo in URL") pts = 10;
      else if (obs.type === "Punycode / IDN Hostname") pts = 8;
      else if (obs.type === "Non-Standard Port") pts = 5;
      else if (obs.type === "Excessive Subdomain Depth") pts = 4;
      else if (obs.type === "Insecure HTTP Protocol") pts = 3;

      if (pts > 0) {
        score += pts;
        const typeKey = obs.type.toLowerCase().replace(/[^a-z0-9]+/g, "_");
        const explanation = obs.description || obs.type;
        const evidenceStr = `${obs.type}: ${urlArt.normalized || urlArt.hostname}`;
        items.push({
          id: `local-url-${items.length}`,
          category: "threat-intelligence",
          type: typeKey,
          source: "URL Structural Heuristics",
          evidence: evidenceStr,
          artifact: urlArt.normalized || urlArt.hostname,
          severity: obs.severity || "medium",
          confidence: 1.0,
          riskContribution: pts,
          contribution: pts,
          explanation,
          finding: explanation,
        });
      }
    }
  }

  const finalThreatScore = Math.min(CATEGORY_WEIGHTS.threatIntelligence, score);
  const adjustedItems = scaleItemsToCap(items, finalThreatScore);

  return {
    score: finalThreatScore,
    items: adjustedItems,
  };
}

/**
 * Proportionally adjusts individual evidence item contributions so their sum
 * strictly equals the category score cap (Step 72: Sum of displayed contributions = riskScore).
 *
 * @param {Array<Object>} items
 * @param {number} capScore
 * @returns {Array<Object>}
 */
function scaleItemsToCap(items, capScore) {
  if (items.length === 0 || capScore === 0) return [];

  const rawSum = items.reduce((acc, i) => acc + (i.riskContribution ?? i.contribution ?? 0), 0);
  if (rawSum <= capScore) return items;

  let allocated = 0;
  return items.map((item, idx) => {
    const rawVal = item.riskContribution ?? item.contribution ?? 0;
    if (idx === items.length - 1) {
      const remaining = Math.max(1, capScore - allocated);
      return { ...item, riskContribution: remaining, contribution: remaining };
    }
    const scaled = Math.max(1, Math.round((rawVal / rawSum) * capScore));
    allocated += scaled;
    return { ...item, riskContribution: scaled, contribution: scaled };
  });
}

/**
 * Reconciles evidence from AI, Authentication, Identity, and Threat Intelligence
 * into a single unified, explainable risk score and verdict (Steps 61–72).
 *
 * @param {Object} params
 * @param {Object} params.aiResult - Gemini AI content analysis output.
 * @param {Object} [params.authentication] - SPF, DKIM, DMARC results.
 * @param {Object} [params.identity] - Extracted sender domains.
 * @param {Object} [params.consistency] - Domain consistency report.
 * @param {Object} [params.threatIntel] - URL/IP/domain threat intelligence findings.
 * @param {Object} [params.artifacts] - Local URL, IP, and domain artifacts.
 * @returns {{
 *   riskScore: number,
 *   riskLevel: "low"|"medium"|"high"|"critical",
 *   verdict: string,
 *   classification: "legitimate"|"suspicious"|"fraudulent",
 *   confidence: number,
 *   categoryScores: {
 *     ai: number,
 *     aiContent: number,
 *     authentication: number,
 *     identity: number,
 *     senderConsistency: number,
 *     threatIntelligence: number,
 *     threatIntel: number
 *   },
 *   evidence: Array<{
 *     id: string,
 *     category: string,
 *     type: string,
 *     source: string,
 *     evidence: string,
 *     artifact: string|null,
 *     severity: string,
 *     confidence: number,
 *     riskContribution: number,
 *     contribution: number,
 *     explanation: string,
 *     finding: string
 *   }>,
 *   breakdown: Array<Object>,
 *   aiRiskScore: number,
 *   aiClassification: string
 * }}
 */
export function calculateUnifiedRisk({
  aiResult,
  authentication,
  identity,
  consistency,
  threatIntel,
  artifacts,
}) {
  // Step 63–66: Evidence Normalization & Category Evaluation
  const aiEval = evaluateAiEvidence(aiResult);
  const authEval = evaluateAuthenticationEvidence(authentication);
  const identityEval = evaluateIdentityEvidence(consistency, identity);
  const threatEval = evaluateThreatIntelEvidence(threatIntel, artifacts);

  // Step 68: Unified Risk Scoring (AI: 30, Auth: 25, Identity: 15, ThreatIntel: 30)
  const categoryScores = {
    ai: aiEval.score,
    aiContent: aiEval.score,
    authentication: authEval.score,
    identity: identityEval.score,
    senderConsistency: identityEval.score,
    threatIntelligence: threatEval.score,
    threatIntel: threatEval.score,
  };

  const rawTotal =
    categoryScores.ai +
    categoryScores.authentication +
    categoryScores.identity +
    categoryScores.threatIntelligence;

  const riskScore = Math.max(0, Math.min(100, Math.round(rawTotal)));
  const riskLevel = mapScoreToRiskLevel(riskScore);

  // Combine and sort from highest contribution to lowest
  const allBreakdownItems = [
    ...aiEval.items,
    ...authEval.items,
    ...identityEval.items,
    ...threatEval.items,
  ].sort((a, b) => (b.riskContribution ?? b.contribution ?? 0) - (a.riskContribution ?? a.contribution ?? 0));

  // Assign stable, sequential IDs: EV-001, EV-002, EV-003, ...
  const evidence = allBreakdownItems.map((item, idx) => {
    const stableId = `EV-${String(idx + 1).padStart(3, "0")}`;
    const riskContribution = item.riskContribution ?? item.contribution ?? 0;
    const explanation = item.explanation || item.finding || "Forensic risk contributor";
    return {
      ...item,
      id: stableId,
      riskContribution,
      contribution: riskContribution, // backward compatibility alias
      explanation,
      finding: explanation, // backward compatibility alias
    };
  });

  // Step 70: Final Classification Determination
  const hasCriticalThreatIntel = threatEval.items.some((i) => i.severity === "critical");
  const hasCriticalAiIndicator = aiEval.items.some((i) => i.severity === "critical");
  const aiClass = String(aiResult?.classification || "").toLowerCase().trim();

  let classification = "legitimate";
  if (
    riskScore >= 50 &&
    (hasCriticalThreatIntel || hasCriticalAiIndicator || aiClass === "fraudulent")
  ) {
    classification = "fraudulent";
  } else if (riskScore >= 25 || aiClass === "suspicious" || evidence.length >= 2) {
    classification = "suspicious";
  } else {
    classification = "legitimate";
  }

  // Format human-readable verdict
  let verdict = "LOW / LEGITIMATE";
  if (riskLevel === "critical") {
    verdict = hasCriticalThreatIntel || hasCriticalAiIndicator || aiClass === "fraudulent"
      ? "CRITICAL / PHISHING"
      : "CRITICAL / FRAUDULENT";
  } else if (riskLevel === "high") {
    verdict = "HIGH / SUSPICIOUS";
  } else if (riskLevel === "medium") {
    verdict = "MEDIUM / CAUTION";
  } else {
    verdict = "LOW / LEGITIMATE";
  }

  // Step 71: Final Confidence Calculation (0–100)
  let confidenceScore = 65;
  if (authentication && authentication.spf?.status !== "not_available") confidenceScore += 10;
  if (threatIntel && (threatIntel.urls?.length > 0 || threatIntel.ips?.length > 0)) confidenceScore += 10;
  if (Number(aiResult?.confidence) >= 80) confidenceScore += 10;
  if ((riskScore >= 70 && aiClass === "fraudulent") || (riskScore <= 20 && aiClass === "legitimate")) {
    confidenceScore += 5; // Signals strongly agree
  }
  const confidence = Math.max(50, Math.min(98, confidenceScore));

  return {
    riskScore,
    riskLevel,
    verdict,
    classification,
    confidence,
    categoryScores,
    evidence,
    breakdown: evidence,
    aiRiskScore: Number(aiResult?.riskScore) || 0,
    aiClassification: aiClass || "unknown",
  };
}

/**
 * Standard alias for calculateUnifiedRisk (Step 62).
 */
export const calculateRisk = calculateUnifiedRisk;

export default calculateUnifiedRisk;
