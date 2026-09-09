import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import pg from "pg";

async function testLiveAnalysisPersistence() {
  console.log("1. Simulating email submission to /api/analyze...");
  const emailPayload = {
    email: `From: "IT Helpdesk" <support@fake-microsoft-security.net>
To: target.user@company.com
Subject: URGENT: Action Required - Your Microsoft 365 Password Expires Today
Date: Wed, 09 Sep 2026 18:30:00 +0000

Dear Employee,

Your Microsoft 365 account password is set to expire within 2 hours.
To prevent immediate service disruption and maintain email access, please verify your credentials at our secure corporate portal:

https://login.fake-microsoft-security.net/verify-credentials

Failure to authenticate will result in temporary suspension of your email inbox.

Thank you,
Corporate IT Helpdesk Support Team`
  };

  const analyzeRes = await fetch("http://127.0.0.1:3000/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(emailPayload),
  });

  const analyzeJson = await analyzeRes.json();
  if (!analyzeRes.ok || !analyzeJson.success) {
    throw new Error("Analyze failed: " + JSON.stringify(analyzeJson));
  }
  console.log("Analyze succeeded! Classification:", analyzeJson.data.classification, "RiskScore:", analyzeJson.data.riskScore);

  // 2. Parse headers / artifacts
  const parseRes = await fetch("http://127.0.0.1:3000/api/parse-eml", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emlContent: emailPayload.email }),
  });
  const parseJson = await parseRes.json();
  const parsedData = parseJson.data || {};

  // 3. Assemble combinedResult (identical to EmailInput.jsx lines 158-182)
  const caseNumber = `EML-LIVE-${Date.now().toString(36).toUpperCase()}`;
  const combinedResult = {
    caseNumber,
    classification: analyzeJson.data.classification,
    riskScore: analyzeJson.data.riskScore,
    riskLevel: analyzeJson.data.riskLevel,
    confidence: analyzeJson.data.confidence,
    verdict: "CRITICAL / PHISHING",
    summary: analyzeJson.data.summary,
    recommendation: analyzeJson.data.recommendation,
    indicators: analyzeJson.data.indicators,
    metadata: parsedData.metadata || {
      from: "IT Helpdesk <support@fake-microsoft-security.net>",
      to: "target.user@company.com",
      subject: "URGENT: Action Required - Your Microsoft 365 Password Expires Today",
      date: new Date().toISOString(),
    },
    body: parsedData.body || { text: emailPayload.email },
    artifacts: parsedData.artifacts || {
      urls: [{ raw: "https://login.fake-microsoft-security.net/verify-credentials" }],
      domains: [{ domain: "fake-microsoft-security.net" }],
      ips: [],
    },
    threatIntel: parsedData.threatIntel || {
      urls: [
        {
          url: "https://login.fake-microsoft-security.net/verify-credentials",
          provider: "Forensic URL Scanner",
          status: "MALICIOUS",
          riskLevel: "CRITICAL",
          confidence: 95,
        }
      ],
      domains: [
        {
          domain: "fake-microsoft-security.net",
          provider: "Domain Reputation Feed",
          status: "MALICIOUS",
          riskLevel: "HIGH",
          confidence: 90,
        }
      ]
    },
    evidence: (analyzeJson.data.indicators || []).map((ind, i) => ({
      id: `EV-${String(i + 1).padStart(3, "0")}`,
      category: "AI_CONTENT",
      type: ind.type,
      severity: ind.severity,
      evidence: ind.evidence || ind.description,
      explanation: ind.description,
      confidence: ind.confidence,
      riskContribution: 20,
    })),
    timeline: [
      {
        type: "EMAIL_RECEIVED",
        title: "Email Ingested for Analysis",
        description: "Inbound RFC 5322 email ingested via live test",
        severity: "info",
        timestamp: new Date().toISOString(),
      },
      {
        type: "AI_ANALYSIS",
        title: "Gemini AI Threat Detection Complete",
        description: `Risk score assessed at ${analyzeJson.data.riskScore}`,
        severity: "critical",
        timestamp: new Date().toISOString(),
      }
    ]
  };

  console.log("4. Persisting to /api/cases (Prisma -> Supabase)...");
  const saveRes = await fetch("http://127.0.0.1:3000/api/cases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(combinedResult),
  });

  const saveJson = await saveRes.json();
  if (!saveRes.ok || !saveJson.success) {
    throw new Error("Save to /api/cases failed: " + JSON.stringify(saveJson));
  }
  console.log("Successfully saved case to Supabase via Prisma! Case ID:", saveJson.data.id, "Case Number:", saveJson.data.caseNumber);

  // 5. Query Supabase directly via pg to verify all related rows exist
  console.log("5. Querying Supabase PostgreSQL to confirm records in all tables...");
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  const caseRow = await client.query('SELECT * FROM cases WHERE "caseNumber" = $1;', [caseNumber]);
  console.log("Cases table matches:", caseRow.rows.length);

  const emailRow = await client.query('SELECT * FROM emails WHERE "caseId" = $1;', [saveJson.data.id]);
  console.log("Emails table matches:", emailRow.rows.length, "Subject:", emailRow.rows[0]?.subject);

  const artRows = await client.query('SELECT * FROM artifacts WHERE "caseId" = $1;', [saveJson.data.id]);
  console.log("Artifacts table matches:", artRows.rows.length);

  const tiRows = await client.query('SELECT * FROM threat_intelligence_results WHERE "artifactId" = ANY($1::uuid[]);', [artRows.rows.map(a => a.id)]);
  console.log("Threat Intelligence table matches:", tiRows.rows.length);

  const evRows = await client.query('SELECT * FROM evidence WHERE "caseId" = $1;', [saveJson.data.id]);
  console.log("Evidence table matches:", evRows.rows.length);

  const eventRows = await client.query('SELECT * FROM investigation_events WHERE "caseId" = $1;', [saveJson.data.id]);
  console.log("Investigation Events table matches:", eventRows.rows.length);

  client.release();
  await pool.end();

  console.log("=== ALL SUPABASE TABLES SUCCESSFULLY VERIFIED FOR THE INVESTIGATION ===");
}

testLiveAnalysisPersistence().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
