import React, { useState } from "react";
import {
  Calculator,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Info,
  Filter,
} from "lucide-react";
import EvidenceCategory, { normalizeCategoryKey } from "./EvidenceCategory";
import EvidenceCard from "./EvidenceCard";

/**
 * Visual stages in the explainable evidence chain.
 */
const EVIDENCE_CHAIN_STEPS = [
  { step: "1", title: "Email Header & Body", sub: "RFC 5322 Ingress" },
  { step: "2", title: "Observed Evidence", sub: "Header / URL / Snippet" },
  { step: "3", title: "Artifact Extraction", sub: "Domain / IP / URL / Pattern" },
  { step: "4", title: "Deterministic Analysis", sub: "Policy / Intel / Heuristics" },
  { step: "5", title: "Risk Contribution", sub: "+Points to Budget" },
  { step: "6", title: "Final Verdict", sub: "Transparent Classification" },
];

/**
 * Filter categories for the evidence item list.
 */
const FILTER_TABS = [
  { id: "all", label: "All Evidence" },
  { id: "threatIntelligence", label: "Threat Intel" },
  { id: "ai", label: "AI Content" },
  { id: "authentication", label: "Authentication" },
  { id: "identity", label: "Sender Identity" },
];

/**
 * WhyThisScore Component (Dark Cybersecurity SOC Console Breakdown)
 *
 * Answers the core question: "Why did this email receive this risk score?"
 * Shows:
 * 1. Category budget meters (Threat Intel, AI Content, Auth, Identity).
 * 2. Visual Evidence Chain flow.
 * 3. Filterable list of forensic evidence items with exact point contributions.
 *
 * @param {Object} props
 * @param {Array<Object>} [props.evidence=[]] - Array of normalized EvidenceItem objects.
 * @param {Object} [props.categoryScores={}] - Scores per category.
 * @param {number} props.riskScore - Final unified risk score (0-100).
 * @param {string} [props.riskLevel="medium"] - Severity level ("low"|"medium"|"high"|"critical").
 * @param {string} [props.verdict] - Human-readable verdict string.
 * @param {number} [props.aiRiskScore] - Optional baseline AI score for comparison.
 */
