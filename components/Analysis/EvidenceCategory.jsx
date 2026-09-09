import React from "react";
import { Bot, ShieldCheck, GitCompare, Globe } from "lucide-react";

/**
 * Visual configuration for the 4 core evidence categories.
 */
export const CATEGORY_CONFIG = {
  ai: {
    label: "AI Content Analysis",
    shortLabel: "AI Content",
    max: 30,
    icon: Bot,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    barBg: "bg-emerald-500",
  },
  authentication: {
    label: "Email Authentication",
    shortLabel: "Authentication",
    max: 25,
    icon: ShieldCheck,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    barBg: "bg-blue-500",
  },
  identity: {
    label: "Identity & Consistency",
    shortLabel: "Identity",
    max: 15,
    icon: GitCompare,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    barBg: "bg-amber-500",
  },
  threatIntelligence: {
    label: "Threat Intelligence & Artifacts",
    shortLabel: "Threat Intel",
    max: 30,
    icon: Globe,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    barBg: "bg-purple-500",
  },
};

/**
 * Normalizes category key to one of: "ai", "authentication", "identity", "threatIntelligence".
 */
export function normalizeCategoryKey(catKey) {
  const k = String(catKey || "").toLowerCase();
  if (k.includes("threat") || k.includes("url") || k.includes("ip") || k.includes("domain") || k.includes("artifact")) {
    return "threatIntelligence";
  }
  if (k.includes("auth") || k.includes("spf") || k.includes("dkim") || k.includes("dmarc")) {
    return "authentication";
  }
  if (k.includes("ident") || k.includes("consist") || k.includes("sender")) {
    return "identity";
  }
  return "ai";
}

/**
 * EvidenceCategory Component
 *
 * Displays a category score budget meter (points / cap) with progress bar.
 *
 * @param {Object} props
 * @param {string} props.categoryKey - One of "ai", "authentication", "identity", "threatIntelligence".
 * @param {number} props.score - Current score allocated to this category.
 * @param {number} [props.max] - Optional override for category maximum weight.
 */
export default function EvidenceCategory({ categoryKey, score = 0, max }) {
  const normKey = normalizeCategoryKey(categoryKey);
  const cfg = CATEGORY_CONFIG[normKey] || CATEGORY_CONFIG.ai;
  const maxScore = max ?? cfg.max;
  const currentScore = Math.min(maxScore, Math.max(0, Number(score) || 0));
  const percentage = Math.round((currentScore / maxScore) * 100);
  const Icon = cfg.icon;

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-3.5 space-y-2 shadow-2xs`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex h-6 w-6 items-center justify-center rounded-md border ${cfg.border} bg-[#141417] ${cfg.color}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold text-[#F4F4F5]">
            {cfg.shortLabel}
          </span>
        </div>

        <div className="font-mono text-xs font-bold text-[#F4F4F5]">
          <span className={currentScore > 0 ? cfg.color : "text-[#71717A]"}>
            {currentScore}
          </span>
          <span className="text-[#71717A]"> / {maxScore}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#18181B] border border-[#27272A]/50">
        <div
          className={`h-full rounded-full transition-all duration-500 ${cfg.barBg}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px] text-[#71717A] font-mono">
        <span>Budget Weight</span>
        <span>{percentage}% utilized</span>
      </div>
    </div>
  );
}
