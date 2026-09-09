"use client";

import React from "react";
import { Plus, Menu, Zap, ShieldAlert, AlertTriangle, ShieldCheck } from "lucide-react";
import { useQuota } from "@/lib/quota";

/**
 * TopNavbar Component (Modern Dark SOC Top Bar)
 *
 * Displays global risk state counters, AI quota indicators, mobile toggle,
 * and quick-action triggers.
 *
 * @param {Object} props
 * @param {Function} props.onOpenMobile - Opens mobile sidebar.
 * @param {Function} props.onNewInvestigation - Triggers new investigation view.
 * @param {Object} [props.summaryStats] - Real counts of malicious, review, and benign cases.
 */
export default function TopNavbar({
  onOpenMobile,
  onNewInvestigation,
  summaryStats = { malicious: 17, review: 36, benign: 11 },
}) {
  const quota = useQuota();
  return (
    <header className="sticky top-0 z-20 flex h-14 w-full shrink-0 items-center justify-between border-b border-[#27272A] bg-[#09090B]/90 backdrop-blur-md px-4 sm:px-6">
      {/* Left: Mobile Menu Trigger & Status Indicator Pills */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-[#27272A] bg-[#141417] text-[#A1A1AA] hover:text-[#F4F4F5]"
          aria-label="Open Navigation Drawer"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Global Case Classification Pills (Matching Reference Inspiration) */}
        <div className="flex items-center gap-2 text-[11px] font-medium">
          {/* Malicious / Critical */}
          <div className="flex items-center gap-1.5 rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            <span className="font-semibold">{summaryStats.malicious}</span>
            <span className="hidden sm:inline">Malicious</span>
          </div>

          {/* Review / Suspicious */}
          <div className="flex items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            <span className="font-semibold">{summaryStats.review}</span>
            <span className="hidden sm:inline">Review</span>
          </div>

          {/* Benign / Legitimate */}
          <div className="flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            <span className="font-semibold">{summaryStats.benign}</span>
            <span className="hidden sm:inline">Benign</span>
          </div>
        </div>
      </div>

      {/* Right: AI Quota & Primary New Investigation Button */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quota Tag */}
        <div
          className="hidden md:flex items-center gap-1.5 rounded-md border border-[#27272A] bg-[#141417] px-2.5 py-1 text-xs font-mono text-[#A1A1AA]"
          title={`12-hour AI analysis limit: ${quota.used}/${quota.limit} used. Resets in ${quota.formattedTimeRemaining}`}
        >
          <Zap
            className={`h-3 w-3 ${
              quota.isExhausted
                ? "text-rose-400 fill-rose-400"
                : quota.percentage >= 80
                ? "text-amber-400 fill-amber-400"
                : "text-indigo-400 fill-indigo-400"
            }`}
          />
          <span className={quota.isExhausted ? "text-rose-400 font-semibold" : ""}>
            {quota.used} / {quota.limit} Analyses
          </span>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={onNewInvestigation}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white shadow-xs transition-all hover:bg-indigo-500 active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Investigation</span>
        </button>
      </div>
    </header>
  );
}
