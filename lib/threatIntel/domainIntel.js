/**
 * Threat Intelligence - Domain Reputation Service (Step 25)
 *
 * Checks domain reputation and analyzes domain structural anomalies.
 */

import { parseDomainStructure } from "../emailArtifacts.js";

/**
 * Checks reputation for a domain name.
 *
 * @param {string} domain - Domain or hostname string.
 * @returns {Promise<{
 *   artifact: string,
 *   type: "domain",
 *   source: string,
 *   status: "malicious"|"suspicious"|"clean"|"unknown"|"unavailable",
 *   confidence: number,
 *   categories: string[],
 *   details: Object
 * }>}
 */
export async function checkDomainReputation(domain) {
  if (!domain || typeof domain !== "string") {
    return {
      artifact: domain || "",
      type: "domain",
      source: "Domain Intelligence",
      status: "unknown",
      confidence: 0,
      categories: [],
      details: { message: "Invalid domain string provided." },
    };
  }

  const cleanDomain = domain.toLowerCase().trim().replace(/^@/, "");
  const domainInfo = parseDomainStructure(cleanDomain);

  // Check for common suspicious indicators (e.g. lookalike patterns, disposable TLDs, excessive length)
  const isPunycode = cleanDomain.includes("xn--");
  const isExcessiveSubdomains = domainInfo.subdomain && domainInfo.subdomain.split(".").length >= 3;

  let status = "unknown";
  let confidence = 0;
  const categories = [];

  if (isPunycode || isExcessiveSubdomains) {
    status = "suspicious";
    confidence = 0.65;
    if (isPunycode) categories.push("punycode_spoofing");
    if (isExcessiveSubdomains) categories.push("deep_subdomain_routing");
  }

  return {
    artifact: cleanDomain,
    type: "domain",
    source: "Domain Intelligence Engine",
    status,
    confidence,
    categories,
    details: {
      rootDomain: domainInfo.rootDomain,
      subdomain: domainInfo.subdomain,
      isIp: domainInfo.isIp,
    },
  };
}

export default checkDomainReputation;
