import React from "react";
import {
  FileText,
  ShieldAlert,
  Layers,
  Fingerprint,
  Calendar,
  Lightbulb,
} from "lucide-react";

/**
 * InvestigationSummary Component (Dark SOC Console Executive Briefing)
 *
 * Displays an executive investigation briefing with Case ID, Classification,
 * Unified Risk Score, Confidence, Key Forensic Findings, Artifact Counts,
 * and Actionable Guidance.
 *
 * @param {Object} props
 * @param {Object} props.result - Complete analysis result object.
 */
export default function InvestigationSummary({ result }) {
  if (!result) return null;

  const {
    caseId = "EML-ACTIVE-SESSION",
    createdAt,
    classification = "suspicious",
    riskScore = 0,
    riskLevel = "medium",
    confidence = 0,
    breakdown = [],
    recommendation = "",
  } = result;

  const authentication = result.authentication || {};
  const artifacts = result.artifacts || {};
  const threatIntel = result.threatIntel || {};
  const consistency = result.consistency || {};

  // Calculate active evidence sources
  const activeSources = [];
  if (result.categoryScores?.ai > 0 || (result.indicators && result.indicators.length > 0)) {
    activeSources.push("AI Content Analysis");
  }
  if (authentication && authentication.spf?.status && authentication.spf.status !== "not_available") {
    activeSources.push("Email Authentication");
  }
  if (consistency && (consistency.replyToMismatch || consistency.dkimDomainMismatch)) {
    activeSources.push("Sender Consistency");
  }
  if (threatIntel && (threatIntel.urls?.length > 0 || threatIntel.ips?.length > 0)) {
    activeSources.push("Threat Intelligence");
  }

  // Count discovered artifacts safely
  const urlCount = artifacts?.urls?.length || result.urls?.length || 0;
  const ipCount = artifacts?.ips?.length || 0;
  const domainCount = artifacts?.domains?.length || 0;
  const attachmentCount = result.attachments?.length || 0;

  // Threat intelligence summary safely
  const tiUrls = Array.isArray(threatIntel?.urls) ? threatIntel.urls : [];
  const tiIps = Array.isArray(threatIntel?.ips) ? threatIntel.ips : [];
  const allTi = [...tiUrls, ...tiIps];
  const maliciousTiCount = allTi.filter((t) => t?.status === "malicious").length;
  const suspiciousTiCount = allTi.filter((t) => t?.status === "suspicious").length;
  const cleanTiCount = allTi.filter((t) => t?.status === "clean" || t?.status === "unknown").length;

  // Top Key Findings from breakdown
  const safeBreakdown = Array.isArray(breakdown) ? breakdown : [];
  const topFindings = safeBreakdown.slice(0, 4);

  return (
    <div className="space-y-4 rounded-xl border border-[#27272A] bg-[#111113] p-5 shadow-2xs">
      {/* Section Header with Case ID */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#27272A] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#18181B] text-indigo-400 border border-[#27272A]">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
              Investigation Summary
            </h3>
            <p className="text-[11px] text-[#71717A]">
              Executive forensic briefing and prioritized evidence synthesis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 rounded-md bg-[#18181B] px-2.5 py-1 text-[#F4F4F5] border border-[#27272A]">
            <Fingerprint className="h-3.5 w-3.5 text-indigo-400" />
            <span>{caseId}</span>
          </div>
          {createdAt && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#71717A]">
              <Calendar className="h-3 w-3" />
              <span>{new Date(createdAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Key Investigation Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Classification */}
        <div className="rounded-lg border border-[#27272A] bg-[#141417] p-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#71717A]">
            Classification
          </span>
          <p className="mt-1 text-sm font-bold uppercase text-[#F4F4F5]">
            {classification}
          </p>
          <span className="text-[10px] font-medium text-[#71717A] capitalize">
            {riskLevel} severity
          </span>
        </div>

        {/* Unified Risk Score */}
        <div className="rounded-lg border border-[#27272A] bg-[#141417] p-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#71717A]">
            Unified Risk
          </span>
          <p className="mt-1 font-mono text-sm font-bold text-indigo-400">
            {riskScore} / 100
          </p>
          <span className="text-[10px] font-medium text-[#71717A]">
            Math verified
          </span>
        </div>

        {/* Forensic Confidence */}
        <div className="rounded-lg border border-[#27272A] bg-[#141417] p-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#71717A]">
            Confidence
          </span>
          <p className="mt-1 font-mono text-sm font-bold text-emerald-400">
            {confidence}%
          </p>
          <span className="text-[10px] font-medium text-[#71717A]">
            Signal convergence
          </span>
        </div>

        {/* Active Evidence Sources */}
        <div className="rounded-lg border border-[#27272A] bg-[#141417] p-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#71717A]">
            Active Sources
          </span>
          <p className="mt-1 font-mono text-sm font-bold text-purple-400">
            {activeSources.length || 1}
          </p>
          <span className="text-[10px] font-medium text-[#71717A]">
            Independent channels
          </span>
        </div>
      </div>

      {/* Two Columns: Key Findings & Forensic Evidence Stats */}
      <div className="grid grid-cols-1 gap-4 pt-1 md:grid-cols-2">
        {/* Left: Key Findings */}
        <div className="rounded-lg border border-[#27272A] bg-[#141417] p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
            <span>Key Forensic Findings</span>
          </div>

          {topFindings.length > 0 ? (
            <ul className="mt-2 space-y-1.5 text-xs">
              {topFindings.map((finding, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-[#D4D4D8]"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  <span className="text-[11px] leading-relaxed">
                    <strong className="text-rose-400 font-mono">+{finding.contribution} pts:</strong> {finding.finding}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[11px] text-[#71717A]">
              No elevated risk findings detected in this email.
            </p>
          )}
        </div>

        {/* Right: Discovered Artifacts & Technical Authentication */}
        <div className="space-y-3 rounded-lg border border-[#27272A] bg-[#141417] p-3.5">
          {/* Artifacts Summary */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              <span>Extracted Artifacts</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[#D4D4D8]">
              <span className="rounded-md bg-[#18181B] px-2.5 py-1 font-mono border border-[#27272A]">
                <strong className="text-[#F4F4F5]">{urlCount}</strong> URLs
              </span>
              <span className="rounded-md bg-[#18181B] px-2.5 py-1 font-mono border border-[#27272A]">
                <strong className="text-[#F4F4F5]">{domainCount}</strong> Domains
              </span>
              <span className="rounded-md bg-[#18181B] px-2.5 py-1 font-mono border border-[#27272A]">
                <strong className="text-[#F4F4F5]">{ipCount}</strong> IPs
              </span>
              {attachmentCount > 0 && (
                <span className="rounded-md bg-[#18181B] px-2.5 py-1 font-mono border border-[#27272A]">
                  <strong className="text-[#F4F4F5]">{attachmentCount}</strong> Files
                </span>
              )}
            </div>
          </div>

          {/* Authentication & Threat Intel Summary */}
          <div className="border-t border-[#27272A] pt-2.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[#71717A]">
              <span>Authentication:</span>
              <span className="font-mono text-xs font-semibold text-[#F4F4F5]">
                SPF: {String(authentication?.spf?.status || "N/A").toUpperCase()} • DKIM: {String(authentication?.dkim?.status || "N/A").toUpperCase()} • DMARC: {String(authentication?.dmarc?.status || "N/A").toUpperCase()}
              </span>
            </div>

            {allTi.length > 0 && (
              <div className="flex items-center justify-between text-[11px] text-[#71717A]">
                <span>Threat Intelligence:</span>
                <span className="font-mono text-xs font-semibold">
                  {maliciousTiCount > 0 && (
                    <span className="text-rose-400">{maliciousTiCount} Malicious • </span>
                  )}
                  {suspiciousTiCount > 0 && (
                    <span className="text-amber-400">{suspiciousTiCount} Suspicious • </span>
                  )}
                  <span className="text-[#71717A]">{cleanTiCount} Clean</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actionable Guidance / Recommendation */}
      {recommendation && (
        <div className="flex items-start gap-2.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs text-indigo-300">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
          <div className="space-y-0.5">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-indigo-400">
              Forensic Recommendation
            </span>
            <p className="leading-relaxed text-[11px] text-[#D4D4D8]">{recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
