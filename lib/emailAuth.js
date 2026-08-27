/**
 * Email Authentication & Header Forensics Engine (Steps 37–47)
 *
 * Extracts and normalizes reported mail server authentication evidence:
 * - Authentication-Results (Step 37)
 * - Received-SPF (Step 38)
 * - DKIM-Signature (Step 39)
 * - ARC Authentication (Step 40)
 * - SPF Evidence Analysis (Step 41)
 * - DKIM Evidence Analysis (Step 42)
 * - DMARC Evidence Analysis (Step 43)
 * - Sender Domain Consistency Checks (Steps 44–46)
 * - Received Header Chain (Step 47)
 *
 * NOTE: These checks extract evidence reported in email headers and perform
 * local structural analysis. They do NOT perform live cryptographic or DNS queries.
 */

/**
 * Extracts and normalizes the domain from an email address or header string.
 * Case-insensitive, whitespace trimmed, and handles malformed addresses safely.
 *
 * @param {string} emailStr - E.g. "Security Team <security@company.example.com>" or "user@domain.com".
 * @returns {string|null} Normalized lowercase domain name.
 */
export function extractDomain(emailStr) {
  if (!emailStr || typeof emailStr !== "string") return null;

  // Match email inside brackets <user@domain.com> or raw user@domain.com
  const match =
    emailStr.match(/<([^>]+)>/) ||
    emailStr.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const target = (match ? match[1] : emailStr).toLowerCase().trim();

  const atIdx = target.lastIndexOf("@");
  if (atIdx !== -1) {
    const domainPart = target.slice(atIdx + 1).trim().replace(/[^a-z0-9.-]/g, "");
    return domainPart || null;
  }

  // If it's already a domain without @
  if (target.includes(".") && !target.includes(" ")) {
    const cleanDomain = target.trim().replace(/[^a-z0-9.-]/g, "");
    return cleanDomain || null;
  }

  return null;
}

/**
 * Parses tags from a DKIM-Signature header string (Step 39).
 * E.g., "v=1; a=rsa-sha256; c=relaxed/relaxed; d=example.com; s=s1; h=from:to; bh=...; b=..."
 *
 * @param {string} dkimHeader - Raw DKIM-Signature header string.
 * @returns {Object|null} Extracted DKIM tags dictionary.
 */
export function parseDkimSignature(dkimHeader) {
  if (!dkimHeader || typeof dkimHeader !== "string") return null;

  const tags = {};
  const tagPairs = dkimHeader.split(";");

  for (const pair of tagPairs) {
    const eqIdx = pair.indexOf("=");
    if (eqIdx !== -1) {
      const tag = pair.slice(0, eqIdx).trim().toLowerCase();
      const val = pair.slice(eqIdx + 1).trim();
      tags[tag] = val;
    }
  }

  return {
    v: tags["v"] || "1",
    algorithm: tags["a"] || null,
    canonicalization: tags["c"] || null,
    signingDomain: tags["d"] ? tags["d"].toLowerCase().trim() : null,
    selector: tags["s"] || null,
    signedHeaders: tags["h"] ? tags["h"].split(":").map((s) => s.trim().toLowerCase()) : [],
    bodyHash: tags["bh"] || null,
    signatureData: tags["b"] || null,
    raw: dkimHeader,
  };
}

/**
 * Normalizes an authentication status string to a standard enum value.
 *
 * @param {string} rawStatus
 * @returns {"pass"|"fail"|"softfail"|"neutral"|"none"|"temperror"|"permerror"|"unknown"}
 */
function normalizeAuthStatus(rawStatus) {
  if (!rawStatus) return "unknown";
  const s = String(rawStatus).toLowerCase().trim();

  if (s.includes("pass")) return "pass";
  if (s.includes("softfail")) return "softfail";
  if (s.includes("fail")) return "fail";
  if (s.includes("neutral")) return "neutral";
  if (s.includes("none")) return "none";
  if (s.includes("temperror") || s.includes("tempfail")) return "temperror";
  if (s.includes("permerror") || s.includes("permfail")) return "permerror";

  return "unknown";
}

