/**
 * Pure JavaScript .eml (RFC 5322 / RFC 2045) Email Parser
 * Extracts headers, metadata, attachments, and normalized body text for forensic analysis.
 */

/**
 * Decodes Quoted-Printable encoded string.
 *
 * @param {string} str - Quoted-printable encoded text.
 * @returns {string} Decoded plain text.
 */
function decodeQuotedPrintable(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/=\r?\n/g, "")
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
}

/**
 * Decodes Base64 encoded text.
 *
 * @param {string} str - Base64 encoded string.
 * @returns {string} Decoded text.
 */
function decodeBase64(str) {
  if (!str || typeof str !== "string") return "";
  const cleaned = str.replace(/\s+/g, "");
  try {
    if (typeof atob === "function") {
      return atob(cleaned);
    }
    return Buffer.from(cleaned, "base64").toString("utf-8");
  } catch {
    return str;
  }
}

/**
 * Decodes MIME encoded-words in headers (=?UTF-8?B?...?= or =?UTF-8?Q?...?=).
 *
 * @param {string} str - Header string potentially containing encoded-words.
 * @returns {string} Decoded header value.
 */
function decodeMimeWords(str) {
  if (!str || typeof str !== "string") return "";
  return str.replace(/=\?([^?]+)\?([BQbq])\?([^?]+)\?=/g, (_, charset, encoding, text) => {
    const enc = encoding.toUpperCase();
    if (enc === "B") {
      return decodeBase64(text);
    }
    if (enc === "Q") {
      return decodeQuotedPrintable(text.replace(/_/g, " "));
    }
    return text;
  });
}

/**
 * Parses raw header block into a key-value dictionary handling multi-line folding.
 *
 * @param {string} rawHeaders - Multi-line string of email headers.
 * @returns {Object} Dictionary of normalized lowercase header names to values.
 */
function parseHeaderBlock(rawHeaders) {
  const headers = {};
  if (!rawHeaders) return headers;

  // Unfold headers (lines beginning with space/tab belong to previous header)
  const unfolded = rawHeaders.replace(/\r?\n[ \t]+/g, " ");
  const lines = unfolded.split(/\r?\n/);

  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx !== -1) {
      const key = line.slice(0, colonIdx).trim().toLowerCase();
      const val = decodeMimeWords(line.slice(colonIdx + 1).trim());
      if (headers[key]) {
        // Multi-value header (e.g. Received)
        if (Array.isArray(headers[key])) {
          headers[key].push(val);
        } else {
          headers[key] = [headers[key], val];
        }
      } else {
        headers[key] = val;
      }
    }
  }

  return headers;
}

/**
 * Extracts parameter from a header value (e.g. boundary from Content-Type).
 *
 * @param {string} headerVal - Header value string.
 * @param {string} paramName - Parameter name to search for (e.g. 'boundary').
 * @returns {string|null} Extracted parameter value.
 */
function extractHeaderParam(headerVal, paramName) {
  if (!headerVal) return null;
  const regex = new RegExp(`${paramName}\\s*=\\s*["']?([^"';\\s]+)["']?`, "i");
  const match = headerVal.match(regex);
  return match ? match[1] : null;
}

/**
 * Strips HTML tags for safe text display and analysis.
 *
 * @param {string} html - HTML string.
 * @returns {string} Plain text content.
 */
function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+\n/g, "\n\n")
    .trim();
}

/**
 * Parses a raw .eml file text into structured metadata, headers, body, and attachments.
 *
 * @param {string} rawEml - Raw text content of an .eml file.
 * @returns {{
 *   headers: Object,
 *   subject: string,
 *   from: string,
 *   to: string,
 *   date: string,
 *   replyTo: string,
 *   messageId: string,
 *   body: string,
 *   attachments: Array<{ filename: string, contentType: string }>,
 *   formattedTextForAnalysis: string,
 *   rawText: string
 * }} Parsed email structure.
 */
