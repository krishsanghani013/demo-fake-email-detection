import React from "react";
import { ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";

/**
 * RiskScore Component
 *
 * Displays a prominent numeric risk score between 0 and 100 with dynamic color coding and progress meter.
 *
 * @param {Object} props
 * @param {number} props.riskScore - Risk score from 0 (safe) to 100 (dangerous).
 * @param {string} [props.riskLevel] - Optional explicit risk severity level.
 */
export default function RiskScore({ riskScore = 0, riskLevel }) {
  const score = Math.max(0, Math.min(100, Math.round(Number(riskScore) || 0)));

  // Derive display styling based on score thresholds
  let theme = {
    label: "Low Risk",
    textColor: "text-emerald-600 dark:text-emerald-400",
    barColor: "bg-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800/60",
    icon: ShieldCheck,
  };

  if (score >= 75) {
    theme = {
      label: "Critical / High Risk",
      textColor: "text-rose-600 dark:text-rose-400",
      barColor: "bg-rose-500",
      bgColor: "bg-rose-50 dark:bg-rose-950/30",
      borderColor: "border-rose-200 dark:border-rose-800/60",
      icon: ShieldAlert,
    };
  } else if (score >= 40) {
    theme = {
      label: "Medium Risk",
      textColor: "text-amber-600 dark:text-amber-400",
      barColor: "bg-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      borderColor: "border-amber-200 dark:border-amber-800/60",
      icon: AlertTriangle,
    };
  }

  const displayLevel = riskLevel
    ? `${String(riskLevel).toUpperCase()} RISK`
    : theme.label.toUpperCase();

  const IconComponent = theme.icon;

  return (
    <div
      className={`flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition-colors ${theme.borderColor} ${theme.bgColor}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Risk Score
        </span>
        <IconComponent className={`h-4 w-4 ${theme.textColor}`} />
      </div>

      <div className="my-3 flex items-baseline gap-2">
        <span className={`text-4xl font-extrabold tracking-tight ${theme.textColor}`}>
          {score}
        </span>
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          / 100
        </span>
      </div>

      {/* Progress Bar Meter */}
      <div className="space-y-1.5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${theme.barColor}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
          <span>{displayLevel}</span>
          <span className="text-zinc-500 dark:text-zinc-400">Threat Index</span>
        </div>
      </div>
    </div>
  );
}