/**
 * Parses reported authentication mechanisms from all Authentication-Results headers (Step 37).
 *
 * @param {string|string[]} authResultsHeaders
 * @returns {Array<{
 *   raw: string,
 *   authservId: string|null,
 *   spf: { status: string, domain: string|null, details: string|null },
 *   dkim: { status: string, domain: string|null, selector: string|null, details: string|null },
 *   dmarc: { status: string, policy: string|null, domain: string|null, details: string|null }
 * }>}
 */
export function parseAllAuthenticationResults(authResultsHeaders) {
  const headers = Array.isArray(authResultsHeaders)
    ? authResultsHeaders
    : authResultsHeaders
    ? [authResultsHeaders]
    : [];

  if (headers.length === 0) return [];

  return headers.map((rawHeader) => {
    const rawStr = String(rawHeader).trim();

    // Extract authserv-id before the first semicolon
    const semiIdx = rawStr.indexOf(";");
    const authservId = semiIdx !== -1 ? rawStr.slice(0, semiIdx).trim() : null;

    const parsedItem = {
      raw: rawStr,
      authservId,
      spf: { status: "not_available", domain: null, details: null },
      dkim: { status: "not_available", domain: null, selector: null, details: null },
      dmarc: { status: "not_available", policy: null, domain: null, details: null },
    };

    // SPF from Authentication-Results
    const spfMatch = rawStr.match(/spf=([a-zA-Z]+)(?:\s*\(([^)]+)\))?/i);
    if (spfMatch) {
      parsedItem.spf.status = normalizeAuthStatus(spfMatch[1]);
      parsedItem.spf.details = spfMatch[2] ? spfMatch[2].trim() : spfMatch[0];
      if (spfMatch[2]) {
        const domainMatch = spfMatch[2].match(/(?:domain of|sender)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+|[a-zA-Z0-9.-]+)/i);
        if (domainMatch) {
          parsedItem.spf.domain = extractDomain(domainMatch[1]);
        }
      }
    }

    // DKIM from Authentication-Results
    const dkimMatch = rawStr.match(/dkim=([a-zA-Z]+)(?:\s*\(([^)]+)\))?(?:\s+header\.i=@?([a-zA-Z0-9.-]+))?(?:\s+header\.s=([a-zA-Z0-9._-]+))?/i);
    if (dkimMatch) {
      parsedItem.dkim.status = normalizeAuthStatus(dkimMatch[1]);
      parsedItem.dkim.details = dkimMatch[2] ? dkimMatch[2].trim() : dkimMatch[0];
      if (dkimMatch[3]) parsedItem.dkim.domain = dkimMatch[3].toLowerCase().trim();
      if (dkimMatch[4]) parsedItem.dkim.selector = dkimMatch[4].trim();
    }

    // DMARC from Authentication-Results
    const dmarcMatch = rawStr.match(/dmarc=([a-zA-Z]+)(?:\s*\(([^)]+)\))?(?:\s+header\.from=([a-zA-Z0-9.-]+))?/i);
    if (dmarcMatch) {
      parsedItem.dmarc.status = normalizeAuthStatus(dmarcMatch[1]);
      parsedItem.dmarc.details = dmarcMatch[2] ? dmarcMatch[2].trim() : dmarcMatch[0];
      if (dmarcMatch[3]) parsedItem.dmarc.domain = dmarcMatch[3].toLowerCase().trim();
      if (dmarcMatch[2] && dmarcMatch[2].includes("p=")) {
        const pMatch = dmarcMatch[2].match(/p=([a-zA-Z]+)/i);
        if (pMatch) parsedItem.dmarc.policy = pMatch[1].toUpperCase();
      }
    }

    return parsedItem;
  });
}

/**
 * Parses all Received-SPF headers (Step 38).
 * E.g., "Pass (mail.example.com: domain of user@example.com designates 192.0.2.1 as permitted sender) client-ip=192.0.2.1;"
 *
 * @param {string|string[]} receivedSpfHeaders
 * @returns {Array<{
 *   raw: string,
 *   result: string,
 *   clientIp: string|null,
 *   envelopeFrom: string|null,
 *   domain: string|null,
 *   receivingHost: string|null
 * }>}
 */
