/**
 * Automated Verification Suite for Feature #1: Evidence Chain
 * Tests all 10 scenarios (A through J) mandated by SIH 2026 requirements.
 */

import { calculateUnifiedRisk, CATEGORY_WEIGHTS } from "../lib/riskEngine.js";
import { analyzeEmailDeterministic } from "../lib/gemini.js";
import { parseEmail } from "../lib/emailParser.js";
import { parseEml } from "../lib/emlParser.js";
import { createInvestigationSnapshot } from "../lib/investigationSnapshot.js";
import { sanitizeForExport } from "../lib/exportSanitizer.js";

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failedCount++;
    throw new Error(message);
  } else {
    console.log(`  ✓ ${message}`);
    passedCount++;
  }
}

async function runTestSuite() {
  console.log("\n=======================================================");
  console.log("  TESTING FEATURE #1: EVIDENCE CHAIN & EXPLAINABILITY  ");
  console.log("=======================================================\n");

  // -------------------------------------------------------------
  // TEST A: Legitimate Email
  // -------------------------------------------------------------
  console.log("--- Test A: Legitimate Business Email ---");
  const legitEmail = `From: "Alex Carter" <alex.carter@team-internal.example.com>
To: "Development Team" <dev-team@company.example.com>
Subject: Sprint 42 Planning & Architecture Review - Thursday 2 PM
Date: Thu, 27 Aug 2026 09:30:00 +0000

Hi Team,
Hope you are having a productive week.
Please review the sprint agenda before 2 PM.`;

  const parsedA = await parseEmail(legitEmail);
  const aiA = analyzeEmailDeterministic(legitEmail);
  const riskA = calculateUnifiedRisk({
    aiResult: aiA,
    authentication: parsedA.authentication,
    identity: parsedA.identity,
    consistency: parsedA.consistency,
    threatIntel: parsedA.threatIntel,
    artifacts: parsedA.artifacts,
  });

  assert(riskA.riskScore <= 24, `Legitimate email score is Low (${riskA.riskScore}/100)`);
  assert(riskA.riskLevel === "low", `Risk level is "low"`);
  assert(riskA.classification === "legitimate", `Classification is "legitimate"`);
  assert(riskA.verdict.includes("LOW"), `Verdict includes LOW (${riskA.verdict})`);
  assert(
    riskA.evidence.reduce((sum, e) => sum + e.riskContribution, 0) === riskA.riskScore,
    `Evidence points sum (${riskA.evidence.reduce((sum, e) => sum + e.riskContribution, 0)}) strictly equals riskScore (${riskA.riskScore})`
  );

  // -------------------------------------------------------------
  // TEST B: Phishing Email (Security Alert + Credential Harvesting)
  // -------------------------------------------------------------
  console.log("\n--- Test B: Phishing Alert (Credential Harvesting) ---");
  const phishingEmail = `From: "Cloud Security Systems" <security-alert@cloud-sso-verify.example.org>
To: "Target Employee" <user@corporate-network.example.com>
Subject: CRITICAL: Unauthorized login attempt detected - Corporate account locked
Date: Thu, 27 Aug 2026 14:15:22 +0000

SECURITY NOTICE: IMMEDIATE ACTION REQUIRED
We detected an unusual sign-in attempt to your corporate account from an unrecognized device.
If this was not you, your account may be compromised.
Verify my account immediately: http://login-secure-sso.cloud-sso-verify.example.org/verify?token=9f82d1c`;

  const parsedB = await parseEmail(phishingEmail);
  const aiB = analyzeEmailDeterministic(phishingEmail);
  const riskB = calculateUnifiedRisk({
    aiResult: aiB,
    authentication: parsedB.authentication,
    identity: parsedB.identity,
    consistency: parsedB.consistency,
    threatIntel: parsedB.threatIntel,
    artifacts: parsedB.artifacts,
  });

  assert(riskB.riskScore >= 25, `Phishing email has elevated risk (${riskB.riskScore}/100)`);
  assert(riskB.categoryScores.aiContent > 0, `AI Content points contributed (${riskB.categoryScores.aiContent}/30)`);
  assert(riskB.evidence.length > 0, `Evidence chain contains items (${riskB.evidence.length})`);
  assert(riskB.evidence[0].id === "EV-001", `First evidence item has stable ID EV-001`);
  assert(
    riskB.evidence.some((e) => e.type.includes("credential") || e.type.includes("security")),
    `Evidence chain contains credential harvesting or security impersonation detection`
  );
  assert(
    riskB.evidence.reduce((sum, e) => sum + e.riskContribution, 0) === riskB.riskScore,
    `Sum of evidence riskContribution strictly equals riskScore (${riskB.riskScore})`
  );

  // -------------------------------------------------------------
  // TEST C: BEC / Financial Impersonation Email
  // -------------------------------------------------------------
  console.log("\n--- Test C: BEC / Financial Wire Redirection ---");
  const becEmail = `From: "David Henderson" <cfo-office@global-trade-escrow.example.com>
To: "Treasury Operations" <treasury@victim-enterprise.example.com>
Subject: URGENT: Mandatory Wire Route Alteration for Invoice #INV-88491 ($84,500.00)

Dear Treasury Team,
Due to an unscheduled compliance audit at our bank, all wire transfers for Invoice #INV-88491 must be rerouted to our designated escrow account.
SWIFT / Routing: 021000021
Do not call by phone as lines are down. Execute wire transfer today.`;

  const parsedC = await parseEmail(becEmail);
  const aiC = analyzeEmailDeterministic(becEmail);
  const riskC = calculateUnifiedRisk({
    aiResult: aiC,
    authentication: parsedC.authentication,
    identity: parsedC.identity,
    consistency: parsedC.consistency,
    threatIntel: parsedC.threatIntel,
    artifacts: parsedC.artifacts,
  });

  assert(riskC.categoryScores.aiContent > 0, `AI Content flagged BEC patterns (${riskC.categoryScores.aiContent}/30)`);
  assert(
    riskC.evidence.some((e) => e.type.includes("financial") || e.explanation.includes("wire")),
    `Evidence chain specifically identifies financial fraud / wire redirection`
  );

  // -------------------------------------------------------------
  // TEST D: Suspicious Email
  // -------------------------------------------------------------
  console.log("\n--- Test D: Suspicious Email with Mild Anomalies ---");
  const suspEmail = `From: "Vendor Inquiry" <support@vendor-portal.example.com>
Subject: Inquiry Regarding Pending Purchase Order PO-98412
Date: Thu, 27 Aug 2026 10:15:30 +0000

Dear Team,
We noticed a minor discrepancy in PO-98412. Please confirm details before Friday.`;

  const parsedD = await parseEmail(suspEmail);
  const aiD = analyzeEmailDeterministic(suspEmail);
  const riskD = calculateUnifiedRisk({
    aiResult: aiD,
    authentication: parsedD.authentication,
    identity: parsedD.identity,
    consistency: parsedD.consistency,
    threatIntel: parsedD.threatIntel,
    artifacts: parsedD.artifacts,
  });

  assert(typeof riskD.riskScore === "number", `Risk score calculated: ${riskD.riskScore}`);
  assert(
    riskD.evidence.reduce((sum, e) => sum + e.riskContribution, 0) === riskD.riskScore,
    `Points sum strictly equals riskScore (${riskD.riskScore})`
  );

  // -------------------------------------------------------------
  // TEST E: Email with DMARC Failure (+10 Authentication points)
  // -------------------------------------------------------------
  console.log("\n--- Test E: DMARC Failure Evidence ---");
  const authDmarcFail = {
    dmarc: {
      status: "fail",
      domain: "paypal.com",
      policy: "reject",
      raw: "dmarc=fail (p=reject domain=paypal.com)",
    },
    spf: { status: "pass", domain: "mail-relay.net" },
    dkim: { status: "pass" },
  };

  const riskE = calculateUnifiedRisk({
    aiResult: { riskScore: 0, indicators: [] },
    authentication: authDmarcFail,
  });

  assert(riskE.categoryScores.authentication === 10, `Authentication score is +10 for DMARC fail (got ${riskE.categoryScores.authentication})`);
  const dmarcItem = riskE.evidence.find((e) => e.type === "dmarc_fail");
  assert(Boolean(dmarcItem), `Evidence contains dmarc_fail item`);
  assert(dmarcItem.id === "EV-001", `DMARC failure assigned EV-001`);
  assert(dmarcItem.category === "authentication", `Category is "authentication"`);
  assert(dmarcItem.riskContribution === 10, `Risk contribution is 10 pts`);
  assert(dmarcItem.artifact === "paypal.com", `Artifact is "paypal.com"`);
  assert(dmarcItem.evidence.includes("dmarc=fail"), `Evidence string contains raw verification: "${dmarcItem.evidence}"`);

  // -------------------------------------------------------------
  // TEST F: Email with Reply-To Mismatch (+6 Identity points)
  // -------------------------------------------------------------
  console.log("\n--- Test F: Reply-To Mismatch Evidence ---");
  const identityF = {
    from: "support@legit-service.com",
    replyTo: "attacker@external-phish.net",
    fromDomain: "legit-service.com",
    replyToDomain: "external-phish.net",
  };
  const consistencyF = {
    replyToMismatch: true,
  };

  const riskF = calculateUnifiedRisk({
    aiResult: { riskScore: 0, indicators: [] },
    identity: identityF,
    consistency: consistencyF,
  });

  assert(riskF.categoryScores.identity === 6, `Identity score is +6 for Reply-To mismatch (got ${riskF.categoryScores.identity})`);
  const replyToItem = riskF.evidence.find((e) => e.type === "reply_to_mismatch");
  assert(Boolean(replyToItem), `Evidence contains reply_to_mismatch item`);
  assert(replyToItem.source === "email_header", `Source is email_header`);
  assert(replyToItem.riskContribution === 6, `Risk contribution is 6`);
  assert(replyToItem.artifact === "external-phish.net", `Artifact is external-phish.net`);
  assert(replyToItem.evidence.includes("From:") && replyToItem.evidence.includes("Reply-To:"), `Evidence shows observed From and Reply-To`);

  // -------------------------------------------------------------
  // TEST G: Email with Malicious URL (+20 Threat Intel points)
  // -------------------------------------------------------------
  console.log("\n--- Test G: Malicious URL Threat Intelligence ---");
  const threatIntelG = {
    urls: [
      {
        artifact: "http://credential-stealer.online/login",
        status: "malicious",
        source: "URLhaus",
        confidence: 0.98,
      },
    ],
  };

  const riskG = calculateUnifiedRisk({
    aiResult: { riskScore: 0, indicators: [] },
    threatIntel: threatIntelG,
  });

  assert(riskG.categoryScores.threatIntelligence === 20, `Threat Intel score is +20 for malicious URL (got ${riskG.categoryScores.threatIntelligence})`);
  const urlItem = riskG.evidence.find((e) => e.type === "malicious_url");
  assert(Boolean(urlItem), `Evidence contains malicious_url item`);
  assert(urlItem.severity === "critical", `Severity is critical`);
  assert(urlItem.riskContribution === 20, `Risk contribution is 20`);
  assert(urlItem.artifact === "http://credential-stealer.online/login", `Artifact matches actual URL`);
  assert(urlItem.source.includes("URLhaus"), `Source attributes URLhaus`);

  // -------------------------------------------------------------
  // TEST H: Clean Email with No Threat Intel Hits
  // -------------------------------------------------------------
  console.log("\n--- Test H: Clean Email with No Threat Intel Hits ---");
  const threatIntelH = {
    urls: [
      {
        artifact: "https://wikipedia.org/wiki/Computer",
        status: "clean",
        source: "Threat Intelligence",
        confidence: 0.95,
      },
    ],
  };

  const riskH = calculateUnifiedRisk({
    aiResult: { riskScore: 0, indicators: [] },
    threatIntel: threatIntelH,
  });

  assert(riskH.categoryScores.threatIntelligence === 0, `Threat Intel points are 0 for clean artifacts`);
  assert(riskH.evidence.length === 0, `Zero malicious evidence items generated`);

  // -------------------------------------------------------------
  // TEST I: Gemini Failure / Offline Heuristic Fallback
  // -------------------------------------------------------------
  console.log("\n--- Test I: AI Service Failure / Fallback Heuristic ---");
  const fallbackEmail = `From: Service Alert <alert@bank.com>
Subject: Unusual sign-in attempt on your account
Please verify your account credentials immediately.`;

  // analyzeEmailDeterministic runs purely local without any cloud Gemini API key
  const fallbackAi = analyzeEmailDeterministic(fallbackEmail);
  assert(fallbackAi.indicators.length > 0, `Deterministic fallback extracted indicators without cloud API`);
  assert(fallbackAi.indicators[0].evidence.length > 0, `Fallback indicator has real evidence snippet`);

  const riskI = calculateUnifiedRisk({ aiResult: fallbackAi });
  assert(riskI.riskScore > 0, `Fallback produced valid risk score (${riskI.riskScore}/100)`);
  assert(riskI.evidence.length > 0, `Fallback produced valid evidence items`);

  // -------------------------------------------------------------
  // TEST J: Malformed Email Input
  // -------------------------------------------------------------
  console.log("\n--- Test J: Malformed Email (Zero Crash Guarantee) ---");
  const malformedEmail = `This is just random fragmented text without any RFC 5322 headers or line breaks.`;

  const parsedJ = await parseEmail(malformedEmail);
  const aiJ = analyzeEmailDeterministic(malformedEmail);
  const riskJ = calculateUnifiedRisk({
    aiResult: aiJ,
    authentication: parsedJ.authentication,
    identity: parsedJ.identity,
    consistency: parsedJ.consistency,
    threatIntel: parsedJ.threatIntel,
    artifacts: parsedJ.artifacts,
  });

  assert(typeof riskJ.riskScore === "number", `Handled malformed email safely (score: ${riskJ.riskScore})`);
  assert(Array.isArray(riskJ.evidence), `evidence is valid array`);
  assert(
    riskJ.evidence.reduce((sum, e) => sum + e.riskContribution, 0) === riskJ.riskScore,
    `Points sum equals riskScore on malformed input`
  );

  // -------------------------------------------------------------
  // TEST K: Snapshot & Export Sanitization Integrity
  // -------------------------------------------------------------
  console.log("\n--- Test K: Snapshot & Export Sanitization Integrity ---");
  const testInvestigation = {
    caseId: "EML-TEST-2026",
    verdict: riskE.verdict,
    riskScore: riskE.riskScore,
    riskLevel: riskE.riskLevel,
    classification: riskE.classification,
    confidence: riskE.confidence,
    evidence: riskE.evidence,
    breakdown: riskE.breakdown,
    categoryScores: riskE.categoryScores,
    authentication: authDmarcFail,
  };

  const snapshot = createInvestigationSnapshot(testInvestigation);
  assert(Array.isArray(snapshot.risk.evidence), `Snapshot risk.evidence is an array`);
  assert(snapshot.risk.evidence[0].id === "EV-001", `Snapshot preserved EV-001 ID`);

  const sanitized = sanitizeForExport(snapshot);
  assert(Array.isArray(sanitized.risk.evidence), `Sanitized risk.evidence is an array`);
  assert(sanitized.risk.evidence[0].riskContribution === 10, `Sanitized evidence preserved riskContribution: 10`);

  // -------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log(`  ALL TESTS COMPLETED: ${passedCount} passed, ${failedCount} failed  `);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution encountered unhandled error:", err);
  process.exit(1);
});