export default function WhyThisScore({
  evidence = [],
  categoryScores = {},
  riskScore = 0,
  riskLevel = "medium",
  verdict,
  aiRiskScore,
}) {
  const [selectedFilter, setSelectedFilter] = useState("all");

  const safeEvidence = Array.isArray(evidence) ? evidence : [];

  const filteredEvidence = safeEvidence.filter((item) => {
    if (selectedFilter === "all") return true;
    return normalizeCategoryKey(item.category) === selectedFilter;
  });

  const isMalicious = riskScore >= 75 || riskLevel === "critical";
  const isSuspicious = riskScore >= 25 || riskLevel === "medium" || riskLevel === "high";

  return (
    <div className="space-y-5 rounded-xl border border-[#27272A] bg-[#111113] p-5 shadow-2xs">
      {/* 1. Header Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#27272A] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#18181B] text-indigo-400 border border-[#27272A]">
            <Calculator className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F4F4F5]">
                Why This Email Is Risky — Evidence Chain
              </h3>
              {verdict && (
                <span className="font-mono text-[10px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 rounded">
                  {verdict}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#71717A]">
              Transparent, evidence-backed mathematical score composition across independent vectors
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-[#71717A]">
          {typeof aiRiskScore === "number" && (
            <span>AI Baseline: <strong className="text-[#F4F4F5]">{aiRiskScore}</strong> • </span>
          )}
          <span>Unified Risk: <strong className="text-indigo-400 font-bold">{riskScore} / 100</strong></span>
        </div>
      </div>

      {/* 2. Visual Evidence Chain Architecture Flow */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Forensic Evidence Traceability Chain</span>
          </div>
          <span className="text-[10px] font-mono text-[#71717A]">
            Deterministic Evidence ──&gt; Risk Score
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 pt-1">
          {EVIDENCE_CHAIN_STEPS.map((s, idx) => (
            <div
              key={s.step}
              className="relative flex flex-col rounded-lg bg-[#141417] p-2.5 border border-[#27272A] text-left"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500/20 text-[9px] font-mono font-bold text-indigo-400 border border-indigo-500/30">
                  {s.step}
                </span>
                {idx < EVIDENCE_CHAIN_STEPS.length - 1 && (
                  <ArrowRight className="hidden lg:block h-3 w-3 text-[#3F3F46]" />
                )}
              </div>
              <p className="mt-1.5 text-[11px] font-semibold text-[#F4F4F5] leading-tight">
                {s.title}
              </p>
              <p className="mt-0.5 text-[9px] font-mono text-[#71717A] leading-tight truncate">
                {s.sub}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Category Score Composition Grid (Max 100 pts) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
            Category Budget Allocation (Max 100 Points)
          </span>
          <span className="font-mono text-[11px] text-[#A1A1AA]">
            Total: <strong className="text-[#F4F4F5]">{riskScore}</strong> / 100
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <EvidenceCategory
            categoryKey="threatIntelligence"
            score={categoryScores.threatIntelligence || categoryScores.threatIntel || 0}
            max={30}
          />
          <EvidenceCategory
            categoryKey="ai"
            score={categoryScores.aiContent || categoryScores.ai || 0}
            max={30}
          />
          <EvidenceCategory
            categoryKey="authentication"
            score={categoryScores.authentication || 0}
            max={25}
          />
          <EvidenceCategory
            categoryKey="identity"
            score={categoryScores.identity || categoryScores.senderConsistency || 0}
            max={15}
          />
        </div>
      </div>

      {/* 4. Itemized Evidence Chain Findings */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-[#27272A] pt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F4F4F5]">
              Discovered Evidence Items ({safeEvidence.length})
            </span>
            <span className="text-[10px] text-[#71717A]">
              Sorted by risk contribution
            </span>
          </div>

          {/* Filter Pills */}
          {safeEvidence.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto rounded-lg bg-[#18181B] p-1 border border-[#27272A]">
              {FILTER_TABS.map((tab) => {
                const count =
                  tab.id === "all"
                    ? safeEvidence.length
                    : safeEvidence.filter(
                        (e) => normalizeCategoryKey(e.category) === tab.id
                      ).length;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedFilter(tab.id)}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all ${
                      selectedFilter === tab.id
                        ? "bg-[#27272A] text-white shadow-xs"
                        : "text-[#71717A] hover:text-[#F4F4F5]"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="font-mono text-[9px] opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Evidence Card Grid */}
        {filteredEvidence.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {filteredEvidence.map((item, idx) => (
              <EvidenceCard key={item.id || `ev-${idx}`} evidence={item} />
            ))}
          </div>
        ) : safeEvidence.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-semibold text-emerald-300">
              Zero Malicious Evidence Points Added
            </h4>
            <p className="mt-1 max-w-md text-xs text-[#71717A]">
              Authentication records passed or neutral, sender identities are aligned, zero malicious URLs/IPs were reported in threat intelligence, and no social engineering patterns were detected.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#27272A] bg-[#141417] p-6 text-center text-xs text-[#71717A]">
            No evidence items in the &ldquo;{selectedFilter}&rdquo; category for this email.
          </div>
        )}
      </div>

      {/* 5. Summary Footer */}
      <div className="flex items-center justify-between border-t border-[#27272A] pt-3 text-xs">
        <span className="text-[#71717A] font-medium">
          Calculated Forensic Risk Score:
        </span>
        <div className="flex items-baseline gap-2 font-mono">
          <span
            className={`text-base font-extrabold ${
              isMalicious
                ? "text-rose-400"
                : isSuspicious
                ? "text-amber-400"
                : "text-emerald-400"
            }`}
          >
            {riskScore}
          </span>
          <span className="text-[#71717A]">/ 100</span>
          <span className="text-[10px] uppercase font-bold text-[#A1A1AA]">
            ({riskLevel})
          </span>
        </div>
      </div>
    </div>
  );
}
