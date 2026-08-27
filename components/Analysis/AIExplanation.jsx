import React from "react";
import { FileText, Bot } from "lucide-react";

/**
 * AIExplanation Component
 *
 * Displays the concise forensic assessment summary produced by the AI model.
 *
 * @param {Object} props
 * @param {string} props.summary - The AI-generated assessment summary.
 */
export default function AIExplanation({ summary }) {
  const displayText =
    String(summary || "").trim() ||
    "No detailed assessment summary was provided for this analysis.";

  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div>
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Bot className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
            AI Assessment
          </h3>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {displayText}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
        <FileText className="h-3 w-3" />
        <span>Evidence-based contextual analysis</span>
      </div>
    </div>
  );
}
