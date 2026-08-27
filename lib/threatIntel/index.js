/**
 * Threat Intelligence Orchestration Engine (Steps 54–60)
 *
 * Coordinates URL, Domain, and IP reputation investigations with strict deduplication,
 * conservative lookup bounds (MAX = 10), graceful failure/rate-limit handling,
 * and normalized evidence output.
 */

import { checkUrlReputation } from "./urlIntel.js";
import { checkIpReputation } from "./ipIntel.js";
import { checkDomainReputation } from "./domainIntel.js";

/**
 * Maximum number of artifacts investigated per analysis to conserve quotas & prevent rate limits.
 */
export const MAX_URL_LOOKUPS = 10;
export const MAX_IP_LOOKUPS = 10;
export const MAX_DOMAIN_LOOKUPS = 10;

/**
 * Investigates a collection of extracted email artifacts (URLs, IPs, Domains)
 * and normalizes the results into structured threat intelligence evidence.
 *
 * @param {Object} params
 * @param {Array<Object|string>} [params.urls=[]] - Extracted URL artifacts or strings.
 * @param {Array<Object|string>} [params.ips=[]] - Extracted IP artifacts or strings.
 * @param {Array<string>} [params.domains=[]] - Extracted domain strings.
 * @returns {Promise<{
 *   urls: Array<Object>,
 *   ips: Array<Object>,
 *   domains: Array<Object>,
 *   uncheckedUrlsCount: number,
 *   uncheckedIpsCount: number,
 *   uncheckedDomainsCount: number,
 *   evidence: Array<{
 *     source: string,
 *     category: string,
 *     artifact: string,
 *     finding: string,
 *     severity: "low"|"medium"|"high"|"critical",
 *     confidence: number
 *   }>
 * }>}
 */
export async function investigateArtifacts({
  urls = [],
  ips = [],
  domains = [],
}) {
  const nowIso = new Date().toISOString();

  // 1. Deduplicate URL artifacts
  const allUniqueUrls = Array.from(
    new Set(
      urls
        .map((u) => (typeof u === "string" ? u : u?.normalized || u?.original || ""))
        .filter(Boolean)
    )
  );
  const uniqueUrls = allUniqueUrls.slice(0, MAX_URL_LOOKUPS);
  const uncheckedUrlsCount = Math.max(0, allUniqueUrls.length - MAX_URL_LOOKUPS);

  // 2. Deduplicate IP artifacts
  const allUniqueIps = Array.from(
    new Set(
      ips
        .map((i) => (typeof i === "string" ? i : i?.ip || ""))
        .filter(Boolean)
    )
  );
  const uniqueIps = allUniqueIps.slice(0, MAX_IP_LOOKUPS);
  const uncheckedIpsCount = Math.max(0, allUniqueIps.length - MAX_IP_LOOKUPS);

  // 3. Deduplicate Domain artifacts
  const allUniqueDomains = Array.from(
    new Set(
      domains
        .map((d) => (typeof d === "string" ? d : d?.rootDomain || d?.hostname || ""))
        .filter(Boolean)
    )
  );
  const uniqueDomains = allUniqueDomains.slice(0, MAX_DOMAIN_LOOKUPS);
  const uncheckedDomainsCount = Math.max(0, allUniqueDomains.length - MAX_DOMAIN_LOOKUPS);

  // Execute lookups in parallel with allSettled to guarantee zero crashes
  const [urlResults, ipResults, domainResults] = await Promise.all([
    Promise.allSettled(uniqueUrls.map((u) => checkUrlReputation(u))),
    Promise.allSettled(uniqueIps.map((i) => checkIpReputation(i))),
    Promise.allSettled(uniqueDomains.map((d) => checkDomainReputation(d))),
  ]);

  const resolvedUrls = urlResults.map((r, idx) => {
    if (r.status === "fulfilled") {
      return {
        ...r.value,
        checkedAt: r.value.checkedAt || nowIso,
      };
    }
    return {
      artifact: uniqueUrls[idx],
      type: "url",
      source: "URL Intelligence",
      status: "unavailable",
      confidence: 0,
      checkedAt: nowIso,
      details: { error: r.reason?.message || "Lookup failed." },
    };
  });

  const resolvedIps = ipResults.map((r, idx) => {
    if (r.status === "fulfilled") {
      return {
        ...r.value,
        checkedAt: r.value.checkedAt || nowIso,
      };
    }
    return {
      artifact: uniqueIps[idx],
      type: "ip",
      source: "IP Intelligence",
      status: "unavailable",
      confidence: 0,
      checkedAt: nowIso,
      details: { error: r.reason?.message || "Lookup failed." },
    };
  });

  const resolvedDomains = domainResults.map((r, idx) => {
    if (r.status === "fulfilled") {
      return {
        ...r.value,
        checkedAt: r.value.checkedAt || nowIso,
      };
    }
    return {
      artifact: uniqueDomains[idx],
      type: "domain",
      source: "Domain Intelligence",
      status: "unavailable",
      confidence: 0,
      checkedAt: nowIso,
      details: { error: r.reason?.message || "Lookup failed." },
    };
  });

  // Normalize findings into standard evidence items (Step 60)
  const evidence = [];

  for (const item of resolvedUrls) {
    if (item.status === "malicious") {
      evidence.push({
        source: item.source,
        category: "threat-intelligence",
        artifact: item.artifact,
        finding: `URL reported as malicious in ${item.source} database`,
        severity: "critical",
        confidence: item.confidence || 0.95,
      });
    } else if (item.status === "suspicious") {
      evidence.push({
        source: item.source,
        category: "threat-intelligence",
        artifact: item.artifact,
        finding: `URL flagged with suspicious activity in ${item.source}`,
        severity: "high",
        confidence: item.confidence || 0.85,
      });
    }
  }

  for (const item of resolvedIps) {
    if (item.status === "malicious") {
      evidence.push({
        source: item.source,
        category: "threat-intelligence",
        artifact: item.artifact,
        finding: `IP address reported with high abuse score (${Math.round((item.confidence || 0.9) * 100)}%)`,
        severity: "critical",
        confidence: item.confidence || 0.9,
      });
    } else if (item.status === "suspicious") {
      evidence.push({
        source: item.source,
        category: "threat-intelligence",
        artifact: item.artifact,
        finding: `IP address reported with moderate abuse history in ${item.source}`,
        severity: "medium",
        confidence: item.confidence || 0.8,
      });
    }
  }

  for (const item of resolvedDomains) {
    if (item.status === "malicious" || item.status === "suspicious") {
      evidence.push({
        source: item.source,
        category: "domain-anomaly",
        artifact: item.artifact,
        finding: `Domain contains structural risk indicators (${(item.categories || []).join(", ")})`,
        severity: "medium",
        confidence: item.confidence || 0.65,
      });
    }
  }

  return {
    urls: resolvedUrls,
    ips: resolvedIps,
    domains: resolvedDomains,
    uncheckedUrlsCount,
    uncheckedIpsCount,
    uncheckedDomainsCount,
    evidence,
  };
}

export { checkUrlReputation, checkIpReputation, checkDomainReputation };
export default investigateArtifacts;