export function parseAllReceivedSpf(receivedSpfHeaders) {
  const headers = Array.isArray(receivedSpfHeaders)
    ? receivedSpfHeaders
    : receivedSpfHeaders
    ? [receivedSpfHeaders]
    : [];

  return headers.map((rawHeader) => {
    const rawStr = String(rawHeader).trim();
    const match = rawStr.match(/^([a-zA-Z]+)(?:\s*\(([^)]+)\))?/i);
    const result = match ? normalizeAuthStatus(match[1]) : "unknown";

    let domain = null;
    let envelopeFrom = null;
    let receivingHost = null;

    if (match && match[2]) {
      const parenContent = match[2];
      const hostMatch = parenContent.match(/^([^:]+):/);
      if (hostMatch) receivingHost = hostMatch[1].trim();

      const senderMatch = parenContent.match(/(?:domain of|sender)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+|[a-zA-Z0-9.-]+)/i);
      if (senderMatch) {
        envelopeFrom = senderMatch[1];
        domain = extractDomain(senderMatch[1]);
      }
    }

    const ipMatch = rawStr.match(/client-ip=([0-9a-fA-F.:]+)/i);
    const clientIp = ipMatch ? ipMatch[1] : null;

    return {
      raw: rawStr,
      result,
      clientIp,
      envelopeFrom,
      domain,
      receivingHost,
    };
  });
}

/**
 * Parses Received header lines into chronological relay hops (Step 47).
 *
 * @param {string|string[]} receivedHeaders
 * @returns {Array<{
 *   raw: string,
 *   fromHost: string|null,
 *   byHost: string|null,
 *   timestamp: string|null,
 *   ip: string|null,
 *   hopIndex: number
 * }>}
 */
export function parseReceivedChain(receivedHeaders) {
  const headers = Array.isArray(receivedHeaders)
    ? receivedHeaders
    : receivedHeaders
    ? [receivedHeaders]
    : [];

  return headers.map((rawHeader, idx) => {
    const rawStr = String(rawHeader).trim();

    const fromMatch = rawStr.match(/from\s+([^\s;()]+)(?:\s*\(([^)]+)\))?/i);
    const byMatch = rawStr.match(/by\s+([^\s;()]+)/i);
    const dateMatch = rawStr.match(/;\s*([A-Za-z]+,\s+\d+[\s\S]+)$/);

    const fromHost = fromMatch ? fromMatch[1] : null;
    const byHost = byMatch ? byMatch[1] : null;
    const timestamp = dateMatch ? dateMatch[1].trim() : null;

    const ipMatch = rawStr.match(/\[(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|[0-9a-fA-F:]{3,})\]/);
    const ip = ipMatch ? ipMatch[1] : null;

    return {
      raw: rawStr,
      fromHost,
      byHost,
      timestamp,
      ip,
      hopIndex: idx + 1,
    };
  });
}

/**
 * Performs local sender domain consistency analysis (Steps 44–46).
 *
 * @param {Object} params
 * @param {string} params.from - From header string.
 * @param {string} [params.replyTo] - Reply-To header string.
 * @param {string} [params.returnPath] - Return-Path header string.
 * @param {string} [params.dkimDomain] - DKIM signing domain.
 * @param {string} [params.spfDomain] - SPF authenticated domain.
 * @returns {Object}
 */
