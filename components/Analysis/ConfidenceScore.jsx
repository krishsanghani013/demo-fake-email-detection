"use client";

import React from "react";
import { CheckCircle2, ShieldCheck, Activity } from "lucide-react";

/**
 * ConfidenceScore Component
 *
 * Displays the AI model's assessment certainty percentage based on the completeness
 * of the supplied textual and header evidence. Visually distinct from the threat Risk Score.
 *
 * @param {Object} props
 * @param {number} props.confidence - Confidence percentage from 0 to 100.
 */
export default function ConfidenceScore({ confidence = 0 }) {
  const score = Math.max(0, Math.min(100, Math.round(Number(confidence) || 0)));

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[#1C2436] bg-[#111723] p-5 shadow-sm transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
          Assessment Confidence
        </span>
        <Activity className="h-4 w-4 text-blue-400" />
      </div>

      <div className="my-3 flex items-baseline gap-2">
        <span className="text-4xl font-extrabold tracking-tight font-mono text-blue-400">
          {score}%
        </span>
        <span className="text-xs font-medium text-[#64748B]">
          model certainty
        </span>
      </div>

      {/* Meter */}
      <div className="space-y-2 pt-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#161D2D]">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-[#64748B]">
          <span>Signal Coverage</span>
          <span className="font-semibold text-blue-400">
            {score >= 80 ? "High Fidelity" : score >= 50 ? "Moderate" : "Low Fidelity"}
          </span>
        </div>
      </div>
    </div>
  );
}
