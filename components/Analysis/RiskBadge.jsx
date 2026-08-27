import React from "react";
import { ShieldCheck, AlertTriangle, AlertOctagon, ShieldAlert, Info } from "lucide-react";

/**
 * Visual configuration for email classifications.
 */
const CLASSIFICATION_CONFIG = {
  legitimate: {
    label: "Legitimate",
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    icon: ShieldCheck,
  },
  suspicious: {
    label: "Suspicious",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    icon: AlertTriangle,
  },
  fraudulent: {
    label: "Fraudulent",
    badgeClass:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    icon: AlertOctagon,
  },
};

/**
 * Visual configuration for risk levels.
 */
const RISK_LEVEL_CONFIG = {
  low: {
    label: "Low Risk",
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    icon: ShieldCheck,
  },
  medium: {
    label: "Medium Risk",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    icon: AlertTriangle,
  },
  high: {
    label: "High Risk",
    badgeClass:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
    icon: ShieldAlert,
  },
  critical: {
    label: "Critical Risk",
    badgeClass:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
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
 * @param {"low"|"medium"|"high"|"critical"} [props.riskLevel]
 * @param {string} [props.size="md"] - "sm" | "md" | "lg"
 */
export default function RiskBadge({ classification, riskLevel, size = "md" }) {
  const normClass = String(classification || "").toLowerCase().trim();
  const normRisk = String(riskLevel || "").toLowerCase().trim();

  const classConfig = CLASSIFICATION_CONFIG[normClass];
  const riskConfig = RISK_LEVEL_CONFIG[normRisk];

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-3 py-1 text-xs sm:text-sm gap-1.5",
    lg: "px-4 py-1.5 text-sm sm:text-base gap-2 font-semibold",
  }[size] || "px-3 py-1 text-xs gap-1.5";

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }[size] || "h-4 w-4";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Classification Badge */}
      {classConfig && (
        <span
          className={`inline-flex items-center rounded-full border font-semibold uppercase tracking-wider ${sizeClasses} ${classConfig.badgeClass}`}
        >
          {React.createElement(classConfig.icon, { className: iconSizes })}
          <span>{classConfig.label}</span>
        </span>
      )}

      {/* Risk Level Badge */}
      {riskConfig && (
        <span
          className={`inline-flex items-center rounded-full border font-semibold uppercase tracking-wider ${sizeClasses} ${riskConfig.badgeClass}`}
        >
          {React.createElement(riskConfig.icon, { className: iconSizes })}
          <span>{riskConfig.label}</span>
        </span>
      )}

      {!classConfig && !riskConfig && (
        <span
          className={`inline-flex items-center rounded-full border border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 font-medium ${sizeClasses}`}
        >
          <Info className={iconSizes} />
          <span>Unclassified</span>
        </span>
      )}
    </div>
  );
}
