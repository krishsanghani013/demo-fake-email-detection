import { db, isDatabaseConfigured } from "./prisma.js";

/**
 * Case Repository & Persistence Layer (Prisma + Supabase PostgreSQL)
 *
 * Implements server-side data access and Prisma transactions for:
 * - Case
 * - Email
 * - Artifact
 * - ThreatIntelligenceResult
 * - Evidence (Evidence Chain)
 * - InvestigationEvent (Timeline)
 * - AnalystNote
 */

/**
 * Helper to map string to CaseClassification enum.
 */
function mapClassification(cls) {
  const c = String(cls || "").toLowerCase().trim();
  if (c === "fraudulent" || c === "phishing") return "FRAUDULENT";
  if (c === "legitimate" || c === "clean") return "LEGITIMATE";
  return "SUSPICIOUS";
}

/**
 * Helper to map string to RiskLevel enum.
 */
function mapRiskLevel(lvl) {
  const l = String(lvl || "").toLowerCase().trim();
  if (l === "critical") return "CRITICAL";
  if (l === "high") return "HIGH";
  if (l === "low") return "LOW";
  return "MEDIUM";
}

/**
 * Helper to map string to EvidenceSeverity enum.
 */
function mapSeverity(sev) {
  const s = String(sev || "").toLowerCase().trim();
  if (s === "critical") return "CRITICAL";
  if (s === "high") return "HIGH";
  if (s === "low") return "LOW";
  return "MEDIUM";
}

/**
 * Helper to map string to EvidenceCategory enum.
 */
function mapCategory(cat) {
  const c = String(cat || "").toLowerCase().trim();
  if (c.includes("ai") || c.includes("content")) return "AI_CONTENT";
  if (c.includes("auth") || c.includes("spf") || c.includes("dkim") || c.includes("dmarc")) return "AUTHENTICATION";
  if (c.includes("ident") || c.includes("sender") || c.includes("reply")) return "IDENTITY";
  return "THREAT_INTELLIGENCE";
}

/**
 * Helper to map string to ThreatResult enum.
 */
function mapThreatResult(res) {
  const r = String(res || "").toUpperCase().trim();
  if (r === "CLEAN") return "CLEAN";
  if (r === "MALICIOUS") return "MALICIOUS";
  if (r === "SUSPICIOUS") return "SUSPICIOUS";
  return "UNKNOWN";
}

/**
 * Generates a privacy-safe, unique Case Number.
 */