export function parseEml(rawEml) {
  if (!rawEml || typeof rawEml !== "string") {
    throw new Error("Invalid .eml content: input must be a non-empty string.");
  }

  // Split headers and body at the first double newline
  const separatorMatch = rawEml.match(/\r?\n\r?\n/);
  if (!separatorMatch) {
    // If no double newline, treat whole text as body
    return {
      headers: {},
      subject: "No Subject",
      from: "Unknown Sender",
      to: "Unknown Recipient",
      date: "Unknown Date",
      replyTo: "",
      messageId: "",
      body: rawEml.trim(),
      attachments: [],
      formattedTextForAnalysis: rawEml.trim(),
      rawText: rawEml,
    };
  }

  const headerText = rawEml.slice(0, separatorMatch.index);
  const bodyText = rawEml.slice(separatorMatch.index + separatorMatch[0].length);

  const headers = parseHeaderBlock(headerText);
  const contentType = String(headers["content-type"] || "");
  const boundary = extractHeaderParam(contentType, "boundary");

  let parsedBody = "";
  const attachments = [];

  if (boundary) {
    // Multipart email parsing
    const parts = bodyText.split(`--${boundary}`);

    for (const part of parts) {
      if (!part.trim() || part.trim() === "--") continue;

      const partSep = part.match(/\r?\n\r?\n/);
      if (!partSep) continue;

      const partHeaderStr = part.slice(0, partSep.index);
      const partContent = part.slice(partSep.index + partSep[0].length);
      const partHeaders = parseHeaderBlock(partHeaderStr);

      const partContentType = String(partHeaders["content-type"] || "");
      const partDisposition = String(partHeaders["content-disposition"] || "");
      const partEncoding = String(partHeaders["content-transfer-encoding"] || "").toLowerCase();

      // Check if attachment
      const filename =
        extractHeaderParam(partDisposition, "filename") ||
        extractHeaderParam(partContentType, "name");

      if (filename) {
        attachments.push({
          filename: decodeMimeWords(filename),
          contentType: partContentType.split(";")[0].trim() || "application/octet-stream",
        });
        continue;
      }

      // Check for body text
      if (partContentType.includes("text/plain") && !parsedBody) {
        let decoded = partContent;
        if (partEncoding.includes("quoted-printable")) {
          decoded = decodeQuotedPrintable(partContent);
        } else if (partEncoding.includes("base64")) {
          decoded = decodeBase64(partContent);
        }
        parsedBody = decoded.trim();
      } else if (partContentType.includes("text/html") && !parsedBody) {
        let decoded = partContent;
        if (partEncoding.includes("quoted-printable")) {
          decoded = decodeQuotedPrintable(partContent);
        } else if (partEncoding.includes("base64")) {
          decoded = decodeBase64(partContent);
        }
        parsedBody = stripHtml(decoded);
      }
    }
  } else {
    // Single part email
    const encoding = String(headers["content-transfer-encoding"] || "").toLowerCase();
    if (encoding.includes("quoted-printable")) {
      parsedBody = decodeQuotedPrintable(bodyText);
    } else if (encoding.includes("base64")) {
      parsedBody = decodeBase64(bodyText);
    } else {
      parsedBody = bodyText;
    }

    if (contentType.includes("text/html")) {
      parsedBody = stripHtml(parsedBody);
    }
  }

  // Fallback to raw body text if parsing produced empty text
  if (!parsedBody.trim()) {
    parsedBody = stripHtml(bodyText) || bodyText.trim();
  }

  const subject = String(headers["subject"] || "No Subject").trim();
  const from = String(headers["from"] || "Unknown Sender").trim();
  const to = String(headers["to"] || "Unknown Recipient").trim();
  const date = String(headers["date"] || "Unknown Date").trim();
  const replyTo = String(headers["reply-to"] || "").trim();
  const messageId = String(headers["message-id"] || "").trim();

  // Create clean formatted string combining headers and body for analyzeEmail()
  const headerSummaryLines = [];
  if (from) headerSummaryLines.push(`From: ${from}`);
  if (to) headerSummaryLines.push(`To: ${to}`);
  if (date) headerSummaryLines.push(`Date: ${date}`);
  if (subject) headerSummaryLines.push(`Subject: ${subject}`);
  if (replyTo) headerSummaryLines.push(`Reply-To: ${replyTo}`);
  if (messageId) headerSummaryLines.push(`Message-ID: ${messageId}`);

  if (attachments.length > 0) {
    headerSummaryLines.push(
      `Attachments: ${attachments.map((a) => `${a.filename} (${a.contentType})`).join(", ")}`
    );
  }

  const formattedTextForAnalysis = `${headerSummaryLines.join("\n")}\n\n${parsedBody.trim()}`;

  return {
    headers,
    subject,
    from,
    to,
    date,
    replyTo,
    messageId,
    body: parsedBody.trim(),
    attachments,
    formattedTextForAnalysis,
    rawText: rawEml,
  };
}

export default parseEml;
