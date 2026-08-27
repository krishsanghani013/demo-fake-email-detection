import React from "react";
import {
  Calculator,
  PlusCircle,
  ShieldAlert,
  Bot,
  Globe,
  MailCheck,
  GitCompare,
  Info,
} from "lucide-react";
import { CATEGORY_WEIGHTS } from "@/lib/riskEngine";

/**
 * Returns an appropriate icon and styling based on evidence category.
 */
function getCategoryVisuals(category) {
  const norm = String(category || "").toLowerCase();

  if (norm.includes("threat") || norm.includes("url") || norm.includes("ip") || norm.includes("domain")) {
    return {
      label: "Threat Intelligence",
      icon: Globe,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    };
  }
  if (norm.includes("auth") || norm.includes("spf") || norm.includes("dkim") || norm.includes("dmarc")) {
    return {
      label: "Authentication",
      icon: MailCheck,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    };
  }
  if (norm.includes("sender") || norm.includes("consistency") || norm.includes("identity")) {
    return {
      label: "Sender Consistency",
      icon: GitCompare,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    };
  }

  return {
    label: "AI Content Analysis",
    icon: Bot,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  };
}

/**
 * RiskBreakdown Component (Dark Cybersecurity SOC Console Breakdown)
 *
 * Displays the transparent, evidence-traceable calculation explaining why the email
 * received its unified risk score.
 *
 * @param {Object} props
 * @param {Array<Object>} [props.breakdown=[]] - Sorted list of evidence score contributions.
 * @param {Object} [props.categoryScores={}] - Scores per category { ai, authentication, identity, threatIntelligence }.
 * @param {number} props.riskScore - Final unified risk score (0-100).
 * @param {number} [props.aiRiskScore] - Original AI score for transparent comparison.
 */
export default function RiskBreakdown({
  breakdown = [],
  categoryScores = {},
  riskScore = 0,
  aiRiskScore,
}) {
  const safeBreakdown = Array.isArray(breakdown) ? breakdown : [];

  return (
    <div className="space-y-4 rounded-xl border border-[#27272A] bg-[#111113] p-5 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#27272A] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#18181B] text-indigo-400 border border-[#27272A]">
            <Calculator className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
              Why This Score? (Explainable Forensic Breakdown)
            </h3>
            <p className="text-[11px] text-[#71717A]">
              Mathematical score composition across independent evidence sources
            </p>
          </div>
        </div>

        {typeof aiRiskScore === "number" && (
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#71717A]">
            <span>AI Baseline: <strong className="text-[#F4F4F5]">{aiRiskScore}</strong></span>
            <span>•</span>
            <span>Unified Risk: <strong className="text-indigo-400">{riskScore}</strong></span>
          </div>
        )}
      </div>

      {/* Category Contribution Bars */}
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        {/* Threat Intelligence */}
        <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-2.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-purple-300 font-mono">
            <span>Threat Intel</span>
            <span>{categoryScores.threatIntelligence || 0} / {CATEGORY_WEIGHTS.threatIntelligence}</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#18181B]">
            <div
              className="h-full rounded-full bg-purple-500"
              style={{
                width: `${Math.min(100, ((categoryScores.threatIntelligence || 0) / CATEGORY_WEIGHTS.threatIntelligence) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* AI Content Analysis */}
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-300 font-mono">
            <span>AI Content</span>
            <span>{categoryScores.ai || 0} / {CATEGORY_WEIGHTS.ai}</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#18181B]">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{
                width: `${Math.min(100, ((categoryScores.ai || 0) / CATEGORY_WEIGHTS.ai) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Authentication */}
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-2.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-blue-300 font-mono">
            <span>Authentication</span>
            <span>{categoryScores.authentication || 0} / {CATEGORY_WEIGHTS.authentication}</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#18181B]">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{
                width: `${Math.min(100, ((categoryScores.authentication || 0) / CATEGORY_WEIGHTS.authentication) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Sender Consistency */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-amber-300 font-mono">
            <span>Consistency</span>
            <span>{categoryScores.identity || 0} / {CATEGORY_WEIGHTS.identity}</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#18181B]">
            <div
              className="h-full rounded-full bg-amber-500"
              style={{
                width: `${Math.min(100, ((categoryScores.identity || 0) / CATEGORY_WEIGHTS.identity) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Itemized Evidence Contributions */}
      {safeBreakdown.length > 0 ? (
        <div className="space-y-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#71717A]">
            Itemized Evidence Contributions ({safeBreakdown.length})
          </span>

          <div className="space-y-1.5">
            {safeBreakdown.map((item, idx) => {
              const visuals = getCategoryVisuals(item.category);
              const VisualIcon = visuals.icon;

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-[#27272A] bg-[#141417] p-2.5 text-xs transition-colors hover:border-[#3F3F46]"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-3">
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${visuals.border} ${visuals.bg} ${visuals.color}`}>
                      <VisualIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#F4F4F5] truncate">
                        {item.finding}
                      </p>
                      <span className="text-[10px] text-[#71717A] capitalize font-mono">
                        {item.source} • {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 font-mono font-bold text-rose-400 text-xs">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>+{item.contribution} pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-emerald-500/30 bg-emerald-500/5 p-3 text-center text-xs text-emerald-300">
          <Info className="mx-auto h-4 w-4 text-emerald-400" />
          <p className="mt-1 font-semibold">Zero Malicious Evidence Points Added</p>
          <p className="text-[11px] text-[#71717A]">
            No phishing patterns, authentication failures, domain mismatches, or malicious artifacts were detected.
          </p>
        </div>
      )}

      {/* Total Score Footer */}
      <div className="flex items-center justify-between border-t border-[#27272A] pt-3 text-xs font-semibold">
        <span className="text-[#71717A]">Calculated Unified Forensic Risk:</span>
        <span className="font-mono text-sm font-bold text-[#F4F4F5]">
          {riskScore} / 100
        </span>
      </div>
    </div>
  );
}
