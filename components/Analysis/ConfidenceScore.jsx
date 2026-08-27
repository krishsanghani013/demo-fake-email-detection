import React from "react";
import { CheckCircle2, HelpCircle } from "lucide-react";

/**
 * ConfidenceScore Component
 *
 * Displays the AI model's assessment certainty percentage based on the completeness
 * of the supplied textual evidence. Visually distinct from the threat Risk Score.
 *
 * @param {Object} props
 * @param {number} props.confidence - Confidence percentage from 0 to 100.
 */
export default function ConfidenceScore({ confidence = 0 }) {
  const score = Math.max(0, Math.min(100, Math.round(Number(confidence) || 0)));

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-blue-100 bg-blue-50/50 p-5 shadow-sm transition-colors dark:border-blue-950/60 dark:bg-blue-950/20">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
          AI Confidence
        </span>
        <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      </div>

      <div className="my-3 flex items-baseline gap-2">
        <span className="text-4xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
          {score}%
        </span>
        <span className="text-xs font-medium text-blue-600/80 dark:text-blue-400/80">
          certainty
        </span>
      </div>

      {/* Meter */}
      <div className="space-y-1.5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200/60 dark:bg-blue-900/50">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500 dark:bg-blue-500"
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
          <span>Based on text evidence</span>
          <span className="font-medium text-blue-600 dark:text-blue-400">
            {score >= 80 ? "High certainty" : score >= 50 ? "Moderate" : "Low certainty"}
          </span>
        </div>
      </div>
    </div>
  );
}
