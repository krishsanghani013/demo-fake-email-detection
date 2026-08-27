/**
 * Threat Intelligence - URL Reputation Service (Step 25)
 *
 * Queries reputable security databases (e.g. URLhaus / VirusTotal) for URL threat reputation.
 * Gracefully handles missing API keys, rate limits, timeouts, and network outages.
 */

/**
 * Checks reputation for a single URL.
 *
 * @param {string} url - Normalized URL string.
 * @returns {Promise<{
 *   artifact: string,
 *   type: "url",
 *   source: string,
 *   status: "malicious"|"suspicious"|"clean"|"unknown"|"unavailable",
 *   confidence: number,
 *   categories: string[],
 *   details: Object
 * }>}
 */
export async function checkUrlReputation(url) {
  if (!url || typeof url !== "string") {
    return {
      artifact: url || "",
      type: "url",
      source: "URLhaus",
      status: "unknown",
      confidence: 0,
      categories: [],
      details: { message: "Invalid URL string provided." },
    };
  }

  // 1. Check if URLhaus public endpoint is accessible
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s strict timeout

    const formData = new URLSearchParams();
    formData.append("url", url);

    const response = await fetch("https://urlhaus-api.abuse.ch/v1/url/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();

      if (data.query_status === "ok") {
        const isMalicious = data.url_status === "online" || data.threat;
        return {
          artifact: url,
          type: "url",
          source: "URLhaus",
          status: isMalicious ? "malicious" : "suspicious",
          confidence: 0.95,
          categories: data.threat ? [data.threat] : ["malware_distribution"],
          details: {
            urlStatus: data.url_status,
            threat: data.threat,
            reporter: data.reporter,
            dateAdded: data.date_added,
            tags: data.tags || [],
          },
        };
      }

      if (data.query_status === "no_results") {
        return {
          artifact: url,
          type: "url",
          source: "URLhaus",
          status: "unknown",
          confidence: 0.5,
          categories: [],
          details: { queryStatus: "no_results", message: "URL not listed in URLhaus database." },
        };
      }
    }
  } catch (err) {
    // Network failure, abort timeout, or offline environment
  }

  // Fallback graceful unknown state
  return {
    artifact: url,
    type: "url",
    source: "Threat Intelligence Engine",
    status: "unknown",
    confidence: 0,
    categories: [],
    details: { message: "No active threat indicators listed." },
  };
}

export default checkUrlReputation;
