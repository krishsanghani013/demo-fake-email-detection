import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createInvestigationCase, getCaseById } from "../lib/caseRepository.js";

async function run() {
  console.log("Testing createInvestigationCase...");

  const sampleInvestigation = {
    caseNumber: `EML-TEST-${Date.now().toString(36).toUpperCase()}`,
    classification: "suspicious",
    riskScore: 48,
    riskLevel: "medium",
    confidence: 88,
    verdict: "MEDIUM / SUSPICIOUS",
    summary: "Automated test scan of invoice email.",
    recommendation: "Verify sender bank details out of band.",
    metadata: {
      from: "billing@vendor-update.example.com",
      to: "accounting@company.com",
      subject: "Invoice #98213 Payment Details",
      date: new Date().toISOString(),
    },
    body: {
      text: "Please find updated wire instructions for invoice 98213 at http://payment-gateway.example.com/pay",
    },
    artifacts: {
      urls: [
        {
          raw: "http://payment-gateway.example.com/pay",
          normalized: "http://payment-gateway.example.com/pay",
          rootDomain: "example.com",
        },
      ],
      domains: [
        { domain: "example.com", rootDomain: "example.com" },
      ],
      ips: [],
    },
    threatIntel: {
      urls: [
        {
          url: "http://payment-gateway.example.com/pay",
          provider: "URLhaus",
          status: "SUSPICIOUS",
          riskLevel: "medium",
          confidence: 85,
        },
      ],
    },
    evidence: [
      {
        id: "EV-001",
        category: "threat_intelligence",
        type: "suspicious_url",
        source: "URLhaus Threat Intelligence",
        evidence: "http://payment-gateway.example.com/pay",
        severity: "medium",
        confidence: 0.85,
        riskContribution: 20,
        explanation: "URL was flagged as suspicious",
      },
      {
        id: "EV-002",
        category: "ai_content",
        type: "financial_wire_urgency",
        source: "AI Content Analysis",
        evidence: "Please find updated wire instructions",
        severity: "medium",
        confidence: 0.9,
        riskContribution: 15,
        explanation: "Financial wire redirection requested",
      },
    ],
    timeline: [
      {
        type: "EMAIL_RECEIVED",
        title: "Email Received",
        description: "Email received from billing@vendor-update.example.com",
        source: "Mail Transfer Agent",
        severity: "info",
        timestamp: new Date().toISOString(),
      },
      {
        type: "RISK_CALCULATED",
        title: "Risk Score Calculated",
        description: "Risk score calculated: 48 (Medium)",
        source: "Deterministic Risk Engine",
        severity: "medium",
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    console.log("Calling createInvestigationCase...");
    const saved = await createInvestigationCase(sampleInvestigation);
    console.log("✓ Case created successfully!");
    console.log("Saved Case ID:", saved.id);
    console.log("Saved Case Number:", saved.caseNumber);
    console.log("Email ID:", saved.email?.id);
    console.log("Artifacts count:", saved.artifacts?.length);
    console.log("Evidence count:", saved.evidence?.length);
    console.log("Timeline events count:", saved.investigationEvents?.length);

    console.log("\nTesting getCaseById...");
    const fetched = await getCaseById(saved.caseNumber);
    console.log("✓ Successfully fetched by caseNumber:", fetched?.caseId);
    console.log("Subject:", fetched?.metadata?.subject);
    console.log("Evidence items in reconstructed case:", fetched?.evidence?.length);
  } catch (err) {
    console.error("✗ Failed to create investigation case:", err);
  }
}

run();
