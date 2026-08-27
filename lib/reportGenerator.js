/**
 * Forensic Report & PDF Generator (Steps 82, 84 & 85)
 *
 * Provides client-side export functions for:
 * 1. JSON evidence export (email-forensics-<caseId>.json)
 * 2. PDF report generation with selectable text (email-forensics-<caseId>.pdf)
 *
 * Uses the normalized, sanitized investigation snapshot as the single source of truth.
 */

import { jsPDF } from "jspdf";
import { sanitizeForExport } from "./exportSanitizer.js";

/**
 * Triggers a client-side download of the sanitized investigation snapshot as formatted JSON (Step 82).
 *
 * @param {Object} rawSnapshot - Investigation data snapshot.
 */
export function exportJsonReport(rawSnapshot) {
  if (!rawSnapshot) {
    throw new Error("No investigation data available for export.");
  }

  // Step 85: Strict sanitization layer
  const snapshot = sanitizeForExport(rawSnapshot);
  const caseId = snapshot.case?.id || "unknown-case";
  const jsonContent = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `email-forensics-${caseId}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a clean, professional PDF forensic report with selectable text (Step 84).
 *
 * @param {Object} rawSnapshot - Investigation data snapshot.
 */
export function exportPdfReport(rawSnapshot) {
  if (!rawSnapshot) {
    throw new Error("No investigation data available for PDF export.");
  }

  // Step 85: Strict sanitization layer
  const snapshot = sanitizeForExport(rawSnapshot);
  const caseId = snapshot.case?.id || "unknown-case";
  const createdAt = snapshot.case?.createdAt || new Date().toISOString();

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  function checkPageBreak(neededHeight) {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawHeader();
    }
  }

  function drawHeader() {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("AI EMAIL FORENSICS DEMO — INVESTIGATION REPORT", margin, y);
    doc.text(`CASE: ${caseId}`, pageWidth - margin, y, { align: "right" });
    y += 4;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  }

  // --- 1. Top Document Header ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text("EMAIL FORENSIC INVESTIGATION REPORT", margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Case ID: ${caseId}   |   Analysis Timestamp: ${createdAt}`, margin, y);
  y += 6;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // --- 2. Executive Summary Banner ---
  const risk = snapshot.risk || {};
  const classification = String(risk.classification || "UNKNOWN").toUpperCase();
  const riskScore = risk.score ?? 0;
  const riskLevel = String(risk.level || "MEDIUM").toUpperCase();
  const confidence = risk.confidence ?? 0;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`VERDICT: ${classification}`, margin + 5, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Unified Risk Score: ${riskScore} / 100 (${riskLevel} SEVERITY)`, margin + 5, y + 13);
  doc.text(`Forensic Confidence: ${confidence}%`, margin + 5, y + 18);
  y += 28;

  // --- 3. Email Information Section ---
  checkPageBreak(35);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("1. EMAIL INFORMATION", margin, y);
  y += 5;

  const emailMeta = snapshot.email?.metadata || {};
  const metaLines = [
    `Subject: ${emailMeta.subject || "No Subject"}`,
    `From: ${emailMeta.from || "Unknown"}`,
    `To: ${emailMeta.to || "Unknown"}`,
    `Date: ${emailMeta.date || "Unknown"}`,
    `Reply-To: ${emailMeta.replyTo || "None specified"}`,
    `Message-ID: ${emailMeta.messageId || "None"}`,
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  for (const line of metaLines) {
    const wrapped = doc.splitTextToSize(line, contentWidth);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 4;
  }
  y += 4;

  // --- 4. Technical Authentication Section ---
  checkPageBreak(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("2. EMAIL AUTHENTICATION EVIDENCE", margin, y);
  y += 5;

  const auth = snapshot.authentication || {};
  const authLines = [
    `SPF: ${String(auth.spf?.status || "NOT AVAILABLE").toUpperCase()}${auth.spf?.domain ? ` (Domain: ${auth.spf.domain})` : ""}`,
    `DKIM: ${String(auth.dkim?.status || "NOT AVAILABLE").toUpperCase()}${auth.dkim?.signingDomain ? ` (Signed: ${auth.dkim.signingDomain})` : ""}`,
    `DMARC: ${String(auth.dmarc?.status || "NOT AVAILABLE").toUpperCase()}${auth.dmarc?.policy ? ` (Policy: ${auth.dmarc.policy})` : ""}`,
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  for (const line of authLines) {
    doc.text(`• ${line}`, margin, y);
    y += 4.5;
  }
  y += 4;

  // --- 5. Sender & Header Consistency ---
  checkPageBreak(25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("3. SENDER & ROUTING CONSISTENCY", margin, y);
  y += 5;

  const identity = snapshot.identity || {};
  const consistency = snapshot.consistency || {};
  const identLines = [
    `From Domain: ${identity.fromDomain || "N/A"}   |   Reply-To Domain: ${identity.replyToDomain || "None"}`,
    `DKIM Domain: ${identity.dkimDomain || "None"}   |   SPF Domain: ${identity.spfDomain || "None"}`,
    `Alignment Status: ${consistency.status || "Evaluated"}`,
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  for (const line of identLines) {
    doc.text(`• ${line}`, margin, y);
    y += 4.5;
  }
  y += 4;

  // --- 6. Threat Intelligence & Artifacts ---
  const ti = snapshot.threatIntelligence || {};
  const tiUrls = Array.isArray(ti.urls) ? ti.urls : [];
  const tiIps = Array.isArray(ti.ips) ? ti.ips : [];

  if (tiUrls.length > 0 || tiIps.length > 0) {
    checkPageBreak(35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("4. THREAT INTELLIGENCE ARTIFACTS", margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);

    tiUrls.forEach((u) => {
      const line = `URL: ${u.artifact} [STATUS: ${String(u.status || "UNKNOWN").toUpperCase()}] (Source: ${u.source || "Threat Engine"})`;
      const wrapped = doc.splitTextToSize(line, contentWidth);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 4;
    });

    tiIps.forEach((ip) => {
      const line = `IP: ${ip.artifact} [STATUS: ${String(ip.status || "UNKNOWN").toUpperCase()}] (${ip.source || "IP Intel"})`;
      doc.text(`• ${line}`, margin, y);
      y += 4.5;
    });
    y += 4;
  }

  // --- 7. Explainable Risk Breakdown ---
  const breakdown = Array.isArray(risk.breakdown) ? risk.breakdown : [];
  if (breakdown.length > 0) {
    checkPageBreak(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("5. EXPLAINABLE RISK BREAKDOWN", margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    breakdown.forEach((item) => {
      const line = `+${item.contribution} pts: ${item.finding} (${item.source || "Evidence"})`;
      const wrapped = doc.splitTextToSize(line, contentWidth);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 4;
    });
    y += 4;
  }

  // --- 8. Chronological Timeline ---
  const timeline = Array.isArray(snapshot.timeline) ? snapshot.timeline : [];
  if (timeline.length > 0) {
    checkPageBreak(35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("6. CHRONOLOGICAL INVESTIGATION TIMELINE", margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    timeline.forEach((event) => {
      const line = `[${event.formattedTime || "Event"}] ${event.title}: ${event.description}`;
      const wrapped = doc.splitTextToSize(line, contentWidth);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 3.8;
    });
    y += 4;
  }

  // --- 9. Evidence Relationships Text Representation (Step 84) ---
  const edges = Array.isArray(snapshot.graph?.edges) ? snapshot.graph.edges : [];
  if (edges.length > 0) {
    checkPageBreak(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("7. EVIDENCE RELATIONSHIPS", margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    edges.slice(0, 10).forEach((edge) => {
      const line = `${edge.source}  --[ ${edge.relationship} ]-->  ${edge.target}`;
      doc.text(`• ${line}`, margin, y);
      y += 4;
    });
    y += 4;
  }

  // --- 10. Recommendation & Disclaimer ---
  checkPageBreak(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("8. ACTIONABLE RECOMMENDATION", margin, y);
  y += 5;

  const recommendation = snapshot.aiAnalysis?.recommendation || "Maintain standard email security practices.";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const recWrapped = doc.splitTextToSize(recommendation, contentWidth);
  doc.text(recWrapped, margin, y);
  y += recWrapped.length * 4 + 6;

  // Footer Disclaimer
  checkPageBreak(15);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Disclaimer: This report was deterministically compiled by the AI Email Forensics platform. Evidence is observational and subject to server header veracity.",
    margin,
    y
  );

  // Save the PDF
  doc.save(`email-forensics-${caseId}.pdf`);
}
