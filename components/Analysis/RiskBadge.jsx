import React from "react";
import { ShieldCheck, AlertTriangle, AlertOctagon, ShieldAlert, Info, CheckCircle2, XCircle } from "lucide-react";

/**
 * Visual configuration for email classifications.
 */
const CLASSIFICATION_CONFIG = {
  legitimate: {
    label: "Legitimate",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    icon: ShieldCheck,
  },
  suspicious: {
    label: "Suspicious",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    icon: AlertTriangle,
  },
  fraudulent: {
    label: "Phishing / Fraud",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/25",
    icon: AlertOctagon,
  },
};

/**
 * Visual configuration for risk levels.
 */
const RISK_LEVEL_CONFIG = {
  safe: {
    label: "Safe",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    icon: CheckCircle2,
  },
  low: {
    label: "Low Risk",
    badgeClass: "bg-teal-500/10 text-teal-400 border-teal-500/25",
    icon: ShieldCheck,
  },
  medium: {
    label: "Medium Risk",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    icon: AlertTriangle,
  },
  high: {
    label: "High Risk",
    badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/25",
    icon: ShieldAlert,
  },
  critical: {
    label: "Critical Risk",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/25",
    icon: AlertOctagon,
  },
};

/**
 * RiskBadge Component
 *
 * Renders structured classification and risk severity badges with distinct icons and styling.
 *
 * @param {Object} props
 * @param {"legitimate"|"suspicious"|"fraudulent"} [props.classification]
 * @param {"safe"|"low"|"medium"|"high"|"critical"} [props.riskLevel]
 * @param {string} [props.size="md"] - "sm" | "md" | "lg"
 */
export default function RiskBadge({ classification, riskLevel, size = "md" }) {
  const normClass = String(classification || "").toLowerCase().trim();
  const normRisk = String(riskLevel || "").toLowerCase().trim();

  const classConfig = CLASSIFICATION_CONFIG[normClass];
  const riskConfig = RISK_LEVEL_CONFIG[normRisk];

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3.5 py-1.5 text-sm gap-2 font-semibold",
  }[size] || "px-2.5 py-1 text-xs gap-1.5";

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  }[size] || "h-3.5 w-3.5";

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5">
      {/* Risk Level Badge */}
      {riskConfig && (
        <span
          className={`inline-flex items-center rounded-md border font-mono font-semibold uppercase tracking-wider ${sizeClasses} ${riskConfig.badgeClass}`}
        >
          {React.createElement(riskConfig.icon, { className: iconSizes })}
          <span>{riskConfig.label}</span>
        </span>
      )}

      {/* Classification Badge */}
      {classConfig && (
        <span
          className={`inline-flex items-center rounded-md border font-semibold uppercase tracking-wider ${sizeClasses} ${classConfig.badgeClass}`}
        >
          {React.createElement(classConfig.icon, { className: iconSizes })}
          <span>{classConfig.label}</span>
        </span>
      )}

      {!classConfig && !riskConfig && (
        <span
          className={`inline-flex items-center rounded-md border border-[#253046] bg-[#161D2D] text-[#94A3B8] font-medium ${sizeClasses}`}
        >
          <Info className={iconSizes} />
          <span>Unclassified</span>
        </span>
      )}
    </div>
  );
}
