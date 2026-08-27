import React from "react";
import { Lightbulb, ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";

/**
 * Recommendation Component
 *
 * Displays the actionable safety recommendation provided by the AI forensics service.
 *
 * @param {Object} props
 * @param {string} props.recommendation - Actionable safety advice.
 * @param {"legitimate"|"suspicious"|"fraudulent"} [props.classification] - Overall classification to contextualize icon/tone.
 */
export default function Recommendation({ recommendation, classification }) {
  const displayText =
    String(recommendation || "").trim() ||
    "Exercise caution and independently verify the authenticity of this message with the purported sender.";

  const normClass = String(classification || "").toLowerCase().trim();

  let bannerConfig = {
    bgColor: "bg-blue-50/50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-900/50",
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300",
    icon: Lightbulb,
  };

  if (normClass === "fraudulent") {
    bannerConfig = {
      bgColor: "bg-rose-50/40 dark:bg-rose-950/20",
      borderColor: "border-rose-200 dark:border-rose-900/50",
      iconColor: "text-rose-600 dark:text-rose-400",
      iconBg: "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300",
      icon: ShieldAlert,
    };
  } else if (normClass === "suspicious") {
    bannerConfig = {
      bgColor: "bg-amber-50/40 dark:bg-amber-950/20",
      borderColor: "border-amber-200 dark:border-amber-900/50",
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
      icon: AlertTriangle,
    };
  } else if (normClass === "legitimate") {
    bannerConfig = {
      bgColor: "bg-emerald-50/40 dark:bg-emerald-950/20",
      borderColor: "border-emerald-200 dark:border-emerald-900/50",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
      icon: ShieldCheck,
    };
  }

  const IconComponent = bannerConfig.icon;

  return (
    <div
      className={`flex h-full flex-col justify-between rounded-xl border p-5 shadow-sm transition-colors ${bannerConfig.borderColor} ${bannerConfig.bgColor}`}
    >
      <div>
        <div className="flex items-center gap-2 border-b border-zinc-200/60 pb-3 dark:border-zinc-800">
          <div className={`flex h-7 w-7 items-center justify-center rounded-md ${bannerConfig.iconBg}`}>
            <IconComponent className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
            Recommended Action
          </h3>
        </div>

        <p className="mt-4 text-sm font-medium leading-relaxed text-zinc-800 dark:text-zinc-200">
          {displayText}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
        <span>Security protocol recommendation</span>
      </div>
    </div>
  );
}