export function analyzeSenderConsistency({
  from,
  replyTo,
  returnPath,
  dkimDomain,
  spfDomain,
}) {
  const fromDomain = extractDomain(from);
  const replyToDomain = extractDomain(replyTo);
  const returnPathDomain = extractDomain(returnPath);
  const normDkimDomain = dkimDomain ? dkimDomain.toLowerCase().trim() : null;
  const normSpfDomain = spfDomain ? spfDomain.toLowerCase().trim() : null;

  const observations = [];

  // Step 44: From vs Reply-To Consistency
  let replyToMismatch = false;
  if (replyToDomain && fromDomain) {
    if (replyToDomain !== fromDomain) {
      replyToMismatch = true;
      observations.push({
        type: "Reply-To Domain Mismatch",
        severity: "medium",
        fromDomain,
        replyToDomain,
        description: `Reply-To domain (${replyToDomain}) differs from From domain (${fromDomain}). Replies will route to a separate domain.`,
      });
    }
  }

  // From vs Return-Path Consistency
  let returnPathMismatch = false;
  if (returnPathDomain && fromDomain) {
    if (returnPathDomain !== fromDomain) {
      returnPathMismatch = true;
      observations.push({
        type: "Return-Path Domain Mismatch",
        severity: "low",
        fromDomain,
        returnPathDomain,
        description: `Envelope bounce Return-Path domain (${returnPathDomain}) differs from visible From domain (${fromDomain}).`,
      });
    }
  }

  // Step 45: From vs DKIM Signing Domain Consistency
  let dkimDomainMismatch = false;
  if (normDkimDomain && fromDomain) {
    if (!fromDomain.endsWith(normDkimDomain) && !normDkimDomain.endsWith(fromDomain)) {
      dkimDomainMismatch = true;
      observations.push({
        type: "DKIM Signing Domain Mismatch",
        severity: "medium",
        fromDomain,
        dkimDomain: normDkimDomain,
        description: `DKIM cryptographic signature was generated by domain (${normDkimDomain}), which does not match From domain (${fromDomain}).`,
      });
    }
  }

  // Step 46: From vs SPF Authenticated Domain Consistency
  let spfDomainMismatch = false;
  if (normSpfDomain && fromDomain) {
    if (!fromDomain.endsWith(normSpfDomain) && !normSpfDomain.endsWith(fromDomain)) {
      spfDomainMismatch = true;
      observations.push({
        type: "SPF Domain Alignment Mismatch",
        severity: "low",
        fromDomain,
        spfDomain: normSpfDomain,
        description: `SPF authenticated domain (${normSpfDomain}) differs from visible From domain (${fromDomain}).`,
      });
    }
  }

  // Consistency status
  let consistencyStatus = "consistent";
  if (replyToMismatch || dkimDomainMismatch) {
    consistencyStatus = "mismatch_detected";
  } else if (returnPathMismatch || spfDomainMismatch) {
    consistencyStatus = "partial_alignment";
  } else if (!fromDomain) {
    consistencyStatus = "unknown";
  }

  return {
    identity: {
      fromDomain: fromDomain || null,
      replyToDomain: replyToDomain || null,
      returnPathDomain: returnPathDomain || null,
      spfDomain: normSpfDomain || null,
      dkimDomain: normDkimDomain || null,
    },
    consistency: {
      status: consistencyStatus,
      replyToMismatch,
      returnPathMismatch,
      dkimDomainMismatch,
      spfDomainMismatch,
      observations,
    },
  };
}

/**
 * Main entry point for comprehensive email header & authentication forensics (Steps 37–47).
 *
 * @param {Object} rawHeaders - Dictionary or Map of raw email headers.
 * @param {Object} metadata - Basic parsed metadata.
 * @returns {Object} Structured authentication, identity, consistency, and received chain.
 */
