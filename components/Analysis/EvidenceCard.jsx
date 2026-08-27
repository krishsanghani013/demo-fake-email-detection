import React from "react";
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  Flame,
  Link2,
  KeyRound,
  DollarSign,
  UserX,
  Clock,
  MailWarning,
  Quote,
} from "lucide-react";

/**
 * Returns an appropriate contextual icon based on indicator type keywords.
 */
function getIndicatorTypeIcon(typeString) {
  const lower = String(typeString || "").toLowerCase();
  if (lower.includes("url") || lower.includes("link") || lower.includes("domain")) {
    return Link2;
  }
  if (
    lower.includes("credential") ||
    lower.includes("password") ||
    lower.includes("login") ||
    lower.includes("harvest")
  ) {
    return KeyRound;
  }
  if (
    lower.includes("financial") ||
    lower.includes("invoice") ||
    lower.includes("payment") ||
    lower.includes("wire") ||
    lower.includes("money")
  ) {
    return DollarSign;
  }
  if (
    lower.includes("impersonat") ||
    lower.includes("spoof") ||
    lower.includes("authority") ||
    lower.includes("brand")
  ) {
    return UserX;
  }
  if (
    lower.includes("urgency") ||
    lower.includes("pressure") ||
    lower.includes("deadline") ||
    lower.includes("time")
  ) {
    return Clock;
  }
  return MailWarning;
}

/**
 * Severity styling and badges.
 */
const SEVERITY_CONFIG = {
  critical: {
    label: "Critical",
    badgeClass:
      "border border-rose-500/30 bg-rose-500/10 text-rose-400 font-mono",
    borderClass: "border-l-4 border-l-rose-500 border-[#27272A]",
    icon: AlertOctagon,
  },
  high: {
    label: "High",
    badgeClass:
      "border border-orange-500/30 bg-orange-500/10 text-orange-400 font-mono",
    borderClass: "border-l-4 border-l-orange-500 border-[#27272A]",
    icon: Flame,
  },
  medium: {
    label: "Medium",
    badgeClass:
      "border border-amber-500/30 bg-amber-500/10 text-amber-400 font-mono",
    borderClass: "border-l-4 border-l-amber-500 border-[#27272A]",
    icon: AlertTriangle,
  },
  low: {
    label: "Low",
    badgeClass:
      "border border-blue-500/30 bg-blue-500/10 text-blue-400 font-mono",
    borderClass: "border-l-4 border-l-blue-500 border-[#27272A]",
    icon: Info,
  },
};

/**
 * EvidenceCard Component (Dark SOC Theme)
 */
export default function EvidenceCard({ indicator }) {
  if (!indicator) return null;

  const { type, severity, description, evidence, confidence } = indicator;
  const normSev = String(severity || "").toLowerCase().trim();
  const config = SEVERITY_CONFIG[normSev] || SEVERITY_CONFIG.medium;
  const typeIconComponent = getIndicatorTypeIcon(type);
  const severityIconComponent = config.icon;

  return (
    <div
      className={`group rounded-xl border bg-[#141417] p-4.5 shadow-2xs transition-all hover:bg-[#18181B] ${config.borderClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#18181B] text-indigo-400 border border-[#27272A]">
            {React.createElement(typeIconComponent, { className: "h-4 w-4" })}
          </div>
          <h4 className="text-xs font-semibold text-[#F4F4F5]">
            {type || "Forensic Observation"}
          </h4>
        </div>

        {/* Severity Badge & Confidence */}
        <div className="flex items-center gap-1.5 shrink-0">
          {typeof confidence === "number" && confidence > 0 && (
            <span className="font-mono text-[10px] text-[#71717A]">
              {confidence}% conf
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.badgeClass}`}
          >
            {React.createElement(severityIconComponent, { className: "h-3 w-3" })}
            <span>{config.label}</span>
          </span>
        </div>
      </div>

      <p className="mt-2.5 text-xs leading-relaxed text-[#A1A1AA]">
        {description || "No specific evidence description provided."}
      </p>

      {evidence && (
        <div className="mt-2.5 rounded-lg bg-[#18181B] p-2 border border-[#27272A] text-[11px] font-mono text-[#D4D4D8]">
          <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-[#71717A] mb-0.5 font-sans font-semibold">
            <Quote className="h-2.5 w-2.5 text-indigo-400" />
            <span>Observed Evidence Snippet</span>
          </div>
          <span className="break-all">&ldquo;{evidence}&rdquo;</span>
        </div>
      )}
    </div>
  );
}
