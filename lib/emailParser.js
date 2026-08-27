import { simpleParser } from "mailparser";
import { analyzeEmailAuthentication, extractDomain } from "./emailAuth.js";
import {
  extractAndNormalizeUrls,
  extractIpsFromReceivedHeaders,
  parseDomainStructure,
} from "./emailArtifacts.js";
import { investigateArtifacts } from "./threatIntel/index.js";

/**
 * Maximum supported .eml file size (5 MB).
 */
export const MAX_EML_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Formats byte size into human-readable representation.
 *
 * @param {number} bytes - Size in bytes.
 * @returns {string} Human readable size.
 */
export function formatFileSize(bytes) {
  const num = Number(bytes) || 0;
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Helper to safely format address header values (e.g. from, to, cc, reply-to).
 *
 * @param {Object|string|Array} headerObj - mailparser header representation.
 * @returns {string} Normalized string representation.
 */
function formatAddressHeader(headerObj) {
  if (!headerObj) return "";
  if (typeof headerObj === "string") return headerObj;
  if (headerObj.text) return headerObj.text;
  if (Array.isArray(headerObj.value)) {
    return headerObj.value
      .map((v) => (v.name ? `${v.name} <${v.address}>` : v.address || ""))
      .filter(Boolean)
      .join(", ");
  }
  return String(headerObj);
}

/**
 * Parses raw .eml content into structured forensic metadata, plain-text body,
 * normalized URL artifacts, IP chains, authentication forensics, and threat intelligence.
 *
 * @param {string|Buffer} emlContent - Raw .eml file content.
 * @returns {Promise<Object>} Structured parsed email.
 */
export async function parseEmail(emlContent) {
  if (!emlContent) {
    throw new Error("No .eml content provided for parsing.");
  }

  const parsed = await simpleParser(emlContent);

  const from = formatAddressHeader(parsed.from);
  const to = formatAddressHeader(parsed.to);
  const cc = formatAddressHeader(parsed.cc);
  const bcc = formatAddressHeader(parsed.bcc);
  const replyTo = formatAddressHeader(parsed.replyTo);
  const subject = parsed.subject || "No Subject";
  const date = parsed.date ? parsed.date.toISOString() : "";
  const messageId = parsed.messageId || "";
  const inReplyTo = parsed.inReplyTo || "";
  const references = Array.isArray(parsed.references)
    ? parsed.references.join(", ")
    : parsed.references || "";

  const returnPath = formatAddressHeader(parsed.headers?.get("return-path")) || "";

  const bodyText = (parsed.text || "").trim();

  // Step 22: Extract and Normalize URL Artifacts
  const normalizedUrls = extractAndNormalizeUrls(bodyText);
  const rawUrlList = normalizedUrls.map((u) => u.normalized);

  // Step 24: Extract Received Header IP Chain
  const rawReceivedHeader = parsed.headers?.get("received");
  const receivedHeaderLines = Array.isArray(rawReceivedHeader)
    ? rawReceivedHeader
    : rawReceivedHeader
    ? [String(rawReceivedHeader)]
    : [];
  const extractedIps = extractIpsFromReceivedHeaders(receivedHeaderLines);

  // Step 23: Extract Domain Artifacts
  const extractedDomains = [];
  const fromDomain = extractDomain(from);
  if (fromDomain) extractedDomains.push(fromDomain);
  normalizedUrls.forEach((u) => {
    if (u.rootDomain && !extractedDomains.includes(u.rootDomain)) {
      extractedDomains.push(u.rootDomain);
    }
  });

  // Extract attachment metadata only (no execution)
  const rawAttachments = Array.isArray(parsed.attachments) ? parsed.attachments : [];
  const attachments = rawAttachments.map((att) => {
    const size = att.size || (att.content ? att.content.length : 0);
    return {
      filename: att.filename || "unnamed_attachment",
      contentType: att.contentType || "application/octet-stream",
      size,
      formattedSize: formatFileSize(size),
    };
  });

  // Preserve raw headers dictionary
  const rawHeaders = {};
  if (parsed.headers && typeof parsed.headers.forEach === "function") {
    parsed.headers.forEach((value, key) => {
      rawHeaders[key] = typeof value === "object" && value?.text ? value.text : String(value);
    });
  }

  const metadata = {
    from,
    to,
    cc,
    bcc,
    replyTo,
    returnPath,
    subject,
    date,
    messageId,
    inReplyTo,
    references,
  };

  // Perform Email Authentication & Header Forensics (Steps 18–21)
  const authAnalysis = analyzeEmailAuthentication(rawHeaders, metadata);

  // Step 25: Threat Intelligence Investigation on Artifacts
  const threatIntel = await investigateArtifacts({
    urls: normalizedUrls,
    ips: extractedIps,
    domains: extractedDomains,
  });

  // Construct normalized, token-efficient text for the Gemini analyzer
  const headerLines = [];
  if (from) headerLines.push(`From: ${from}`);
  if (to) headerLines.push(`To: ${to}`);
  if (cc) headerLines.push(`Cc: ${cc}`);
  if (replyTo) headerLines.push(`Reply-To: ${replyTo}`);
  if (subject) headerLines.push(`Subject: ${subject}`);
  if (date) headerLines.push(`Date: ${date}`);
  if (messageId) headerLines.push(`Message-ID: ${messageId}`);

  if (attachments.length > 0) {
    headerLines.push(
      `Attachments: ${attachments.map((a) => `${a.filename} (${a.contentType}, ${a.formattedSize})`).join(", ")}`
    );
  }

  if (rawUrlList.length > 0) {
    headerLines.push(`Observed URLs: ${rawUrlList.slice(0, 10).join(", ")}`);
  }

  const formattedTextForAnalysis = `${headerLines.join("\n")}\n\n${bodyText}`;

  return {
    metadata,
    body: {
      text: bodyText,
    },
    urls: rawUrlList,
    artifacts: {
      urls: normalizedUrls,
      ips: extractedIps,
      domains: extractedDomains.map((d) => parseDomainStructure(d)),
    },
    threatIntel,
    attachments,
    authentication: authAnalysis.authentication,
    identity: authAnalysis.identity,
    consistency: authAnalysis.consistency,
    receivedHeaders: authAnalysis.receivedHeaders || [],
    rawHeaders,
    formattedTextForAnalysis,
  };
}

export { extractDomain };
export default parseEmail;