export function generateCaseNumber() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EML-${dateStr}-${randomSuffix}`;
}

/**
 * Creates an entire investigation case atomically within a Prisma transaction.
 *
 * @param {Object} investigation - The normalized investigation analysis output.
 * @returns {Promise<Object>} The persisted case with relations.
 */
export async function createInvestigationCase(investigation) {
  if (!db) {
    throw new Error("Prisma client is not initialized. Check DATABASE_URL.");
  }

  const caseNumber =
    investigation.caseNumber ||
    investigation.caseId ||
    investigation.case?.id ||
    generateCaseNumber();

  const subject =
    investigation.metadata?.subject ||
    investigation.email?.metadata?.subject ||
    "Pasted Email Forensics Scan";

  const sender =
    investigation.metadata?.from ||
    investigation.email?.metadata?.from ||
    "Unknown Sender";

  const recipient =
    investigation.metadata?.to ||
    investigation.email?.metadata?.to ||
    null;

  const classification = mapClassification(
    investigation.classification || investigation.risk?.classification
  );

  const riskScore = Math.max(
    0,
    Math.min(100, Math.round(Number(investigation.riskScore ?? investigation.risk?.score ?? 0)))
  );

  const riskLevel = mapRiskLevel(
    investigation.riskLevel || investigation.risk?.level
  );

  const confidence = Math.max(
    0,
    Math.min(100, Number(investigation.confidence ?? investigation.risk?.confidence ?? 75))
  );

  const verdict =
    investigation.verdict ||
    investigation.risk?.verdict ||
    (classification === "FRAUDULENT"
      ? "CRITICAL / PHISHING"
      : classification === "SUSPICIOUS"
      ? "HIGH / SUSPICIOUS"
      : "LOW / LEGITIMATE");

  const categoryScores =
    investigation.categoryScores || investigation.risk?.categoryScores || null;

  const aiSummary = investigation.summary || investigation.aiAnalysis?.summary || null;
  const aiRecommendation =
    investigation.recommendation || investigation.aiAnalysis?.recommendation || null;

  const isDemo = Boolean(investigation.isDemo);

  console.log(`[DB] Creating case: ${caseNumber}`);

  try {
    // Use a Prisma transaction to ensure all-or-nothing persistence
    return await db.$transaction(
      async (tx) => {
      // 1. Create or upsert Case
      const savedCase = await tx.case.upsert({
        where: { caseNumber },
        update: {
          classification,
          riskScore,
          riskLevel,
          confidence,
          verdict,
          subject,
          sender,
          recipient,
          categoryScores,
          aiSummary,
          aiRecommendation,
          isDemo,
        },
        create: {
          caseNumber,
          classification,
          riskScore,
          riskLevel,
          confidence,
          verdict,
          subject,
          sender,
          recipient,
          categoryScores,
          aiSummary,
          aiRecommendation,
          isDemo,
        },
      });

      const caseId = savedCase.id;
      console.log(`[DB] Case created: ${caseId} (${caseNumber})`);

      // Clean up any existing children if upserting an existing case to avoid duplicates
      await tx.email.deleteMany({ where: { caseId } });
      await tx.evidence.deleteMany({ where: { caseId } });
      await tx.artifact.deleteMany({ where: { caseId } });
      await tx.investigationEvent.deleteMany({ where: { caseId } });

      // 2. Create Email Record
      console.log(`[DB] Saving email for case: ${caseNumber}`);
      const meta = investigation.metadata || investigation.email?.metadata || {};
      const bodyText = investigation.body?.text || investigation.email?.bodyText || "";
      const rawHeaders = investigation.rawHeaders || investigation.email?.rawHeaders || null;
      const attachments = investigation.attachments || investigation.email?.attachments || null;
      const authentication = investigation.authentication || null;
      const identity = investigation.identity || null;
      const consistency = investigation.consistency || null;
      const receivedHeaders = investigation.receivedHeaders || null;

      const savedEmail = await tx.email.create({
        data: {
          caseId,
          from: meta.from || sender,
          to: meta.to || recipient,
          cc: meta.cc || null,
          bcc: meta.bcc || null,
          replyTo: meta.replyTo || null,
          returnPath: meta.returnPath || null,
          subject: meta.subject || subject,
          date: meta.date || null,
          messageId: meta.messageId || null,
          inReplyTo: meta.inReplyTo || null,
          references: meta.references || null,
          bodyText,
          rawHeaders,
          attachments,
          authentication,
          identity,
          consistency,
          receivedHeaders,
        },
      });

      // 3. Prepare Artifacts & Threat Intelligence Results
      const artifactMap = new Map(); // key -> artId
      const artifactsToCreate = [];
      const rawArtifacts = investigation.artifacts || {};

      // 3a. URLs
      const urlList = Array.isArray(rawArtifacts.urls)
        ? rawArtifacts.urls
        : Array.isArray(investigation.urls)
        ? investigation.urls.map((u) => ({ raw: u, normalized: u }))
        : [];

      for (const urlObj of urlList) {
        const rawVal = typeof urlObj === "string" ? urlObj : urlObj.raw || urlObj.normalized;
        const normVal = typeof urlObj === "string" ? urlObj : urlObj.normalized || urlObj.raw;
        if (!rawVal) continue;

        const artId = crypto.randomUUID();
        artifactsToCreate.push({
          id: artId,
          caseId,
          emailId: savedEmail.id,
          type: "URL",
          value: rawVal,
          normalizedValue: normVal,
          details: typeof urlObj === "object" ? urlObj : null,
        });
        artifactMap.set(normVal.toLowerCase(), artId);
        artifactMap.set(rawVal.toLowerCase(), artId);
      }

      // 3b. Domains
      const domainList = Array.isArray(rawArtifacts.domains) ? rawArtifacts.domains : [];
      for (const domObj of domainList) {
        const domVal = typeof domObj === "string" ? domObj : domObj.domain || domObj.rootDomain;
        if (!domVal) continue;

        const artId = crypto.randomUUID();
        artifactsToCreate.push({
          id: artId,
          caseId,
          emailId: savedEmail.id,
          type: "DOMAIN",
          value: domVal,
          normalizedValue: typeof domObj === "object" ? domObj.rootDomain || domVal : domVal,
          details: typeof domObj === "object" ? domObj : null,
        });
        artifactMap.set(domVal.toLowerCase(), artId);
      }

      // 3c. IPs
      const ipList = Array.isArray(rawArtifacts.ips) ? rawArtifacts.ips : [];
      for (const ipObj of ipList) {
        const ipVal = typeof ipObj === "string" ? ipObj : ipObj.ip;
        if (!ipVal) continue;

        const artId = crypto.randomUUID();
        artifactsToCreate.push({
          id: artId,
          caseId,
          emailId: savedEmail.id,
          type: "IP",
          value: ipVal,
          normalizedValue: ipVal,
          details: typeof ipObj === "object" ? ipObj : null,
        });
        artifactMap.set(ipVal.toLowerCase(), artId);
      }

      // Batch insert artifacts in 1 roundtrip
      if (artifactsToCreate.length > 0) {
        console.log(`[DB] Saving artifacts (${artifactsToCreate.length} records)`);
        await tx.artifact.createMany({ data: artifactsToCreate });
      }

      // 3d. Threat Intelligence Feed Results
      const threatIntel = investigation.threatIntel || {};
      const tiToCreate = [];
      const tiSources = [
        ...(Array.isArray(threatIntel.urls) ? threatIntel.urls : []),
        ...(Array.isArray(threatIntel.domains) ? threatIntel.domains : []),
        ...(Array.isArray(threatIntel.ips) ? threatIntel.ips : []),
      ];

      for (const tu of tiSources) {
        const targetVal = String(tu.url || tu.domain || tu.ip || tu.artifact || "").toLowerCase();
        const matchedArtId = artifactMap.get(targetVal);
        if (matchedArtId) {
          tiToCreate.push({
            artifactId: matchedArtId,
            provider: tu.provider || "Threat Intelligence Feed",
            result: mapThreatResult(tu.status || tu.result || "UNKNOWN"),
            reputation: tu.riskLevel || tu.status || null,
            confidence: tu.confidence && !isNaN(Number(tu.confidence)) ? Number(tu.confidence) : null,
            rawResult: tu,
          });
        }
      }

      if (tiToCreate.length > 0) {
        console.log(`[DB] Saving threat intelligence results (${tiToCreate.length} records)`);
        await tx.threatIntelligenceResult.createMany({ data: tiToCreate });
      }

      // 4. Prepare Evidence Chain Records
      const rawEvidenceList = Array.isArray(investigation.evidence)
        ? investigation.evidence
        : Array.isArray(investigation.breakdown)
        ? investigation.breakdown
        : [];

      const evidenceToCreate = [];
      for (let idx = 0; idx < rawEvidenceList.length; idx++) {
        const ev = rawEvidenceList[idx];
        const evId = ev.id || `EV-${String(idx + 1).padStart(3, "0")}`;
        const artifactKey = String(ev.artifact || "").toLowerCase();
        const linkedArtId = artifactMap.get(artifactKey) || null;

        const confVal = Number(ev.confidence);
        const rcVal = Number(ev.riskContribution ?? ev.contribution ?? 0);

        evidenceToCreate.push({
          caseId,
          evidenceId: evId,
          artifactId: linkedArtId,
          category: mapCategory(ev.category),
          type: String(ev.type || "finding"),
          source: String(ev.source || "Deterministic Risk Engine"),
          evidence: String(ev.evidence || ev.finding || "Forensic artifact observed"),
          severity: mapSeverity(ev.severity),
          confidence: !isNaN(confVal) ? confVal : null,
          riskContribution: !isNaN(rcVal) ? Math.round(rcVal) : 0,
          explanation: String(ev.explanation || ev.finding || "Contributes to forensic risk score"),
        });
      }

      if (evidenceToCreate.length > 0) {
        console.log(`[DB] Saving evidence (${evidenceToCreate.length} items)`);
        await tx.evidence.createMany({ data: evidenceToCreate });
      }

      // 5. Prepare Investigation Events (Timeline)
      const rawTimeline = Array.isArray(investigation.timeline) ? investigation.timeline : [];
      const eventsToCreate = [];

      if (rawTimeline.length > 0) {
        for (const event of rawTimeline) {
          let ts = null;
          if (event.timestamp) {
            const parsed = new Date(event.timestamp);
            if (!isNaN(parsed.getTime())) ts = parsed;
          }

          eventsToCreate.push({
            caseId,
            eventType: String(event.type || "INVESTIGATION_EVENT"),
            title: String(event.title || "Investigation Step"),
            description: String(event.description || ""),
            source: event.source ? String(event.source) : null,
            severity: event.severity ? String(event.severity) : "info",
            eventTimestamp: ts,
          });
        }
      } else {
        eventsToCreate.push({
          caseId,
          eventType: "CASE_CREATED",
          title: "Investigation Initialized",
          description: `Case ${caseNumber} created for ${subject}`,
          source: "Case Registry",
          severity: "info",
          eventTimestamp: new Date(),
        });
      }

      console.log(`[DB] Saving timeline (${eventsToCreate.length} events)`);
      await tx.investigationEvent.createMany({ data: eventsToCreate });

      console.log(`[DB] Investigation persistence completed: ${caseNumber}`);

      // Return the saved case with complete relations
      return await tx.case.findUnique({
        where: { id: caseId },
        include: {
          email: true,
          artifacts: {
            include: {
              threatIntelligenceResults: true,
            },
          },
          evidence: true,
          investigationEvents: {
            orderBy: { createdAt: "asc" },
          },
          analystNotes: {
            orderBy: { createdAt: "desc" },
          },
        },
      });
    },
    {
      timeout: 30000,
      maxWait: 15000,
    }
  );
  } catch (error) {
    console.error(`[DB] Investigation persistence failed for ${caseNumber}:`, error.message || error);
    throw error;
  }
}

/**
 * Retrieves paginated and filtered cases for Dashboard and Investigations list.
 */
export async function getCases({
  page = 1,
  limit = 50,
  filter = "all",
  searchQuery = "",
  status = "all",
  includeDemo = true,
} = {}) {
  if (!db) return [];

  const where = {};

  if (!includeDemo) {
    where.isDemo = false;
  }

  if (filter && filter !== "all") {
    where.classification = mapClassification(filter);
  }

  if (status && status !== "all") {
    where.status = status.toUpperCase();
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim();
    where.OR = [
      { caseNumber: { contains: q, mode: "insensitive" } },
      { subject: { contains: q, mode: "insensitive" } },
      { sender: { contains: q, mode: "insensitive" } },
    ];
  }

  const cases = await db.case.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
    select: {
      id: true,
      caseNumber: true,
      subject: true,
      sender: true,
      classification: true,
      riskScore: true,
      riskLevel: true,
      confidence: true,
      status: true,
      verdict: true,
      isDemo: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return cases.map((c) => ({
    caseId: c.caseNumber,
    id: c.id,
    subject: c.subject || "No Subject",
    sender: c.sender || "Unknown Sender",
    classification: c.classification.toLowerCase(),
    riskScore: c.riskScore,
    riskLevel: c.riskLevel.toLowerCase(),
    confidence: c.confidence,
    status: c.status,
    verdict: c.verdict,
    isDemo: c.isDemo,
    createdAt: c.createdAt.toISOString(),
  }));
}

/**
 * Retrieves a single complete case by caseNumber or internal ID.
 */
export async function getCaseById(caseIdentifier) {
  if (!db || !caseIdentifier) return null;

  const foundCase = await db.case.findFirst({
    where: {
      OR: [{ caseNumber: caseIdentifier }, { id: caseIdentifier }],
    },
    include: {
      email: true,
      artifacts: {
        include: {
          threatIntelligenceResults: true,
        },
      },
      evidence: {
        orderBy: { riskContribution: "desc" },
      },
      investigationEvents: {
        orderBy: { createdAt: "asc" },
      },
      analystNotes: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!foundCase) return null;

  // Reconstruct into the shape expected by AnalysisResult and ForensicReport
  const email = foundCase.email || {};

  return {
    caseId: foundCase.caseNumber,
    id: foundCase.id,
    createdAt: foundCase.createdAt.toISOString(),
    status: foundCase.status,
    classification: foundCase.classification.toLowerCase(),
    riskScore: foundCase.riskScore,
    riskLevel: foundCase.riskLevel.toLowerCase(),
    confidence: foundCase.confidence,
    verdict: foundCase.verdict,
    categoryScores: foundCase.categoryScores || {},
    summary: foundCase.aiSummary || "",
    recommendation: foundCase.aiRecommendation || "",
    isDemo: foundCase.isDemo,
    metadata: {
      from: email.from || foundCase.sender || "",
      to: email.to || foundCase.recipient || "",
      cc: email.cc || "",
      bcc: email.bcc || "",
      replyTo: email.replyTo || "",
      returnPath: email.returnPath || "",
      subject: email.subject || foundCase.subject || "",
      date: email.date || foundCase.createdAt.toISOString(),
      messageId: email.messageId || "",
      inReplyTo: email.inReplyTo || "",
      references: email.references || "",
    },
    body: {
      text: email.bodyText || "",
    },
    rawHeaders: email.rawHeaders || {},
    attachments: email.attachments || [],
    authentication: email.authentication || {
      spf: { status: "not_available" },
      dkim: { status: "not_available" },
      dmarc: { status: "not_available" },
    },
    identity: email.identity || {},
    consistency: email.consistency || {},
    artifacts: {
      urls: foundCase.artifacts
        .filter((a) => a.type === "URL")
        .map((a) => a.details || { raw: a.value, normalized: a.normalizedValue }),
      domains: foundCase.artifacts
        .filter((a) => a.type === "DOMAIN")
        .map((a) => a.details || { domain: a.value, rootDomain: a.normalizedValue }),
      ips: foundCase.artifacts
        .filter((a) => a.type === "IP")
        .map((a) => a.details || { ip: a.value }),
    },
    threatIntel: {
      urls: foundCase.artifacts
        .flatMap((a) => a.threatIntelligenceResults)
        .map((ti) => ti.rawResult || {
          status: ti.result,
          riskLevel: ti.reputation,
          provider: ti.provider,
        }),
    },
    evidence: foundCase.evidence.map((ev) => ({
      id: ev.evidenceId || ev.id,
      category: ev.category.toLowerCase(),
      type: ev.type,
      source: ev.source,
      evidence: ev.evidence,
      severity: ev.severity.toLowerCase(),
      confidence: ev.confidence,
      riskContribution: ev.riskContribution,
      contribution: ev.riskContribution,
      explanation: ev.explanation,
      finding: ev.explanation,
    })),
    breakdown: foundCase.evidence.map((ev) => ({
      id: ev.evidenceId || ev.id,
      category: ev.category.toLowerCase(),
      type: ev.type,
      source: ev.source,
      evidence: ev.evidence,
      severity: ev.severity.toLowerCase(),
      confidence: ev.confidence,
      riskContribution: ev.riskContribution,
      contribution: ev.riskContribution,
      explanation: ev.explanation,
      finding: ev.explanation,
    })),
    timeline: foundCase.investigationEvents.map((evt) => ({
      id: evt.id,
      timestamp: evt.eventTimestamp ? evt.eventTimestamp.toISOString() : evt.createdAt.toISOString(),
      formattedTime: evt.eventTimestamp
        ? new Date(evt.eventTimestamp).toLocaleString()
        : new Date(evt.createdAt).toLocaleString(),
      type: evt.eventType,
      title: evt.title,
      description: evt.description,
      source: evt.source || "System",
      severity: evt.severity || "info",
    })),
    notes: foundCase.analystNotes.map((n) => ({
      id: n.id,
      note: n.note,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}

/**
 * Returns aggregated statistics for the Dashboard view.
 */
export async function getDashboardStats() {
  if (!db) {
    return {
      totalCases: 0,
      maliciousCount: 0,
      reviewCount: 0,
      benignCount: 0,
      avgRiskScore: 0,
      avgConfidence: 0,
    };
  }

  const [totalCases, maliciousCount, reviewCount, benignCount, aggregate] =
    await Promise.all([
      db.case.count(),
      db.case.count({ where: { classification: "FRAUDULENT" } }),
      db.case.count({ where: { classification: "SUSPICIOUS" } }),
      db.case.count({ where: { classification: "LEGITIMATE" } }),
      db.case.aggregate({
        _avg: {
          riskScore: true,
          confidence: true,
        },
      }),
    ]);

  return {
    totalCases,
    maliciousCount,
    reviewCount,
    benignCount,
    avgRiskScore: Math.round(aggregate._avg.riskScore || 0),
    avgConfidence: Math.round(aggregate._avg.confidence || 0),
  };
}

/**
 * Deletes a case and its cascading relations.
 */
export async function deleteCase(caseIdentifier) {
  if (!db || !caseIdentifier) return false;

  const found = await db.case.findFirst({
    where: {
      OR: [{ caseNumber: caseIdentifier }, { id: caseIdentifier }],
    },
  });

  if (!found) return false;

  await db.case.delete({
    where: { id: found.id },
  });

  return true;
}

/**
 * Updates a case's lifecycle status.
 */
export async function updateCaseStatus(caseIdentifier, status) {
  if (!db || !caseIdentifier) return null;

  const found = await db.case.findFirst({
    where: {
      OR: [{ caseNumber: caseIdentifier }, { id: caseIdentifier }],
    },
  });

  if (!found) return null;

  return await db.case.update({
    where: { id: found.id },
    data: { status: status.toUpperCase() },
  });
}

/**
 * Adds an analyst note to a case.
 */
export async function addAnalystNote(caseIdentifier, noteText, userId = null) {
  if (!db || !caseIdentifier || !noteText) return null;

  const found = await db.case.findFirst({
    where: {
      OR: [{ caseNumber: caseIdentifier }, { id: caseIdentifier }],
    },
  });

  if (!found) return null;

  return await db.analystNote.create({
    data: {
      caseId: found.id,
      note: noteText,
      userId,
    },
  });
}