export function analyzeEmailAuthentication(rawHeaders = {}, metadata = {}) {
  // Normalize header keys to lowercase
  const headers = {};
  if (rawHeaders) {
    if (typeof rawHeaders.forEach === "function") {
      rawHeaders.forEach((val, key) => {
        headers[String(key).toLowerCase()] = val;
      });
    } else {
      for (const [k, v] of Object.entries(rawHeaders)) {
        headers[k.toLowerCase()] = v;
      }
    }
  }

  // Extract raw auth headers (preserving all items)
  const authResultsHeader = headers["authentication-results"] || headers["authentication-results-original"] || null;
  const receivedSpfHeader = headers["received-spf"] || null;
  const dkimSignatureHeader = headers["dkim-signature"] || null;
  const returnPathHeader = headers["return-path"] || metadata.returnPath || null;
  const receivedHeaders = headers["received"] || null;

  // Step 40: ARC Authentication Headers
  const arcAuthResults = headers["arc-authentication-results"] || null;
  const arcSeal = headers["arc-seal"] || null;
  const arcSignature = headers["arc-message-signature"] || null;

  // Step 37 & 38: Parse all entries
  const parsedAuthResultsList = parseAllAuthenticationResults(authResultsHeader);
  const parsedReceivedSpfList = parseAllReceivedSpf(receivedSpfHeader);
  const parsedReceivedChain = parseReceivedChain(receivedHeaders);

  // Step 39: Parse all DKIM-Signature headers
  const dkimHeadersList = Array.isArray(dkimSignatureHeader)
    ? dkimSignatureHeader
    : dkimSignatureHeader
    ? [dkimSignatureHeader]
    : [];
  const parsedDkimSignatures = dkimHeadersList
    .map((raw) => parseDkimSignature(raw))
    .filter(Boolean);

  // Step 41: Consolidated SPF Analysis
  let finalSpf = {
    status: "not_available",
    source: null,
    domain: null,
    details: null,
  };

  const primaryAuthResult = parsedAuthResultsList[0] || null;
  const primaryReceivedSpf = parsedReceivedSpfList[0] || null;

  if (primaryAuthResult && primaryAuthResult.spf.status !== "not_available") {
    finalSpf = {
      status: primaryAuthResult.spf.status,
      source: "Authentication-Results",
      domain: primaryAuthResult.spf.domain || primaryReceivedSpf?.domain || null,
      details: primaryAuthResult.spf.details,
    };
  } else if (primaryReceivedSpf && primaryReceivedSpf.result !== "not_available") {
    finalSpf = {
      status: primaryReceivedSpf.result,
      source: "Received-SPF",
      domain: primaryReceivedSpf.domain,
      details: primaryReceivedSpf.raw,
    };
  }

  // Step 42: Consolidated DKIM Analysis
  const primaryDkimSig = parsedDkimSignatures[0] || null;
  let finalDkim = {
    status: primaryAuthResult && primaryAuthResult.dkim.status !== "not_available"
      ? primaryAuthResult.dkim.status
      : primaryDkimSig
      ? "present"
      : "not_available",
    signaturePresent: parsedDkimSignatures.length > 0,
    signingDomain: primaryDkimSig?.signingDomain || primaryAuthResult?.dkim.domain || null,
    selector: primaryDkimSig?.selector || primaryAuthResult?.dkim.selector || null,
    algorithm: primaryDkimSig?.algorithm || null,
    canonicalization: primaryDkimSig?.canonicalization || null,
    source: primaryAuthResult && primaryAuthResult.dkim.status !== "not_available"
      ? "Authentication-Results"
      : primaryDkimSig
      ? "DKIM-Signature Header"
      : null,
  };

  // Step 43: Consolidated DMARC Analysis
  let finalDmarc = {
    status: primaryAuthResult ? primaryAuthResult.dmarc.status : "not_available",
    policy: primaryAuthResult?.dmarc.policy || null,
    domain: primaryAuthResult?.dmarc.domain || null,
    source: primaryAuthResult && primaryAuthResult.dmarc.status !== "not_available" ? "Authentication-Results" : null,
    details: primaryAuthResult?.dmarc.details || null,
  };

  // Steps 44–46: Sender Consistency Analysis
  const consistencyReport = analyzeSenderConsistency({
    from: metadata.from || headers["from"] || "",
    replyTo: metadata.replyTo || headers["reply-to"] || "",
    returnPath: returnPathHeader,
    dkimDomain: finalDkim.signingDomain,
    spfDomain: finalSpf.domain,
  });

  return {
    authentication: {
      spf: finalSpf,
      dkim: finalDkim,
      dmarc: finalDmarc,
      authenticationResults: parsedAuthResultsList,
      receivedSpf: parsedReceivedSpfList,
      dkimSignatures: parsedDkimSignatures,
      arc: {
        authenticationResults: arcAuthResults ? (Array.isArray(arcAuthResults) ? arcAuthResults : [arcAuthResults]) : [],
        seals: arcSeal ? (Array.isArray(arcSeal) ? arcSeal : [arcSeal]) : [],
        messageSignatures: arcSignature ? (Array.isArray(arcSignature) ? arcSignature : [arcSignature]) : [],
        present: Boolean(arcAuthResults || arcSeal || arcSignature),
      },
    },
    identity: consistencyReport.identity,
    consistency: consistencyReport.consistency,
    receivedHeaders: parsedReceivedChain,
  };
}

export default analyzeEmailAuthentication;
