/**
 * Artifact Extraction & Local Forensic Analysis Utility (Steps 22–24)
 *
 * Extracts, normalizes, and performs deterministic local analysis on:
 * - URLs
 * - Hostnames & Domains
 * - IP addresses from Received headers and auth headers
 */

/**
 * Common multi-part public suffixes (e.g. .co.uk, .com.au, .co.in).
 */
const COMMON_TWO_PART_TLDS = new Set([
  "co.uk",
  "org.uk",
  "gov.uk",
  "ac.uk",
  "com.au",
  "net.au",
  "org.au",
  "edu.au",
  "co.in",
  "net.in",
  "org.in",
  "gen.in",
  "firm.in",
  "co.jp",
  "ne.jp",
  "or.jp",
  "co.nz",
  "com.br",
  "com.mx",
  "com.sg",
  "co.za",
]);

/**
 * IPv4 validation regex.
 */
const IPV4_REGEX = /\b(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(?:\.(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}\b/g;

/**
 * IPv6 validation regex (matches full, compressed, and IPv4-mapped IPv6).
 */
const IPV6_REGEX = /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b|\b(?:[0-9a-fA-F]{1,4}:){1,7}:|::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}\b/g;

/**
 * Checks whether an IPv4 string belongs to a private/reserved/local range.
 *
 * @param {string} ip - IPv4 address.
 * @returns {boolean} True if private or non-routable.
 */
export function isPrivateIPv4(ip) {
  if (!ip || typeof ip !== "string") return false;
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return false;

  // 10.0.0.0/8
  if (parts[0] === 10) return true;
  // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;
  // 127.0.0.0/8 (Loopback)
  if (parts[0] === 127) return true;
  // 169.254.0.0/16 (Link-local)
  if (parts[0] === 169 && parts[1] === 254) return true;
  // 100.64.0.0/10 (Carrier-grade NAT)
  if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
  // 0.0.0.0/8 or Broadcast
  if (parts[0] === 0 || parts[0] === 255) return true;

  return false;
}

/**
 * Checks whether an IPv6 string belongs to a private or local range.
 *
 * @param {string} ip - IPv6 address.
 * @returns {boolean} True if private/local.
 */
export function isPrivateIPv6(ip) {
  if (!ip || typeof ip !== "string") return false;
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fe80:") || lower.startsWith("fe90:") || lower.startsWith("fea0:") || lower.startsWith("feb0:")) return true; // Link-local
  if (lower.startsWith("fc00:") || lower.startsWith("fd00:")) return true; // Unique local
  return false;
}

/**
 * Classifies an IP address into version, scope (public/private), and category.
 *
 * @param {string} ip - IP string.
 * @returns {{
 *   ip: string,
 *   version: "IPv4" | "IPv6" | "unknown",
 *   type: "public" | "private" | "loopback" | "unknown"
 * }}
 */
export function classifyIp(ip) {
  if (!ip || typeof ip !== "string") {
    return { ip: "", version: "unknown", type: "unknown" };
  }

  const trimmed = ip.trim();

  // Test IPv4
  if (trimmed.includes(".") && trimmed.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
    const isPrivate = isPrivateIPv4(trimmed);
    const isLoopback = trimmed.startsWith("127.");
    return {
      ip: trimmed,
      version: "IPv4",
      type: isLoopback ? "loopback" : isPrivate ? "private" : "public",
    };
  }

  // Test IPv6
  if (trimmed.includes(":")) {
    const isPrivate = isPrivateIPv6(trimmed);
    const isLoopback = trimmed === "::1";
    return {
      ip: trimmed,
      version: "IPv6",
      type: isLoopback ? "loopback" : isPrivate ? "private" : "public",
    };
  }

  return { ip: trimmed, version: "unknown", type: "unknown" };
}

/**
 * Decomposes a hostname into root domain, subdomain, and TLD.
 *
 * @param {string} hostname - Hostname (e.g., "login.portal.example.co.uk").
 * @returns {{
 *   hostname: string,
 *   rootDomain: string,
 *   subdomain: string,
 *   isIp: boolean
 * }}
 */
export function parseDomainStructure(hostname) {
  if (!hostname || typeof hostname !== "string") {
    return { hostname: "", rootDomain: "", subdomain: "", isIp: false };
  }

  const cleanHost = hostname.toLowerCase().trim().replace(/\.$/, "");

  // Check if hostname is an IP
  if (cleanHost.match(/^(\d{1,3}\.){3}\d{1,3}$/) || cleanHost.includes(":")) {
    return {
      hostname: cleanHost,
      rootDomain: cleanHost,
      subdomain: "",
      isIp: true,
    };
  }

  const parts = cleanHost.split(".");
  if (parts.length <= 1) {
    return { hostname: cleanHost, rootDomain: cleanHost, subdomain: "", isIp: false };
  }

  // Check for 2-part TLDs (e.g., example.co.uk)
  const lastTwo = parts.slice(-2).join(".");
  if (parts.length >= 3 && COMMON_TWO_PART_TLDS.has(lastTwo)) {
    const rootDomain = parts.slice(-3).join(".");
    const subdomain = parts.slice(0, -3).join(".");
    return { hostname: cleanHost, rootDomain, subdomain, isIp: false };
  }

  const rootDomain = parts.slice(-2).join(".");
  const subdomain = parts.slice(0, -2).join(".");
  return { hostname: cleanHost, rootDomain, subdomain, isIp: false };
}

/**
 * Performs deterministic local suspiciousness checks on a URL and its hostname.
 *
 * @param {URL} urlObj - JavaScript URL instance.
 * @param {string} originalUrl - Raw source string.
 * @returns {Array<{ type: string, severity: "low"|"medium"|"high", description: string }>} Local observations.
 */
export function getUrlSuspicionSignals(urlObj, originalUrl) {
  const observations = [];
  if (!urlObj) return observations;

  const hostname = urlObj.hostname.toLowerCase();
  const domainInfo = parseDomainStructure(hostname);

  // 1. IP address used instead of hostname
  if (domainInfo.isIp) {
    observations.push({
      type: "IP Address Hostname",
      severity: "high",
      description: `URL uses an IP address (${hostname}) instead of a registered domain name.`,
    });
  }

  // 2. Punycode / Internationalized Domain Name
  if (hostname.includes("xn--")) {
    observations.push({
      type: "Punycode / IDN Hostname",
      severity: "medium",
      description: "Hostname contains Punycode (xn--) characters, which can be used for visual spoofing.",
    });
  }

  // 3. Excessive subdomain depth
  if (domainInfo.subdomain) {
    const subParts = domainInfo.subdomain.split(".");
    if (subParts.length >= 3) {
      observations.push({
        type: "Excessive Subdomain Depth",
        severity: "medium",
        description: `Hostname contains unusually deep subdomain nesting (${subParts.length} levels).`,
      });
    }
  }

  // 4. Suspiciously long hostname
  if (hostname.length > 45) {
    observations.push({
      type: "Unusually Long Hostname",
      severity: "low",
      description: `Hostname exceeds 45 characters (${hostname.length} chars), which is characteristic of domain generation or tracking obfuscation.`,
    });
  }

  // 5. URL contains embedded userinfo (e.g. user:password@)
  if (urlObj.username || urlObj.password || originalUrl.includes("@") && originalUrl.indexOf("@") < originalUrl.indexOf("/", 8)) {
    observations.push({
      type: "Embedded Userinfo in URL",
      severity: "high",
      description: "URL contains embedded authentication userinfo before the hostname.",
    });
  }

  // 6. Non-standard port
  if (urlObj.port && !["80", "443", "8080", "8443"].includes(urlObj.port)) {
    observations.push({
      type: "Non-Standard Port",
      severity: "medium",
      description: `URL targets a non-standard network port (${urlObj.port}).`,
    });
  }

  // 7. Insecure HTTP protocol
  if (urlObj.protocol === "http:") {
    observations.push({
      type: "Insecure HTTP Protocol",
      severity: "low",
      description: "URL uses unencrypted HTTP instead of HTTPS.",
    });
  }

  return observations;
}

/**
 * Extracts, normalizes, and validates all URLs found in the plain-text email content.
 *
 * @param {string} text - Plain text email body.
 * @returns {Array<{
 *   original: string,
 *   normalized: string,
 *   protocol: string,
 *   hostname: string,
 *   rootDomain: string,
 *   subdomain: string,
 *   pathname: string,
 *   port: string|null,
 *   search: string|null,
 *   isIp: boolean,
 *   localObservations: Array<{ type: string, severity: string, description: string }>
 * }>} Deduplicated array of structured URL artifacts.
 */
export function extractAndNormalizeUrls(text) {
  if (!text || typeof text !== "string") return [];

  const rawUrlRegex = /https?:\/\/[^\s<>"'{}|\\^`[\]]+/gi;
  const matches = text.match(rawUrlRegex) || [];

  const seenNormalized = new Set();
  const results = [];

  for (const raw of matches) {
    // Strip trailing punctuation commonly attached to URLs in prose
    const cleaned = raw.replace(/[.,;:!?)]+$/, "").trim();
    if (!cleaned) continue;

    try {
      const urlObj = new URL(cleaned);
      const normalized = urlObj.href;

      if (seenNormalized.has(normalized)) continue;
      seenNormalized.add(normalized);

      const domainInfo = parseDomainStructure(urlObj.hostname);
      const localObservations = getUrlSuspicionSignals(urlObj, cleaned);

      results.push({
        original: cleaned,
        normalized,
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        rootDomain: domainInfo.rootDomain,
        subdomain: domainInfo.subdomain,
        pathname: urlObj.pathname,
        port: urlObj.port || null,
        search: urlObj.search || null,
        isIp: domainInfo.isIp,
        localObservations,
      });
    } catch {
      // Ignore invalid URL formats safely without crashing
    }
  }

  return results;
}

/**
 * Extracts IP addresses from Received headers in topological transmission order.
 *
 * @param {string|string[]} receivedHeaders - Array of raw Received header lines.
 * @returns {Array<{
 *   ip: string,
 *   version: "IPv4"|"IPv6"|"unknown",
 *   type: "public"|"private"|"loopback"|"unknown",
 *   source: string,
 *   hopIndex: number,
 *   rawHeader: string
 * }>} Ordered and deduplicated IP artifacts.
 */
export function extractIpsFromReceivedHeaders(receivedHeaders) {
  const headers = Array.isArray(receivedHeaders)
    ? receivedHeaders
    : receivedHeaders
    ? [receivedHeaders]
    : [];

  const seenIps = new Set();
  const results = [];

  // Iterate in header order (hop index)
  headers.forEach((headerStr, hopIndex) => {
    if (!headerStr || typeof headerStr !== "string") return;

    // Search for IPv4
    const v4Matches = headerStr.match(IPV4_REGEX) || [];
    for (const ip of v4Matches) {
      if (!seenIps.has(ip)) {
        seenIps.add(ip);
        const classification = classifyIp(ip);
        results.push({
          ip,
          version: classification.version,
          type: classification.type,
          source: `Received Header (Hop #${hopIndex + 1})`,
          hopIndex: hopIndex + 1,
          rawHeader: headerStr.slice(0, 120),
        });
      }
    }

    // Search for IPv6
    const v6Matches = headerStr.match(IPV6_REGEX) || [];
    for (const ip of v6Matches) {
      if (!seenIps.has(ip)) {
        seenIps.add(ip);
        const classification = classifyIp(ip);
        results.push({
          ip,
          version: classification.version,
          type: classification.type,
          source: `Received Header (Hop #${hopIndex + 1})`,
          hopIndex: hopIndex + 1,
          rawHeader: headerStr.slice(0, 120),
        });
      }
    }
  });

  return results;
}
