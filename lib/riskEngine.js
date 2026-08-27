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
      items.push({
        id: `ai-${items.length + 1}`,
        source: "ai",
        category: "social-engineering",
        artifact: null,
        finding: ind.description || ind.type || "Suspicious content indicator",
        severity: sev || "medium",
        confidence: 0.9,
        contribution: points,
      });
      calculatedScore += points;
    }
  }

  // Provide baseline contribution if indicators were few but overall AI score was high
  if (items.length === 0 && rawRiskScore > 0) {
    const baselinePoints = Math.round((rawRiskScore / 100) * CATEGORY_WEIGHTS.ai);
    if (baselinePoints > 0) {
      items.push({
        id: "ai-baseline",
        source: "ai",
        category: "phishing",
        artifact: null,
        finding: aiResult.summary || "AI content analysis detected threat patterns",
        severity: rawRiskScore >= 75 ? "critical" : rawRiskScore >= 40 ? "high" : "medium",
        confidence: 0.85,
        contribution: baselinePoints,
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
    items.push({
      id: "auth-dmarc-fail",
      source: "dmarc",
      category: "authentication",
      artifact: dmarc.domain || null,
      finding: "Reported DMARC policy validation failed",
      severity: "high",
      confidence: 0.95,
      contribution: pts,
    });
  } else if (dmarcStatus === "softfail" || dmarcStatus === "temperror") {
    const pts = 5;
    score += pts;
    items.push({
      id: "auth-dmarc-softfail",
      source: "dmarc",
      category: "authentication",
      artifact: dmarc.domain || null,
      finding: "Reported DMARC policy warning/temporary error",
      severity: "medium",
      confidence: 0.8,
      contribution: pts,
    });
  }

  // 2. SPF Evaluation (Step 64: SPF fail +8, softfail +4)
  const spfStatus = String(spf.status || "").toLowerCase();
  if (spfStatus === "fail" || spfStatus === "permerror") {
    const pts = 8;
    score += pts;
    items.push({
      id: "auth-spf-fail",
      source: "spf",
      category: "authentication",
      artifact: spf.domain || null,
      finding: "Reported SPF origin validation failed",
      severity: "high",
      confidence: 0.95,
      contribution: pts,
    });
  } else if (spfStatus === "softfail") {
    const pts = 4;
    score += pts;
    items.push({
      id: "auth-spf-softfail",
      source: "spf",
      category: "authentication",
      artifact: spf.domain || null,
      finding: "Reported SPF softfail (sending IP not authorized)",
      severity: "medium",
      confidence: 0.85,
      contribution: pts,
    });
  }

  // 3. DKIM Evaluation (Step 64: DKIM fail +8)
  const dkimStatus = String(dkim.status || "").toLowerCase();
  if (dkimStatus === "fail" || dkimStatus === "permerror") {
    const pts = 8;
    score += pts;
    items.push({
      id: "auth-dkim-fail",
      source: "dkim",
      category: "authentication",
      artifact: dkim.signingDomain || null,
      finding: "Reported DKIM cryptographic signature verification failed",
      severity: "high",
      confidence: 0.95,
      contribution: pts,
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
    items.push({
      id: "ident-replyto-mismatch",
      source: "header-analysis",
      category: "sender-consistency",
      artifact: identity?.replyToDomain || null,
      finding: `Reply-To domain (${identity?.replyToDomain}) differs from From domain (${identity?.fromDomain})`,
      severity: "medium",
      confidence: 0.9,
      contribution: pts,
    });
  }

  // Step 65: DKIM Signing Domain Mismatch (+5)
  if (consistency.dkimDomainMismatch) {
    const pts = 5;
    score += pts;
    items.push({
      id: "ident-dkim-mismatch",
      source: "header-analysis",
      category: "sender-consistency",
      artifact: identity?.dkimDomain || null,
      finding: `DKIM signature domain (${identity?.dkimDomain}) is not aligned with From domain (${identity?.fromDomain})`,
      severity: "medium",
      confidence: 0.85,
      contribution: pts,
    });
  }

  // Step 65: SPF Domain Mismatch (+4)
  if (consistency.spfDomainMismatch) {
    const pts = 4;
    score += pts;
    items.push({
      id: "ident-spf-mismatch",
      source: "header-analysis",
      category: "sender-consistency",
      artifact: identity?.spfDomain || null,
      finding: `SPF authenticated domain (${identity?.spfDomain}) differs from From domain (${identity?.fromDomain})`,
      severity: "low",
      confidence: 0.8,
      contribution: pts,
    });
  }

  // Return-Path Mismatch
  if (consistency.returnPathMismatch) {
    const pts = 3;
    score += pts;
    items.push({
      id: "ident-returnpath-mismatch",
      source: "header-analysis",
      category: "sender-consistency",
      artifact: identity?.returnPathDomain || null,
      finding: `Envelope Return-Path domain differs from visible From domain`,
      severity: "low",
      confidence: 0.8,
      contribution: pts,
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
      items.push({
        id: `ti-url-malicious-${items.length}`,
        source: item.source || "URLhaus",
        category: "threat-intelligence",
        artifact: item.artifact,
        finding: "URL reported as malicious in threat intelligence database",
        severity: "critical",
        confidence: item.confidence || 0.95,
        contribution: pts,
      });
    } else if (item.status === "suspicious") {
      const pts = 10;
      score += pts;
      items.push({
        id: `ti-url-suspicious-${items.length}`,
        source: item.source || "URLhaus",
        category: "threat-intelligence",
        artifact: item.artifact,
        finding: "URL flagged with suspicious activity in threat database",
        severity: "high",
        confidence: item.confidence || 0.85,
        contribution: pts,
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
      items.push({
        id: `ti-domain-malicious-${items.length}`,
        source: item.source || "Domain Intel",
        category: "threat-intelligence",
        artifact: item.artifact,
        finding: "Domain reported as malicious in threat database",
        severity: "critical",
        confidence: item.confidence || 0.9,
        contribution: pts,
      });
    } else if (item.status === "suspicious") {
      const pts = 8;
      score += pts;
      items.push({
        id: `ti-domain-suspicious-${items.length}`,
        source: item.source || "Domain Intel",
        category: "threat-intelligence",
        artifact: item.artifact,
        finding: "Domain contains structural risk indicators",
        severity: "medium",
        confidence: item.confidence || 0.75,
        contribution: pts,
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
      items.push({
        id: `ti-ip-malicious-${items.length}`,
        source: item.source || "AbuseIPDB",
        category: "threat-intelligence",
        artifact: item.artifact,
        finding: `Transmission IP reported with high abuse score (${Math.round((item.confidence || 0.9) * 100)}%)`,
        severity: "critical",
        confidence: item.confidence || 0.9,
        contribution: pts,
      });
    } else if (item.status === "suspicious") {
      const pts = 8;
      score += pts;
      items.push({
        id: `ti-ip-suspicious-${items.length}`,
        source: item.source || "AbuseIPDB",
        category: "threat-intelligence",
        artifact: item.artifact,
        finding: "Transmission IP reported with moderate abuse history",
        severity: "medium",
        confidence: item.confidence || 0.8,
        contribution: pts,
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
        items.push({
          id: `local-url-${items.length}`,
          source: "url-analysis",
          category: "url",
          artifact: urlArt.normalized || urlArt.hostname,
          finding: obs.description || obs.type,
          severity: obs.severity || "medium",
          confidence: 1.0,
          contribution: pts,
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

  const rawSum = items.reduce((acc, i) => acc + i.contribution, 0);
  if (rawSum <= capScore) return items;

  let allocated = 0;
  return items.map((item, idx) => {
    if (idx === items.length - 1) {
      const remaining = Math.max(1, capScore - allocated);
      return { ...item, contribution: remaining };
    }
    const scaled = Math.max(1, Math.round((item.contribution / rawSum) * capScore));
    allocated += scaled;
    return { ...item, contribution: scaled };
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
 *   classification: "legitimate"|"suspicious"|"fraudulent",
 *   confidence: number,
 *   categoryScores: { ai: number, authentication: number, identity: number, threatIntelligence: number },
 *   breakdown: Array<{ id: string, source: string, category: string, artifact: string|null, finding: string, severity: string, contribution: number }>,
 *   aiRiskScore: number
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
    authentication: authEval.score,
    identity: identityEval.score,
    threatIntelligence: threatEval.score,
  };

  const rawTotal =
    categoryScores.ai +
    categoryScores.authentication +
    categoryScores.identity +
    categoryScores.threatIntelligence;

  const riskScore = Math.max(0, Math.min(100, Math.round(rawTotal)));
  const riskLevel = mapScoreToRiskLevel(riskScore);

  // Step 72: Explainable Risk Breakdown (sorted from highest contribution to lowest)
  const allBreakdownItems = [
    ...aiEval.items,
    ...authEval.items,
    ...identityEval.items,
    ...threatEval.items,
  ].sort((a, b) => b.contribution - a.contribution);

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
  } else if (riskScore >= 25 || aiClass === "suspicious" || allBreakdownItems.length >= 2) {
    classification = "suspicious";
  } else {
    classification = "legitimate";
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
    classification,
    confidence,
    categoryScores,
    breakdown: allBreakdownItems,
    aiRiskScore: Number(aiResult?.riskScore) || 0,
    aiClassification: aiClass || "unknown",
  };
}

/**
 * Standard alias for calculateUnifiedRisk (Step 62).
 */
export const calculateRisk = calculateUnifiedRisk;

export default calculateUnifiedRisk;
