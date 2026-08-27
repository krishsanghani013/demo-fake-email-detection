/**
 * Threat Intelligence - IP Reputation Service (Step 25)
 *
 * Checks IP address threat reputation via AbuseIPDB / threat intelligence feeds.
 * Skips private/local network ranges and handles API keys/outages safely.
 */

import { isPrivateIPv4, isPrivateIPv6 } from "../emailArtifacts.js";

/**
 * Checks reputation for an IP address.
 *
 * @param {string} ip - IPv4 or IPv6 address.
 * @returns {Promise<{
 *   artifact: string,
 *   type: "ip",
 *   source: string,
 *   status: "malicious"|"suspicious"|"clean"|"unknown"|"unavailable",
 *   confidence: number,
 *   categories: string[],
 *   details: Object
 * }>}
 */
export async function checkIpReputation(ip) {
  if (!ip || typeof ip !== "string") {
    return {
      artifact: ip || "",
      type: "ip",
      source: "IP Intelligence",
      status: "unknown",
      confidence: 0,
      categories: [],
      details: { message: "Invalid IP address provided." },
    };
  }

  const cleanIp = ip.trim();

  // 1. Check if private or loopback IP (local infrastructure is never flagged as external malicious threat)
  if (isPrivateIPv4(cleanIp) || isPrivateIPv6(cleanIp)) {
    return {
      artifact: cleanIp,
      type: "ip",
      source: "Local IP Classifier",
      status: "clean",
      confidence: 1.0,
      categories: ["private_network"],
      details: {
        isPrivate: true,
        scope: "Internal/Private Network Infrastructure",
        message: "Internal/private routing address (RFC 1918 / RFC 4193).",
      },
    };
  }

  // 2. Query AbuseIPDB if API key is provided
  const apiKey = process.env.ABUSEIPDB_API_KEY || process.env.THREAT_INTEL_API_KEY;

  if (apiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(
        `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(cleanIp)}&maxAgeInDays=90`,
        {
          method: "GET",
          headers: {
            Key: apiKey,
            Accept: "application/json",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        const data = json?.data;

        if (data) {
          const score = data.abuseConfidenceScore || 0;
          let status = "clean";
          if (score >= 50) status = "malicious";
          else if (score >= 20) status = "suspicious";

          return {
            artifact: cleanIp,
            type: "ip",
            source: "AbuseIPDB",
            status,
            confidence: score / 100,
            categories: data.usageType ? [data.usageType] : [],
            details: {
              abuseScore: score,
              countryCode: data.countryCode,
              domain: data.domain,
              isp: data.isp,
              totalReports: data.totalReports || 0,
            },
          };
        }
      }
    } catch (err) {
      // AbuseIPDB query failed or timed out
    }
  }

  // Default state for public IPs when external threat intelligence feed has no listing
  return {
    artifact: cleanIp,
    type: "ip",
    source: "Threat Intelligence Engine",
    status: "unknown",
    confidence: 0,
    categories: ["public_routable"],
    details: {
      isPublic: true,
      message: "Public routable IP address. No active blacklist entries reported.",
    },
  };
}

export default checkIpReputation;
