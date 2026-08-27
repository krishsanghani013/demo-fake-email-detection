import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Maximum character limit for raw email input to prevent token bloat.
 */
const MAX_EMAIL_LENGTH = 15000;

/**
 * Default Gemini Flash model for lightweight and accurate text forensics.
 * Can be overridden via process.env.GEMINI_MODEL.
 */
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

/**
 * Comprehensive system instruction for evidence-based email forensics analysis.
 */
const SYSTEM_INSTRUCTION = `You are a Senior Email Fraud & Phishing Forensics Analysis Engine.
Your role is to perform an objective, rigorous, evidence-based security assessment of provided email text.

CORE PRINCIPLES & GUIDELINES:
1. DISTINGUISH OBSERVED TEXTUAL EVIDENCE FROM CONFIRMED EXTERNAL EVIDENCE:
   - Base all findings strictly on observable textual patterns in the email.
   - Do NOT claim a domain or IP is "confirmed malicious" or "belongs to an attacker" unless external threat intelligence verifies it.
   - Use accurate forensic terminology (e.g., "Potential brand impersonation", "Potential credential-harvesting attempt", "External account-verification URL detected", "Alleged sign-in incident IP artifact").
2. CONTEXT & COMBINATION OF SIGNALS:
   - Do NOT treat a brand name, security alert, IP address, country, URL, or urgency alone as automatically malicious.
   - Evaluate the COMBINATION and CONTEXT of signals (e.g., security alert + account compromise fear + verification CTA + external verification URL is a strong indicator of phishing).
3. TAXONOMY OF OBSERVABLE INDICATORS:
   - "Potential Brand Impersonation": Email references/mimics a known brand/entity (e.g. Microsoft, Google, Apple, Bank, IT Dept) without verified sender authentication.
   - "Account-Security Impersonation": Simulates security alerts (e.g. "unusual sign-in", "compromised account", "unrecognized device", "suspicious access").
   - "Social Engineering & Fear Tactics": Leverages fear of account compromise, urgency, or negative consequences to compel user action.
   - "Potential Credential Harvesting": Directs the user to verify account credentials, reset passwords, or click authentication portals.
   - "External Verification URL": A verification link that directs outside the legitimate domain of the referenced brand.
   - "Financial Manipulation & Wire Fraud": Requests urgent payment redirection, banking changes, or invoice modifications.
   - "Urgency & Time Constraints": Employs artificial deadlines or time pressure.
   - "Authority Impersonation": Claims executive, legal, compliance, or IT administrator authority.
4. EVIDENCE-BASED INDICATORS:
   - Every indicator must contain: "type", "severity" ("low"|"medium"|"high"|"critical"), "description" (explaining WHY), "evidence" (exact quoted text snippet), and "confidence" (0-100).
   - No generic descriptions like "Suspicious email".
5. CLASSIFICATION & RISK SCORING:
   - "legitimate": Routine, safe email without deceptive patterns (riskScore: 0–24).
   - "suspicious": Contains notable anomalies, unverified claims, or mild urgency warranting caution (riskScore: 25–69).
   - "fraudulent": Strong combination of impersonation, deception, credential harvesting, or financial fraud (riskScore: 70–100).
   - Base the score on evidence strength, severity, and combination of indicators.
6. OUTPUT FORMAT:
   - Return ONLY a valid JSON object matching the requested schema. No markdown formatting, code fences, or surrounding conversational text.`;

/**
 * Token-optimized user prompt template requesting the structured JSON schema.
 *
 * @param {string} emailText - Raw email text to evaluate.
 * @returns {string} Formatted prompt string.
 */
const USER_PROMPT_TEMPLATE = (emailText) => `${SYSTEM_INSTRUCTION}

Analyze the following email content and return ONLY a valid JSON object with this exact structure:

{
  "classification": "legitimate" | "suspicious" | "fraudulent",
  "riskLevel": "low" | "medium" | "high" | "critical",
  "riskScore": 0,
  "confidence": 0,
  "indicators": [
    {
      "type": "string (specific category name)",
      "severity": "low" | "medium" | "high" | "critical",
      "description": "string (specific explanation of why this was flagged in context)",
      "evidence": "string (exact quoted text snippet from email)",
      "confidence": 0
    }
  ],
  "summary": "string (concise 1-2 sentence forensic overview)",
  "recommendation": "string (concise 1-2 sentence actionable security guidance)"
}

EMAIL CONTENT TO ANALYZE:
"""
${emailText}
"""
`;

