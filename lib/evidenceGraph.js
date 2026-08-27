/**
 * Evidence Graph & Relationship Mapping (Steps 77–79)
 *
 * Transforms forensic evidence into a structured directed graph (nodes and edges)
 * representing concrete relationships between the email, senders, domains, URLs, IPs,
 * authentication results, threat intelligence, and risk evaluation.
 */

/**
 * Builds nodes and relationship edges from actual forensic analysis data.
 *
 * @param {Object} params
 * @param {Object} [params.metadata] - Email headers metadata.
 * @param {Object} [params.artifacts] - Extracted URLs, IPs, and Domains.
 * @param {Object} [params.authentication] - SPF, DKIM, DMARC statuses.
 * @param {Object} [params.threatIntel] - Threat intelligence results.
 * @param {Object} [params.aiResult] - AI content indicators.
 * @param {Object} [params.riskData] - Unified risk score and breakdown.
 * @returns {{
 *   nodes: Array<{ id: string, type: string, label: string, sublabel?: string, severity?: string, status?: string }>,
 *   edges: Array<{ source: string, target: string, relationship: string, label: string }>
 * }} Normalized graph representation.
 */
export function generateEvidenceGraph({
  metadata: rawMeta,
  artifacts: rawArt,
  authentication: rawAuth,
  threatIntel: rawTi,
  aiResult: rawAi,
  riskData: rawRisk,
} = {}) {
  const metadata = rawMeta || {};
  const artifacts = rawArt || {};
  const authentication = rawAuth || {};
  const threatIntel = rawTi || {};
  const aiResult = rawAi || {};
  const riskData = rawRisk || {};

  const nodes = [];
  const edges = [];
  const addedNodeIds = new Set();

  function addNode(node) {
    if (!node || !node.id || addedNodeIds.has(node.id)) return;
    addedNodeIds.add(node.id);
    nodes.push(node);
  }

  function addEdge(source, target, relationship, label) {
    if (!source || !target || !addedNodeIds.has(source) || !addedNodeIds.has(target)) return;
    edges.push({ source, target, relationship, label });
  }

  // 1. Root Email Node
  const rootEmailId = "node-email-root";
  addNode({
    id: rootEmailId,
    type: "email",
    label: "Email Message",
    sublabel: metadata.subject ? `"${metadata.subject.slice(0, 30)}..."` : "RFC 5322",
    severity: "info",
  });

  // 2. Sender Node
  if (metadata.from) {
    const senderId = "node-sender";
    addNode({
      id: senderId,
      type: "sender",
      label: "Sender",
      sublabel: metadata.from.slice(0, 32),
      severity: "info",
    });
    addEdge(rootEmailId, senderId, "sent-by", "sent by");
  }

  // 3. Recipient Node
  if (metadata.to) {
    const recipientId = "node-recipient";
    addNode({
      id: recipientId,
      type: "recipient",
      label: "Recipient",
      sublabel: metadata.to.slice(0, 32),
      severity: "info",
    });
    addEdge(rootEmailId, recipientId, "sent-to", "sent to");
  }

  // 4. Authentication Nodes (SPF, DKIM, DMARC)
  const spf = authentication.spf;
  const dkim = authentication.dkim;
  const dmarc = authentication.dmarc;

  if (spf && spf.status && spf.status !== "not_available") {
    const spfId = "node-auth-spf";
    const isFail = spf.status === "fail" || spf.status === "permerror";
    addNode({
      id: spfId,
      type: "spf",
      label: `SPF: ${String(spf.status).toUpperCase()}`,
      sublabel: spf.domain || "Envelope Sender",
      status: spf.status,
      severity: isFail ? "high" : "info",
    });
    addEdge(rootEmailId, spfId, "authenticated-by", "verified by");
  }

  if (dkim && dkim.status && dkim.status !== "not_available") {
    const dkimId = "node-auth-dkim";
    const isFail = dkim.status === "fail" || dkim.status === "permerror";
    addNode({
      id: dkimId,
      type: "dkim",
      label: `DKIM: ${String(dkim.status).toUpperCase()}`,
      sublabel: dkim.signingDomain ? `d=${dkim.signingDomain}` : "Signature",
      status: dkim.status,
      severity: isFail ? "high" : "info",
    });
    addEdge(rootEmailId, dkimId, "authenticated-by", "signed with");
  }

  if (dmarc && dmarc.status && dmarc.status !== "not_available") {
    const dmarcId = "node-auth-dmarc";
    const isFail = dmarc.status === "fail" || dmarc.status === "permerror";
    addNode({
      id: dmarcId,
      type: "dmarc",
      label: `DMARC: ${String(dmarc.status).toUpperCase()}`,
      sublabel: dmarc.policy ? `p=${dmarc.policy}` : "Policy",
      status: dmarc.status,
      severity: isFail ? "critical" : "info",
    });
    addEdge(rootEmailId, dmarcId, "authenticated-by", "enforced by");
  }

  // 5. Extracted URLs & Domains
  const urls = Array.isArray(artifacts.urls) ? artifacts.urls.slice(0, 5) : [];
  urls.forEach((urlArt, idx) => {
    const urlNodeId = `node-url-${idx}`;
    const isMaliciousLocal = urlArt.localObservations?.length > 0;

    addNode({
      id: urlNodeId,
      type: "url",
      label: "Embedded URL",
      sublabel: urlArt.hostname || urlArt.normalized.slice(0, 26),
      severity: isMaliciousLocal ? "medium" : "info",
    });
    addEdge(rootEmailId, urlNodeId, "contains", "contains link");

    // Connect URL to its Root Domain
    if (urlArt.rootDomain && urlArt.rootDomain !== urlArt.hostname) {
      const domainNodeId = `node-domain-${urlArt.rootDomain}`;
      addNode({
        id: domainNodeId,
        type: "domain",
        label: "Root Domain",
        sublabel: urlArt.rootDomain,
        severity: "info",
      });
      addEdge(urlNodeId, domainNodeId, "resolves-to", "resolves to");
    }

    // Connect URL to Threat Intelligence lookup if exists
    const matchingTi = (threatIntel.urls || []).find(
      (t) => t.artifact === urlArt.normalized || t.artifact === urlArt.original
    );
    if (matchingTi && matchingTi.status !== "unknown") {
      const tiNodeId = `node-ti-url-${idx}`;
      addNode({
        id: tiNodeId,
        type: "threat-intelligence",
        label: `Threat Intel: ${matchingTi.status.toUpperCase()}`,
        sublabel: matchingTi.source || "Feed",
        severity: matchingTi.status === "malicious" ? "critical" : "high",
      });
      addEdge(urlNodeId, tiNodeId, "reported-by", "reputation");
    }
  });

  // 6. Transmission Relay IPs
  const ips = Array.isArray(artifacts.ips) ? artifacts.ips.slice(0, 3) : [];
  ips.forEach((ipArt, idx) => {
    const ipNodeId = `node-ip-${idx}`;
    addNode({
      id: ipNodeId,
      type: "ip",
      label: `Hop IP: ${ipArt.ip}`,
      sublabel: `${ipArt.type} network`,
      severity: "info",
    });
    addEdge(rootEmailId, ipNodeId, "received-from", "routed via");
  });

  // 7. AI Threat Findings
  const indicators = Array.isArray(aiResult.indicators) ? aiResult.indicators.slice(0, 3) : [];
  indicators.forEach((ind, idx) => {
    const aiNodeId = `node-ai-${idx}`;
    addNode({
      id: aiNodeId,
      type: "ai",
      label: ind.type || "Threat Pattern",
      sublabel: ind.description ? ind.description.slice(0, 30) + "..." : "AI Finding",
      severity: ind.severity || "medium",
    });
    addEdge(rootEmailId, aiNodeId, "indicates", "exhibits");
  });

  // 8. Unified Risk Verdict Node
  if (typeof riskData.riskScore === "number") {
    const riskNodeId = "node-risk-verdict";
    addNode({
      id: riskNodeId,
      type: "risk",
      label: `Risk: ${riskData.riskScore}/100`,
      sublabel: String(riskData.riskLevel || "").toUpperCase(),
      severity: riskData.riskLevel === "critical" ? "critical" : riskData.riskLevel === "high" ? "high" : "info",
    });

    // Connect top findings to Risk Node
    nodes.forEach((n) => {
      if (
        (n.type === "ai" || n.type === "threat-intelligence" || (n.severity === "high" || n.severity === "critical")) &&
        n.id !== riskNodeId &&
        n.id !== rootEmailId
      ) {
        addEdge(n.id, riskNodeId, "contributes-to", "increases risk");
      }
    });
  }

  return { nodes, edges };
}

export default generateEvidenceGraph;
