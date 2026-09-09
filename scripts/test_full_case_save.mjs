import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function run() {
  console.log("Testing POST /api/cases with full forensic investigation payload...");

  const payload = {
    caseNumber: `EML-TEST-${Date.now().toString(36).toUpperCase()}`,
    classification: "fraudulent",
    riskScore: 92,
    riskLevel: "critical",
    confidence: 96,
    verdict: "CRITICAL / PHISHING",
    summary: "High-risk credential harvesting attempt simulating corporate SSO portal.",
    recommendation: "Block sender domain and reset credentials immediately.",
    metadata: {
      from: "Security Alert <security-noreply@corporate-sso-login.example.com>",
      to: "victim@enterprise.com",
      subject: "MANDATORY: Urgent SSO Authentication Required",
      date: new Date().toISOString(),
      messageId: "<msg-9921@corporate-sso-login.example.com>",
    },
    body: {
      text: "Your SSO session has expired. Click here to verify credentials: https://corporate-sso-login.example.com/auth/login",
    },
    artifacts: {
      urls: [
        {
          raw: "https://corporate-sso-login.example.com/auth/login",
          normalized: "https://corporate-sso-login.example.com/auth/login",
          rootDomain: "corporate-sso-login.example.com",
        },
      ],
      domains: [
        {
          domain: "corporate-sso-login.example.com",
          rootDomain: "corporate-sso-login.example.com",
        },
      ],
      ips: [
        {
          ip: "198.51.100.99",
        },
      ],
    },
    threatIntel: {
      urls: [
        {
          url: "https://corporate-sso-login.example.com/auth/login",
          provider: "URLhaus",
          status: "MALICIOUS",
          riskLevel: "critical",
          confidence: 95,
        },
      ],
      domains: [
        {
          domain: "corporate-sso-login.example.com",
          provider: "Domain Intelligence",
          status: "SUSPICIOUS",
          riskLevel: "high",
          confidence: 90,
        },
      ],
    },
    evidence: [
      {
        id: "EV-001",
        category: "threat_intelligence",
        type: "malicious_url",
        source: "URLhaus Threat Intelligence",
        evidence: "https://corporate-sso-login.example.com/auth/login",
        artifact: "https://corporate-sso-login.example.com/auth/login",
        severity: "critical",
        confidence: 0.95,
        riskContribution: 30,
        explanation: "Observed URL is flagged in threat intelligence feeds.",
      },
      {
        id: "EV-002",
        category: "ai_content",
        type: "credential_harvesting",
        source: "AI Content Analysis",
        evidence: "Click here to verify credentials",
        severity: "critical",
        confidence: 0.94,
        riskContribution: 25,
        explanation: "Language directly compels credential submission.",
      },
      {
        id: "EV-003",
        category: "identity",
        type: "domain_mismatch",
        source: "Email Header Forensics",
        evidence: "From domain does not match enterprise SSO",
        artifact: "corporate-sso-login.example.com",
        severity: "high",
        confidence: 0.92,
        riskContribution: 20,
        explanation: "Sender domain mimics official organization.",
      },
      {
        id: "EV-004",
        category: "authentication",
        type: "dmarc_fail",
        source: "Authentication Forensics",
        evidence: "dmarc=fail (p=reject)",
        severity: "high",
        confidence: 0.99,
        riskContribution: 17,
        explanation: "DMARC policy rejected the incoming message.",
      },
    ],
    timeline: [
      {
        type: "EMAIL_RECEIVED",
        title: "Inbound Email Ingress",
        description: "RFC 5322 email ingested by gateway",
        source: "Mail Transfer Agent",
        severity: "info",
        timestamp: new Date().toISOString(),
      },
      {
        type: "AUTHENTICATION_ANALYSIS",
        title: "Authentication Verification Failed",
        description: "SPF pass, DKIM fail, DMARC fail",
        source: "Header Forensics",
        severity: "high",
        timestamp: new Date().toISOString(),
      },
      {
        type: "THREAT_INTEL",
        title: "Threat Intel Hit",
        description: "URLhaus flagged malicious phishing link",
        source: "URLhaus Feed",
        severity: "critical",
        timestamp: new Date().toISOString(),
      },
      {
        type: "CASE_COMPLETED",
        title: "Investigation Completed",
        description: "Final risk score 92/100 (Critical)",
        source: "Deterministic Risk Engine",
        severity: "critical",
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const res = await fetch("http://localhost:3000/api/cases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  console.log("HTTP status:", res.status);
  console.log("Response:", JSON.stringify(json, null, 2));

  if (json?.success && json?.data?.id) {
    console.log("✓ SUCCESS: Investigation case fully saved to Supabase via Prisma!");
    console.log("Case ID:", json.data.id);
    console.log("Case Number:", json.data.caseNumber);
    console.log("Email ID:", json.data.email?.id);
    console.log("Artifacts count:", json.data.artifacts?.length);
    console.log("Evidence count:", json.data.evidence?.length);
    console.log("Investigation events count:", json.data.investigationEvents?.length);
  } else {
    console.error("✗ Failed to save:", json);
  }
}

run();