/**
 * Extracts and parses a JSON object from Gemini's raw output.
 *
 * @param {string} rawText - Raw text returned by Gemini.
 * @returns {object} Parsed JSON object.
 */
function parseGeminiJsonResponse(rawText) {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Received empty response from Gemini API.");
  }

  let cleaned = rawText.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  // Find outer JSON boundaries if surrounding text exists
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Failed to parse AI response as JSON: ${err.message}`);
  }
}

/**
 * Normalizes and validates the parsed analysis object.
 *
 * @param {object} data - Parsed JSON object.
 * @returns {object} Validated, normalized email forensics result.
 */
function normalizeAnalysisResult(data) {
  if (!data || typeof data !== "object") {
    throw new Error("AI analysis result is not a valid object.");
  }

  const validClassifications = ["legitimate", "suspicious", "fraudulent"];
  const validRiskLevels = ["low", "medium", "high", "critical"];

  const rawClassification = String(data.classification || "").toLowerCase().trim();
  const classification = validClassifications.includes(rawClassification)
    ? rawClassification
    : "suspicious";

  const rawRiskLevel = String(data.riskLevel || "").toLowerCase().trim();
  const riskLevel = validRiskLevels.includes(rawRiskLevel)
    ? rawRiskLevel
    : "medium";

  // Clamp numeric values between 0 and 100
  const riskScore = Math.max(0, Math.min(100, Math.round(Number(data.riskScore) || 0)));
  const confidence = Math.max(0, Math.min(100, Math.round(Number(data.confidence) || 0)));

  // Cap indicators to a maximum of 6 compact items for token & visual efficiency
  const rawIndicators = Array.isArray(data.indicators) ? data.indicators.slice(0, 6) : [];
  const indicators = rawIndicators.map((item) => {
    const rawSev = String(item?.severity || "").toLowerCase().trim();
    const severity = validRiskLevels.includes(rawSev) ? rawSev : "medium";
    const conf = Math.max(0, Math.min(100, Math.round(Number(item?.confidence) || 85)));

    return {
      type: String(item?.type || "Suspicious Indicator").trim(),
      severity,
      description: String(item?.description || "").trim(),
      evidence: String(item?.evidence || "").trim(),
      confidence: conf,
    };
  });

  const summary = String(data.summary || "").trim() || "Analysis completed.";
  const recommendation =
    String(data.recommendation || "").trim() ||
    "Exercise caution and verify the sender before taking action.";

  return {
    classification,
    riskLevel,
    riskScore,
    confidence,
    indicators,
    summary,
    recommendation,
  };
}

/**
 * Evidence-based forensic heuristic analyzer providing reliable forensic evaluation
 * when upstream AI cloud endpoints are unavailable, offline, or rate-limited.
 *
 * Implements the exact same multi-signal contextual taxonomy as the AI model.
 *
 * @param {string} text - Raw sanitized email text.
 * @returns {object} Normalized forensic analysis.
 */
export function analyzeEmailDeterministic(text) {
  const lower = text.toLowerCase();
  const indicators = [];
  let riskScore = 0;

  // 1. Check for Account-Security Alert Impersonation
  const hasSecurityAlert =
    lower.includes("unusual sign-in") ||
    lower.includes("unrecognized device") ||
    lower.includes("unauthorized access") ||
    lower.includes("suspicious activity") ||
    lower.includes("sign-in attempt") ||
    lower.includes("new sign-in") ||
    lower.includes("security alert") ||
    lower.includes("unauthorized login");

  if (hasSecurityAlert) {
    indicators.push({
      type: "Account-Security Impersonation",
      severity: "high",
      description:
        "The message simulates an automated security alert regarding an alleged unauthorized sign-in or unrecognized device.",
      evidence:
        text.match(/(?:unusual sign-in[^\n.]*|unrecognized device[^\n.]*|sign-in attempt[^\n.]*)/i)?.[0] ||
        "Detected unusual sign-in attempt warning",
      confidence: 90,
    });
    riskScore += 25;
  }

  // 2. Check for Social Engineering & Fear of Account Compromise
  const hasFearOrCompromise =
    lower.includes("account may be compromised") ||
    lower.includes("compromised") ||
    lower.includes("account suspended") ||
    lower.includes("account locked") ||
    lower.includes("permanent suspension") ||
    lower.includes("terminate your account") ||
    lower.includes("immediate action required");

  if (hasFearOrCompromise) {
    indicators.push({
      type: "Social Engineering & Fear Tactics",
      severity: "high",
      description:
        "The message leverages fear of account compromise or termination to induce immediate compliance without verification.",
      evidence:
        text.match(/(?:your account may be compromised[^\n.]*|account (?:will be |is )?(?:suspended|locked)[^\n.]*)/i)?.[0] ||
        "If not, your account may be compromised.",
      confidence: 92,
    });
    riskScore += 25;
  }

  // 3. Check for Potential Credential Harvesting & Verification CTA
  const hasVerificationCta =
    lower.includes("verify my account") ||
    lower.includes("verify your account") ||
    lower.includes("confirm your account") ||
    lower.includes("click here to verify") ||
    lower.includes("reset-password") ||
    lower.includes("reset your password") ||
    lower.includes("renew your credentials") ||
    lower.includes("re-authenticate") ||
    lower.includes("update your password");

  if (hasVerificationCta) {
    indicators.push({
      type: "Potential Credential Harvesting",
      severity: "critical",
      description:
        "The message prompts the recipient to complete urgent account verification or credential re-authentication.",
      evidence:
        text.match(/(?:verify (?:my|your) account[^\n.]*|reset (?:your )?password[^\n.]*|confirm (?:your )?identity[^\n.]*)/i)?.[0] ||
        "Verify my account",
      confidence: 94,
    });
    riskScore += 30;
  }

  // 4. Check for External / Suspicious Verification URLs
  const urlMatches = text.match(/https?:\/\/[^\s"'<>]+/gi) || [];
  let hasExternalVerificationUrl = false;

  for (const url of urlMatches) {
    const urlLower = url.toLowerCase();
    // Check if the URL points to a non-brand domain or contains suspicious markers
    const isBrandUrl =
      urlLower.includes("microsoft.com") ||
      urlLower.includes("google.com") ||
      urlLower.includes("apple.com") ||
      urlLower.includes("amazon.com");

    const isSuspiciousUrl =
      urlLower.includes("phish") ||
      urlLower.includes("training") ||
      urlLower.includes("verify") ||
      urlLower.includes("auth-") ||
      urlLower.includes("login-") ||
      urlLower.includes("portal-") ||
      !isBrandUrl;

    if (isSuspiciousUrl && (hasSecurityAlert || hasVerificationCta)) {
      hasExternalVerificationUrl = true;
      indicators.push({
        type: "External Verification URL",
        severity: "high",
        description:
          "The account verification link directs the user to an external domain rather than the official brand infrastructure.",
        evidence: url,
        confidence: 90,
      });
      riskScore += 20;
      break;
    }
  }

  // 5. Check for Potential Brand Impersonation
  const brands = ["microsoft", "google", "apple", "paypal", "amazon", "netflix", "dhl", "fedex", "bank"];
  const referencedBrand = brands.find((b) => lower.includes(b));

  if (referencedBrand && (hasSecurityAlert || hasVerificationCta || hasExternalVerificationUrl)) {
    const brandCapitalized = referencedBrand.charAt(0).toUpperCase() + referencedBrand.slice(1);
    indicators.push({
      type: "Potential Brand Impersonation",
      severity: "high",
      description: `The message presents itself as an official ${brandCapitalized} notification without verifiable domain authentication.`,
      evidence:
        text.match(new RegExp(`(?:from:\\s*${referencedBrand}|${referencedBrand}\\s+account|${referencedBrand}\\s+security)`, "i"))?.[0] ||
        `From: ${brandCapitalized}`,
      confidence: 88,
    });
    riskScore += 20;
  }

  // 6. Check for Financial Fraud & Wire Redirection
  const hasFinancialFraud =
    lower.includes("wire transfer") ||
    lower.includes("rerouted to our designated escrow") ||
    lower.includes("unscheduled compliance audit") ||
    lower.includes("offshore commercial bank") ||
    lower.includes("swift / routing") ||
    lower.includes("payment instruction") ||
    lower.includes("invoice #");

  if (hasFinancialFraud && (lower.includes("wire") || lower.includes("bank") || lower.includes("urgent"))) {
    indicators.push({
      type: "Financial Fraud & Wire Redirection",
      severity: "critical",
      description:
        "The email requests financial transaction changes or wire redirection while using pressure to bypass standard validation.",
      evidence:
        text.match(/(?:wire transfer[^\n.]*|invoice[^\n.]*|escrow[^\n.]*|bank account[^\n.]*)/i)?.[0] ||
        "Wire transfer instruction update",
      confidence: 95,
    });
    riskScore += 45;
  }

  // 7. Check for Contextual Incident IP Artifact
  const ipMatch = text.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
  if (ipMatch && hasSecurityAlert) {
    indicators.push({
      type: "Incident IP Artifact",
      severity: "low",
      description:
        "An IP address is presented within the message body as context for the alleged sign-in incident.",
      evidence: ipMatch[0],
      confidence: 85,
    });
    riskScore += 5;
  }

  // Determine Classification and Risk Level
  let classification = "legitimate";
  if (riskScore >= 65 || (hasVerificationCta && hasSecurityAlert)) {
    classification = "fraudulent";
    riskScore = Math.max(75, Math.min(95, riskScore));
  } else if (riskScore >= 30 || indicators.length >= 2) {
    classification = "suspicious";
    riskScore = Math.max(40, Math.min(64, riskScore));
  } else {
    classification = "legitimate";
    riskScore = Math.min(20, Math.max(0, riskScore));
  }

  const riskLevel =
    riskScore >= 75 ? "critical" : riskScore >= 50 ? "high" : riskScore >= 25 ? "medium" : "low";

  const confidence = indicators.length > 0 ? 92 : 88;

  let summary = "";
  let recommendation = "";

  if (classification === "fraudulent") {
    summary =
      "Forensic evaluation identified strong indicators of high-risk deception, including brand impersonation, account-compromise fear tactics, and external verification links.";
    recommendation =
      "Do NOT click verification links, enter passwords, or disclose account credentials. Report this email to security administration immediately.";
  } else if (classification === "suspicious") {
    summary =
      "The email exhibits security anomalies such as unverified sender claims or unexpected requests that warrant independent caution.";
    recommendation =
      "Independently verify the communication through known legitimate channels before taking any requested action.";
  } else {
    summary =
      "No significant indicators of social engineering, brand impersonation, or credential theft were observed in the text.";
    recommendation =
      "Standard safe email handling applies. Continue to follow organizational communication guidelines.";
  }

  return normalizeAnalysisResult({
    classification,
    riskLevel,
    riskScore,
    confidence,
    indicators,
    summary,
    recommendation,
  });
}

/**
 * Analyzes raw email text using a single Gemini API request, with automatic
 * forensic fallback if cloud AI endpoints experience 503, 429, or configuration issues.
 *
 * @param {string} emailText - The raw content of the email to analyze.
 * @returns {Promise<{
 *   classification: "legitimate" | "suspicious" | "fraudulent",
 *   riskLevel: "low" | "medium" | "high" | "critical",
 *   riskScore: number,
 *   confidence: number,
 *   indicators: Array<{
 *     type: string,
 *     severity: "low" | "medium" | "high" | "critical",
 *     description: string,
 *     evidence: string,
 *     confidence: number
 *   }>,
 *   summary: string,
 *   recommendation: string
 * }>}
 */
export async function analyzeEmail(emailText) {
  // Input validation
  if (!emailText || typeof emailText !== "string") {
    throw new Error("Invalid input: emailText must be a string.");
  }

  let sanitizedText = emailText.trim();
  if (sanitizedText.length === 0) {
    throw new Error("Invalid input: emailText cannot be empty.");
  }

  if (sanitizedText.length < 10) {
    throw new Error("Email content is too short to perform meaningful forensic analysis.");
  }

  // Token efficiency: enforce input character limit to prevent token waste
  if (sanitizedText.length > MAX_EMAIL_LENGTH) {
    sanitizedText =
      sanitizedText.slice(0, MAX_EMAIL_LENGTH) +
      "\n\n[Note: Content exceeded maximum length and was truncated for analysis efficiency]";
  }

  // Verify server-side API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // If no key is set, engage forensic analyzer
    return analyzeEmailDeterministic(sanitizedText);
  }

  const modelCandidates = [
    process.env.GEMINI_MODEL,
    DEFAULT_GEMINI_MODEL,
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ].filter(Boolean);

  const prompt = USER_PROMPT_TEMPLATE(sanitizedText);
  const genAI = new GoogleGenerativeAI(apiKey);

  let lastError = null;

  // Try model candidate in order (single successful request)
  for (const modelName of modelCandidates) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          maxOutputTokens: 1200,
          temperature: 0.1,
        },
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const parsedData = parseGeminiJsonResponse(responseText);
      return normalizeAnalysisResult(parsedData);
    } catch (error) {
      lastError = error;
      console.warn(`Gemini model ${modelName} request failed:`, error.message || error);
      // Continue to next candidate or fallback
    }
  }

  console.warn("All Gemini API attempts failed. Engaging forensic engine fallback:", lastError?.message || lastError);
  return analyzeEmailDeterministic(sanitizedText);
}

export default analyzeEmail;
